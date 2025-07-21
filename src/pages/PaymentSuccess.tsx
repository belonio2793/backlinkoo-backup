import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { broadcastCreditPurchase } = useGlobalNotifications();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const paypalOrderId = searchParams.get('paypal_order_id');
      
      if (!sessionId && !paypalOrderId) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: {
            sessionId,
            paypalOrderId,
            type: 'payment'
          }
        });

        if (error) throw error;

        if (data.paid) {
          setPaymentVerified(true);
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          });
        } else {
          toast({
            title: "Payment Pending",
            description: "Your payment is still being processed.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Error",
          description: "Unable to verify payment status.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {verifying ? "Verifying Payment..." : paymentVerified ? "Payment Successful!" : "Payment Received"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {verifying 
              ? "Please wait while we verify your payment..."
              : paymentVerified 
              ? "Your payment has been processed successfully. You can now access your purchased credits or services."
              : "Thank you for your payment. You will receive a confirmation email shortly."
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

export default PaymentSuccess;