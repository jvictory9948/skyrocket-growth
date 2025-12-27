import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('REALLYSIMPLESOCIAL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { service, link, quantity } = await req.json();

    console.log(`Placing order: service=${service}, link=${link}, quantity=${quantity}`);

    // Place order with external API
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'add');
    formData.append('service', service.toString());
    formData.append('link', link);
    formData.append('quantity', quantity.toString());

    const response = await fetch('https://reallysimplesocial.com/api/v2', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Order result:', result);

    if (result.error) {
      throw new Error(result.error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: result.order,
      message: 'Order placed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error placing order:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
