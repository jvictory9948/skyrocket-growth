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

    // Use service role to bypass RLS and access all orders
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all orders that need syncing (pending or processing)
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, external_order_id, status, user_id, charge, service, platform, quantity')
      .in('status', ['pending', 'processing'])
      .not('external_order_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${orders?.length || 0} orders to sync`);

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No orders to sync',
        synced: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let syncedCount = 0;
    let errorCount = 0;
    let refundRequestsCreated = 0;

    // Sync each order
    for (const order of orders) {
      try {
        // Fetch order status from API
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('action', 'status');
        formData.append('order', order.external_order_id);

        const response = await fetch('https://reallysimplesocial.com/api/v2', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.error) {
          console.error(`Error syncing order ${order.id}:`, result.error);
          errorCount++;
          continue;
        }

        // Map API status to our status
        let newStatus = 'pending';
        if (result.status) {
          const apiStatus = result.status.toLowerCase();
          if (apiStatus === 'completed') newStatus = 'completed';
          else if (apiStatus === 'cancelled' || apiStatus === 'canceled') newStatus = 'cancelled';
          else if (apiStatus === 'in progress' || apiStatus === 'processing') newStatus = 'processing';
          else if (apiStatus === 'partial') newStatus = 'completed';
          else if (apiStatus === 'pending') newStatus = 'pending';
        }

        // Only update if status changed
        if (newStatus !== order.status) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Error updating order ${order.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`Order ${order.id}: ${order.status} -> ${newStatus}`);
            syncedCount++;

            // If order was cancelled, create a pending refund request
            if (newStatus === 'cancelled') {
              // Check if refund request already exists
              const { data: existingRefund } = await supabase
                .from('refund_requests')
                .select('id')
                .eq('order_id', order.id)
                .maybeSingle();

              if (!existingRefund) {
                // Create refund request
                const { error: refundError } = await supabase
                  .from('refund_requests')
                  .insert({
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: order.charge,
                    status: 'pending',
                    notes: `Auto-created: Order cancelled by provider (External ID: ${order.external_order_id})`
                  });

                if (refundError) {
                  console.error(`Error creating refund request for order ${order.id}:`, refundError);
                } else {
                  refundRequestsCreated++;
                  console.log(`Created refund request for cancelled order ${order.id}`);

                  // Fetch user profile for notification
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', order.user_id)
                    .maybeSingle();

                  const userName = profile?.username || profile?.full_name || 'Unknown User';

                  // Send Telegram notification for refund approval
                  try {
                    // Fetch Telegram settings
                    const { data: telegramToken } = await supabase
                      .from('admin_settings')
                      .select('setting_value')
                      .eq('setting_key', 'telegram_bot_token')
                      .maybeSingle();

                    const { data: telegramChatId } = await supabase
                      .from('admin_settings')
                      .select('setting_value')
                      .eq('setting_key', 'telegram_chat_id')
                      .maybeSingle();

                    if (telegramToken?.setting_value && telegramChatId?.setting_value) {
                      const message = `🔄 *Refund Request - Cancelled Order*\n\n` +
                        `📦 *Order ID:* \`${order.id.slice(0, 8)}\`\n` +
                        `🔗 *External ID:* \`${order.external_order_id}\`\n` +
                        `👤 *User:* ${userName}\n` +
                        `📱 *Platform:* ${order.platform}\n` +
                        `🎯 *Service:* ${order.service}\n` +
                        `📊 *Quantity:* ${order.quantity.toLocaleString()}\n` +
                        `💰 *Amount:* $${Number(order.charge).toFixed(2)}\n\n` +
                        `⚠️ Order was cancelled by provider.\n` +
                        `Please approve or reject the refund in the Admin Panel.`;

                      const telegramUrl = `https://api.telegram.org/bot${telegramToken.setting_value}/sendMessage`;
                      
                      await fetch(telegramUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: telegramChatId.setting_value,
                          text: message,
                          parse_mode: 'Markdown'
                        }),
                      });

                      console.log(`Telegram notification sent for order ${order.id}`);
                    }
                  } catch (telegramError) {
                    console.error(`Error sending Telegram notification:`, telegramError);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Exception syncing order ${order.id}:`, err);
        errorCount++;
      }
    }

    console.log(`Sync complete: ${syncedCount} updated, ${errorCount} errors, ${refundRequestsCreated} refund requests created`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Synced ${syncedCount} orders`,
      synced: syncedCount,
      errors: errorCount,
      refundRequests: refundRequestsCreated,
      total: orders.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sync-all-orders:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
