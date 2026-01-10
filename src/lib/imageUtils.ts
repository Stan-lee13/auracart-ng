/**
 * Image utility functions for handling product images with fallbacks
 */

// Default product image fallback
export const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

// Image CDN base URL (can be configured via environment variable)
export const IMAGE_CDN_BASE = import.meta.env.VITE_IMAGE_CDN_BASE || '';

/**
 * Get product image URL with fallback
 */
export const getProductImageUrl = (imageUrl: string | undefined, index: number = 0): string => {
  if (!imageUrl) return DEFAULT_PRODUCT_IMAGE;
  
  // Handle array of images
  if (Array.isArray(imageUrl)) {
    return imageUrl[index] || imageUrl[0] || DEFAULT_PRODUCT_IMAGE;
  }
  
  // Handle single image URL
  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    // Add CDN prefix if available and image is not already a full URL
    if (IMAGE_CDN_BASE && !imageUrl.startsWith('http')) {
      return `${IMAGE_CDN_BASE}${imageUrl}`;
    }
    return imageUrl;
  }
  
  return DEFAULT_PRODUCT_IMAGE;
};

/**
 * Get all product images with fallbacks
 */
export const getProductImages = (images: string[] | undefined): string[] => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [DEFAULT_PRODUCT_IMAGE];
  }
  
  return images.map(url => getProductImageUrl(url));
};

/**
 * Validate image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url, window.location.origin);
    return true;
  } catch {
    return false;
  }
};

/**
 * Preload image for better performance
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Handle image load error
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  img.src = DEFAULT_PRODUCT_IMAGE;
  img.onerror = null; // Prevent infinite loop
};