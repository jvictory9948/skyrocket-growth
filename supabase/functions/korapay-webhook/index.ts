import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("Korapay webhook received:", JSON.stringify(payload));

    // Validate webhook event
    if (payload.event !== "charge.success") {
      console.log("Ignoring non-success event:", payload.event);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data } = payload;
    const reference = data.payment_reference;
    const amount = parseFloat(data.amount);
    const status = data.status;

    if (status !== "success") {
      console.log("Payment not successful:", status);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse reference to get user_id (format: KP-{fullUserId}-{timestamp})
    // Example: KP-a7258c28-20c2-4113-a227-e563841227ac-1704380000000
    if (!reference.startsWith("KP-")) {
      console.error("Invalid reference format (missing KP- prefix):", reference);
      return new Response(JSON.stringify({ error: "Invalid reference format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the user ID (format: KP-{uuid}-{timestamp})
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts separated by "-")
    const parts = reference.substring(3).split('-');
    // Join the first 5 parts to reconstruct the UUID
    const userId = parts.slice(0, 5).join('-');
    console.log("Extracted user ID:", userId);
    
    // Find the user by their UUID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, balance, username")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("User not found with ID:", userId, profileError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user balance
    const newBalance = (profile.balance || 0) + amount;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update balance:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update balance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create transaction record (reference_id is UUID type, so we don't use the Korapay reference)
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amount,
      description: `Korapay deposit - ${reference}`,
      status: "completed",
    });

    if (txError) {
      console.error("Failed to create transaction record:", txError);
    } else {
      console.log("Transaction record created successfully");
    }

    // Get user email for notification
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    // Send Telegram notification
    try {
      await supabase.functions.invoke("send-telegram-notification", {
        body: {
          type: "deposit",
          userEmail: authUser?.user?.email || "Unknown",
          username: profile.username,
          amount: amount,
        },
      });
    } catch (notifError) {
      console.log("Notification error (non-blocking):", notifError);
    }

    console.log(`Successfully credited ${amount} to user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
