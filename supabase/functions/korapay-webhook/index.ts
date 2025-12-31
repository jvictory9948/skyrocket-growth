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

    // Parse reference to get user_id (format: KP-{shortUserId}-{timestamp})
    // The shortUserId is the first 8 characters of the full UUID
    const referenceParts = reference.split("-");
    if (referenceParts.length < 3 || referenceParts[0] !== "KP") {
      console.error("Invalid reference format:", reference);
      return new Response(JSON.stringify({ error: "Invalid reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The short user ID is in format like "a7258c28" (8 chars)
    const shortUserId = referenceParts[1];
    
    // Find the user by matching the start of their UUID
    const { data: matchedProfile, error: matchError } = await supabase
      .from("profiles")
      .select("id, balance, username")
      .ilike("id", `${shortUserId}%`)
      .single();

    if (matchError || !matchedProfile) {
      console.error("User not found with short ID:", shortUserId, matchError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = matchedProfile.id;

    // Update user balance
    const newBalance = (matchedProfile.balance || 0) + amount;
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

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amount,
      description: `Korapay deposit - ${reference}`,
      status: "completed",
      reference_id: data.reference,
    });

    // Get user email for notification
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    // Send Telegram notification
    try {
      await supabase.functions.invoke("send-telegram-notification", {
        body: {
          type: "deposit",
          userEmail: authUser?.user?.email || "Unknown",
          username: matchedProfile.username,
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
