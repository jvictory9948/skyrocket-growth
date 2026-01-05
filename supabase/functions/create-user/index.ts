import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Creates a new user using the Supabase service_role key and marks their email as confirmed.
// WARNING: This endpoint creates users without an email confirmation step. Protect it appropriately in production.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { email, password, username } = body || {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if email is blocked (deleted user)
    const { data: blockedEmail } = await supabase
      .from("blocked_emails")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (blockedEmail) {
      console.log(`Blocked signup attempt for deleted email: ${email}`);
      return new Response(JSON.stringify({ error: "This email address is not allowed to register" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user via the admin API and confirm the email immediately
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });

    if (error) {
      console.error('admin.createUser error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optionally create a profile row so UI can read it immediately
    try {
      await supabase.from('profiles').insert({ id: data.user?.id, username: username || null, balance: 0 });
    } catch (e) {
      // non-blocking; log and continue
      console.warn('Failed to create profile row (non-blocking):', e);
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-user function error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
