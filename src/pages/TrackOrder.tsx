import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Truck, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Order, OrderItem } from "@/lib/types";

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);

  const trackOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.trim())
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Order not found");
        return;
      }

      // Cast the response to match the Order type, specifically handling the items JSON array
      const order: Order = {
        ...data,
        items: data.items as unknown as OrderItem[],
        // ensure total_amount is a number if it comes as string, or leave as is if number
        total_amount: Number(data.total_amount)
      } as unknown as Order;

      setOrderData(order);
    } catch (error) {
      // Log error to monitoring service in production
      if (import.meta.env.DEV) {
        console.error('Tracking error:', error);
      }
      toast.error("Failed to find order");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_transit':
      case 'shipped':
        return <Truck className="w-6 h-6 text-blue-500" />;
      default:
        return <Package className="w-6 h-6 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Order Number</CardTitle>
              <CardDescription>Track your package in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter your order number (e.g., ORD-123456)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                />
                <Button onClick={trackOrder} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>

          {orderData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(orderData.fulfillment_status)}
                  Order Status
                </CardTitle>
                <CardDescription>Order #{orderData.order_number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Current Status</h3>
                  <p className="text-lg capitalize">{orderData.status}</p>
                </div>

                {orderData.tracking_number && (
                  <div>
                    <h3 className="font-semibold mb-2">Tracking Number</h3>
                    <p className="font-mono">{orderData.tracking_number}</p>
                  </div>
                )}

                {orderData.carrier && (
                  <div>
                    <h3 className="font-semibold mb-2">Carrier</h3>
                    <p>{orderData.carrier}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Order Date</h3>
                  <p>{new Date(orderData.created_at).toLocaleDateString()}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Total Amount</h3>
                  <p className="text-lg font-bold">₦{Number(orderData.total_amount).toFixed(2)}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${orderData.payment_status === 'paid' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Payment {orderData.payment_status === 'paid' ? 'Confirmed' : 'Pending'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${orderData.fulfillment_status !== 'pending' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Processing</span>
                    </div>
                    <div className={`flex items-center gap-2 ${['shipped', 'in_transit', 'delivered'].includes(orderData.fulfillment_status) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Shipped</span>
                    </div>
                    <div className={`flex items-center gap-2 ${orderData.fulfillment_status === 'delivered' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}