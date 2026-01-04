-- Add delete policy for admins on orders table
CREATE POLICY "Admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (is_admin());

-- Add delete policy for admins on transactions table
CREATE POLICY "Admins can delete transactions" 
ON public.transactions 
FOR DELETE 
USING (is_admin());