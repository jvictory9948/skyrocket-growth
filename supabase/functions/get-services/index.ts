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

async function getApiKeyForProvider(
  supabase: any,
  providerId: string
): Promise<string | undefined> {
  const keyMap: Record<string, { dbKey: string; envKey: string }> = {
    reallysimplesocial: {
      dbKey: "reallysimplesocial_api_key",
      envKey: "REALLYSIMPLESOCIAL_API_KEY",
    },
    resellerprovider: {
      dbKey: "resellerprovider_api_key",
      envKey: "RESELLERPROVIDER_API_KEY",
    },
  };

  const mapping = keyMap[providerId];
  if (!mapping) return undefined;

  // Try admin_settings first
  try {
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", mapping.dbKey)
      .maybeSingle();

    if (data?.setting_value) {
      console.log(`Using API key from admin_settings for ${providerId}`);
      return data.setting_value;
    }
  } catch (err) {
    console.warn(`Failed to read admin_settings for ${providerId}:`, err);
  }

  // Fallback to environment secret
  console.log(`Using environment secret for ${providerId}`);
  return Deno.env.get(mapping.envKey);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    for (const provider of providers as ApiProvider[]) {
      try {
        const apiKey = await getApiKeyForProvider(supabase, provider.provider_id);
        
        if (!apiKey) {
          console.warn(`No API key configured for provider: ${provider.provider_id}`);
          continue;
        }
        
        console.log(`Fetching services from ${provider.name}...`);
        
        const params = new URLSearchParams();
        params.append('key', apiKey);
        params.append('action', 'services');
        
        const response = await fetch(provider.api_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        console.log(`${provider.name} responded with status: ${response.status}`);

        const responseText = await response.text();
        console.log(`${provider.name} response preview: ${responseText.substring(0, 500)}`);

        let services;
        try {
          services = JSON.parse(responseText);
        } catch {
          console.error(`${provider.name} returned non-JSON response`);
          continue;
        }

        if (services && !Array.isArray(services) && services.error) {
          console.error(`${provider.name} API error: ${services.error}`);
          continue;
        }

        if (Array.isArray(services)) {
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
