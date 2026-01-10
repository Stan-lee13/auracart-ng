import { useState } from "react";
import { Json } from "@/integrations/supabase/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { calculateMarkup, detectCategory } from "@/lib/pricing";
import { supplierApi } from "@/lib/api/suppliers";
import { SupplierProduct } from "@/lib/suppliers/types";

export default function ImportProducts() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [markup, setMarkup] = useState<Record<string, number>>({});

  const searchProducts = async () => {
    if (!keyword.trim()) {
      toast.error("Please enter a search keyword");
      return;
    }

    setLoading(true);
    try {
      const response = await supplierApi.searchProducts({
        query: keyword,
        limit: 20
      }, ['aliexpress']);

      // The response structure depends on how supplier-operations returns it.
      // Based on manager.ts, it returns Map<SupplierType, SupplierSearchResponse>
      // But passing through edge function might serialize it differently.
      // Let's assume the edge function returns a JSON object where keys are supplier types.

      const aliexpressData = response.aliexpress || response['aliexpress'];

      if (aliexpressData) {
        setProducts(aliexpressData.products || []);
        toast.success(`Found ${aliexpressData.products?.length || 0} products`);
      } else {
        setProducts([]);
        toast.info("No products found");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search products";
      console.error('Search error:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const importProduct = async (product: SupplierProduct) => {
    const category = detectCategory(product.name, product.description);
    const suggestedMarkup = calculateMarkup(product.price, category);
    const markupMultiplier = markup[product.id] || suggestedMarkup;

    setImporting(product.id);
    try {
      // Cast to any to bypass strict type checking since schema may differ
      const insertData: Record<string, unknown> = {
        aliexpress_product_id: product.id,
        title: product.name,
        description: product.description || '',
        images: product.images || [],
        variants: product.variants || [],
        supplier_cost: product.price,
        markup_multiplier: markupMultiplier,
        supplier_sku: product.sku || product.id,
        category,
        stock_status: product.stock && product.stock > 0 ? 'in_stock' : 'out_of_stock',
        supplier: 'aliexpress',
        final_price: product.price * markupMultiplier,
      };

      // eslint-disable-next-line
      const { error } = await supabase.from('products').insert(insertData as any);

      if (error) throw error;

      toast.success("Product imported successfully!");
      setProducts(products.filter(p => p.id !== product.id));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import product';
      console.error('Import error:', error);
      toast.error(errorMessage);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Import Products from AliExpress</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Products</CardTitle>
              <CardDescription>Search for products on AliExpress to import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter product keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                />
                <Button onClick={searchProducts} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const category = detectCategory(product.name, product.description);
              const suggestedMarkup = calculateMarkup(product.price, category);
              const markupMultiplier = markup[product.id] || suggestedMarkup;
              const finalPrice = product.price * markupMultiplier;

              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supplier Cost:</span>
                        <span className="font-medium">${product.price.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Markup:</span>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          value={markupMultiplier}
                          onChange={(e) => setMarkup({ ...markup, [product.id]: parseFloat(e.target.value) || 2.3 })}
                          className="w-20 h-8"
                        />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Selling Price:</span>
                        <span className="font-bold text-primary">${finalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => importProduct(product)}
                      disabled={importing === product.id}
                      className="w-full"
                    >
                      {importing === product.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Import Product
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              Search for products to import them into your store
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}