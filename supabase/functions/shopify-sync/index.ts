import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Shopify API Helper
class ShopifyClient {
    private domain: string;
    private accessToken: string;
    private apiVersion: string;

    constructor(domain: string, accessToken: string, apiVersion = '2024-01') {
        this.domain = domain;
        this.accessToken = accessToken;
        this.apiVersion = apiVersion;
    }

    async request(query: string, variables?: any) {
        const response = await fetch(`https://${this.domain}/admin/api/${this.apiVersion}/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': this.accessToken,
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        if (data.errors) {
            throw new Error(JSON.stringify(data.errors));
        }

        // Handle throttling
        const cost = data.extensions?.cost;
        if (cost && cost.throttleStatus.currentlyAvailable < 100) {
            // Simple backoff if we're running low on credits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return data.data;
    }

    async getPrimaryLocationId() {
        const query = `
            query {
                locations(first: 5) {
                    edges {
                        node {
                            id
                            isActive
                        }
                    }
                }
            }
        `;
        const data = await this.request(query);
        const location = data.locations.edges.find((edge: any) => edge.node.isActive)?.node;
        if (!location) throw new Error("No active location found in Shopify store");
        return location.id;
    }

    async createProduct(product: any, locationId: string) {
        const query = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            variants(first: 10) {
              edges {
                node {
                  id
                  sku
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

        const variants = product.variants && product.variants.length > 0
            ? product.variants.map((v: any) => ({
                price: v.price.toString(),
                sku: v.sku || v.id,
                inventoryManagement: "SHOPIFY",
                options: [v.option1, v.option2, v.option3].filter(Boolean),
                inventoryQuantities: [
                    {
                        availableQuantity: v.inventory_quantity || 0,
                        locationId: locationId
                    }
                ]
            }))
            : [{
                price: product.final_price.toString(),
                sku: product.id,
                inventoryManagement: "SHOPIFY",
                inventoryQuantities: [
                    {
                        availableQuantity: product.stock_status === 'in_stock' ? 100 : 0,
                        locationId: locationId
                    }
                ]
            }];

        const input = {
            title: product.title,
            descriptionHtml: product.description,
            vendor: "AuraCart",
            productType: product.category || "General",
            status: "ACTIVE",
            variants: variants,
            images: product.images ? product.images.map((src: string) => ({ src })) : []
        };

        return this.request(query, { input });
    }

    async updateProduct(shopifyId: string, product: any) {
        const query = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

        const input = {
            id: shopifyId,
            title: product.title,
            descriptionHtml: product.description,
            // Note: Updating variants is complex as it requires matching IDs. 
            // For this production release, we update core fields. 
            // Full variant sync would require fetching existing variants first.
            images: product.images ? product.images.map((src: string) => ({ src })) : []
        };

        return this.request(query, { input });
    }

    async deleteProduct(shopifyId: string) {
        const query = `
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;

        return this.request(query, { input: { id: shopifyId } });
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

        if (!shopifyDomain || !shopifyToken) {
            console.log('Shopify sync skipped: Missing configuration');
            return new Response(JSON.stringify({ message: 'Skipped' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const shopify = new ShopifyClient(shopifyDomain, shopifyToken);
        const payload = await req.json();

        // Handle Database Webhook Payload
        const { type, record, old_record } = payload;

        console.log(`Processing ${type} for product ${record?.id || old_record?.id}`);

        if (type === 'INSERT') {
            const locationId = await shopify.getPrimaryLocationId();
            const result = await shopify.createProduct(record, locationId);
            const shopifyProduct = result.productCreate?.product;

            if (shopifyProduct) {
                const shopifyId = shopifyProduct.id;
                const shopifyVariantId = shopifyProduct.variants.edges[0]?.node.id;

                // Update AuraCart with Shopify IDs
                await supabase
                    .from('products')
                    .update({
                        shopify_product_id: shopifyId,
                        shopify_variant_id: shopifyVariantId,
                        last_sync_at: new Date().toISOString(),
                        sync_status: 'synced'
                    })
                    .eq('id', record.id);
            } else {
                console.error('Shopify Create Errors:', result.productCreate?.userErrors);
                throw new Error('Failed to create product in Shopify: ' + JSON.stringify(result.productCreate?.userErrors));
            }

        } else if (type === 'UPDATE') {
            if (!record.shopify_product_id) {
                console.log('Product has no Shopify ID, creating...');
                const locationId = await shopify.getPrimaryLocationId();
                const result = await shopify.createProduct(record, locationId);
                const shopifyProduct = result.productCreate?.product;

                if (shopifyProduct) {
                    const shopifyId = shopifyProduct.id;
                    const shopifyVariantId = shopifyProduct.variants.edges[0]?.node.id;

                    await supabase
                        .from('products')
                        .update({
                            shopify_product_id: shopifyId,
                            shopify_variant_id: shopifyVariantId,
                            last_sync_at: new Date().toISOString(),
                            sync_status: 'synced'
                        })
                        .eq('id', record.id);
                } else {
                    console.error('Shopify Create (on Update) Errors:', result.productCreate?.userErrors);
                    await supabase
                        .from('products')
                        .update({ sync_status: 'failed' })
                        .eq('id', record.id);
                }
            } else {
                const result = await shopify.updateProduct(record.shopify_product_id, record);
                if (result.productUpdate?.userErrors?.length > 0) {
                    console.error('Shopify Update Errors:', result.productUpdate?.userErrors);
                    await supabase
                        .from('products')
                        .update({ sync_status: 'failed' })
                        .eq('id', record.id);
                } else {
                    await supabase
                        .from('products')
                        .update({
                            last_sync_at: new Date().toISOString(),
                            sync_status: 'synced'
                        })
                        .eq('id', record.id);
                }
            }


        } else if (type === 'DELETE') {
            if (old_record.shopify_product_id) {
                await shopify.deleteProduct(old_record.shopify_product_id);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Shopify Sync Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
