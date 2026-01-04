-- Create service reviews table
CREATE TABLE public.service_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id text NOT NULL,
  service_name text NOT NULL,
  platform text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id)
);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all reviews"
ON public.service_reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their own orders"
ON public.service_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.service_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.service_reviews
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON public.service_reviews
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_service_reviews_updated_at
BEFORE UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();