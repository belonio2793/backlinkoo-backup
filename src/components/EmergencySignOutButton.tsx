import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EmergencySignOutButton = () => {
  const handleEmergencySignOut = async () => {
    console.log('🚨 Emergency sign out triggered');
    
    try {
      // Clear all local data immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force reload to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Emergency sign out error:', error);
      // Force reload anyway
      window.location.href = '/';
    }
  };

  // Only show in development or if needed
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleEmergencySignOut}
        variant="outline"
        size="sm"
        className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
      >
        <LogOut className="h-3 w-3 mr-1" />
        Emergency Sign Out
      </Button>
    </div>
  );
};
