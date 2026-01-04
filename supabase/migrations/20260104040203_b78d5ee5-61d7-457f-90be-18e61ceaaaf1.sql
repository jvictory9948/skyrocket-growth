-- Table for user favorite services
CREATE TABLE public.favorite_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE public.favorite_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
ON public.favorite_services 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.favorite_services 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorite_services 
FOR DELETE 
USING (auth.uid() = user_id);

-- Table for referral codes
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code" 
ON public.referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (is_admin());

-- Table for referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Service role can insert referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

-- Table for referral earnings
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Service role can insert earnings" 
ON public.referral_earnings 
FOR INSERT 
WITH CHECK (true);

-- Add referral_code column to profiles for tracking who referred the user
ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);

-- Insert default referral percentage setting
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('referral_percentage', '4')
ON CONFLICT (setting_key) DO NOTHING;