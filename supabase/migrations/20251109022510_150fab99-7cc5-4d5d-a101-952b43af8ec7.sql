-- Create admin_keys table for secure admin authentication
CREATE TABLE IF NOT EXISTS public.admin_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access admin keys
CREATE POLICY "Only service role can access admin keys"
  ON public.admin_keys
  FOR ALL
  USING (false);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_keys_updated_at
  BEFORE UPDATE ON public.admin_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();