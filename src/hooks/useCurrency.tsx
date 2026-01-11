import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Placeholder exchange rates - in production, fetch from API
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1580,
  ZAR: 18.5,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  ZAR: 'R',
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState('USD');
  const [locale, setLocale] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('currency') || 'USD';
      const savedLocale = localStorage.getItem('locale') || 'en-US';
      
      // Validate currency
      if (!EXCHANGE_RATES[savedCurrency]) {
        throw new Error(`Invalid currency: ${savedCurrency}`);
      }
      
      setCurrency(savedCurrency);
      setLocale(savedLocale);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load currency preferences';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Currency initialization error:', errorMessage);
      }
      // Fallback to default currency
      setCurrency('USD');
      setLocale('en-US');
    }
  }, []);

  const convertPrice = (amount: number, fromCurrency: string = 'USD'): number => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Invalid amount provided for conversion');
      }
      
      if (amount < 0) {
        throw new Error('Amount cannot be negative');
      }
      
      const fromRate = EXCHANGE_RATES[fromCurrency];
      const toRate = EXCHANGE_RATES[currency];
      
      if (!fromRate || !toRate) {
        throw new Error(`Unsupported currency pair: ${fromCurrency} to ${currency}`);
      }
      
      return (amount / fromRate) * toRate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Currency conversion failed';
      setError(errorMessage);
      
      // Log error silently - don't show toast for conversion errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Currency conversion error:', errorMessage);
      }
      
      // Return original amount as fallback
      return amount;
    }
  };

  const formatPrice = (amount: number, fromCurrency: string = 'USD'): string => {
    try {
      const converted = convertPrice(amount, fromCurrency);
      const symbol = CURRENCY_SYMBOLS[currency] || currency;
      
      // Format based on locale
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Price formatting failed';
      setError(errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Price formatting error:', errorMessage);
      }
      
      // Fallback to simple formatting
      const converted = convertPrice(amount, fromCurrency);
      const symbol = CURRENCY_SYMBOLS[currency] || currency;
      return `${symbol}${converted.toFixed(2)}`;
    }
  };

  const changeCurrency = (newCurrency: string) => {
    try {
      if (!EXCHANGE_RATES[newCurrency]) {
        throw new Error(`Invalid currency: ${newCurrency}`);
      }
      
      setCurrency(newCurrency);
      localStorage.setItem('currency', newCurrency);
      setError(null);
      
      toast({
        title: "Currency Changed",
        description: `Currency changed to ${newCurrency}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change currency';
      setError(errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Currency change error:', errorMessage);
      }
      
      toast({
        title: "Currency Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const changeLocale = (newLocale: string) => {
    try {
      setLocale(newLocale);
      localStorage.setItem('locale', newLocale);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change locale';
      setError(errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Locale change error:', errorMessage);
      }
    }
  };

  return {
    currency,
    locale,
    convertPrice,
    formatPrice,
    changeCurrency,
    changeLocale,
    availableCurrencies: Object.keys(EXCHANGE_RATES),
    isLoading,
    error,
  };
};