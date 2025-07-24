import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';

interface CampaignDashboardProps {
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  onStatsUpdate: (stats: any) => void;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'scheduled';
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
}

export function CampaignDashboard({ stats, onStatsUpdate }: CampaignDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Backlink ∞ Introduction',
      subject: 'Transform Your SEO with Professional Backlink Services',
      status: 'sent',
      sent: 2543,
      delivered: 2487,
      opened: 1245,
      clicked: 387,
      bounced: 56,
      unsubscribed: 12,
      createdAt: '2024-01-15T10:00:00Z',
      sentAt: '2024-01-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'Flash Sale Campaign',
      subject: '🔥 50% OFF: Professional Backlinks (24 Hours Only)',
      status: 'sent',
      sent: 1876,
      delivered: 1834,
      opened: 892,
      clicked: 234,
      bounced: 42,
      unsubscribed: 8,
      createdAt: '2024-01-12T09:00:00Z',
      sentAt: '2024-01-12T12:00:00Z'
    },
    {
      id: '3',
      name: 'Weekly Newsletter',
      subject: 'SEO Updates & Backlink Success Stories',
      status: 'scheduled',
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      createdAt: '2024-01-16T08:00:00Z',
      scheduledFor: '2024-01-17T10:00:00Z'
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate aggregate stats
  const totalStats = campaigns.reduce((acc, campaign) => ({
    sent: acc.sent + campaign.sent,
    delivered: acc.delivered + campaign.delivered,
    opened: acc.opened + campaign.opened,
    clicked: acc.clicked + campaign.clicked,
    bounced: acc.bounced + campaign.bounced,
    unsubscribed: acc.unsubscribed + campaign.unsubscribed
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });

  // Calculate rates
  const openRate = totalStats.delivered > 0 ? (totalStats.opened / totalStats.delivered) * 100 : 0;
  const clickRate = totalStats.opened > 0 ? (totalStats.clicked / totalStats.opened) * 100 : 0;
  const deliveryRate = totalStats.sent > 0 ? (totalStats.delivered / totalStats.sent) * 100 : 0;
  const unsubscribeRate = totalStats.delivered > 0 ? (totalStats.unsubscribed / totalStats.delivered) * 100 : 0;

  const refreshStats = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update with slight variations
    setCampaigns(prev => prev.map(campaign => ({
      ...campaign,
      opened: campaign.status === 'sent' ? 
        Math.min(campaign.delivered, campaign.opened + Math.floor(Math.random() * 5)) : 
        campaign.opened,
      clicked: campaign.status === 'sent' ? 
        Math.min(campaign.opened, campaign.clicked + Math.floor(Math.random() * 3)) : 
        campaign.clicked
    })));
    
    setIsRefreshing(false);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-3 w-3" />;
      case 'sending':
        return <Clock className="h-3 w-3" />;
      case 'scheduled':
        return <Calendar className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const exportData = () => {
    const csvData = [
      ['Campaign', 'Subject', 'Status', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Open Rate', 'Click Rate'],
      ...campaigns.map(c => [
        c.name,
        c.subject,
        c.status,
        c.sent,
        c.delivered,
        c.opened,
        c.clicked,
        `${((c.opened / Math.max(c.delivered, 1)) * 100).toFixed(2)}%`,
        `${((c.clicked / Math.max(c.opened, 1)) * 100).toFixed(2)}%`
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-campaign-stats.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time email campaign analytics and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{totalStats.sent.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{deliveryRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+0.8%</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+2.3%</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">+1.7%</span>
                </div>
              </div>
              <MousePointer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Delivered</span>
                  <span>{totalStats.delivered.toLocaleString()} ({deliveryRate.toFixed(1)}%)</span>
                </div>
                <Progress value={deliveryRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Opened</span>
                  <span>{totalStats.opened.toLocaleString()} ({openRate.toFixed(1)}%)</span>
                </div>
                <Progress value={openRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Clicked</span>
                  <span>{totalStats.clicked.toLocaleString()} ({clickRate.toFixed(1)}%)</span>
                </div>
                <Progress value={clickRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Unsubscribed</span>
                  <span>{totalStats.unsubscribed.toLocaleString()} ({unsubscribeRate.toFixed(2)}%)</span>
                </div>
                <Progress value={unsubscribeRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Industry Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Industry Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-800 font-medium">Open Rate</div>
                <div className="text-xl font-bold text-green-900">{openRate.toFixed(1)}%</div>
                <div className="text-xs text-green-600">vs 21.3% avg</div>
                <div className="flex items-center gap-1 mt-1">
                  {openRate > 21.3 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Above average</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">Below average</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">Click Rate</div>
                <div className="text-xl font-bold text-blue-900">{clickRate.toFixed(1)}%</div>
                <div className="text-xs text-blue-600">vs 2.6% avg</div>
                <div className="flex items-center gap-1 mt-1">
                  {clickRate > 2.6 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Above average</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">Below average</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-800 font-medium">Delivery Rate</div>
                <div className="text-xl font-bold text-purple-900">{deliveryRate.toFixed(1)}%</div>
                <div className="text-xs text-purple-600">vs 95.6% avg</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">Excellent</span>
                </div>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-800 font-medium">Unsubscribe Rate</div>
                <div className="text-xl font-bold text-orange-900">{unsubscribeRate.toFixed(2)}%</div>
                <div className="text-xs text-orange-600">vs 0.5% avg</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">Good</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <Badge className={`gap-1 text-xs ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.status === 'scheduled' ? (
                        `Scheduled for ${new Date(campaign.scheduledFor!).toLocaleString()}`
                      ) : campaign.sentAt ? (
                        `Sent ${new Date(campaign.sentAt).toLocaleDateString()}`
                      ) : (
                        `Created ${new Date(campaign.createdAt).toLocaleDateString()}`
                      )}
                    </p>
                  </div>
                </div>

                {campaign.status === 'sent' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{campaign.sent.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{campaign.delivered.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{campaign.opened.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        Opened ({((campaign.opened / Math.max(campaign.delivered, 1)) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{campaign.clicked.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        Clicked ({((campaign.clicked / Math.max(campaign.opened, 1)) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{campaign.unsubscribed.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Unsubscribed</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
