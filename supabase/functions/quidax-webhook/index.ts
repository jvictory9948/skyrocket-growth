import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    console.log("Quidax webhook received:", JSON.stringify(payload));

    // Get Quidax secret key for signature verification
    let quidaxSecretKey = Deno.env.get("QUIDAX_SECRET_KEY") || "";
    const { data: settingData } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "quidax_secret_key")
      .single();
    if (settingData?.setting_value) {
      quidaxSecretKey = settingData.setting_value;
    }

    // Verify webhook signature if present
    const signature = req.headers.get("x-quidax-signature") || req.headers.get("X-Quidax-Signature");
    if (signature && quidaxSecretKey) {
      const expectedSignature = createHmac("sha256", quidaxSecretKey)
        .update(rawBody)
        .digest("hex");
      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Webhook signature verified");
    }

    const event = payload.event || payload.type;
    const data = payload.data || payload;

    console.log("Webhook event type:", event);

    // Handle deposit/payment events
    // Quidax sends events like: wallet.deposit.completed, instant_order.done
    if (
      event === "wallet.deposit.completed" ||
      event === "deposit.success" ||
      event === "instant_order.done"
    ) {
      const amount = parseFloat(data.amount || data.total || "0");
      const currency = (data.currency || data.pair || "").toLowerCase();

      if (amount <= 0) {
        console.log("Zero or negative amount, ignoring");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try to find the user from pending payments or use reference
      const reference = data.reference || data.id || "";
      let userId = "";
      let username = "";
      let depositAmount = amount;

      // Check if there's a pending payment matching this reference
      if (reference && reference.startsWith("QDX-")) {
        const { data: pending } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", `quidax_pending_${reference}`)
          .single();

        if (pending?.setting_value) {
          const pendingData = JSON.parse(pending.setting_value);
          userId = pendingData.userId;
          username = pendingData.username;
          depositAmount = pendingData.amount; // Use the NGN amount they intended to deposit

          // Clean up pending record
          await supabase
            .from("admin_settings")
            .delete()
            .eq("setting_key", `quidax_pending_${reference}`);
        }
      }

      // If no user found from reference, try to find from wallet/address metadata
      if (!userId) {
        console.log("Could not determine user from webhook data. Manual processing may be needed.");
        // Log the deposit for admin review
        await supabase.from("admin_settings").upsert(
          {
            setting_key: `quidax_unmatched_${Date.now()}`,
            setting_value: JSON.stringify({
              event,
              amount,
              currency,
              reference,
              rawData: data,
              receivedAt: new Date().toISOString(),
            }),
          },
          { onConflict: "setting_key" }
        );

        return new Response(JSON.stringify({ received: true, matched: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Credit user's balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, balance, username")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        console.error("User not found:", userId, profileError);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = (profile.balance || 0) + depositAmount;
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
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        amount: depositAmount,
        description: `Crypto deposit (${currency.toUpperCase()}) - ${reference}`,
        status: "completed",
      });

      if (txError) {
        console.error("Failed to create transaction:", txError);
      }

      // Get user email for notification
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);

      // Send Telegram notification
      try {
        await supabase.functions.invoke("send-telegram-notification", {
          body: {
            type: "deposit",
            userEmail: authUser?.user?.email || "Unknown",
            username: username || profile.username,
            amount: depositAmount,
          },
        });
      } catch (notifError) {
        console.log("Notification error (non-blocking):", notifError);
      }

      console.log(`Credited ${depositAmount} to user ${userId} via crypto`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For other event types, just acknowledge
    console.log("Unhandled event type:", event);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Quidax webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
