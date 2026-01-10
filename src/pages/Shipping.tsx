import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Globe, Clock } from "lucide-react";

export default function Shipping() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Shipping Information
          </h1>

          <p className="text-xl text-muted-foreground mb-12">
            Fast, reliable worldwide shipping with real-time tracking.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <Package className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Processing Time</h3>
                <p className="text-muted-foreground">
                  Orders are processed within 2-3 business days. You'll receive a confirmation email once your order ships.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Truck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Delivery Methods</h3>
                <p className="text-muted-foreground">
                  We use AliExpress Standard Shipping for cost-effective delivery, with DHL available for faster service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">International Shipping</h3>
                <p className="text-muted-foreground">
                  We ship to over 200 countries worldwide. Customs fees may apply based on your location.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tracking</h3>
                <p className="text-muted-foreground">
                  Track your order in real-time with updates sent directly to your email and available in your account.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Estimated Delivery Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">United States</span>
                  <span className="text-muted-foreground">7-15 business days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Europe</span>
                  <span className="text-muted-foreground">10-18 business days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Asia Pacific</span>
                  <span className="text-muted-foreground">7-21 business days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Africa</span>
                  <span className="text-muted-foreground">10-21 business days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Other Regions</span>
                  <span className="text-muted-foreground">15-25 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>• Delivery times are estimates and may vary based on location and customs processing.</p>
              <p>• Orders are shipped from our global warehouse network for fastest delivery.</p>
              <p>• Free shipping available on orders over $50 to select countries.</p>
              <p>• Customers are responsible for any customs duties or import taxes.</p>
              <p>• Contact support if your order hasn't arrived within the estimated timeframe.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
