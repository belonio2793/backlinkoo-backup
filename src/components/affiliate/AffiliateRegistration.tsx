import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AffiliateService } from '@/services/affiliateService';
import { supabase } from '@/integrations/supabase/client';
import { Copy, ExternalLink, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { AffiliateProgram } from '@/integrations/supabase/affiliate-types';

interface AffiliateRegistrationProps {
  userId: string;
  onRegistrationComplete?: (affiliate: AffiliateProgram) => void;
}

export const AffiliateRegistration = ({ userId, onRegistrationComplete }: AffiliateRegistrationProps) => {
  const [customId, setCustomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateProgram | null>(null);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!userId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to join the affiliate program.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already has an affiliate program
      const existingAffiliate = await AffiliateService.getAffiliateByUserId(userId);
      
      if (existingAffiliate) {
        setAffiliate(existingAffiliate);
        toast({
          title: 'Already Registered',
          description: 'You are already part of our affiliate program!',
        });
        if (onRegistrationComplete) {
          onRegistrationComplete(existingAffiliate);
        }
        return;
      }

      const newAffiliate = await AffiliateService.createAffiliateProgram(userId, customId);
      setAffiliate(newAffiliate);
      
      toast({
        title: 'Welcome to our Affiliate Program!',
        description: 'Your affiliate account has been created successfully.',
      });

      if (onRegistrationComplete) {
        onRegistrationComplete(newAffiliate);
      }
    } catch (error) {
      console.error('Affiliate registration error:', error);
      toast({
        title: 'Registration Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  if (affiliate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Your Affiliate Dashboard
            </CardTitle>
            <CardDescription>
              Start earning 50% commission on every referral!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">${affiliate.total_earnings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${affiliate.pending_earnings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${affiliate.total_paid.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Paid Out</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Your Custom ID</Label>
                <div className="flex items-center gap-2">
                  <Input value={affiliate.custom_id} readOnly className="font-mono" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(affiliate.custom_id, 'Custom ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Your Affiliate Code</Label>
                <div className="flex items-center gap-2">
                  <Input value={affiliate.affiliate_code} readOnly className="font-mono" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(affiliate.affiliate_code, 'Affiliate Code')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Your Referral URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={affiliate.referral_url} readOnly className="text-sm" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(affiliate.referral_url, 'Referral URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(affiliate.referral_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">How it works:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Share your referral URL with potential customers</li>
                <li>• Earn 50% commission on their ad spend</li>
                <li>• Get paid monthly when earnings reach $100 minimum</li>
                <li>• Track all your referrals and earnings in real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Join Our Affiliate Program
        </CardTitle>
        <CardDescription>
          Earn 50% commission on every customer you refer to our platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-semibold">50% Commission</div>
            <div className="text-sm text-muted-foreground">On all referral spending</div>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-semibold">Monthly Payouts</div>
            <div className="text-sm text-muted-foreground">$100 minimum threshold</div>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-semibold">Real-time Tracking</div>
            <div className="text-sm text-muted-foreground">Monitor your performance</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="customId">Custom ID (Optional)</Label>
            <Input
              id="customId"
              placeholder="Enter your preferred custom ID (8 characters)"
              value={customId}
              onChange={(e) => setCustomId(e.target.value.toUpperCase().slice(0, 8))}
              maxLength={8}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to auto-generate. Only letters and numbers allowed.
            </p>
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={isLoading}
            size="lg" 
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Join Affiliate Program'}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Program Benefits:</h4>
          <ul className="text-sm space-y-1">
            <li>✓ Earn 50% of all referred customer spending</li>
            <li>✓ Real-time performance tracking dashboard</li>
            <li>✓ Monthly payouts via PayPal or bank transfer</li>
            <li>✓ Custom referral URLs and tracking codes</li>
            <li>✓ Dedicated affiliate support team</li>
            <li>✓ Marketing materials and resources</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
