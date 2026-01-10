import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplierApi } from '../suppliers';
import { SupplierType } from '@/lib/suppliers/types';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('supplierApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('checkHealth calls supplier-operations with correct action', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { status: 'ok' }, error: null });

        const result = await supplierApi.checkHealth();

        expect(supabase.functions.invoke).toHaveBeenCalledWith('supplier-operations', {
            body: { action: 'checkHealth' },
        });
        expect(result).toEqual({ status: 'ok' });
    });

    it('searchProducts calls supplier-operations with correct payload', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: [], error: null });

        const params = { query: 'test', limit: 10 };
        const suppliers: SupplierType[] = ['aliexpress'];
        await supplierApi.searchProducts(params, suppliers);

        expect(supabase.functions.invoke).toHaveBeenCalledWith('supplier-operations', {
            body: {
                action: 'searchProducts',
                payload: { params, suppliers },
            },
        });
    });

    it('createOrder calls supplier-operations with correct payload', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { orderId: '123' }, error: null });

        const order = { id: '1' };
        await supplierApi.createOrder('aliexpress', order);

        expect(supabase.functions.invoke).toHaveBeenCalledWith('supplier-operations', {
            body: {
                action: 'createOrder',
                payload: { supplierType: 'aliexpress', order },
            },
        });
    });

    it('throws error when supabase function fails', async () => {
        const error = new Error('Function failed');
        vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error });

        await expect(supplierApi.checkHealth()).rejects.toThrow('Function failed');
    });
});
