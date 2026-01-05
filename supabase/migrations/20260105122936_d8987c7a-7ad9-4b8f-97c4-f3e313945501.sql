-- Allow anyone to read specific public settings like referral_percentage
CREATE POLICY "Anyone can read public settings"
ON public.admin_settings
FOR SELECT
USING (setting_key IN ('referral_percentage', 'turnstile_site_key'));

-- Allow authenticated users to insert referrals (when they sign up with a referral code)
CREATE POLICY "Authenticated users can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_id);