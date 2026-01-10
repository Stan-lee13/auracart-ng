import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { Product } from "@/lib/types";
import { normalizeProduct } from "@/lib/normalizers";
import { getProductImageUrl, handleImageError } from "@/lib/imageUtils";
import SimilarProducts from "@/components/SimilarProducts";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCartStore();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Product not found");
          navigate('/');
          return;
        }
        setProduct(normalizeProduct(data));
      } catch (error) {
        // Log error to monitoring service in production
        if (import.meta.env.DEV) {
          console.error('Error loading product:', error);
        }
        toast.error("Failed to load product");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, 1);
    toast.success("Added to cart!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={getProductImageUrl(product.images[selectedImage])}
                  onError={handleImageError}
                  alt={product.title}
                  className="w-full aspect-square object-cover"
                />
              </CardContent>
            </Card>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, idx) => (
                  <Card
                    key={idx}
                    className={`overflow-hidden cursor-pointer ${selectedImage === idx ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <CardContent className="p-0">
                      <img src={image} alt={`${product.title} ${idx + 1}`} className="w-full aspect-square object-cover" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-4xl font-bold text-primary mb-4">₦{product.final_price.toFixed(2)}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{product.description || "No description available"}</p>
            </div>

            <Button onClick={handleAddToCart} size="lg" className="w-full md:w-auto">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>

            <div className="border-t pt-4">
              <span className={`px-3 py-1 rounded-full text-sm ${product.stock_status === 'in_stock'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        <SimilarProducts currentProductId={product.id} />
      </main>

      <Footer />
    </div>
  );
}