-- Add Korapay payment method
INSERT INTO public.payment_methods (method_id, name, icon, is_enabled, display_order, details)
VALUES ('korapay', 'Korapay', 'CreditCard', false, 1, '{}')
ON CONFLICT (method_id) DO NOTHING;

-- Add Korapay settings to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
  ('korapay_public_key', ''),
  ('korapay_secret_key', '')
ON CONFLICT (setting_key) DO NOTHING;