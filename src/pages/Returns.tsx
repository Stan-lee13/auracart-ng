import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function Returns() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Returns & Refunds Policy
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            We want you to be completely satisfied with your purchase.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>30-Day Return Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                You have 30 days from the date of delivery to return most items for a full refund. 
                Items must be unused, in original packaging, and in the same condition as received.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Eligible for Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Unused items in original packaging</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Items with all original tags and labels attached</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Items returned within 30 days of delivery</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Defective or damaged items received</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-muted-foreground">
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">Step 1:</span>
                  <span>Contact our support team at support@auracart.com with your order number and reason for return.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">Step 2:</span>
                  <span>Wait for return authorization and shipping instructions.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">Step 3:</span>
                  <span>Pack the item securely in its original packaging.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">Step 4:</span>
                  <span>Ship the item back using the provided return label.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">Step 5:</span>
                  <span>Refund will be processed within 5-7 business days after we receive your return.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Non-Returnable Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>• Personal care items and hygiene products</p>
              <p>• Items marked as final sale or clearance</p>
              <p>• Gift cards and digital products</p>
              <p>• Custom or personalized items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refund Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Once we receive and inspect your return, we'll send you an email notification. 
                If approved, your refund will be processed automatically to your original payment method.
              </p>
              <p>
                Please allow 5-10 business days for the refund to appear in your account, 
                depending on your payment provider's processing time.
              </p>
              <p className="font-semibold text-foreground pt-2">
                Shipping costs are non-refundable unless the item was defective or we made an error.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
