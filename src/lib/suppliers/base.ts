// Base supplier implementation for frontend
import { 
  BaseSupplier, 
  SupplierConfig, 
  SupplierProduct, 
  SupplierOrder, 
  SupplierSearchParams, 
  SupplierSearchResponse,
  SupplierType,
  SupplierRateLimitInfo,
  SupplierError
} from './types';

export abstract class AbstractSupplier implements BaseSupplier {
  protected config: SupplierConfig;
  protected rateLimitInfo: SupplierRateLimitInfo = {
    requestsRemaining: 1000,
    resetTime: Date.now() + 3600000, // 1 hour from now
    limit: 1000,
  };

  constructor(config: SupplierConfig) {
    this.config = config;
  }

  abstract getType(): SupplierType;
  abstract getName(): string;
  abstract getDescription(): string;
  abstract getFeatures(): string[];
  abstract getSupportedCountries(): string[];
  abstract searchProducts(params: SupplierSearchParams): Promise<SupplierSearchResponse>;
  abstract getProduct(productId: string): Promise<SupplierProduct>;
  abstract createOrder(order: SupplierOrder): Promise<{ orderId: string; status: string }>;
  abstract getOrderStatus(orderId: string): Promise<{ status: string; trackingNumber?: string; estimatedDelivery?: string }>;
  abstract isHealthy(): Promise<boolean>;

  getRateLimitInfo(): SupplierRateLimitInfo {
    return this.rateLimitInfo;
  }

  protected updateRateLimit(headers: Record<string, string>): void {
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.requestsRemaining = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.resetTime = parseInt(headers['x-ratelimit-reset'], 10) * 1000;
    }
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo.limit = parseInt(headers['x-ratelimit-limit'], 10);
    }
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new SupplierError('API key is required', 'CONFIG_ERROR', this.getType());
    }
    if (!this.config.baseUrl) {
      throw new SupplierError('Base URL is required', 'CONFIG_ERROR', this.getType());
    }
  }

  protected handleError(error: any, operation: string): never {
    if (error instanceof SupplierError) {
      throw error;
    }
    
    const message = error?.message || 'Unknown error';
    const code = error?.code || 'OPERATION_ERROR';
    
    throw new SupplierError(message, code, this.getType(), { operation });
  }
}