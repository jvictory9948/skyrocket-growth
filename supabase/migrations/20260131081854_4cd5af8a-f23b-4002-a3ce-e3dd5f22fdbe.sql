-- Create api_providers table to store SMM API providers
CREATE TABLE public.api_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

-- Anyone can view providers (needed for service fetching)
CREATE POLICY "Anyone can view api providers"
ON public.api_providers
FOR SELECT
USING (true);

-- Admins can manage providers
CREATE POLICY "Admins can manage api providers"
ON public.api_providers
FOR ALL
USING (is_admin());

-- Add timestamp trigger
CREATE TRIGGER update_api_providers_updated_at
BEFORE UPDATE ON public.api_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default providers
INSERT INTO public.api_providers (provider_id, name, api_url, is_enabled, is_primary, display_order)
VALUES 
  ('reallysimplesocial', 'ReallySimpleSocial', 'https://reallysimplesocial.com/api/v2', true, true, 0),
  ('resellerprovider', 'ResellerProvider', 'https://resellerprovider.ru/api/v2', false, false, 1);