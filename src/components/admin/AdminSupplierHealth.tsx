import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { supplierApi } from "@/lib/api/suppliers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALIEXPRESS_APP_KEY = import.meta.env.VITE_ALIEXPRESS_APP_KEY;

interface HealthStatus {
    [key: string]: {
        status: 'online' | 'offline' | 'degraded';
        latency?: number;
        message?: string;
        lastChecked?: string;
    };
}

export default function AdminSupplierHealth() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const data = await supplierApi.checkHealth();
            setHealth(data);

            // Also check if we have a valid access token in Supabase
            const { data: credentials } = await supabase
                .from('supplier_credentials')
                .select('access_token')
                .eq('supplier_type', 'aliexpress')
                .maybeSingle();

            setIsConnected(!!credentials?.access_token);
            toast.success("Supplier status updated");
        } catch (error) {
            console.error("Failed to check health:", error);
            toast.error("Failed to check supplier health");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const handleConnect = () => {
        if (!ALIEXPRESS_APP_KEY) {
            toast.error("AliExpress App Key not configured in .env");
            return;
        }

        const redirectUri = `${window.location.origin.includes('localhost')
            ? 'https://mnuppunshelyjezumqtr.supabase.co/functions/v1/aliexpress-oauth-callback'
            : `${window.location.origin}/api/aliexpress-callback`}`;

        const oauthUrl = `https://oauth.aliexpress.com/authorize?response_type=code&client_id=${ALIEXPRESS_APP_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&state=stanley&view=web`;

        window.open(oauthUrl, '_blank');
    };

    const handleSeedTokens = async () => {
        const accessToken = prompt('Enter AliExpress Access Token (for testing):');
        if (!accessToken) return;

        try {
            const response = await supabase.functions.invoke('seed-tokens', {
                body: { accessToken, refreshToken: null, userId: 'test', userNick: 'test', locale: 'en' }
            });
            if (response.error) throw response.error;
            toast.success('Test tokens seeded successfully');
            setIsConnected(true);
            checkHealth();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to seed tokens';
            toast.error(message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'offline': return 'bg-red-500';
            case 'degraded': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'offline': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Supplier Health</CardTitle>
                <Button variant="ghost" size="sm" onClick={checkHealth} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-4">
                    {!health ? (
                        <div className="text-center text-muted-foreground py-4">
                            {loading ? "Checking status..." : "No data available"}
                        </div>
                    ) : (
                        Object.entries(health).map(([supplier, status]) => (
                            <div key={supplier} className="flex items-center justify-between p-2 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    {getStatusIcon(status.status)}
                                    <div>
                                        <p className="font-medium capitalize">{supplier}</p>
                                        {status.message && (
                                            <p className="text-xs text-muted-foreground">{status.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {status.latency && (
                                        <span className="text-xs text-muted-foreground">{status.latency}ms</span>
                                    )}
                                    <Badge variant="outline" className={getStatusColor(status.status) + " text-white border-none"}>
                                        {status.status}
                                    </Badge>
                                    {supplier === 'aliexpress' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant={isConnected ? "outline" : "default"}
                                                onClick={handleConnect}
                                                className="ml-2"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                {isConnected ? "Reconnect" : "Connect"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleSeedTokens}
                                                className="ml-2"
                                                title="Seed test tokens for development"
                                            >
                                                Seed Tokens
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
