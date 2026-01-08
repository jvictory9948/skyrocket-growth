import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hash === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify signature
    if (signature) {
      const isValid = await verifySignature(body, signature, paystackSecretKey);
      if (!isValid) {
        console.error("Invalid Paystack signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(body);
    console.log("Paystack webhook received:", payload.event);

    if (payload.event !== "charge.success") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data;
    const reference = data.reference;
    const amountKobo = data.amount; // Amount in kobo (smallest currency unit)
    const amount = amountKobo / 100; // Convert to Naira
    const customerEmail = data.customer?.email;

    console.log(`Processing successful payment: ref=${reference}, amount=${amount} NGN, email=${customerEmail}`);

    // Extract user ID from reference (format: PS-{userId}-{timestamp})
    const refParts = reference.split("-");
    if (refParts.length < 2 || refParts[0] !== "PS") {
      console.error("Invalid reference format:", reference);
      return new Response(JSON.stringify({ error: "Invalid reference format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reference format: PS-{UUID}-{timestamp}
    // UUID is 36 chars, so we need to extract it properly
    const userId = refParts.slice(1, -1).join("-");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if transaction already processed
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference_id", reference)
      .maybeSingle();

    if (existingTx) {
      console.log("Transaction already processed:", reference);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance, username")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("User not found:", userId, profileError);
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

    // Create transaction record
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amount,
      description: `Paystack deposit of ₦${amount.toLocaleString()}`,
      status: "completed",
      reference_id: reference,
    });

    if (txError) {
      console.error("Failed to create transaction:", txError);
    }

    // Send Telegram notification (non-blocking)
    supabase.functions.invoke("send-telegram-notification", {
      body: {
        type: "deposit",
        userEmail: customerEmail,
        username: profile.username,
        amount: amount,
      },
    }).catch((err: Error) => console.log("Notification error (non-blocking):", err));

    console.log(`Successfully credited ${amount} NGN to user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
