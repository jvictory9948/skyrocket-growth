import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { amount, currency } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Quidax secret key from admin_settings first, fallback to env
    let quidaxSecretKey = Deno.env.get("QUIDAX_SECRET_KEY") || "";
    const { data: settingData } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "quidax_secret_key")
      .single();
    if (settingData?.setting_value) {
      quidaxSecretKey = settingData.setting_value;
    }

    if (!quidaxSecretKey) {
      return new Response(JSON.stringify({ error: "Quidax not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    // Get user email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email || "unknown";

    // Create an instant order on Quidax to buy crypto (user pays fiat, receives crypto)
    // For accepting crypto payments, we use the payment address approach
    // Create a wallet address for the merchant's sub-account
    const cryptoCurrency = currency || "btc";
    const QUIDAX_BASE = "https://app.quidax.io/api/v1";

    // Helper to safely parse JSON from Quidax responses
    async function safeJson(resp: Response) {
      const ct = resp.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await resp.text();
        console.error("Non-JSON response from Quidax:", text.substring(0, 300));
        throw new Error(`Quidax returned non-JSON (status ${resp.status})`);
      }
      return resp.json();
    }

    // Helper to fetch with timeout and retry
    async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          const resp = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timeout);
          if (resp.status >= 500 && attempt < retries) {
            console.warn(`Quidax returned ${resp.status}, retrying (${attempt + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return resp;
        } catch (err) {
          if (attempt < retries) {
            console.warn(`Quidax request failed, retrying (${attempt + 1}/${retries})...`, err);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      throw new Error("Quidax request failed after retries");
    }

    // Fetch wallet address for receiving crypto
    const walletResponse = await fetchWithRetry(
      `${QUIDAX_BASE}/users/me/wallets/${cryptoCurrency}/addresses`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${quidaxSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const walletData = await safeJson(walletResponse);
    console.log("Quidax wallet address response:", JSON.stringify(walletData));

    if (!walletResponse.ok || walletData.status !== "success") {
      // If address creation fails, try to get existing addresses
      const existingResponse = await fetchWithRetry(
        `${QUIDAX_BASE}/users/me/wallets/${cryptoCurrency}/addresses`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${quidaxSecretKey}`,
          },
        }
      );

      const existingData = await safeJson(existingResponse);
      console.log("Quidax existing addresses:", JSON.stringify(existingData));

      if (existingData.status === "success" && existingData.data?.length > 0) {
        const address = existingData.data[0];
        return new Response(
          JSON.stringify({
            success: true,
            address: address.address || address.destination_tag_or_memo,
            network: address.network,
            currency: cryptoCurrency.toUpperCase(),
            amount,
            userId,
            reference: `QDX-${userId}-${Date.now().toString().slice(-8)}`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate payment address", details: walletData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const address = walletData.data;
    const reference = `QDX-${userId}-${Date.now().toString().slice(-8)}`;

    // Store pending payment info in admin_settings for webhook verification
    await supabase.from("admin_settings").upsert(
      {
        setting_key: `quidax_pending_${reference}`,
        setting_value: JSON.stringify({
          userId,
          username: profile?.username,
          email: userEmail,
          amount,
          currency: cryptoCurrency,
          reference,
          createdAt: new Date().toISOString(),
        }),
      },
      { onConflict: "setting_key" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        address: address.address || address.destination_tag_or_memo,
        network: address.network,
        currency: cryptoCurrency.toUpperCase(),
        amount,
        userId,
        reference,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Quidax payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
