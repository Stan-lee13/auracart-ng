# Database Setup Guide

This guide will help you set up the database schema and apply all necessary migrations for the AuraCart system.

## Prerequisites

- Access to your Supabase Dashboard
- SQL Editor access in Supabase

## Applying Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Run all pending migrations
npx supabase db push
```

### Option 2: Manual SQL Execution

If the CLI doesn't work, manually run each migration file in the Supabase SQL Editor in this order:

#### 1. Add Product Sync Columns (Required for multi-supplier integration)

Open `supabase/migrations/20240521_add_product_sync_columns.sql` and run it in the SQL Editor.

**What it does:**
- Adds `supplier_product_id` column to track supplier product IDs
- Adds `supplier_variant_id` column to track supplier variant IDs
- Adds `sync_status` column to track sync state (pending/synced/failed)
- Adds `last_sync_at` timestamp for sync tracking
- Creates indexes for performance

#### 2. Setup Product Sync Trigger (Required for auto-sync)

Open `supabase/migrations/20240522_product_sync_trigger.sql` and:

1. **First, update the service role key:**
   - Find the line with `Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"`
   - Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from:
     Supabase Dashboard → Settings → API → service_role (secret)

2. **Then run the SQL**

**What it does:**
- Enables the `pg_net` extension (for HTTP requests)
- Creates a trigger function that calls the `sync-products` Edge Function
- Sets up a trigger on `products` table for INSERT, UPDATE, DELETE operations

## Verifying Migrations

After running the migrations, verify they were applied correctly:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('shopify_product_id', 'shopify_variant_id', 'sync_status', 'last_sync_at');

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_product_change';

-- Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Expected output:
- 4 columns should be listed
- 3 trigger events (INSERT, UPDATE, DELETE) on `products` table
- pg_net extension should be present

## Setting Up Admin Access

To access the admin panel, you need to assign the admin role to your user:

### Step 1: Sign Up/Login
1. Go to `http://localhost:8080/auth` (or your deployed URL)
2. Create an account or login

### Step 2: Get Your User ID

**Option A: From Browser Console**
```javascript
// Open browser console (F12) and run:
const authData = JSON.parse(localStorage.getItem('sb-ctjattuedycmgewumqeh-auth-token'));
console.log('User ID:', authData.user.id);
```

**Option B: From Supabase Dashboard**
1. Go to Authentication → Users
2. Find your email
3. Copy the User ID (UUID)

### Step 3: Assign Admin Role

Run this in Supabase SQL Editor, replacing `YOUR-USER-ID` with the ID from step 2:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR-USER-ID', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
```

### Step 4: Access Admin Panel

Now you can access:
- http://localhost:8080/admin (local)
- https://your-domain.com/admin (production)

## Common Issues

### "Column does not exist" errors

**Problem:** IDE shows errors about missing columns like `sync_status`

**Solution:** 
1. Run the migration: `20240521_add_shopify_columns.sql`
2. Restart your dev server: `npm run dev`
3. Restart your IDE (VSCode, etc.)

### Trigger not firing

**Problem:** Products aren't syncing to suppliers

**Solution:**
1. Check if pg_net is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_product_change';`
3. Check Edge Function logs in Supabase Dashboard
4. Ensure supplier API credentials are set in Edge Function secrets

### "Access Denied" on Admin Panel

**Problem:** Can't access /admin even after logging in

**Solution:**
1. Verify you ran the INSERT into user_roles with your correct user_id
2. Check the user_roles table: `SELECT * FROM user_roles WHERE user_id = 'YOUR-USER-ID';`
3. Try logging out and back in
4. Clear browser cache/localStorage

## Next Steps

After completing the database setup:

1. ✅ Database migrations applied
2. ✅ Admin access configured
3. 🔲 Deploy Edge Functions (see INTEGRATION_SETUP.md)
4. 🔲 Configure environment variables
5. 🔲 Import products
6. 🔲 Test supplier sync

## Testing the Setup

### Test Product Creation

```sql
-- Insert a test product
INSERT INTO products (title, description, final_price, images, stock_status, category)
VALUES (
  'Test Product',
  'This is a test product',
  99.99,
  ARRAY['https://via.placeholder.com/300'],
  'in_stock',
  'Test'
);

-- Check if it has sync_status
SELECT id, title, sync_status, supplier_product_id, last_sync_at
FROM products
WHERE title = 'Test Product';
```

Expected result:
- sync_status should be 'pending' (or 'synced' if trigger fired and function succeeded)
- supplier_product_id should be populated after sync completes

### Test Admin Access

1. Navigate to http://localhost:8080/admin
2. You should see the dashboard with tabs: Orders, Inventory, Pricing, Suppliers, Sync Status
3. Click "Sync Status" tab to see sync statistics

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check Edge Function logs: Dashboard → Edge Functions → [function-name] → Logs
3. Review browser console for frontend errors
4. Check network tab for failed requests
