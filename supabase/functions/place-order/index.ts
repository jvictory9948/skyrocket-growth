import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getApiKeyForProvider(
  supabase: any,
  providerId: string
): Promise<string | undefined> {
  const keyMap: Record<string, { dbKey: string; envKey: string }> = {
    reallysimplesocial: { dbKey: "reallysimplesocial_api_key", envKey: "REALLYSIMPLESOCIAL_API_KEY" },
    resellerprovider: { dbKey: "resellerprovider_api_key", envKey: "RESELLERPROVIDER_API_KEY" },
  };
  const mapping = keyMap[providerId];
  if (!mapping) return undefined;
  try {
    const { data } = await supabase.from("admin_settings").select("setting_value").eq("setting_key", mapping.dbKey).maybeSingle();
    if (data?.setting_value) { console.log(`Using API key from admin_settings for ${providerId}`); return data.setting_value; }
  } catch (err) { console.warn(`Failed to read admin_settings for ${providerId}:`, err); }
  console.log(`Using environment secret for ${providerId}`);
  return Deno.env.get(mapping.envKey);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Incoming Authorization header present?', !!authHeader);
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

    // diagnostic holders to return/log later
    let insertedOrderVar: any = null;
    let newBalanceVar: number | null = null;

    const { service, link, quantity, serviceName, platform, charge, baseCharge, providerId } = await req.json();

    console.log(`Placing order: service=${service}, link=${link}, quantity=${quantity}, provider=${providerId}`);
    console.log('Received values:', { service, serviceName, platform, charge, baseCharge, quantity, link, providerId });

    // Get API configuration for the provider
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    let apiUrl: string;
    
    // Determine which API to use
    const resolvedProviderId = providerId || 'reallysimplesocial';
    
    if (resolvedProviderId === 'resellerprovider') {
      apiUrl = 'https://resellerprovider.ru/api/v2';
    } else {
      apiUrl = 'https://reallysimplesocial.com/api/v2';
    }

    // Get API key from admin_settings first, then fall back to env secret
    const apiKey = await getApiKeyForProvider(serviceClient, resolvedProviderId);
    
    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${resolvedProviderId}`);
    }

    // Place order with external API
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('action', 'add');
    formData.append('service', service.toString());
    formData.append('link', link);
    formData.append('quantity', quantity.toString());

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Order result:', result);

    if (result.error) {
      // Return 200 with error so frontend can show friendly message
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order status from API to get the actual status
    const statusFormData = new FormData();
    statusFormData.append('key', apiKey);
    statusFormData.append('action', 'status');
    statusFormData.append('order', result.order.toString());

    const statusResponse = await fetch(apiUrl, {
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

    // Send Telegram notification (fire and forget)
    try {
      // Apply global markup and debit user atomically
      try {
        // Fetch global markup percentage
        const { data: markupRow } = await serviceClient
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'price_markup_percentage')
          .maybeSingle();

        const markup = markupRow?.setting_value ? parseFloat(markupRow.setting_value) : 0;
        const base = baseCharge != null ? Number(baseCharge) : Number(charge || 0);
        const totalCharge = base * (1 + markup / 100);
        console.log('Calculated charges', { base, markup, totalCharge });

        // Get user balance
        const { data: profileData, error: profileErr } = await serviceClient
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (profileErr || !profileData) {
          console.error('Profile fetch error', profileErr);
          throw new Error('User profile not found');
        }

        const currentBalance = Number(profileData.balance || 0);
        console.log('Current balance for user', currentBalance);
        if (currentBalance < totalCharge) {
          console.error('Insufficient funds', { currentBalance, totalCharge });
          return new Response(JSON.stringify({ error: 'Insufficient funds', currentBalance, totalCharge }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        newBalanceVar = currentBalance - totalCharge;
        console.log('New balance after debit will be', newBalanceVar);

        // Debit user
        const { data: updatedProfile, error: updateErr } = await serviceClient
          .from('profiles')
          .update({ balance: newBalanceVar })
          .eq('id', user.id)
          .select();

        console.log('Profile update result', { updatedProfile, updateErr });
        if (updateErr) throw updateErr;

        // Insert order record with provider info
        const { data: insertedOrder, error: insertErr } = await serviceClient
          .from('orders')
          .insert({
            user_id: user.id,
            platform,
            service: serviceName || service,
            link,
            quantity,
            charge: totalCharge,
            status: orderStatus,
            external_order_id: result.order?.toString() || null,
          })
          .select()
          .single();

        if (insertErr) {
          // attempt to revert balance update
          await serviceClient.from('profiles').update({ balance: currentBalance }).eq('id', user.id);
          throw insertErr;
        }

        insertedOrderVar = insertedOrder;
        console.log('Inserted order', insertedOrderVar);

        // Process referral commission
        try {
          // Check if user was referred
          const { data: userProfile } = await serviceClient
            .from('profiles')
            .select('referred_by')
            .eq('id', user.id)
            .single();

          if (userProfile?.referred_by) {
            // Get referral percentage from settings
            const { data: refPercentRow } = await serviceClient
              .from('admin_settings')
              .select('setting_value')
              .eq('setting_key', 'referral_percentage')
              .maybeSingle();

            const refPercent = refPercentRow?.setting_value ? parseFloat(refPercentRow.setting_value) : 4;
            const commission = totalCharge * (refPercent / 100);

            if (commission > 0) {
              // Add commission to referrer's balance
              const { data: referrerProfile } = await serviceClient
                .from('profiles')
                .select('balance')
                .eq('id', userProfile.referred_by)
                .single();

              if (referrerProfile) {
                await serviceClient
                  .from('profiles')
                  .update({ balance: Number(referrerProfile.balance) + commission })
                  .eq('id', userProfile.referred_by);

                // Record the earning
                await serviceClient.from('referral_earnings').insert({
                  referrer_id: userProfile.referred_by,
                  order_id: insertedOrder.id,
                  amount: commission,
                });

                console.log('Referral commission processed:', { referrer: userProfile.referred_by, commission });
              }
            }
          }
        } catch (refErr) {
          console.log('Referral commission error (non-blocking):', refErr);
        }

        // Get user profile for notification
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        // Send notification asynchronously
        fetch(`${supabaseUrl}/functions/v1/send-telegram-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order',
            userEmail: user.email,
            username: profile?.username,
            amount: totalCharge || 0,
            service: serviceName || service,
            platform: platform || 'Unknown',
            quantity: quantity,
            link: link,
          }),
        }).catch(err => console.log('Telegram notification error (non-blocking):', err));
      } catch (chargeErr) {
        console.error('Charge/debit error:', chargeErr);
        throw chargeErr;
      }
    } catch (notifError) {
      console.log('Telegram notification setup error (non-blocking):', notifError);
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
