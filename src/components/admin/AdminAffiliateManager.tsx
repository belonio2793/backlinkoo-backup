import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Ban,
  Award,
  Clock,
  Search,
  Filter,
  Download,
  Mail,
  BarChart3,
  Shield,
  Target,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  Globe,
  MousePointer,
  Zap,
  Settings,
  RefreshCw,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { affiliateService } from '../../services/affiliateService';
import type { AffiliateProfile, AffiliateStats } from '../../integrations/supabase/affiliate-types';

interface AdminAffiliateManagerProps {
  isAdmin: boolean;
}

interface AffiliateWithStats extends AffiliateProfile {
  stats: AffiliateStats;
  userEmail?: string;
  lastActivity?: string;
  flagged?: boolean;
  flagReason?: string;
}

export const AdminAffiliateManager: React.FC<AdminAffiliateManagerProps> = ({ isAdmin }) => {
  const [affiliates, setAffiliates] = useState<AffiliateWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithStats | null>(null);
  const [showingDetails, setShowingDetails] = useState(false);

  // Admin settings
  const [adminSettings, setAdminSettings] = useState({
    defaultCommissionRate: 0.20,
    cookieDuration: 30,
    minimumPayout: 50,
    autoApprove: false,
    fraudDetection: true
  });

  useEffect(() => {
    if (isAdmin) {
      loadAffiliateData();
    }
  }, [isAdmin]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual admin API calls
      // For now, we'll simulate the data structure
      const mockAffiliates: AffiliateWithStats[] = [
        {
          id: '1',
          user_id: 'user1',
          affiliate_id: 'BL123ABC',
          status: 'active',
          commission_rate: 0.25,
          tier: 'silver',
          total_earnings: 2500,
          total_referrals: 45,
          total_conversions: 12,
          lifetime_value: 8900,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z',
          userEmail: 'john@example.com',
          lastActivity: '2024-01-19T00:00:00Z',
          stats: {
            total_clicks: 850,
            total_referrals: 45,
            total_conversions: 12,
            total_earnings: 2500,
            conversion_rate: 2.67,
            epc: 2.94,
            pending_commissions: 150,
            paid_commissions: 2350,
            current_tier: 'silver',
            next_tier_threshold: 5000
          }
        },
        // Add more mock data as needed
      ];
      
      setAffiliates(mockAffiliates);
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
      toast.error('Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAffiliate = async (affiliateId: string) => {
    try {
      // API call to approve affiliate
      toast.success('Affiliate approved successfully');
      loadAffiliateData();
    } catch (error) {
      toast.error('Failed to approve affiliate');
    }
  };

  const handleSuspendAffiliate = async (affiliateId: string) => {
    try {
      // API call to suspend affiliate
      toast.success('Affiliate suspended');
      loadAffiliateData();
    } catch (error) {
      toast.error('Failed to suspend affiliate');
    }
  };

  const handleUpdateCommissionRate = async (affiliateId: string, newRate: number) => {
    try {
      // API call to update commission rate
      toast.success('Commission rate updated');
      loadAffiliateData();
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.affiliate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
    const matchesTier = tierFilter === 'all' || affiliate.tier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      banned: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
      partner: 'bg-blue-100 text-blue-800'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access the affiliate admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-gray-600 mt-1">Manage affiliates, commissions, and program settings</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={loadAffiliateData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-3xl font-bold">{affiliates.length}</p>
                <p className="text-sm text-green-600">+12 this month</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(affiliates.reduce((sum, a) => sum + a.stats.paid_commissions, 0))}
                </p>
                <p className="text-sm text-green-600">+15.3% this month</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(affiliates.reduce((sum, a) => sum + a.stats.pending_commissions, 0))}
                </p>
                <p className="text-sm text-yellow-600">Awaiting approval</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Conversion Rate</p>
                <p className="text-3xl font-bold">
                  {(affiliates.reduce((sum, a) => sum + a.stats.conversion_rate, 0) / affiliates.length || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Across all affiliates</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by affiliate ID or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Affiliates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate List ({filteredAffiliates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Affiliate</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Tier</th>
                      <th className="text-left p-3">Earnings</th>
                      <th className="text-left p-3">Conversions</th>
                      <th className="text-left p-3">Commission Rate</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map(affiliate => (
                      <tr key={affiliate.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{affiliate.affiliate_id}</p>
                            <p className="text-gray-600 text-xs">{affiliate.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(affiliate.status)}>
                            {affiliate.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getTierColor(affiliate.tier)}>
                            {affiliate.tier}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{formatCurrency(affiliate.stats.total_earnings)}</p>
                            <p className="text-gray-600 text-xs">
                              {formatCurrency(affiliate.stats.pending_commissions)} pending
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{affiliate.stats.total_conversions}</p>
                            <p className="text-gray-600 text-xs">
                              {affiliate.stats.conversion_rate.toFixed(1)}% rate
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">
                            {(affiliate.commission_rate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowingDetails(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {affiliate.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveAffiliate(affiliate.affiliate_id)}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendAffiliate(affiliate.affiliate_id)}
                            >
                              <Ban className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Management</CardTitle>
              <CardDescription>
                Review and approve pending commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Commission management interface would be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Fraud Detection
              </CardTitle>
              <CardDescription>
                Monitor suspicious activity and protect your affiliate program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fraud Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">High Risk</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">3</p>
                    <p className="text-sm text-red-600">Suspicious affiliates</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Medium Risk</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">7</p>
                    <p className="text-sm text-yellow-600">Flagged for review</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Clean</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">156</p>
                    <p className="text-sm text-green-600">Verified affiliates</p>
                  </div>
                </div>

                {/* Recent Alerts */}
                <div>
                  <h3 className="font-semibold mb-3">Recent Fraud Alerts</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium">BL789XYZ</p>
                          <p className="text-sm text-gray-600">Suspicious click patterns detected</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Affiliate Program Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Commission Rate (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={adminSettings.defaultCommissionRate * 100}
                    onChange={(e) => setAdminSettings(prev => ({
                      ...prev,
                      defaultCommissionRate: parseFloat(e.target.value) / 100
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cookie Duration (days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={adminSettings.cookieDuration}
                    onChange={(e) => setAdminSettings(prev => ({
                      ...prev,
                      cookieDuration: parseInt(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Payout ($)</label>
                  <Input
                    type="number"
                    min="1"
                    value={adminSettings.minimumPayout}
                    onChange={(e) => setAdminSettings(prev => ({
                      ...prev,
                      minimumPayout: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <Button className="bg-green-600 hover:bg-green-700">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Affiliate Details Modal */}
      {showingDetails && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Affiliate Details</h3>
                  <p className="text-gray-600">{selectedAffiliate.affiliate_id}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowingDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedAffiliate.userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedAffiliate.status)}>
                        {selectedAffiliate.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <Badge className={getTierColor(selectedAffiliate.tier)}>
                        {selectedAffiliate.tier}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Rate:</span>
                      <span>{(selectedAffiliate.commission_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span>{new Date(selectedAffiliate.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Clicks:</span>
                      <span>{selectedAffiliate.stats.total_clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversions:</span>
                      <span>{selectedAffiliate.stats.total_conversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span>{selectedAffiliate.stats.conversion_rate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EPC:</span>
                      <span>{formatCurrency(selectedAffiliate.stats.epc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="font-semibold">{formatCurrency(selectedAffiliate.stats.total_earnings)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Rate Update */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3">Update Commission Rate</h4>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    placeholder="New rate (%)"
                    className="w-32"
                  />
                  <Button
                    onClick={() => {
                      // Implementation would go here
                      toast.success('Commission rate updated');
                    }}
                  >
                    Update Rate
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3">Actions</h4>
                <div className="flex gap-3">
                  {selectedAffiliate.status === 'pending' && (
                    <Button
                      onClick={() => handleApproveAffiliate(selectedAffiliate.affiliate_id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleSuspendAffiliate(selectedAffiliate.affiliate_id)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>

                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>

                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Activity Log
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAffiliateManager;
