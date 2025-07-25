import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AffiliateService } from '@/services/affiliateService';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  ExternalLink,
  Calendar,
  CreditCard,
  Download
} from 'lucide-react';
import type { AffiliateProgram, AffiliateReferral } from '@/integrations/supabase/affiliate-types';

interface AffiliateDashboardProps {
  userId: string;
}

export const AffiliateDashboard = ({ userId }: AffiliateDashboardProps) => {
  const [affiliate, setAffiliate] = useState<AffiliateProgram | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'bank_transfer' | 'crypto'>('paypal');
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliateData();
  }, [userId]);

  const loadAffiliateData = async () => {
    try {
      const affiliateData = await AffiliateService.getAffiliateByUserId(userId);
      if (!affiliateData) {
        setIsLoading(false);
        return;
      }

      setAffiliate(affiliateData);
      
      const [referralsData, statsData] = await Promise.all([
        AffiliateService.getAffiliateReferrals(affiliateData.id),
        AffiliateService.getAffiliateStats(affiliateData.id)
      ]);

      setReferrals(referralsData);
      setStats(statsData);
      setPayoutAmount(affiliateData.pending_earnings);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate data.',
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

  const requestPayout = async () => {
    if (!affiliate || payoutAmount < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum payout amount is $100.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await AffiliateService.requestPayout(affiliate.id, payoutAmount, payoutMethod);
      toast({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted for processing.',
      });
      loadAffiliateData(); // Refresh data
    } catch (error) {
      console.error('Payout request error:', error);
      toast({
        title: 'Request Failed',
        description: 'Could not submit payout request.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Program</CardTitle>
          <CardDescription>You are not enrolled in our affiliate program.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/affiliate-signup'}>
            Join Affiliate Program
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">${affiliate.total_earnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600">${affiliate.pending_earnings.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Out</p>
                <p className="text-3xl font-bold text-green-600">${affiliate.total_paid.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-3xl font-bold">{stats?.total_conversions || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Links</CardTitle>
          <CardDescription>Share these links to start earning commissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Custom ID</Label>
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
            <Label>Affiliate Code</Label>
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
            <Label>Referral URL</Label>
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
        </CardContent>
      </Card>

      {/* Payout Request */}
      {affiliate.pending_earnings >= 100 && (
        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>Minimum payout amount is $100</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payout Amount</Label>
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  max={affiliate.pending_earnings}
                  min={100}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={requestPayout} className="w-full">
              Request Payout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Your latest referral activity</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No referrals yet. Start sharing your referral link!
            </p>
          ) : (
            <div className="space-y-4">
              {referrals.slice(0, 10).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {referral.conversion_date ? 'Converted' : 'Clicked'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${referral.commission_earned.toFixed(2)}</p>
                    <Badge variant={referral.commission_paid ? 'default' : 'secondary'}>
                      {referral.commission_paid ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
