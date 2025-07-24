import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CreditCard, Repeat, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

export const PaymentModal = ({ isOpen, onClose, initialCredits }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const subscriptionPlan = {
    price: 29,
    priceId: "price_premium_seo_tools",
    name: "Premium SEO Tools",
    features: [
      "Unlimited keyword research",
      "Advanced SERP analysis",
      "Campaign monitoring",
      "Priority support",
      "Export capabilities",
      "All SEO tools access"
    ]
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
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: subscriptionPlan.priceId,
          tier: "premium_seo_tools",
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
          <DialogTitle>Premium SEO Tools Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Plan Details */}
          <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-purple-50">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{subscriptionPlan.name}</h3>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">
              ${subscriptionPlan.price}/month
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get access to all SEO tools and features
            </p>
            <div className="space-y-2">
              {subscriptionPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

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

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscription}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : `Subscribe for $${subscriptionPlan.price}/month`}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Cancel anytime • No setup fees • 30-day money back guarantee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
