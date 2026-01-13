import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminInventory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Product sourcing and inventory control</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Manage product inventory, stock levels, and supplier integration.</p>
            </CardContent>
        </Card>
    );
}
