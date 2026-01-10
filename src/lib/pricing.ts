// Smart pricing engine with category-based multipliers

export interface PricingConfig {
  baseMultiplier: number;
  minMultiplier: number;
  maxMultiplier: number;
  minProfit: number;
}

export const CATEGORY_PRICING: Record<string, PricingConfig> = {
  electronics: {
    baseMultiplier: 1.6,
    minMultiplier: 1.4,
    maxMultiplier: 1.8,
    minProfit: 2.0,
  },
  fashion: {
    baseMultiplier: 2.2,
    minMultiplier: 1.8,
    maxMultiplier: 2.6,
    minProfit: 1.5,
  },
  'home-goods': {
    baseMultiplier: 1.9,
    minMultiplier: 1.6,
    maxMultiplier: 2.2,
    minProfit: 1.0,
  },
  accessories: {
    baseMultiplier: 2.5,
    minMultiplier: 2.0,
    maxMultiplier: 3.0,
    minProfit: 1.0,
  },
  default: {
    baseMultiplier: 2.0,
    minMultiplier: 1.5,
    maxMultiplier: 2.5,
    minProfit: 1.0,
  },
};

export interface PricingMetadata {
  trendingScore?: number; // 0-1 scale
  salesVelocity?: number; // units sold per day
  competitorPrice?: number;
}

/**
 * Calculate optimal markup multiplier based on category and metadata
 */
export function calculateMarkup(
  supplierCost: number,
  category?: string,
  metadata?: PricingMetadata
): number {
  const config = CATEGORY_PRICING[category || 'default'] || CATEGORY_PRICING.default;
  
  let multiplier = config.baseMultiplier;
  
  // Adjust based on trending score (higher trend = slightly higher multiplier)
  if (metadata?.trendingScore) {
    const trendBoost = metadata.trendingScore * 0.3; // Max 30% boost
    multiplier += trendBoost;
  }
  
  // Adjust based on sales velocity (popular items can have slightly higher margins)
  if (metadata?.salesVelocity && metadata.salesVelocity > 10) {
    multiplier += 0.1; // 10% boost for high-velocity items
  }
  
  // Ensure within bounds
  multiplier = Math.max(config.minMultiplier, Math.min(multiplier, config.maxMultiplier));
  
  // Ensure minimum profit margin
  const finalPrice = supplierCost * multiplier;
  const profit = finalPrice - supplierCost;
  
  if (profit < config.minProfit) {
    multiplier = (supplierCost + config.minProfit) / supplierCost;
  }
  
  return Number(multiplier.toFixed(2));
}

/**
 * Calculate final selling price
 */
export function calculateFinalPrice(
  supplierCost: number,
  multiplier: number
): number {
  return Number((supplierCost * multiplier).toFixed(2));
}

/**
 * Get category from product title or description
 */
export function detectCategory(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  if (text.match(/phone|laptop|computer|tablet|headphone|speaker|camera|tv/)) {
    return 'electronics';
  }
  if (text.match(/shirt|dress|pants|shoes|clothing|fashion|wear|jacket/)) {
    return 'fashion';
  }
  if (text.match(/home|furniture|decor|kitchen|bedroom|living/)) {
    return 'home-goods';
  }
  if (text.match(/watch|jewelry|bag|wallet|accessory|sunglasses/)) {
    return 'accessories';
  }
  
  return 'default';
}
