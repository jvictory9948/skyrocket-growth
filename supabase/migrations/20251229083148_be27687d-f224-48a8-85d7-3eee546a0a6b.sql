-- Create refund_requests table to track pending refunds
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  CONSTRAINT refund_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update refund requests" 
ON public.refund_requests 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can insert refund requests" 
ON public.refund_requests 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Service role can insert refund requests" 
ON public.refund_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to prevent duplicate refund requests for same order
CREATE UNIQUE INDEX idx_refund_requests_order_id ON public.refund_requests(order_id) WHERE status = 'pending';