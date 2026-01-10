// Supplier API integration types for frontend
// Re-export SupplierType from main types
export type { SupplierType } from '../types';
import type { SupplierType } from '../types';

export interface SupplierConfig {
  name: SupplierType;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  timeout: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface SupplierProductVariant {
  id: string;
  name: string;
  price: number;
  stock?: number;
  inventory?: number;
  attributes?: Record<string, string>;
  sku: string;
  images?: string[];
}

export interface SupplierShippingInfo {
  shippingCost: number;
  estimatedDelivery: string;
  warehouseLocation?: string;
}

export interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  stock?: number;
  variants?: SupplierProductVariant[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  supplierUrl?: string;
  supplierId?: string;
  updatedAt?: string;
  supplier?: string;
  shippingInfo?: SupplierShippingInfo;
}

export interface SupplierOrder {
  id: string;
  orderId: string;
  status: SupplierOrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  items: SupplierOrderItem[];
  shippingAddress: SupplierAddress;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  sku: string;
}

export interface SupplierAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export type SupplierOrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface SupplierSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'name' | 'updated' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierSearchResponse {
  products: SupplierProduct[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface SupplierRateLimitInfo {
  requestsRemaining: number;
  resetTime: number;
  limit: number;
}

// Base supplier interface
export interface BaseSupplier {
  getType(): SupplierType;
  getName(): string;
  getDescription(): string;
  getFeatures(): string[];
  getSupportedCountries(): string[];
  searchProducts(params: SupplierSearchParams): Promise<SupplierSearchResponse>;
  getProduct(productId: string): Promise<SupplierProduct>;
  createOrder(order: any): Promise<{ orderId: string; status: string }>;
  getOrderStatus(orderId: string): Promise<{ status: string; trackingNumber?: string; estimatedDelivery?: string }>;
  isHealthy(): Promise<boolean>;
  getRateLimitInfo(): SupplierRateLimitInfo;
}

// Supplier-specific config types
export interface AliExpressConfig extends SupplierConfig {
  appKey?: string;
  appSecret?: string;
  trackingId?: string;
}

// Error class
export class SupplierError extends Error {
  constructor(
    message: string,
    public code: string,
    public supplierType: SupplierType,
    public details?: any
  ) {
    super(message);
    this.name = 'SupplierError';
  }
}
