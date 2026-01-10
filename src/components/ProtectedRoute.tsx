import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // First check local storage for custom admin token (for "secrecy" mode)
      const customToken = localStorage.getItem('admin_token');
      if (customToken) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        return;
      }

      if (!requireAdmin || !user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // Check if user has admin role in user_roles table
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsAdmin(userRole?.role === 'admin');
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (requireAdmin) {
      checkAdminStatus();
    } else {
      setCheckingAdmin(false);
    }
  }, [user, requireAdmin]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && isAdmin === false) {
    return <Navigate to="/stanley/login" replace />;
  }

  return <>{children}</>;
};