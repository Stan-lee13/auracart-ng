import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/types";
import { normalizeProduct } from "@/lib/normalizers";
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react";

interface SimilarProductsProps {
    currentProductId: string;
}

export default function SimilarProducts({ currentProductId }: SimilarProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProductId) {
            loadRecommendations();
        }
    }, [currentProductId]);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-recommendations', {
                body: { productId: currentProductId }
            });

            if (error) throw error;

            if (data?.recommendations) {
                setProducts(data.recommendations.map(normalizeProduct));
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
