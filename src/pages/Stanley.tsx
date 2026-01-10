import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminInventory } from '@/components/admin/AdminInventory';
import { AdminPricing } from '@/components/admin/AdminPricing';
import AdminSupplierHealth from '@/components/admin/AdminSupplierHealth';
import AdminShopifySync from '@/components/admin/AdminShopifySync';

import { Order } from '@/lib/types';

// ... (keep existing imports)

export default function Stanley() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check for custom admin token first
      const customToken = localStorage.getItem('admin_token');
      if (customToken) {
        setIsAdmin(true);
        setLoading(false);
        fetchAdminData();
        return;
      }

      if (!user) {
        navigate('/stanley/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setIsAdmin(data?.role === 'admin');
        if (data?.role === 'admin') {
          await fetchAdminData();
        } else {
          navigate('/stanley/login');
        }
      } catch (error) {
        // Log error to monitoring service in production
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((import.meta as any).env.DEV) {
          console.error('Error checking admin status:', error);
        }
        navigate('/stanley/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id');

      setOrders((ordersData || []) as unknown as Order[]);

      const revenue = ordersData?.reduce((sum: number, order: { total_amount: number | string }) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalOrders: ordersData?.length || 0,
        totalRevenue: revenue,
        totalUsers: profilesData?.length || 0,
      });
    } catch (error: unknown) {
      // Log error to monitoring service in production
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((import.meta as any).env.DEV) {
        console.error('Error fetching admin data:', error);
      }
      toast.error('Failed to load admin data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Stanley Dashboard</h1>
            <Button onClick={() => navigate('/stanley/import')}>
              <Plus className="w-4 h-4 mr-2" />
              Import Products
            </Button>
          </div>

          <AdminStats stats={stats} />

          <Tabs defaultValue="orders" className="w-full">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="shopify">Shopify Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-6">
              <AdminOrders orders={orders} />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <AdminInventory />
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <AdminPricing />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-6">
              <AdminSupplierHealth />
            </TabsContent>

            <TabsContent value="shopify" className="mt-6">
              <AdminShopifySync />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}