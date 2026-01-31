import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiProvider {
  provider_id: string;
  name: string;
  api_url: string;
  is_enabled: boolean;
  is_primary: boolean;
}

interface Service {
  service: number | string;
  name: string;
  type?: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
  provider_id?: string;
  provider_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch enabled API providers
    const { data: providers, error: providersError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('display_order');
    
    if (providersError) {
      console.error('Error fetching providers:', providersError);
      throw new Error('Failed to fetch API providers');
    }
    
    if (!providers || providers.length === 0) {
      console.log('No enabled providers found');
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Found ${providers.length} enabled providers`);
    
    const allServices: Service[] = [];
    
    // Fetch services from each enabled provider
    for (const provider of providers as ApiProvider[]) {
      try {
        const apiKey = getApiKeyForProvider(provider.provider_id);
        
        if (!apiKey) {
          console.warn(`No API key configured for provider: ${provider.provider_id}`);
          continue;
        }
        
        console.log(`Fetching services from ${provider.name}...`);
        
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('action', 'services');
        
        const response = await fetch(provider.api_url, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          console.error(`API error for ${provider.name}: ${response.status}`);
          continue;
        }
        
        const services = await response.json();
        
        if (Array.isArray(services)) {
          // Tag services with provider info
          const taggedServices = services.map((service: Service) => ({
            ...service,
            provider_id: provider.provider_id,
            provider_name: provider.name,
          }));
          
          allServices.push(...taggedServices);
          console.log(`Fetched ${services.length} services from ${provider.name}`);
        }
      } catch (providerError) {
        console.error(`Error fetching from ${provider.name}:`, providerError);
        // Continue with other providers
      }
    }
    
    console.log(`Total services fetched: ${allServices.length}`);
    
    return new Response(JSON.stringify(allServices), {
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

function getApiKeyForProvider(providerId: string): string | undefined {
  switch (providerId) {
    case 'reallysimplesocial':
      return Deno.env.get('REALLYSIMPLESOCIAL_API_KEY');
    case 'resellerprovider':
      return Deno.env.get('RESELLERPROVIDER_API_KEY');
    default:
      return undefined;
  }
}
