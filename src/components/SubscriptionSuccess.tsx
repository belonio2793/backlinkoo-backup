import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            type: 'subscription'
          }
        });

        if (error) throw error;

        if (data.subscribed) {
          setSubscriptionActive(true);
          toast({
            title: "Subscription Active!",
            description: "Your subscription has been activated successfully.",
          });
        } else {
          toast({
            title: "Subscription Pending",
            description: "Your subscription is still being processed.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Subscription verification error:', error);
        toast({
          title: "Verification Error",
          description: "Unable to verify subscription status.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifySubscription();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {verifying ? "Verifying Subscription..." : subscriptionActive ? "Subscription Active!" : "Subscription Created"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {verifying 
              ? "Please wait while we verify your subscription..."
              : subscriptionActive 
              ? "Your subscription has been activated successfully. You now have access to all premium features."
              : "Thank you for subscribing! You will receive a confirmation email shortly."
            }
          </p>
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate("/dashboard")}
              disabled={verifying}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;