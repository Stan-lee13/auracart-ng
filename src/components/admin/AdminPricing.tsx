import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminPricing() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pricing Automation</CardTitle>
                <CardDescription>Automated pricing rules and strategies</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Pricing automation features coming soon.</p>
            </CardContent>
        </Card>
    );
}
