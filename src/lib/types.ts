// Unified types for the application

export type SupplierType = 'aliexpress';
export type PaymentMethod = 'paystack' | 'crypto' | 'cod';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  price: number;
  inventory_quantity: number;
  option1?: string; // e.g. Size
  option2?: string; // e.g. Color
  option3?: string; // e.g. Material
  image_id?: string;
  shopify_variant_id?: string;
}

export interface Product {
  id: string;
  aliexpress_product_id: string;
  title: string;
  description: string;
  images: string[];
  variants?: ProductVariant[];
  supplier_cost: number;
  final_price: number;
  markup_multiplier: number;
  supplier_sku?: string;
  category?: string;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
  supplier?: SupplierType;
  supplier_product_id?: string;
  country_availability?: string[];
  last_sync_at?: string;
  sync_status?: 'pending' | 'syncing' | 'synced' | 'failed';
  original_price?: number;
  discount_percentage?: number;
  trending_score?: number;
  ai_recommended?: boolean;
  shopify_product_id?: string;
  shopify_variant_id?: string;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  zip: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  variantId?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  shipping_address: ShippingAddress;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
}

export interface Supplier {
  id: string;
  name: string;
  api_endpoint?: string;
  api_key?: string;
  supplier_type: 'dropshipping' | 'marketplace' | 'direct';
  categories: string[];
  countries_supported: string[];
  is_active: boolean;
  sync_enabled: boolean;
  auto_order_enabled: boolean;
  last_sync_at?: string;
  sync_frequency_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CryptoPayment {
  id: string;
  order_id: string;
  payment_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'failed' | 'refunded';
  pay_address?: string;
  price_amount: number;
  price_currency: string;
  pay_amount?: number;
  pay_currency?: string;
  payin_extra_id?: string;
  payout_extra_id?: string;
  payout_hash?: string;
  payin_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  alert_type: 'price_drop' | 'restock';
  is_active: boolean;
  notified_at?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id?: string;
  ip_address: string;
  country_code?: string;
  country_name?: string;
  user_agent?: string;
  created_at: string;
}

export interface ProductRecommendation {
  id: string;
  user_id?: string;
  product_id: string;
  recommendation_type: 'ai' | 'trending' | 'related';
  score: number;
  created_at: string;
  expires_at: string;
}

export interface ProductTranslation {
  id: string;
  product_id: string;
  language_code: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationSettings {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  automation_type: 'inventory_sync' | 'price_update' | 'order_fulfillment';
  supplier_id?: string;
  status: 'running' | 'completed' | 'failed';
  details?: unknown;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}
