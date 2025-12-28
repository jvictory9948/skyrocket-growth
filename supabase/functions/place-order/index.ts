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

    // Create Supabase client with anon key and pass the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    // Get user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError.message);
      throw new Error('Unauthorized: ' + userError.message);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('Unauthorized');
    }
    
    console.log('Authenticated user:', user.id);

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

    // Fetch order status from API to get the actual status
    const statusFormData = new FormData();
    statusFormData.append('key', apiKey);
    statusFormData.append('action', 'status');
    statusFormData.append('order', result.order.toString());

    const statusResponse = await fetch('https://reallysimplesocial.com/api/v2', {
      method: 'POST',
      body: statusFormData,
    });

    const statusResult = await statusResponse.json();
    console.log('Order status result:', statusResult);

    // Map API status to our status
    let orderStatus = 'pending';
    if (statusResult.status) {
      const apiStatus = statusResult.status.toLowerCase();
      if (apiStatus === 'completed') orderStatus = 'completed';
      else if (apiStatus === 'cancelled' || apiStatus === 'canceled') orderStatus = 'cancelled';
      else if (apiStatus === 'in progress' || apiStatus === 'processing') orderStatus = 'processing';
      else if (apiStatus === 'partial') orderStatus = 'completed';
      else if (apiStatus === 'pending') orderStatus = 'pending';
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: result.order,
      status: orderStatus,
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
