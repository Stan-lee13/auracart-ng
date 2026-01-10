import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckout } from '../useCheckout';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({ user: { email: 'test@example.com' } })),
}));

vi.mock('@/stores/cartStore', () => ({
    useCartStore: vi.fn(() => ({
        items: [
            {
                product: { id: 'p1', title: 'Product 1', final_price: 100 },
                quantity: 2,
                variantId: 'v1',
            },
        ],
    })),
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

// Need to define window.location.href since it's used in the hook
Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
});

describe('useCheckout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with correct default values', () => {
        const { result } = renderHook(() => useCheckout());

        expect(result.current.loading).toBe(false);
        expect(result.current.formData.email).toBe('test@example.com');
        expect(result.current.total).toBe(200); // 100 * 2
    });

    it('updates form data correctly', () => {
        const { result } = renderHook(() => useCheckout());

        act(() => {
            result.current.setFormData({ ...result.current.formData, name: 'John Doe' });
        });

        expect(result.current.formData.name).toBe('John Doe');
    });

    it('processCheckout calls paystack-initialize and redirects', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: { authorization_url: 'https://paystack.com/pay/123' },
            error: null,
        });

        const { result } = renderHook(() => useCheckout());

        await act(async () => {
            await result.current.processCheckout({ preventDefault: vi.fn() } as any);
        });

        expect(supabase.functions.invoke).toHaveBeenCalledWith('paystack-initialize', expect.objectContaining({
            body: expect.objectContaining({
                amount: 200,
                email: 'test@example.com',
                items: expect.arrayContaining([
                    expect.objectContaining({
                        product_id: 'p1',
                        quantity: 2,
                        price: 100,
                    }),
                ]),
            }),
        }));

        expect(window.location.href).toBe('https://paystack.com/pay/123');
    });

    it('handles checkout error correctly', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: null,
            error: { message: 'Payment failed' },
        });

        const { result } = renderHook(() => useCheckout());

        await act(async () => {
            await result.current.processCheckout({ preventDefault: vi.fn() } as any);
        });

        expect(result.current.loading).toBe(false);
        // You might want to check if toast.error was called
    });
});
