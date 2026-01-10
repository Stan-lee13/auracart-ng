-- Create crypto_payments table for NowPayments integration
CREATE TABLE public.crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  payment_id TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'waiting',
  pay_address TEXT,
  price_amount NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'NGN',
  pay_amount NUMERIC,
  pay_currency TEXT,
  payin_extra_id TEXT,
  payout_extra_id TEXT,
  payout_hash TEXT,
  payin_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create automation_logs table for tracking automated operations
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL,
  supplier_id TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  details JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on both tables
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS for crypto_payments - users can view their own payments
CREATE POLICY "Users can view their own crypto payments"
ON public.crypto_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = crypto_payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Admins can view all crypto payments
CREATE POLICY "Admins can view all crypto payments"
ON public.crypto_payments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for automation_logs - only admins can access
CREATE POLICY "Admins can manage automation logs"
ON public.automation_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX idx_crypto_payments_order_id ON public.crypto_payments(order_id);
CREATE INDEX idx_crypto_payments_payment_id ON public.crypto_payments(payment_id);
CREATE INDEX idx_automation_logs_type_status ON public.automation_logs(automation_type, status);

-- Add supplier column to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'supplier'
  ) THEN
    ALTER TABLE public.products ADD COLUMN supplier TEXT DEFAULT 'aliexpress';
  END IF;
END $$;

-- Fix the search path for existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;