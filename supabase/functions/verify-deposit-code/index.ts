import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCodePayload {
  codeKey: string;
  code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VerifyCodePayload = await req.json();
    console.log('Verifying deposit code:', payload.codeKey);

    // Get the stored code
    const { data: storedData, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', payload.codeKey)
      .single();

    if (error || !storedData) {
      console.log('Code not found:', payload.codeKey);
      return new Response(
        JSON.stringify({ valid: false, error: 'Confirmation code not found or expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const codeData = JSON.parse(storedData.setting_value);
    console.log('Code data:', codeData);

    // Check if code has expired
    if (new Date(codeData.expiresAt) < new Date()) {
      // Delete expired code
      await supabase
        .from('admin_settings')
        .delete()
        .eq('setting_key', payload.codeKey);

      return new Response(
        JSON.stringify({ valid: false, error: 'Confirmation code has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the code
    if (codeData.code !== payload.code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid confirmation code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Code is valid - delete it to prevent reuse
    await supabase
      .from('admin_settings')
      .delete()
      .eq('setting_key', payload.codeKey);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        data: {
          userId: codeData.userId,
          username: codeData.username,
          amount: codeData.amount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying deposit code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
