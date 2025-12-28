-- Add column to store the external order ID from ReallySimpleSocial API
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_order_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_external_order_id ON public.orders(external_order_id);

-- Allow users to update their own orders (for status sync)
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);