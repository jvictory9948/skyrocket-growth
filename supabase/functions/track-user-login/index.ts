import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Tracking login for user: ${user.id}`);

    // Get IP address from request headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               req.headers.get("x-real-ip") || 
               "Unknown";

    console.log(`User IP: ${ip}`);

    // Try to get location from IP using a free geolocation API
    let location = "Unknown";
    
    if (ip && ip !== "Unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === "success") {
            location = `${geoData.city || "Unknown"}, ${geoData.country || "Unknown"}`;
            console.log(`Location resolved: ${location}`);
          }
        }
      } catch (geoError) {
        console.error("Failed to get geolocation:", geoError);
      }
    }

    // Update user profile with IP, location, and login time
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        last_ip: ip,
        last_location: location,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully tracked login for user ${user.id}`);

    return new Response(JSON.stringify({ success: true, ip, location }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in track-user-login:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});