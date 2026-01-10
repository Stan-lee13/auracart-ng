-- Multi-supplier support and enhanced features migration

-- Add supplier information to products table
ALTER TABLE products 
ADD COLUMN supplier VARCHAR(50) DEFAULT 'aliexpress',
ADD COLUMN supplier_product_id VARCHAR(100),
ADD COLUMN country_availability JSONB DEFAULT '["all"]',
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sync_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN original_price DECIMAL(10,2),
ADD COLUMN discount_percentage INTEGER DEFAULT 0,
ADD COLUMN trending_score INTEGER DEFAULT 0,
ADD COLUMN ai_recommended BOOLEAN DEFAULT FALSE;

-- Create suppliers table for managing multiple suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  api_endpoint VARCHAR(500),
  api_key VARCHAR(500),
  supplier_type VARCHAR(50) NOT NULL, -- 'dropshipping', 'marketplace', 'direct'
  categories JSONB DEFAULT '[]',
  countries_supported JSONB DEFAULT '["all"]',
  is_active BOOLEAN DEFAULT TRUE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  auto_order_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crypto payments table
CREATE TABLE crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  payment_id VARCHAR(100) UNIQUE,
  payment_status VARCHAR(50) DEFAULT 'waiting',
  pay_address VARCHAR(255),
  price_amount DECIMAL(10,2),
  price_currency VARCHAR(10),
  pay_amount DECIMAL(18,8),
  pay_currency VARCHAR(10),
  payin_extra_id VARCHAR(100),
  payout_extra_id VARCHAR(100),
  payout_hash VARCHAR(255),
  payin_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist table
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create price alerts table
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  target_price DECIMAL(10,2),
  alert_type VARCHAR(20) DEFAULT 'price_drop', -- 'price_drop', 'restock'
  is_active BOOLEAN DEFAULT TRUE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation logs table
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type VARCHAR(50) NOT NULL, -- 'inventory_sync', 'price_update', 'order_fulfillment'
  supplier_id UUID REFERENCES suppliers(id),
  status VARCHAR(20) DEFAULT 'running',
  details JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create country detection table for user sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  country_code VARCHAR(2),
  country_name VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product recommendations table
CREATE TABLE product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  product_id UUID REFERENCES products(id),
  recommendation_type VARCHAR(50), -- 'ai', 'trending', 'related'
  score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Create multi-language support
CREATE TABLE product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  language_code VARCHAR(5) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, language_code)
);

-- Create automation settings table
CREATE TABLE automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default suppliers
  ('aliexpress', 'dropshipping', '["all"]', '["all"]', 'https://api-sg.aliexpress.com/sync');

-- Insert default automation settings
INSERT INTO automation_settings (setting_key, setting_value, description) VALUES
  ('inventory_sync_enabled', 'true', 'Enable automatic inventory synchronization'),
  ('price_update_enabled', 'true', 'Enable automatic price updates'),
  ('auto_order_enabled', 'true', 'Enable automatic order placement'),
  ('crypto_payments_enabled', 'true', 'Enable cryptocurrency payments'),
  ('ai_recommendations_enabled', 'true', 'Enable AI-powered product recommendations'),
  ('country_restriction_enabled', 'true', 'Enable country-based product restrictions'),
  ('multi_language_enabled', 'true', 'Enable multi-language support');

-- Create indexes for performance
CREATE INDEX idx_products_supplier ON products(supplier);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_country_availability ON products USING GIN(country_availability);
CREATE INDEX idx_products_trending_score ON products(trending_score DESC);
CREATE INDEX idx_products_ai_recommended ON products(ai_recommended);
CREATE INDEX idx_products_last_sync ON products(last_sync_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_crypto_payments_status ON crypto_payments(payment_status);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_automation_logs_type ON automation_logs(automation_type);
CREATE INDEX idx_user_sessions_country ON user_sessions(country_code);
CREATE INDEX idx_product_recommendations_user ON product_recommendations(user_id);
CREATE INDEX idx_product_translations_language ON product_translations(language_code);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_payments_updated_at BEFORE UPDATE ON crypto_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON product_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at BEFORE UPDATE ON automation_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();