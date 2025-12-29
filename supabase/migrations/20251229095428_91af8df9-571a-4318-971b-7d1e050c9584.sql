-- Add new admin settings for signup and admin action notifications
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('telegram_signup_bot_token', ''),
  ('telegram_signup_chat_id', ''),
  ('telegram_admin_action_bot_token', ''),
  ('telegram_admin_action_chat_id', ''),
  ('turnstile_site_key', '')
ON CONFLICT (setting_key) DO NOTHING;