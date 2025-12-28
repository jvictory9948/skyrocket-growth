-- Create social_links table for admin to manage footer social links
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Everyone can view enabled social links
CREATE POLICY "Anyone can view social links" 
ON public.social_links 
FOR SELECT 
USING (true);

-- Only admins can manage social links
CREATE POLICY "Admins can manage social links" 
ON public.social_links 
FOR ALL 
USING (is_admin());

-- Insert default social links
INSERT INTO public.social_links (platform, url, display_order) VALUES
  ('twitter', 'https://twitter.com/epicsmm', 1),
  ('instagram', 'https://instagram.com/epicsmm', 2),
  ('discord', 'https://discord.gg/epicsmm', 3);

-- Create payment_methods table for admin to manage available payment methods
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can view enabled payment methods
CREATE POLICY "Anyone can view payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (true);

-- Only admins can manage payment methods
CREATE POLICY "Admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (is_admin());

-- Insert default payment methods
INSERT INTO public.payment_methods (method_id, name, icon, is_enabled, display_order, details) VALUES
  ('card', 'Credit Card', 'CreditCard', true, 1, '{}'),
  ('crypto', 'Crypto', 'Bitcoin', true, 2, '{}'),
  ('paypal', 'PayPal', 'Wallet', true, 3, '{}'),
  ('manual', 'Manual Transfer', 'Banknote', false, 4, '{"bank_name": "", "account_name": "", "account_number": "", "instructions": ""}');

-- Create trigger for updated_at
CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();