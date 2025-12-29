import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositConfirmationPayload {
  userId: string;
  username: string;
  amount: number;
  adminUsername?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Telegram settings
    const { data: telegramSettings } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const settings = Object.fromEntries(
      telegramSettings?.map(s => [s.setting_key, s.setting_value]) || []
    );

    const botToken = settings['telegram_bot_token'];
    const chatId = settings['telegram_chat_id'];

    if (!botToken || !chatId) {
      console.log('Telegram not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: DepositConfirmationPayload = await req.json();
    console.log('Received deposit confirmation request:', payload);

    // Generate a 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the confirmation code in admin_settings temporarily
    const codeKey = `deposit_code_${payload.userId}_${Date.now()}`;
    await supabase
      .from('admin_settings')
      .insert({
        setting_key: codeKey,
        setting_value: JSON.stringify({
          code: confirmationCode,
          userId: payload.userId,
          username: payload.username,
          amount: payload.amount,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        })
      });

    // Send message to Telegram
    const message = `
🔐 *DEPOSIT CONFIRMATION REQUIRED*

A large deposit requires your confirmation:

👤 *User:* ${payload.username || 'Unknown'}
💰 *Amount:* ₦${payload.amount.toLocaleString()}
👨‍💼 *Admin:* ${payload.adminUsername || 'Unknown'}

🔑 *Confirmation Code:* \`${confirmationCode}\`

⚠️ This code expires in 10 minutes.

Enter this code in the admin panel to approve the deposit.
    `;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramResult = await telegramResponse.json();
    console.log('Telegram response:', telegramResult);

    if (!telegramResult.ok) {
      throw new Error(`Telegram error: ${telegramResult.description}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        codeKey,
        message: 'Confirmation code sent to Telegram' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending deposit confirmation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
