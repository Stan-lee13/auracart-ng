# Shopify Integration Guide

## Overview
This integration makes **AuraCart the source of truth**, automatically syncing all product changes to Shopify in real-time using database triggers and Edge Functions.

## Architecture

```
AuraCart DB (Source of Truth)
    ↓
  Database Trigger (on INSERT/UPDATE/DELETE)
    ↓
  shopify-sync Edge Function
    ↓
  Shopify Admin API (GraphQL)
    ↓
  Shopify Store (Mirror)
```

## Setup Instructions

### 1. Create Shopify Private App

1. Go to your Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → "Create an app"
3. Name it "AuraCart Sync"
4. Configure Admin API scopes:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
   - `read_locations` (to set inventory)
5. Install the app and copy the **Admin API access token**

### 2. Set Environment Variables in Supabase

Go to Supabase Dashboard → Edge Functions → Secrets and add:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01
```

### 3. Deploy Edge Function

**Option A: Using Supabase CLI** (if installed)
```bash
npx supabase functions deploy shopify-sync
```

**Option B: Manual Deployment**
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function" → Name it `shopify-sync`
3. Copy the code from `supabase/functions/shopify-sync/index.ts`
4. Deploy

### 4. Add Shopify Columns to Products Table

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS shopify_product_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_variant_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_shopify_id 
ON products(shopify_product_id);
```

### 5. Enable Database Trigger

**Important**: First, get your Supabase Service Role Key from:
Dashboard → Settings → API → service_role (secret)

Then update the SQL migration file:
`supabase/migrations/20240522_shopify_sync_trigger.sql`

Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.

Then run it in Supabase SQL Editor.

### 6. Initial Bulk Sync (Optional)

To sync existing products to Shopify, create and run this SQL:

```sql
-- This will trigger the sync for all existing products
UPDATE products 
SET updated_at = NOW() 
WHERE shopify_product_id IS NULL;
```

This updates all products without a Shopify ID, triggering the sync.

### 7. Get Shopify Location ID (Important!)

The default sync code needs your Shopify location ID for inventory management.

Run this query in the Shopify GraphQL Admin API explorer:

```graphql
{
  locations(first: 1) {
    edges {
      node {
        id
        name
      }
    }
  }
}
```

Copy the location ID and update it in `shopify-sync/index.ts` line 79:
```typescript
locationId: "gid://shopify/Location/YOUR_ACTUAL_LOCATION_ID"
```

## How It Works

### Product Creation
1. New product inserted into AuraCart database
2. Database trigger fires → calls `shopify-sync` function
3. Function creates product in Shopify via GraphQL API
4. Shopify returns product ID and variant ID
5. Function updates AuraCart product with Shopify IDs

### Product Update
1. Product updated in AuraCart
2. Trigger fires → calls `shopify-sync`
3. Function updates existing Shopify product using stored ID
4. Updates sync timestamp in AuraCart

### Product Deletion
1. Product deleted from AuraCart
2. Trigger fires with old record data
3. Function deletes product from Shopify
4. No update to AuraCart (record already deleted)

## Rate Limiting

Shopify has a rate limit of **2 requests per second** for GraphQL API.

The `ShopifyClient` class includes:
- Automatic throttle detection
- 1-second backoff when credits are low
- GraphQL cost-based monitoring

For bulk operations, implement a queue system (see below).

## Queue System for Bulk Updates

For large-scale updates, create a separate Edge Function that processes in batches:

```typescript
// supabase/functions/shopify-bulk-sync/index.ts
// Fetch products in batches of 10
// Sleep 5 seconds between batches to respect rate limits
// Update products sequentially
```

## Testing

### Test Individual Sync
1. Insert a test product in AuraCart:
```sql
INSERT INTO products (title, description, final_price, images, stock_status)
VALUES ('Test Product', 'This is a test', 99.99, ARRAY['https://via.placeholder.com/300'], 'in_stock');
```

2. Check Edge Function logs in Supabase Dashboard
3. Verify product appears in Shopify Admin

### Test Update
```sql
UPDATE products 
SET title = 'Updated Test Product' 
WHERE title = 'Test Product';
```

Check that the change propagates to Shopify.

### Test Delete
```sql
DELETE FROM products WHERE title = 'Updated Test Product';
```

Verify product is removed from Shopify.

## Monitoring

### Check Sync Status
```sql
SELECT id, title, shopify_product_id, last_sync_at, sync_status
FROM products
WHERE sync_status = 'failed'
ORDER BY updated_at DESC;
```

### View Edge Function Logs
Go to: Supabase Dashboard → Edge Functions → shopify-sync → Logs

## Troubleshooting

### "Missing configuration" error
- Verify `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ACCESS_TOKEN` are set in Edge Function secrets

### "Failed to create product in Shopify"
- Check Edge Function logs for Shopify error details
- Verify API scopes are correct
- Ensure store domain format is `your-store.myshopify.com` (not `https://`)

### Products not syncing
- Check database trigger is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_product_change';
```
- Verify `pg_net` extension is installed:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### Rate limit errors
- Implement queue system for bulk updates
- Add delays between operations
- Monitor GraphQL cost in response

## Optional: Klaviyo Integration

To sync product catalog to Klaviyo for email campaigns:

1. Set environment variable:
```bash
KLAVIYO_API_KEY=pk_xxxxx
KLAVIYO_ENABLED=true
```

2. Add to `shopify-sync/index.ts`:
```typescript
if (Deno.env.get('KLAVIYO_ENABLED') === 'true') {
  await syncToKlaviyo(record);
}
```

## Optional: Yotpo Integration

To push product metadata for reviews:

1. Set environment variables:
```bash
YOTPO_API_KEY=your_key
YOTPO_API_SECRET=your_secret
YOTPO_ENABLED=true
```

2. Add to `shopify-sync/index.ts`:
```typescript
if (Deno.env.get('YOTPO_ENABLED') === 'true') {
  await syncToYotpo(record);
}
```

## Security Notes

1. **Never expose service role key** in client-side code
2. **Use HTTPS only** for webhook endpoints
3. **Validate webhook signatures** (future: add Shopify webhook validation)
4. **Rotate API tokens** periodically
5. **Monitor Edge Function logs** for suspicious activity

## Production Checklist

- [ ] Shopify private app created with correct scopes
- [ ] Environment variables set in Supabase
- [ ] Database columns added (shopify_product_id, shopify_variant_id)
- [ ] Database trigger deployed
- [ ] Edge function deployed and tested
- [ ] Location ID updated in sync code
- [ ] Initial bulk sync completed (if needed)
- [ ] Monitoring alerts configured
- [ ] Rate limiting tested
- [ ] Backup strategy in place

## Support

For issues:
1. Check Edge Function logs in Supabase Dashboard
2. Review Shopify API status: https://www.shopifystatus.com/
3. Verify database trigger is firing correctly
4. Check product sync_status column for failures
