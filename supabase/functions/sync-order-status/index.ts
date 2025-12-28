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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    // Get user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      throw new Error('Unauthorized');
    }
    
    console.log('Authenticated user:', user.id);

    const { external_order_id } = await req.json();

    if (!external_order_id) {
      return new Response(JSON.stringify({ error: 'Missing external_order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching status for order: ${external_order_id}`);

    // Fetch order status from API
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'status');
    formData.append('order', external_order_id.toString());

    const response = await fetch('https://reallysimplesocial.com/api/v2', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Status API result:', result);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map API status to our status
    let orderStatus = 'pending';
    if (result.status) {
      const apiStatus = result.status.toLowerCase();
      if (apiStatus === 'completed') orderStatus = 'completed';
      else if (apiStatus === 'cancelled' || apiStatus === 'canceled') orderStatus = 'cancelled';
      else if (apiStatus === 'in progress' || apiStatus === 'processing') orderStatus = 'processing';
      else if (apiStatus === 'partial') orderStatus = 'completed';
      else if (apiStatus === 'pending') orderStatus = 'pending';
    }

    console.log(`Mapped status: ${result.status} -> ${orderStatus}`);

    return new Response(JSON.stringify({ 
      success: true, 
      status: orderStatus,
      raw_status: result.status,
      charge: result.charge,
      start_count: result.start_count,
      remains: result.remains,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error syncing order status:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
