-- Update RLS policy to allow reading usd_to_ngn_rate publicly
DROP POLICY IF EXISTS "Anyone can read public settings" ON public.admin_settings;

CREATE POLICY "Anyone can read public settings" 
ON public.admin_settings 
FOR SELECT 
USING (setting_key = ANY (ARRAY['referral_percentage', 'turnstile_site_key', 'usd_to_ngn_rate', 'price_markup_percentage']));