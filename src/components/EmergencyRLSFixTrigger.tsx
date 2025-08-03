import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

export const EmergencyRLSFixTrigger = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerFix = async () => {
    setIsFixing(true);
    setError(null);

    try {
      console.log('🚨 Triggering emergency RLS fix...');
      
      const response = await fetch('/.netlify/functions/fix-rls-recursion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setIsFixed(true);
        console.log('✅ RLS fix successful:', result.message);
        
        // Refresh page after short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || 'Fix failed');
        console.error('❌ RLS fix failed:', result);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('❌ RLS fix error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Auto-trigger fix on component mount
  useEffect(() => {
    triggerFix();
  }, []);

  if (isFixed) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>RLS Recursion Fixed!</strong> Page will refresh automatically.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Database Error:</strong> Infinite recursion detected in profiles table.
            Applying emergency fix...
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Fix Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={triggerFix}
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Fixing Database Policies...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Apply Emergency Fix
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          This will fix the database policies causing the infinite recursion error.
        </p>
      </div>
    </div>
  );
};
