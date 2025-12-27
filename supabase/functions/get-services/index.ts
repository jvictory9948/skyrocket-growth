import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Fetching services from ReallySimpleSocial API...');

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'services');

    const response = await fetch('https://reallysimplesocial.com/api/v2', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const services = await response.json();
    console.log(`Fetched ${services.length} services`);

    return new Response(JSON.stringify(services), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching services:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
