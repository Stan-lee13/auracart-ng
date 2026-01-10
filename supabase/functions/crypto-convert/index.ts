import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { fromCurrency, toCurrency, amount, orderId } = await req.json();

    // Get current exchange rate
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
    
    if (!exchangeRate) {
      throw new Error('Failed to get exchange rate');
    }

    // Calculate converted amount
    const convertedAmount = amount * exchangeRate;

    // Log the conversion
    const { data: conversionLog } = await supabase
      .from('crypto_conversions')
      .insert({
        order_id: orderId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        original_amount: amount,
        converted_amount: convertedAmount,
        exchange_rate: exchangeRate,
        conversion_fee: convertedAmount * 0.01, // 1% conversion fee
        net_amount: convertedAmount * 0.99,
      })
      .select()
      .single();

    // Update order with converted amount if orderId provided
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          converted_amount: convertedAmount,
          conversion_rate: exchangeRate,
          conversion_currency: toCurrency,
        })
        .eq('id', orderId);
    }

    return new Response(JSON.stringify({
      success: true,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      original_amount: amount,
      converted_amount: convertedAmount,
      exchange_rate: exchangeRate,
      conversion_fee: convertedAmount * 0.01,
      net_amount: convertedAmount * 0.99,
      conversion_id: conversionLog.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in crypto conversion:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Get exchange rate from various sources
async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    // Try multiple exchange rate APIs for redundancy
    const exchangeRate = await tryCoinGecko(fromCurrency, toCurrency) ||
                         await tryCoinMarketCap(fromCurrency, toCurrency) ||
                         await tryBinance(fromCurrency, toCurrency);

    return exchangeRate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return null;
  }
}

// CoinGecko API
async function tryCoinGecko(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY');
    
    // Convert currency codes to CoinGecko format
    const fromCoin = fromCurrency.toLowerCase();
    const toCoin = toCurrency.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${fromCoin}&vs_currencies=${toCoin}`,
      {
        headers: COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {},
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data[fromCoin] && data[fromCoin][toCoin]) {
      return data[fromCoin][toCoin];
    }

    return null;
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return null;
  }
}

// CoinMarketCap API
async function tryCoinMarketCap(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    const CMC_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!CMC_API_KEY) {
      return null;
    }

    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=${fromCurrency}&convert=${toCurrency}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.quote && data.data.quote[toCurrency]) {
      return data.data.quote[toCurrency].price;
    }

    return null;
  } catch (error) {
    console.error('CoinMarketCap API error:', error);
    return null;
  }
}

// Binance API (for crypto-to-crypto pairs)
async function tryBinance(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    const symbol = `${fromCurrency}${toCurrency}`;
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);

    if (!response.ok) {
      // Try reverse pair
      const reverseSymbol = `${toCurrency}${fromCurrency}`;
      const reverseResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${reverseSymbol}`);
      
      if (reverseResponse.ok) {
        const data = await reverseResponse.json();
        if (data.price) {
          return 1 / parseFloat(data.price);
        }
      }
      
      return null;
    }

    const data = await response.json();
    
    if (data.price) {
      return parseFloat(data.price);
    }

    return null;
  } catch (error) {
    console.error('Binance API error:', error);
    return null;
  }
}