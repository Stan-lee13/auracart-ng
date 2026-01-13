# AuraCart - Quick Start Guide

## Project Overview

AuraCart is a modern e-commerce platform with:
- ✅ **Multiple Payment Methods**: Paystack (Cards/Bank) & Cryptocurrency (USDT, BTC, ETH)
- ✅ **AliExpress Integration**: Official AliExpress API support
- ✅ **Automated Order Fulfillment**: Server-side order processing
- ✅ **AI-Powered Recommendations**: Similar products suggestion
- ✅ **Admin Dashboard**: Order management, inventory, pricing, supplier health
- ✅ **Secure Checkout**: Server-side price calculation, webhooks validation

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

**Minimum required variables for local development:**
```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

### 3. Setup Database

Follow the instructions in `DATABASE_SETUP.md` to:
- Apply database migrations
- Set up admin access
- Configure triggers

### 4. Set Up Admin Access

**Get your user ID:**
```javascript
// In browser console after signing up:
const authData = JSON.parse(localStorage.getItem('sb-ctjattuedycmgewumqeh-auth-token'));
console.log(authData.user.id);
```

**Set admin role in Supabase SQL Editor:**
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin');
```

### 5. Run Development Server

```bash
npm run dev
```

Access the app at: http://localhost:8080

### 6. Access Admin Panel

Navigate to: http://localhost:8080/admin

## Project Structure

```
auracart-ng-main/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── CartDrawer.tsx
│   │   ├── ProductCard.tsx
│   │   └── SimilarProducts.tsx
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Home/product listing
│   │   ├── ProductDetail.tsx
│   │   ├── Checkout.tsx
│   │   ├── Admin.tsx
│   │   └── AdminImport.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useCheckout.ts
│   ├── stores/             # Zustand state management
│   │   └── cartStore.ts
│   ├── lib/                # Utilities and APIs
│   │   ├── api/
│   │   │   └── suppliers.ts
│   │   ├── suppliers/      # Supplier integrations
│   │   ├── types.ts
│   │   └── normalizers.ts
│   └── integrations/
│       └── supabase/
├── supabase/
│   ├── functions/          # Edge Functions (Backend)
│   │   ├── paystack-initialize/
│   │   ├── nowpayments-initialize/
│   │   ├── supplier-operations/
│   │   ├── auto-fulfill-order/
│   │   └── get-recommendations/
│   └── migrations/         # SQL migrations
├── PRODUCTION_CHECKLIST.md
├── DATABASE_SETUP.md
└── .env.example
```

## Key Features

### 1. Checkout Flow

Located in: `src/pages/Checkout.tsx`, `src/hooks/useCheckout.ts`

**Features:**
- Payment method selection (Paystack or Crypto)
- Cryptocurrency selection (USDT, BTC, ETH, USDC)
- Server-side price calculation
- Automatic order creation
- Payment initialization via Edge Functions

### 2. Product Management

**Admin Panel** (`src/pages/Admin.tsx`):
- View all orders
- Monitor inventory
- Adjust pricing
- Check supplier health

**Product Import** (`src/pages/AdminImport.tsx`):
- Search products from suppliers
- Import to catalog
- Automatic pricing with markup

### 3. Supplier Integration

Located in: `src/lib/suppliers/`

**Supported Suppliers:**
- AliExpress

**API Client:** `src/lib/api/suppliers.ts`
- Centralized supplier operations
- Health checks
- Product search
- Order creation
- Tracking

### 5. AI Recommendations

Located in: `src/components/SimilarProducts.tsx`

**Features:**
- Keyword extraction from product titles
- Category-based matching
- "You might also like" section on product pages
- Edge Function: `supabase/functions/get-recommendations`

## Edge Functions (Backend)

All backend logic runs in Supabase Edge Functions (Deno runtime):

### Payment Functions
- `paystack-initialize` - Initialize Paystack payment
- `paystack-verify` - Verify Paystack webhook
- `nowpayments-initialize` - Initialize crypto payment
- `nowpayments-webhook` - Handle crypto payment IPN

### Order Functions
- `auto-fulfill-order` - Automatically fulfill paid orders
- `aliexpress-fulfill-order` - Fulfill via AliExpress

### Supplier Functions
- `supplier-operations` - Centralized supplier API gateway
- `check-availability` - Check product availability
- `sync-inventory` - Sync inventory from suppliers

### Integration Functions
- `get-recommendations` - AI-powered product recommendations

### Import Functions
- `import-products` - Bulk import from suppliers
- `aliexpress-search-products` - Search AliExpress catalog
- `search-products` - Search local catalog

## Testing

### Run Unit Tests
```bash
npm run test
```

**Test Coverage:**
- `src/lib/api/__tests__/suppliers.test.ts` - Supplier API client
- `src/hooks/__tests__/useCheckout.test.tsx` - Checkout hook

### Manual Testing Checklist

**Frontend:**
- [ ] Product listing loads
- [ ] Product detail page works
- [ ] Add to cart functionality
- [ ] Cart drawer displays items
- [ ] Checkout form validation
- [ ] Payment method selection
- [ ] Crypto currency selection

**Admin Panel:**
- [ ] Login with admin credentials
- [ ] View orders list
- [ ] Monitor supplier health
- [ ] Import products

**Payments:**
- [ ] Paystack initialization
- [ ] Crypto payment initialization
- [ ] Order creation after payment

## Deployment

### Frontend (Vercel/Netlify)

1. **Connect Git Repository**
2. **Set Environment Variables:**
   ```
   VITE_SUPABASE_PROJECT_ID=xxx
   VITE_SUPABASE_PUBLISHABLE_KEY=xxx
   VITE_SUPABASE_URL=xxx
   ```
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Deploy**

### Backend (Supabase Edge Functions)

**Deploy all functions:**
```bash
npx supabase functions deploy paystack-initialize
npx supabase functions deploy nowpayments-initialize
npx supabase functions deploy supplier-operations
npx supabase functions deploy auto-fulfill-order
npx supabase functions deploy get-recommendations
```

**Set secrets in Supabase Dashboard:**
- Go to Edge Functions → Secrets
- Add all keys from `.env.example` (backend section)

### Database Migrations

**Apply via CLI:**
```bash
npx supabase db push
```

**Or manually via SQL Editor** (see DATABASE_SETUP.md)

## Environment Variables Reference

See `.env.example` for complete list. Key variables:

**Required:**
- Supabase credentials
- Payment provider keys (Paystack, NowPayments)
- AliExpress API key

**Optional:**
- Klaviyo API key (for marketing)
- Yotpo credentials (for reviews)

## Common Issues & Solutions

### No products showing
**Cause:** No products in database
**Solution:** 
1. Go to `/admin/import`
2. Search and import products from suppliers
3. Or manually insert test data (see DATABASE_SETUP.md)

### Admin access denied
**Cause:** User not in `user_roles` table
**Solution:** Run the INSERT query in DATABASE_SETUP.md with your user ID

### Payment failing
**Cause:** Using test keys or webhook not configured
**Solution:**
1. Verify API keys are correct
2. For production, use live keys
3. Configure webhook URLs in payment provider dashboard

### Supplier API errors
**Cause:** Invalid or missing API keys
**Solution:**
1. Check keys in Supabase Edge Function secrets
2. Verify supplier API is operational
3. Check Edge Function logs for details

## Next Steps

After initial setup:

1. **Import Products**: Use admin panel to import from suppliers
2. **Configure Payments**: Set up Paystack and NowPayments webhooks
3. **Optimize**: Review PRODUCTION_CHECKLIST.md
4. **Deploy**: Push to production

## Support & Documentation

- **Production Checklist**: `PRODUCTION_CHECKLIST.md`
- **Database Setup**: `DATABASE_SETUP.md`
- **Environment Variables**: `.env.example`

## Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: Zustand
- **Routing**: React Router
- **Testing**: Vitest
- **Payments**: Paystack, NowPayments
- **Suppliers**: AliExpress

## License

[Your License]

## Contributing

[Your Contributing Guidelines]
