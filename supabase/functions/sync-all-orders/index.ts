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
      .select('id, external_order_id, status')
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
          }
        }
      } catch (err) {
        console.error(`Exception syncing order ${order.id}:`, err);
        errorCount++;
      }
    }

    console.log(`Sync complete: ${syncedCount} updated, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Synced ${syncedCount} orders`,
      synced: syncedCount,
      errors: errorCount,
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
