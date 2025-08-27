import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MobilePaymentHandler from "@/utils/mobilePaymentHandler";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

export const PaymentModal = ({ isOpen, onClose, initialCredits }: PaymentModalProps) => {
  const CREDIT_PRICE = 1.40;
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe">("stripe");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState(() => initialCredits ? (initialCredits * CREDIT_PRICE).toFixed(2) : "");
  const [credits, setCredits] = useState(() => initialCredits ? initialCredits.toString() : "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Update state when modal opens or initialCredits changes
  useEffect(() => {
    if (isOpen) {
      if (initialCredits && initialCredits > 0) {
        setCredits(initialCredits.toString());
        setAmount((initialCredits * CREDIT_PRICE).toFixed(2));
      } else {
        // Reset for new payment if no initial credits
        setCredits("");
        setAmount("");
      }
    }
  }, [isOpen, initialCredits]);

  // Calculate total amount based on credits
  const calculateAmount = (creditCount: string) => {
    const numCredits = parseFloat(creditCount) || 0;
    return (numCredits * CREDIT_PRICE).toFixed(2);
  };

  // Update amount when credits change
  const handleCreditsChange = (newCredits: string) => {
    setCredits(newCredits);
    setAmount(calculateAmount(newCredits));
  };

  const handlePayment = async () => {
    if (!credits || parseFloat(credits) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of credits",
        variant: "destructive",
      });
      return;
    }

    if (isGuest && !guestEmail) {
      toast({
        title: "Error", 
        description: "Email is required for guest checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          productName: `${credits} Backlink Credits`,
          credits: parseInt(credits),
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined,
          paymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.url) {
        // Use mobile-optimized payment handler
        await MobilePaymentHandler.handlePaymentRedirect({
          url: data.url,
          onSuccess: () => {
            console.log('✅ Payment redirect successful');
            onClose();
          },
          onError: (error) => {
            console.error('❌ Payment redirect failed:', error);
            toast({
              title: "Redirect Failed",
              description: "Trying alternative redirect method...",
              variant: "destructive",
            });
            // Fallback to new window
            const fallbackWindow = window.open(data.url, 'stripe-checkout-fallback', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!fallbackWindow) {
              // Only use current window redirect as last resort if popup is completely blocked
              window.location.href = data.url;
            }
          }
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = (error as Error).message || 'Unknown error occurred';

      // Provide more specific error messages
      let userFriendlyMessage = "Failed to create payment session";
      if (errorMessage.includes('not configured')) {
        userFriendlyMessage = "Payment system is not configured. Please contact support.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('rate limit')) {
        userFriendlyMessage = "Too many requests. Please wait a moment and try again.";
      } else if (errorMessage.includes('Invalid amount')) {
        userFriendlyMessage = "Invalid payment amount. Please check your selection.";
      }

      toast({
        title: "Payment Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info Display */}
          {user ? (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Purchasing as:</Label>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-800">{user.email}</p>
                <p className="text-xs text-green-600">Authenticated user</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email Address *</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              <p className="text-xs text-gray-500">
                Required for payment processing and receipt delivery
              </p>
            </div>
          )}

          {/* Credits Input */}
          <div className="space-y-2">
            <Label htmlFor="credits">Number of Credits</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              step="1"
              value={credits}
              onChange={(e) => handleCreditsChange(e.target.value)}
              placeholder="Enter number of credits"
            />
            <p className="text-sm text-muted-foreground">
              $1.40 per credit
            </p>
          </div>

          {/* Total Amount Display */}
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount</Label>
            <Input
              id="amount"
              value={`$${amount}`}
              readOnly
              className="bg-muted font-semibold"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "stripe")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Credit Card (Stripe)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePayment} 
            disabled={loading || !credits || parseFloat(credits) <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Buy {credits || 0} Credits for ${amount || "0.00"}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
