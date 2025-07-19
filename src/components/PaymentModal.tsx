import { useState } from "react";
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
}

export const PaymentModal = ({ isOpen, onClose }: PaymentModalProps) => {
  const [paymentType, setPaymentType] = useState<"payment" | "subscription">("payment");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [productName, setProductName] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("basic");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const subscriptionPlans = {
    basic: { price: 9.99, priceId: "price_basic", name: "Basic Plan" },
    premium: { price: 29.99, priceId: "price_premium", name: "Premium Plan" },
    enterprise: { price: 99.99, priceId: "price_enterprise", name: "Enterprise Plan" }
  };

  const handlePayment = async () => {
    if (!amount || !productName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
          productName,
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
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Product/Service Name</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product or service name"
                />
              </div>
              <Button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Processing..." : `Pay $${amount || "0.00"}`}
              </Button>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <RadioGroup value={subscriptionTier} onValueChange={setSubscriptionTier}>
                  {Object.entries(subscriptionPlans).map(([key, plan]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="flex-1">
                        {plan.name} - ${plan.price}/month
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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