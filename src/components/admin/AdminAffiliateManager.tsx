import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateService } from '@/services/affiliateService';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { AffiliateProgram, AffiliateReferral, AffiliatePayment } from '@/integrations/supabase/affiliate-types';

export const AdminAffiliateManager = () => {
  const [affiliates, setAffiliates] = useState<AffiliateProgram[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateProgram | null>(null);
  const [affiliateReferrals, setAffiliateReferrals] = useState<AffiliateReferral[]>([]);
  const [affiliatePayments, setAffiliatePayments] = useState<AffiliatePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_affiliates: 0,
    active_affiliates: 0,
    total_earnings: 0,
    pending_payouts: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliates();
    loadStats();
  }, []);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select(`
          *,
          profiles:user_id (
            email,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate programs.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliate_programs')
        .select('status, total_earnings, pending_earnings');

      if (affiliateError) throw affiliateError;

      const totalAffiliates = affiliateData?.length || 0;
      const activeAffiliates = affiliateData?.filter(a => a.status === 'active').length || 0;
      const totalEarnings = affiliateData?.reduce((sum, a) => sum + a.total_earnings, 0) || 0;
      const pendingPayouts = affiliateData?.reduce((sum, a) => sum + a.pending_earnings, 0) || 0;

      setStats({
        total_affiliates: totalAffiliates,
        active_affiliates: activeAffiliates,
        total_earnings: totalEarnings,
        pending_payouts: pendingPayouts
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAffiliateDetails = async (affiliate: AffiliateProgram) => {
    setSelectedAffiliate(affiliate);
    
    try {
      const [referrals, payments] = await Promise.all([
        AffiliateService.getAffiliateReferrals(affiliate.id),
        supabase
          .from('affiliate_payments')
          .select('*')
          .eq('affiliate_id', affiliate.id)
          .order('created_at', { ascending: false })
      ]);

      setAffiliateReferrals(referrals);
      setAffiliatePayments(payments.data || []);
    } catch (error) {
      console.error('Error loading affiliate details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate details.',
        variant: 'destructive'
      });
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('affiliate_programs')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Affiliate status changed to ${newStatus}.`,
      });

      loadAffiliates();
      if (selectedAffiliate?.id === affiliateId) {
        setSelectedAffiliate({ ...selectedAffiliate, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update affiliate status.',
        variant: 'destructive'
      });
    }
  };

  const updatePaymentStatus = async (
    paymentId: string, 
    status: 'processing' | 'completed' | 'failed',
    paymentReference?: string
  ) => {
    try {
      await AffiliateService.updatePayoutStatus(paymentId, status, paymentReference);
      
      toast({
        title: 'Payment Updated',
        description: `Payment status changed to ${status}.`,
      });

      if (selectedAffiliate) {
        loadAffiliateDetails(selectedAffiliate);
      }
      loadStats();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status.',
        variant: 'destructive'
      });
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.custom_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (affiliate.profiles as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (affiliate.profiles as any)?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
      </div>
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
                <p className="text-sm font-medium text-muted-foreground">Total Affiliates</p>
                <p className="text-3xl font-bold">{stats.total_affiliates}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Affiliates</p>
                <p className="text-3xl font-bold">{stats.active_affiliates}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">${stats.total_earnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                <p className="text-3xl font-bold">${stats.pending_payouts.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Management</CardTitle>
          <CardDescription>Manage affiliate programs and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, custom ID, or affiliate code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Affiliates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Custom ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {(affiliate.profiles as any)?.display_name || 'No Name'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(affiliate.profiles as any)?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{affiliate.custom_id}</TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell>${affiliate.total_earnings.toFixed(2)}</TableCell>
                    <TableCell>${affiliate.pending_earnings.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadAffiliateDetails(affiliate)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Affiliate Details</DialogTitle>
                              <DialogDescription>
                                Detailed view of affiliate performance and payments
                              </DialogDescription>
                            </DialogHeader>
                            {selectedAffiliate && (
                              <div className="space-y-6">
                                {/* Affiliate Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p>{(selectedAffiliate.profiles as any)?.display_name || 'No Name'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p>{(selectedAffiliate.profiles as any)?.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Custom ID</label>
                                    <p className="font-mono">{selectedAffiliate.custom_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(selectedAffiliate.status)}
                                      <Select
                                        value={selectedAffiliate.status}
                                        onValueChange={(value) => 
                                          updateAffiliateStatus(selectedAffiliate.id, value as any)
                                        }
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="inactive">Inactive</SelectItem>
                                          <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>

                                {/* Recent Referrals */}
                                <div>
                                  <h4 className="font-medium mb-2">Recent Referrals</h4>
                                  <div className="border rounded-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>Commission</TableHead>
                                          <TableHead>Paid</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {affiliateReferrals.slice(0, 5).map((referral) => (
                                          <TableRow key={referral.id}>
                                            <TableCell>
                                              {new Date(referral.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {referral.conversion_date ? 'Converted' : 'Pending'}
                                            </TableCell>
                                            <TableCell>
                                              ${referral.commission_earned.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                              {referral.commission_paid ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                {/* Payment Requests */}
                                <div>
                                  <h4 className="font-medium mb-2">Payment Requests</h4>
                                  <div className="border rounded-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Amount</TableHead>
                                          <TableHead>Method</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {affiliatePayments.map((payment) => (
                                          <TableRow key={payment.id}>
                                            <TableCell>
                                              {new Date(payment.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                            <TableCell className="capitalize">
                                              {payment.payment_method.replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>
                                              {getPaymentStatusBadge(payment.status)}
                                            </TableCell>
                                            <TableCell>
                                              {payment.status === 'pending' && (
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => 
                                                      updatePaymentStatus(payment.id, 'processing')
                                                    }
                                                  >
                                                    Process
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() => 
                                                      updatePaymentStatus(payment.id, 'completed')
                                                    }
                                                  >
                                                    Complete
                                                  </Button>
                                                </div>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
