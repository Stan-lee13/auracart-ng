-- Create products table for internal product management
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aliexpress_product_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  supplier_cost numeric NOT NULL,
  markup_multiplier numeric NOT NULL DEFAULT 2.3,
  final_price numeric GENERATED ALWAYS AS (supplier_cost * markup_multiplier) STORED,
  supplier_sku text,
  category text,
  stock_status text DEFAULT 'in_stock',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_products_aliexpress_id ON public.products(aliexpress_product_id);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- Update trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add AliExpress order tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS aliexpress_order_id text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text,
ADD COLUMN IF NOT EXISTS fulfillment_status text DEFAULT 'pending';

-- Create index for AliExpress order tracking
CREATE INDEX IF NOT EXISTS idx_orders_aliexpress_order_id ON public.orders(aliexpress_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);