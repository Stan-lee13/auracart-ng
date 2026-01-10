import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/types";
import { normalizeProduct } from "@/lib/normalizers";

const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('stock_status', 'in_stock')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setProducts((data || []).map(normalizeProduct));
    } catch (error) {
      // Log error to monitoring service in production
      if (import.meta.env.DEV) {
        console.error('Failed to load products:', error);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="products" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Featured{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Products
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Curated collection of premium items from trusted sellers worldwide
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              No products found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
