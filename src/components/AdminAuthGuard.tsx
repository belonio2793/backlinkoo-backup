import { useState, useEffect } from 'react';
import { AdminAuthService } from '@/services/adminAuthService';
import { AdminLogin } from '@/components/AdminLogin';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication status
    const checkAdminAuth = () => {
      const authenticated = AdminAuthService.isAdminAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
      
      if (authenticated) {
        // Extend session to keep it active
        AdminAuthService.extendAdminSession();
      }
    };

    checkAdminAuth();

    // Set up periodic session check (every 5 minutes)
    const interval = setInterval(() => {
      const authenticated = AdminAuthService.isAdminAuthenticated();
      if (!authenticated && isAuthenticated) {
        // Session expired
        setIsAuthenticated(false);
      } else if (authenticated) {
        // Extend session
        AdminAuthService.extendAdminSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking admin access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={handleAuthenticated} />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
