// Region detection and currency utilities

export interface RegionInfo {
  country: string;
  countryCode: string;
  currency: string;
  locale: string;
}

/**
 * Detect user region from browser
 */
export function detectRegion(): RegionInfo {
  const locale = navigator.language || 'en-US';
  const [language, country] = locale.split('-');
  
  // Map common locales to currency
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'NG': 'NGN',
    'ZA': 'ZAR',
    'EU': 'EUR',
    'DE': 'EUR',
    'FR': 'EUR',
    'ES': 'EUR',
    'IT': 'EUR',
  };
  
  const countryCode = (country || 'US').toUpperCase();
  
  return {
    country: countryCode,
    countryCode,
    currency: currencyMap[countryCode] || 'USD',
    locale,
  };
}

/**
 * Save region preference
 */
export function saveRegionPreference(region: RegionInfo) {
  localStorage.setItem('user_region', JSON.stringify(region));
}

/**
 * Get saved region preference
 */
export function getSavedRegion(): RegionInfo | null {
  const saved = localStorage.getItem('user_region');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}
