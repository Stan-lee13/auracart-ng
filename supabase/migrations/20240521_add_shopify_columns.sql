-- Add Shopify sync columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS shopify_product_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_variant_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_shopify_id 
ON products(shopify_product_id);

CREATE INDEX IF NOT EXISTS idx_products_sync_status 
ON products(sync_status);

-- Add check constraint for sync_status values
ALTER TABLE products
ADD CONSTRAINT check_sync_status 
CHECK (sync_status IN ('pending', 'synced', 'failed', NULL));
