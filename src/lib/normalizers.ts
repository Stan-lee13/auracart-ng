import { Product, ProductVariant } from './types';
import { Json } from '@/integrations/supabase/types';

/**
 * Safely converts various JSON-like types to string array
 */
export function toStringArray(jsonLike: Json | string | string[] | null | undefined): string[] {
  if (!jsonLike) return [];

  if (Array.isArray(jsonLike)) {
    return jsonLike.map(item => String(item));
  }

  if (typeof jsonLike === 'string') {
    try {
      const parsed = JSON.parse(jsonLike);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [jsonLike];
    }
  }

  return [];
}

/**
 * Safely converts JSON to any array
 */
export function toArray<T>(jsonLike: Json | null | undefined): T[] {
  if (!jsonLike) return [];

  if (Array.isArray(jsonLike)) {
    return jsonLike as unknown as T[];
  }

  if (typeof jsonLike === 'string') {
    try {
      const parsed = JSON.parse(jsonLike);
      return Array.isArray(parsed) ? (parsed as unknown as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Normalizes a database product record to the Product type
 */
interface ProductRecord {
  id: string;
  aliexpress_product_id: string;
  title?: string;
  description?: string;
  images?: Json;
  variants?: Json;
  supplier_cost?: number;
  final_price?: number;
  markup_multiplier?: number;
  supplier_sku?: string;
  category?: string;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
}

export function normalizeProduct(record: Record<string, unknown>): Product {
  const r = record as unknown as ProductRecord;
  return {
    id: r.id,
    aliexpress_product_id: r.aliexpress_product_id,
    title: r.title || '',
    description: r.description || '',
    images: toStringArray(r.images),
    variants: toArray<ProductVariant>(r.variants),
    supplier_cost: Number(r.supplier_cost) || 0,
    final_price: Number(r.final_price) || 0,
    markup_multiplier: Number(r.markup_multiplier) || 2.3,
    supplier_sku: r.supplier_sku,
    category: r.category,
    stock_status: r.stock_status,
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || new Date().toISOString(),
  };
}
