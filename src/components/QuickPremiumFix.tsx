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
      // Call the set premium function
      const response = await fetch('/.netlify/functions/set-user-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userEmail: 'labindalawamaryrose@gmail.com' 
        })
      });

      const result = await response.json();

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
      console.error('Quick fix error:', error);
      toast({
        title: "Error",
        description: "Failed to fix premium status",
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
