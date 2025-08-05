import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminInstantAccessProps {
  children: React.ReactNode;
  adminEmail?: string;
}

export function AdminInstantAccess({ 
  children, 
  adminEmail = 'support@backlinkoo.com' 
}: AdminInstantAccessProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkInstantAccess = async () => {
      try {
        // Check for instant admin session storage
        if (sessionStorage.getItem('instant_admin') === 'true') {
          setHasAccess(true);
          setChecked(true);
          return;
        }

        // Quick session check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email === adminEmail) {
          sessionStorage.setItem('instant_admin', 'true');
          setHasAccess(true);
          setChecked(true);
          return;
        }

        setHasAccess(false);
        setChecked(true);
      } catch (error) {
        console.warn('Admin instant access check failed:', error);
        setHasAccess(false);
        setChecked(true);
      }
    };

    checkInstantAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email === adminEmail) {
        sessionStorage.setItem('instant_admin', 'true');
        setHasAccess(true);
      } else {
        sessionStorage.removeItem('instant_admin');
        setHasAccess(false);
      }
      setChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [adminEmail]);

  // Don't render until checked to prevent flash
  if (!checked) {
    return null;
  }

  // Only render children if admin has access
  if (hasAccess) {
    return <>{children}</>;
  }

  return null;
}
