import { supabase } from "@/integrations/supabase/client";
import { SupplierType } from "@/lib/types";

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

export interface SupplierOrder {
    id: string;
    orderId: string;
    status: string;
    items: any[];
    totalAmount: number;
    currency: string;
    // Add other fields as needed
}

export const supplierApi = {
    /**
     * Check the health status of all configured suppliers
     */
    async checkHealth() {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: { action: 'checkHealth' }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Search for products across multiple suppliers
     */
    async searchProducts(params: SupplierSearchParams, suppliers?: SupplierType[]) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'searchProducts',
                payload: { params, suppliers }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Compare a product across different suppliers
     */
    async compareProducts(productIds: string[]) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'compareProducts',
                payload: { productIds }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Create an order with a specific supplier
     */
    async createOrder(supplierType: SupplierType, order: any) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'createOrder',
                payload: { supplierType, order }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Get order details from a supplier
     */
    async getOrder(supplierType: SupplierType, orderId: string) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'getOrder',
                payload: { supplierType, orderId }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Update an order with a supplier
     */
    async updateOrder(supplierType: SupplierType, orderId: string, updates: any) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'updateOrder',
                payload: { supplierType, orderId, updates }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Cancel an order with a supplier
     */
    async cancelOrder(supplierType: SupplierType, orderId: string) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'cancelOrder',
                payload: { supplierType, orderId }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Get real-time inventory for products
     */
    async getInventory(supplierType: SupplierType, productIds: string[]) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'getInventory',
                payload: { supplierType, productIds }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Get tracking information for an order
     */
    async getTracking(supplierType: SupplierType, orderId: string) {
        const { data, error } = await supabase.functions.invoke('supplier-operations', {
            body: {
                action: 'getTracking',
                payload: { supplierType, orderId }
            }
        });
        if (error) throw error;
        return data;
    }
};
