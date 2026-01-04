-- Add IP and location tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_ip text,
ADD COLUMN IF NOT EXISTS last_location text,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;