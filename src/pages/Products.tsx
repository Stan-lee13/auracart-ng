import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { Product } from "@/lib/types";
import { normalizeProduct } from "@/lib/normalizers";
import { useCurrency } from "@/hooks/useCurrency";
import SearchBar from "@/components/SearchBar";
import { getProductImageUrl } from "@/lib/imageUtils";

const CATEGORIES = [
  { id: 'tech', label: 'Tech' },
  { id: 'mens-fashion', label: "Men's Fashion" },
  { id: 'womens-fashion', label: "Women's Fashion" },
  { id: 'accessories', label: 'Accessories' },
  { id: 'home', label: 'Home' }
];

export default function Products() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { formatPrice } = useCurrency();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('stock_status', 'in_stock')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProducts((data || []).map(normalizeProduct));
    } catch (error) {
      // Log error to monitoring service in production
      if (import.meta.env.DEV) {
        console.error('Error loading products:', error);
      }
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {category ? category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All Products'}
          </h1>

          <div className="flex justify-center mb-6">
            <SearchBar products={products} />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={!category ? "default" : "outline"}
              onClick={() => navigate('/products')}
            >
              All
            </Button>
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={category === cat.id ? "default" : "outline"}
                onClick={() => navigate(`/products?category=${cat.id}`)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {category ? `No ${category} products available yet` : 'No products available yet'}
            </p>
            <p className="text-sm text-muted-foreground">Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square overflow-hidden bg-secondary/20">
                  <img
                    src={getProductImageUrl(product.images[0])}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.final_price, 'NGN')}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
