import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { diagnosePremiumStatus } from '@/utils/premiumDiagnostic';

export function PremiumDiagnosticButton() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);

  const runDiagnostic = async () => {
    if (!user) return;
    
    setRunning(true);
    console.log('🔧 Running premium diagnostic...');
    await diagnosePremiumStatus(user.id);
    setRunning(false);
  };

  if (!user) return null;

  return (
    <Button 
      onClick={runDiagnostic}
      disabled={running}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      {running ? 'Testing...' : 'Test Premium Status'}
    </Button>
  );
}
