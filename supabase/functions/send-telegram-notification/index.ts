import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'order' | 'deposit' | 'signup' | 'admin_action';
  userEmail?: string;
  username?: string;
  amount?: number;
  service?: string;
  platform?: string;
  quantity?: number;
  link?: string;
  // For admin actions
  action?: string;
  adminEmail?: string;
  details?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all Telegram settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'telegram_bot_token', 
        'telegram_chat_id',
        'telegram_signup_bot_token',
        'telegram_signup_chat_id',
        'telegram_admin_action_bot_token',
        'telegram_admin_action_chat_id'
      ]);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Failed to fetch Telegram settings');
    }

    const payload: NotificationPayload = await req.json();
    console.log('Sending notification:', payload);

    // Determine which bot/chat to use based on notification type
    let botToken: string | undefined;
    let chatId: string | undefined;

    if (payload.type === 'signup') {
      botToken = settings?.find(s => s.setting_key === 'telegram_signup_bot_token')?.setting_value;
      chatId = settings?.find(s => s.setting_key === 'telegram_signup_chat_id')?.setting_value;
    } else if (payload.type === 'admin_action') {
      botToken = settings?.find(s => s.setting_key === 'telegram_admin_action_bot_token')?.setting_value;
      chatId = settings?.find(s => s.setting_key === 'telegram_admin_action_chat_id')?.setting_value;
    } else {
      // For orders and deposits, use the main notification channel
      botToken = settings?.find(s => s.setting_key === 'telegram_bot_token')?.setting_value;
      chatId = settings?.find(s => s.setting_key === 'telegram_chat_id')?.setting_value;
    }

    if (!botToken || !chatId) {
      console.log(`Telegram not configured for type: ${payload.type}, skipping notification`);
      return new Response(JSON.stringify({ success: true, message: 'Telegram not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let message = '';
    if (payload.type === 'order') {
      message = `🛒 *New Order Placed!*\n\n` +
        `👤 User: ${payload.username || payload.userEmail || 'Unknown'}\n` +
        `📦 Service: ${payload.service}\n` +
        `📱 Platform: ${payload.platform}\n` +
        `📊 Quantity: ${payload.quantity?.toLocaleString()}\n` +
        `💰 Amount: ${formatNaira(payload.amount || 0)}\n` +
        `🔗 Link: ${payload.link}`;
    } else if (payload.type === 'deposit') {
      message = `💳 *New Deposit!*\n\n` +
        `👤 User: ${payload.username || payload.userEmail || 'Unknown'}\n` +
        `💰 Amount: ${formatNaira(payload.amount || 0)}`;
    } else if (payload.type === 'signup') {
      message = `🎉 *New User Signup!*\n\n` +
        `👤 Username: ${payload.username || 'Not set'}\n` +
        `📧 Email: ${payload.userEmail || 'Unknown'}\n` +
        `📅 Time: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`;
    } else if (payload.type === 'admin_action') {
      message = `🔐 *Admin Action*\n\n` +
        `👮 Admin: ${payload.adminEmail || 'Unknown'}\n` +
        `⚡ Action: ${payload.action || 'Unknown action'}\n` +
        `👤 Target User: ${payload.username || payload.userEmail || 'N/A'}\n` +
        `${payload.amount !== undefined ? `💰 Amount: ${formatNaira(payload.amount)}\n` : ''}` +
        `${payload.details ? `📝 Details: ${payload.details}\n` : ''}` +
        `📅 Time: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`;
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const telegramResult = await telegramResponse.json();
    console.log('Telegram response:', telegramResult);

    if (!telegramResult.ok) {
      console.error('Telegram error:', telegramResult);
      throw new Error(telegramResult.description || 'Failed to send Telegram message');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending notification:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
