import { AbstractSupplier } from './base';
import {
    SupplierConfig,
    SupplierSearchParams,
    SupplierSearchResponse,
    SupplierProduct,
    SupplierOrder,
    SupplierType,
    AliExpressConfig
} from './types';

export class AliExpressSupplier extends AbstractSupplier {
    constructor(config: AliExpressConfig) {
        super(config);
    }

    getType(): SupplierType {
        return 'aliexpress';
    }

    getName(): string {
        return 'AliExpress';
    }

    getDescription(): string {
        return 'Global retail marketplace offering products at factory prices';
    }

    getFeatures(): string[] {
        return [
            'Global Shipping',
            'Buyer Protection',
            'Wide Variety',
            'Competitive Prices'
        ];
    }

    getSupportedCountries(): string[] {
        return ['Global']; // Supports almost all countries
    }

    async searchProducts(params: SupplierSearchParams): Promise<SupplierSearchResponse> {
        // This would typically call our backend proxy to avoid exposing secrets
        // or call a public API if available and safe
        return {
            products: [],
            total: 0,
            hasMore: false
        };
    }

    async getProduct(productId: string): Promise<SupplierProduct> {
        throw new Error('Method not implemented.');
    }

    async createOrder(order: SupplierOrder): Promise<{ orderId: string; status: string }> {
        throw new Error('Method not implemented.');
    }

    async getOrderStatus(orderId: string): Promise<{ status: string; trackingNumber?: string; estimatedDelivery?: string }> {
        throw new Error('Method not implemented.');
    }

    async isHealthy(): Promise<boolean> {
        return true;
    }
}
