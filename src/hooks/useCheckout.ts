import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShippingAddress, PaymentMethod } from "@/lib/types";

export function useCheckout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
    const [payCurrency, setPayCurrency] = useState('USDT');
    const [formData, setFormData] = useState<ShippingAddress>({
        name: "",
        email: user?.email || "",
        phone: "",
        address1: "",
        city: "",
        state: "",
        country: "Nigeria",
        countryCode: "NG",
        zip: "",
    });

    const total = items.reduce((sum, item) => sum + (item.product.final_price * item.quantity), 0);

    const processCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please log in to checkout");
            navigate("/auth");
            return;
        }

        setLoading(true);
        try {
            let response;

            if (paymentMethod === 'paystack') {
                // Initialize Paystack payment
                response = await supabase.functions.invoke('paystack-initialize', {
                    body: {
                        email: formData.email,
                        amount: total,
                        items: items.map(item => ({
                            product_id: item.product.id,
                            title: item.product.title,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.product.final_price,
                        })),
                        shippingAddress: formData,
                    }
                });
            } else {
                // Initialize Crypto payment
                response = await supabase.functions.invoke('nowpayments-initialize', {
                    body: {
                        items: items.map(item => ({
                            product_id: item.product.id,
                            title: item.product.title,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.product.final_price,
                        })),
                        shippingAddress: formData,
                        payCurrency,
                    }
                });
            }

            const { data, error } = response;

            if (error) throw error;

            // Redirect to payment URL (authorization_url for Paystack, payment_url for NowPayments)
            const redirectUrl = data.authorization_url || data.payment_url;
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                throw new Error("No payment URL returned");
            }

        } catch (error) {
            // Log error to monitoring service in production
            if (import.meta.env.DEV) {
                console.error('Checkout error:', error);
            }
            const message = error instanceof Error ? error.message : "Failed to initialize payment";
            toast.error(message);
            setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        loading,
        total,
        processCheckout,
        items,
        paymentMethod,
        setPaymentMethod,
        payCurrency,
        setPayCurrency,
    };
}
