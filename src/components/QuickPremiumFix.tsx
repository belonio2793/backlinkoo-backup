import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const QuickPremiumFix = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const { toast } = useToast();

  const handleQuickFix = async () => {
    setIsFixing(true);

    try {
      console.log('🔧 Starting quick premium fix...');

      // Call the set premium function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/.netlify/functions/set-user-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: 'labindalawamaryrose@gmail.com'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Check if response is ok first
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      let result;
      try {
        const responseText = await response.text();
        console.log('📡 Response text:', responseText);

        if (!responseText.trim()) {
          throw new Error('Empty response body');
        }

        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse response as JSON');
      }

      console.log('✅ Parse result:', result);

      if (result.success) {
        setIsFixed(true);
        toast({
          title: "Premium Status Fixed!",
          description: "User has been set to premium. Refreshing page...",
        });

        // Refresh page to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Fix Failed",
          description: result.error || "Failed to set premium status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Quick fix error:', error);

      let errorMessage = "Failed to fix premium status";

      if (error.name === 'AbortError') {
        errorMessage = "Request timed out - please try again";
      } else if (error.message?.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message?.includes('JSON')) {
        errorMessage = "Invalid response from server";
      } else if (error.message?.includes('body stream already read')) {
        errorMessage = "Network error - please refresh and try again";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (isFixed) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Success!</strong> Premium status has been activated. Page will refresh automatically.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Crown className="h-5 w-5" />
          Quick Premium Fix
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-100">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This will immediately activate premium features for labindalawamaryrose@gmail.com
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleQuickFix}
          disabled={isFixing}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
        >
          {isFixing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Activating Premium...
            </>
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Activate Premium Now
            </>
          )}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          This will set subscription_tier to 'premium' and create an active premium subscription
        </p>
      </CardContent>
    </Card>
  );
};
