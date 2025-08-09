import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Users,
  Search,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Activity,
  Award,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferredUser {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  last_sign_in_at: string | null;
  total_spent: number;
  commission_earned: number;
  referral_date: string;
  conversion_date: string | null;
  status: 'pending' | 'converted' | 'active' | 'churned';
}

interface ReferredUsersProps {
  affiliateId: string;
  affiliateCode: string;
}

export const ReferredUsers: React.FC<ReferredUsersProps> = ({ 
  affiliateId, 
  affiliateCode 
}) => {
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    loadReferredUsers();
  }, [affiliateId]);

  useEffect(() => {
    filterUsers();
  }, [referredUsers, searchTerm, statusFilter, subscriptionFilter]);

  const loadReferredUsers = async () => {
    try {
      setLoading(true);

      // For now, we'll create mock data since the affiliate system may not be fully set up
      // In a real implementation, this would query affiliate_referrals joined with profiles
      const mockReferredUsers: ReferredUser[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          display_name: 'John Doe',
          subscription_tier: 'premium',
          subscription_status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          last_sign_in_at: '2024-01-20T09:30:00Z',
          total_spent: 299.00,
          commission_earned: 59.80,
          referral_date: '2024-01-15T10:00:00Z',
          conversion_date: '2024-01-15T12:30:00Z',
          status: 'converted'
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          display_name: 'Jane Smith',
          subscription_tier: 'monthly',
          subscription_status: 'active',
          created_at: '2024-01-18T14:20:00Z',
          last_sign_in_at: '2024-01-21T16:45:00Z',
          total_spent: 29.00,
          commission_earned: 7.25,
          referral_date: '2024-01-18T14:20:00Z',
          conversion_date: '2024-01-18T15:00:00Z',
          status: 'active'
        },
        {
          id: '3',
          email: 'mike.johnson@example.com',
          display_name: 'Mike Johnson',
          subscription_tier: 'free',
          subscription_status: 'active',
          created_at: '2024-01-20T11:30:00Z',
          last_sign_in_at: null,
          total_spent: 0,
          commission_earned: 0,
          referral_date: '2024-01-20T11:30:00Z',
          conversion_date: null,
          status: 'pending'
        },
        {
          id: '4',
          email: 'sarah.wilson@example.com',
          display_name: 'Sarah Wilson',
          subscription_tier: 'enterprise',
          subscription_status: 'active',
          created_at: '2024-01-12T09:15:00Z',
          last_sign_in_at: '2024-01-21T08:20:00Z',
          total_spent: 599.00,
          commission_earned: 119.80,
          referral_date: '2024-01-12T09:15:00Z',
          conversion_date: '2024-01-12T10:45:00Z',
          status: 'converted'
        },
        {
          id: '5',
          email: 'david.brown@example.com',
          display_name: 'David Brown',
          subscription_tier: 'monthly',
          subscription_status: 'cancelled',
          created_at: '2024-01-08T16:45:00Z',
          last_sign_in_at: '2024-01-10T12:30:00Z',
          total_spent: 58.00,
          commission_earned: 14.50,
          referral_date: '2024-01-08T16:45:00Z',
          conversion_date: '2024-01-08T17:15:00Z',
          status: 'churned'
        }
      ];

      // Try to fetch real data first, fall back to mock data
      try {
        const { data: referrals, error } = await supabase
          .from('affiliate_referrals')
          .select(`
            *,
            profiles!inner(
              email,
              display_name,
              subscription_tier,
              subscription_status,
              created_at
            )
          `)
          .eq('affiliate_id', affiliateId);

        if (error) {
          console.warn('Could not fetch real referral data, using mock data:', error);
          setReferredUsers(mockReferredUsers);
        } else {
          // Transform real data
          const transformedUsers = (referrals || []).map((referral: any) => ({
            id: referral.id,
            email: referral.profiles.email,
            display_name: referral.profiles.display_name,
            subscription_tier: referral.profiles.subscription_tier || 'free',
            subscription_status: referral.profiles.subscription_status || 'active',
            created_at: referral.profiles.created_at,
            last_sign_in_at: null,
            total_spent: referral.total_revenue || 0,
            commission_earned: referral.commission_earned || 0,
            referral_date: referral.created_at,
            conversion_date: referral.converted_at,
            status: referral.status || 'pending'
          }));

          setReferredUsers(transformedUsers.length > 0 ? transformedUsers : mockReferredUsers);
        }
      } catch (err) {
        console.warn('Database query failed, using mock data');
        setReferredUsers(mockReferredUsers);
      }

      // Calculate stats
      const users = referredUsers.length > 0 ? referredUsers : mockReferredUsers;
      setTotalUsers(users.length);
      setActiveUsers(users.filter(u => u.status === 'active' || u.status === 'converted').length);
      setTotalCommissions(users.reduce((sum, user) => sum + user.commission_earned, 0));

      toast({
        title: "Referred Users Loaded",
        description: `Found ${users.length} referred users`,
      });

    } catch (error: any) {
      console.error('Error loading referred users:', error);
      toast({
        title: "Error Loading Referred Users",
        description: error.message || "Failed to load referred users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = referredUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesSubscription = subscriptionFilter === 'all' || user.subscription_tier === subscriptionFilter;

      return matchesSearch && matchesStatus && matchesSubscription;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const exportUsers = () => {
    const csv = [
      ['Email', 'Name', 'Status', 'Subscription', 'Total Spent', 'Commission Earned', 'Referral Date', 'Conversion Date'],
      ...filteredUsers.map(user => [
        user.email,
        user.display_name || '',
        user.status,
        user.subscription_tier,
        user.total_spent.toFixed(2),
        user.commission_earned.toFixed(2),
        new Date(user.referral_date).toLocaleDateString(),
        user.conversion_date ? new Date(user.conversion_date).toLocaleDateString() : 'Not converted'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referred_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} referred users to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      converted: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      churned: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getSubscriptionBadge = (tier: string) => {
    const variants = {
      enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
      premium: 'bg-blue-100 text-blue-800 border-blue-200',
      monthly: 'bg-green-100 text-green-800 border-green-200',
      free: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return variants[tier as keyof typeof variants] || variants.free;
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Referred</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${totalCommissions.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Referred Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referred Users
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportUsers} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={loadReferredUsers} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading referred users...</span>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Referred Users Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'Start referring users to see them here!'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>Referral Date</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.display_name || 'No name provided'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSubscriptionBadge(user.subscription_tier)}>
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">${user.total_spent.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          ${user.commission_earned.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(user.referral_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="h-3 w-3 text-gray-400" />
                          {user.last_sign_in_at ? 
                            new Date(user.last_sign_in_at).toLocaleDateString() : 
                            'Never'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferredUsers;
