import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FlaskConical, CheckCircle, AlertTriangle } from 'lucide-react';

export function DevEmailVerificationHelper() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Only show in development
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('.fly.dev');
  
  if (!isDev) {
    return null;
  }

  const simulateEmailVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to verify.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // This simulates what would happen when a user clicks the verification link
      // In development, we can manually trigger this
      console.log('🧪 Simulating email verification for:', email);
      
      // Create a mock verification token
      const mockToken = `mock_verification_${Date.now()}`;
      
      toast({
        title: "Development Verification Simulated",
        description: `Email verification simulated for ${email}. In production, this would be triggered by clicking the email link.`,
      });
      
    } catch (error: any) {
      toast({
        title: "Simulation failed",
        description: error.message || "Failed to simulate verification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4" />
          Development Email Helper
          <Badge variant="secondary" className="text-xs">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Development Mode Active</p>
              <p>Email services are mocked. Use admin panel for full testing.</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Email Verification:</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={simulateEmailVerification}
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            'Simulating...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Simulate Email Verification
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          This helper is only visible in development mode.
        </div>
      </CardContent>
    </Card>
  );
}
