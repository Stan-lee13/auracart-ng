# Required API Keys and Webhooks

To make your AuraCart application fully functional in production, you need to configure the following environment variables in your Supabase Edge Functions.

## 1. Core Infrastructure
These are usually pre-configured by Supabase, but verify they are available to your functions.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!).
- `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://auracart.vercel.app`).

## 2. Payment Gateways

### Paystack (Nigeria/Africa)
- **Variable**: `PAYSTACK_SECRET_KEY`
- **Where to get it**: [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer) -> API Keys & Webhooks.
- **Webhook URL**: You need to set your Paystack webhook URL to:
  `https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook`

### NowPayments (Crypto)
- **Variable**: `NOWPAYMENTS_API_KEY`
- **Where to get it**: [NowPayments Dashboard](https://account.nowpayments.io/settings).
- **Webhook URL**: Set your IPN (Instant Payment Notification) URL to:
  `https://<your-project-ref>.supabase.co/functions/v1/nowpayments-webhook`

## 3. E-commerce Integrations

### Shopify Sync
- **Variable**: `SHOPIFY_STORE_DOMAIN` (e.g., `your-store.myshopify.com`)
- **Variable**: `SHOPIFY_ACCESS_TOKEN`
- **Where to get it**: 
  1. Go to Shopify Admin -> Settings -> Apps and sales channels -> Develop apps.
  2. Create a new app.
  3. Configure Admin API scopes: `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_locations`.
  4. Install the app and reveal the "Admin API access token".

## 4. Suppliers (Dropshipping)
Configure these based on which suppliers you intend to use.

### AliExpress
- `ALIEXPRESS_APP_KEY`: Your AliExpress Open Platform App Key.
- `ALIEXPRESS_APP_SECRET`: Your AliExpress Open Platform Secret Key.
- `ALIEXPRESS_ACCESS_TOKEN`: The OAuth access token obtained via the authorization flow.
- **Where to get it**: [AliExpress Open Platform](https://open.aliexpress.com/).

## How to Set These Variables
You can set these variables using the Supabase CLI or the Dashboard.

**Via Dashboard:**
1. Go to your Supabase Project.
2. Click on **Edge Functions**.
3. Click on **Secrets** (or Environment Variables).
4. Add each key-value pair listed above.

**Via CLI:**
```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...
supabase secrets set SHOPIFY_ACCESS_TOKEN=shpat_...
# ... and so on
```
