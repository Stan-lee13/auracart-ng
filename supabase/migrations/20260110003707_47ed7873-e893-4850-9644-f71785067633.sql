-- Create supplier_credentials table for storing AliExpress OAuth tokens
CREATE TABLE IF NOT EXISTS public.supplier_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_type TEXT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  user_id TEXT,
  user_nick TEXT,
  locale TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for edge functions)
CREATE POLICY "Only service role can access supplier credentials"
  ON public.supplier_credentials
  FOR ALL
  USING (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_supplier_credentials_updated_at
  BEFORE UPDATE ON public.supplier_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();