import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Globe, Zap, Shield } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            About Aura Cart
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Experience luxury shopping redefined with AI-powered automation and global reach.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <ShoppingBag className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Premium Products</h3>
                <p className="text-muted-foreground">
                  Curated selection of high-quality products from trusted global suppliers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Shipping</h3>
                <p className="text-muted-foreground">
                  Fast and reliable worldwide shipping with real-time tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Smart Pricing</h3>
                <p className="text-muted-foreground">
                  AI-powered dynamic pricing ensures competitive prices on trending products.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-muted-foreground">
                  Safe and encrypted payment processing with multiple currency support.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                At Aura Cart, we're revolutionizing online shopping by combining cutting-edge technology 
                with exceptional customer service. Our platform connects you with premium products from 
                around the world, delivered right to your doorstep.
              </p>
              <p className="text-muted-foreground">
                We believe in transparency, quality, and innovation. Every product is carefully selected, 
                and our smart pricing engine ensures you always get the best value.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
