import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Repeat, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

export const PaymentModal = ({ isOpen, onClose, initialCredits }: PaymentModalProps) => {
  const CREDIT_PRICE = 1.40;
  
  const [paymentType, setPaymentType] = useState<"payment" | "subscription">("payment");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState(() => initialCredits ? (initialCredits * CREDIT_PRICE).toFixed(2) : "");
  const [credits, setCredits] = useState(() => initialCredits ? initialCredits.toString() : "");
  const [subscriptionTier, setSubscriptionTier] = useState("premium-seo-tools");
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

  const subscriptionPlans = {
    "premium-seo-tools": { price: 29, priceId: "price_premium_seo_tools", name: "Premium SEO Tools" }
  };

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
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: parseFloat(amount),
          productName: `${credits} Backlink Credits`,
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined,
          paymentMethod
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async () => {
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
      const plan = subscriptionPlans[subscriptionTier as keyof typeof subscriptionPlans];
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: plan.priceId,
          tier: subscriptionTier,
          isGuest,
          guestEmail: isGuest ? guestEmail : undefined
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription",
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
          <DialogTitle>Choose Payment Option</DialogTitle>
        </DialogHeader>

        <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as "payment" | "subscription")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              One-time Payment
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            {/* Guest/User Toggle */}
            <div className="space-y-2">
              <Label>Checkout Type</Label>
              <RadioGroup
                value={isGuest ? "guest" : "user"}
                onValueChange={(value) => setIsGuest(value === "guest")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user">User Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="guest" id="guest" />
                  <Label htmlFor="guest">Guest Checkout</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Guest Email */}
            {isGuest && (
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email Address</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "stripe" | "paypal")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Credit Card (Stripe)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    PayPal
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-4">
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
                     $1.40 per credit • 1 credit = 1 premium backlink
                   </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount</Label>
                  <Input
                    id="total"
                    value={`$${amount}`}
                    readOnly
                    className="bg-muted"
                  />
                   <p className="text-sm text-muted-foreground">
                     {credits ? `${credits} credits × $1.40 = $${amount}` : 'Enter credits to see total'}
                   </p>
                </div>
              </div>
              <Button 
                onClick={handlePayment} 
                disabled={loading || !credits || parseFloat(credits) <= 0}
                className="w-full"
              >
                {loading ? "Processing..." : `Buy ${credits || 0} Credits for $${amount || "0.00"}`}
              </Button>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>SEO Tool Subscriptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get access to all SEO tools and features with one monthly subscription
                  </p>
                  <RadioGroup value={subscriptionTier} onValueChange={setSubscriptionTier}>
                    {Object.entries(subscriptionPlans).map(([key, plan]) => (
                      <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key} className="flex-1 cursor-pointer">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">${plan.price}/month</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              <Button 
                onClick={handleSubscription} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Processing..." : `Subscribe to ${subscriptionPlans[subscriptionTier as keyof typeof subscriptionPlans].name}`}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
