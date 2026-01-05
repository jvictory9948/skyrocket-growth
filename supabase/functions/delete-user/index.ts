import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with the user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if the caller is an admin
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, username, email } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the user's email from auth before deleting
    let userEmail = email;
    if (!userEmail) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email;
      console.log(`Retrieved email for user ${userId}: ${userEmail}`);
    }

    // Delete related records first (in case cascade doesn't cover all)
    // These will be handled by cascade from profiles, but let's be explicit
    console.log(`Deleting user ${userId} and all related records...`);

    // Delete from orders
    await adminClient.from("orders").delete().eq("user_id", userId);
    
    // Delete from transactions
    await adminClient.from("transactions").delete().eq("user_id", userId);
    
    // Delete from support_tickets
    await adminClient.from("support_tickets").delete().eq("user_id", userId);
    
    // Delete from favorite_services
    await adminClient.from("favorite_services").delete().eq("user_id", userId);
    
    // Delete from referral_codes
    await adminClient.from("referral_codes").delete().eq("user_id", userId);
    
    // Delete from referral_earnings (where user is the referrer)
    await adminClient.from("referral_earnings").delete().eq("referrer_id", userId);
    
    // Delete from referrals (where user is referrer or referred)
    await adminClient.from("referrals").delete().eq("referrer_id", userId);
    await adminClient.from("referrals").delete().eq("referred_id", userId);
    
    // Delete from refund_requests
    await adminClient.from("refund_requests").delete().eq("user_id", userId);
    
    // Delete from user_roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    
    // Delete from profiles
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Continue anyway to delete auth user
    }

    console.log(`Attempting to delete auth user ${userId}...`);
    
    // Delete the auth user (this requires admin/service role)
    const { data: deleteData, error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      console.error("Auth error details:", JSON.stringify(authError, null, 2));
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Auth user delete response:", JSON.stringify(deleteData, null, 2));

    // Add to blocked emails to prevent re-registration
    if (userEmail) {
      const { error: blockError } = await adminClient
        .from("blocked_emails")
        .insert({ email: userEmail.toLowerCase(), reason: "Account deleted by admin" });
      
      if (blockError) {
        console.error("Error blocking email:", blockError);
      } else {
        console.log(`Email ${userEmail} added to blocked list`);
      }
    } else {
      console.warn("No email found to block for deleted user");
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "User and all related data deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
