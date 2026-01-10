import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminInventory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Product sourcing and inventory control</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Inventory management features coming soon. Connect to Shopify to manage products.</p>
            </CardContent>
        </Card>
    );
}
