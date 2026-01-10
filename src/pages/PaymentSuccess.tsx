import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const [verifying, setVerifying] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const { clearCart } = useCartStore();

  useEffect(() => {
    if (!reference) {
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: { reference }
        });

        if (error) throw error;

        setOrderNumber(data.order_number);
        clearCart();

        // Trigger order fulfillment
        await supabase.functions.invoke('auto-fulfill-order', {
          body: { orderId: data.order_id }
        });

        toast.success("Payment verified! Your order is being processed.");
      } catch (error: unknown) {
        // Log error to monitoring service in production
        if (import.meta.env.DEV) {
          console.error('Verification error:', error);
        }
        toast.error("Failed to verify payment");
        navigate("/");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, navigate, clearCart]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">Thank you for your order!</p>
            <p className="text-muted-foreground">Order Number: <span className="font-mono font-bold">{orderNumber}</span></p>
            <p className="text-sm text-muted-foreground">
              Your order is being processed and will be shipped soon. You'll receive tracking information via email.
            </p>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => navigate("/orders")} variant="outline" className="flex-1">
                View Orders
              </Button>
              <Button onClick={() => navigate("/")} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}