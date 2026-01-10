import { Product } from './types';

/**
 * Simple fuzzy search implementation
 */
export function searchProducts(
  products: Product[],
  query: string,
  filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    inStockOnly?: boolean;
  }
): Product[] {
  if (!query && !filters) return products;
  
  let results = [...products];
  
  // Text search
  if (query) {
    const searchTerms = query.toLowerCase().split(' ');
    results = results.filter(product => {
      const searchText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }
  
  // Apply filters
  if (filters) {
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }
    
    if (filters.priceMin !== undefined) {
      results = results.filter(p => p.final_price >= filters.priceMin!);
    }
    
    if (filters.priceMax !== undefined) {
      results = results.filter(p => p.final_price <= filters.priceMax!);
    }
    
    if (filters.inStockOnly) {
      results = results.filter(p => p.stock_status === 'in_stock');
    }
  }
  
  // Rank by relevance (simple scoring)
  if (query) {
    results = results.map(product => {
      const titleMatch = product.title.toLowerCase().includes(query.toLowerCase());
      const exactMatch = product.title.toLowerCase() === query.toLowerCase();
      
      return {
        product,
        score: exactMatch ? 3 : titleMatch ? 2 : 1
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
  }
  
  return results;
}

/**
 * Get autocomplete suggestions
 */
export function getAutocompleteSuggestions(
  products: Product[],
  query: string,
  limit: number = 10
): Product[] {
  if (!query || query.length < 2) return [];
  
  const searchResults = searchProducts(products, query);
  return searchResults.slice(0, limit);
}
