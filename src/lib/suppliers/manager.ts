// Frontend supplier manager (mirrors supabase/functions/supplier-operations/suppliers/manager)
import {
  BaseSupplier,
  SupplierConfig,
  SupplierProduct,
  SupplierOrder,
  SupplierSearchParams,
  SupplierSearchResponse,
  SupplierType,
  AliExpressConfig,
  SupplierRateLimitInfo,
  SupplierError,
} from './types';

import { AliExpressSupplier } from './aliexpress';

export interface SupplierManagerConfig {
  aliexpress?: AliExpressConfig;
  defaultTimeout?: number;
  maxRetries?: number;
  enableCaching?: boolean;
  cacheTtl?: number;
}

// ... (rest of interfaces)
export interface SupplierHealth {
  supplier: SupplierType;
  status: 'healthy' | 'unhealthy' | 'rate_limited';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  rateLimitInfo?: SupplierRateLimitInfo;
}

export interface ProductComparison {
  productId: string;
  suppliers: Array<{
    supplier: SupplierType;
    product: SupplierProduct | null;
    price: number;
    availability: boolean;
    shippingCost: number;
    totalCost: number;
    deliveryTime: string;
  }>;
  bestPrice?: SupplierType;
  fastestDelivery?: SupplierType;
  bestOverall?: SupplierType;
}

export class SupplierManager {
  private suppliers: Map<SupplierType, BaseSupplier> = new Map();
  private config: SupplierManagerConfig;
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  constructor(config: SupplierManagerConfig) {
    this.config = {
      defaultTimeout: 30000,
      maxRetries: 3,
      enableCaching: true,
      cacheTtl: 300000, // 5 minutes
      ...config,
    };

    this.initializeSuppliers();
  }

  private initializeSuppliers(): void {
    if (this.config.aliexpress) {
      this.suppliers.set('aliexpress', new AliExpressSupplier(this.config.aliexpress));
    }
  }

  // Health monitoring
  async checkHealth(): Promise<SupplierHealth[]> {
    const healthChecks: Promise<SupplierHealth>[] = [];

    for (const [supplierType, supplier] of this.suppliers) {
      healthChecks.push(this.checkSupplierHealth(supplierType, supplier));
    }

    return Promise.all(healthChecks);
  }

  private async checkSupplierHealth(
    supplierType: SupplierType,
    supplier: BaseSupplier
  ): Promise<SupplierHealth> {
    const startTime = Date.now();

    try {
      const isHealthy = await supplier.isHealthy();
      const responseTime = Date.now() - startTime;
      const rateLimitInfo = supplier.getRateLimitInfo();

      return {
        supplier: supplierType,
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastChecked: new Date(),
        responseTime,
        rateLimitInfo,
      };
    } catch (error) {
      return {
        supplier: supplierType,
        status: 'unhealthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Product search across suppliers
  async searchProducts(
    params: SupplierSearchParams,
    suppliers?: SupplierType[]
  ): Promise<Map<SupplierType, SupplierSearchResponse>> {
    const targetSuppliers = suppliers || Array.from(this.suppliers.keys());
    const results = new Map<SupplierType, SupplierSearchResponse>();

    const searchPromises = targetSuppliers.map(async (supplierType) => {
      const supplier = this.suppliers.get(supplierType);
      if (!supplier) {
        return { supplierType, result: null, error: 'Supplier not configured' };
      }

      try {
        const result = await supplier.searchProducts(params);
        return { supplierType, result, error: null };
      } catch (error) {
        return {
          supplierType,
          result: { products: [], total: 0, hasMore: false, nextOffset: 0 },
          error: error instanceof Error ? error.message : 'Search failed'
        };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    searchResults.forEach(({ supplierType, result, error }) => {
      if (result) {
        results.set(supplierType, result);
      }
    });

    return results;
  }

  // Compare products across suppliers
  async compareProducts(productIds: string[]): Promise<ProductComparison[]> {
    const comparisons: ProductComparison[] = [];

    for (const productId of productIds) {
      const comparison = await this.compareProduct(productId);
      comparisons.push(comparison);
    }

    return comparisons;
  }

  private async compareProduct(productId: string): Promise<ProductComparison> {
    const suppliers = Array.from(this.suppliers.keys());
    const supplierData: ProductComparison['suppliers'] = [];

    const productPromises = suppliers.map(async (supplierType) => {
      const supplier = this.suppliers.get(supplierType);
      if (!supplier) return null;

      try {
        const product = await supplier.getProduct(productId);
        const shippingCost = product.shippingInfo?.shippingCost || 0;
        const totalCost = product.price + shippingCost;

        return {
          supplier: supplierType,
          product,
          price: product.price,
          availability: product.variants?.some(v => v.inventory > 0) || true,
          shippingCost,
          totalCost,
          deliveryTime: product.shippingInfo?.estimatedDelivery || 'Unknown',
        };
      } catch (error) {
        return {
          supplier: supplierType,
          product: null,
          price: 0,
          availability: false,
          shippingCost: 0,
          totalCost: 0,
          deliveryTime: 'N/A',
        };
      }
    });

    const results = await Promise.all(productPromises);
    supplierData.push(...results.filter(Boolean));

    // Determine best options
    const availableSuppliers = supplierData.filter(s => s.availability && s.product);

    const bestPrice = availableSuppliers.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best, availableSuppliers[0]
    );

    const fastestDelivery = availableSuppliers.reduce((fastest, current) => {
      const fastestDays = this.extractDeliveryDays(fastest.deliveryTime);
      const currentDays = this.extractDeliveryDays(current.deliveryTime);
      return currentDays < fastestDays ? current : fastest;
    }, availableSuppliers[0]);

    return {
      productId,
      suppliers: supplierData,
      bestPrice: bestPrice?.supplier,
      fastestDelivery: fastestDelivery?.supplier,
      bestOverall: this.calculateBestOverall(availableSuppliers),
    };
  }

  private calculateBestOverall(suppliers: any[]): SupplierType | undefined {
    if (suppliers.length === 0) return undefined;

    return suppliers.reduce((best, current) => {
      const bestScore = this.calculateSupplierScore(best);
      const currentScore = this.calculateSupplierScore(current);
      return currentScore > bestScore ? current : best;
    }).supplier;
  }

  private calculateSupplierScore(supplier: any): number {
    const priceScore = Math.max(0, 100 - (supplier.totalCost / 10)); // Lower cost = higher score
    const deliveryScore = Math.max(0, 100 - (this.extractDeliveryDays(supplier.deliveryTime) * 5)); // Faster delivery = higher score
    return priceScore * 0.6 + deliveryScore * 0.4; // Weighted average
  }

  private extractDeliveryDays(deliveryTime: string): number {
    const match = deliveryTime.match(/(\d+)\s*day/i);
    return match ? parseInt(match[1], 10) : 999; // Default to very high if unknown
  }

  // Get supplier instance
  getSupplier(supplierType: SupplierType): BaseSupplier | undefined {
    return this.suppliers.get(supplierType);
  }

  // Get all configured suppliers
  getSuppliers(): Map<SupplierType, BaseSupplier> {
    return this.suppliers;
  }

  // Get supplier configuration
  getConfig(): SupplierManagerConfig {
    return this.config;
  }

  // Update supplier configuration
  updateConfig(updates: Partial<SupplierManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.initializeSuppliers();
  }

  // Cache management
  private getCacheKey(supplierType: SupplierType, operation: string, params: any): string {
    return `${supplierType}:${operation}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache<T>(key: string, data: T): void {
    if (!this.config.enableCaching) return;

    this.cache.set(key, {
      data,
      expiry: Date.now() + (this.config.cacheTtl || 300000),
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}