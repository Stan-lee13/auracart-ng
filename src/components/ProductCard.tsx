import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getProductImageUrl } from "@/lib/imageUtils";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    addItem(product, 1);

    toast.success(`${product.title} added to cart!`, {
      position: "top-center",
    });
  };

  const price = product.final_price;
  const currency = 'NGN'; // Default to NGN as per new types
  const image = getProductImageUrl(product.images[0]);

  return (
    <div
      className="glass rounded-2xl overflow-hidden card-lift group cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden aspect-square">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="font-sans font-semibold text-lg line-clamp-2">{product.title}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold font-sans">
            {currency} {price.toFixed(2)}
          </p>
          <Button
            size="icon"
            className="rounded-full glow-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;