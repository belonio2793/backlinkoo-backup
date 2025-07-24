import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail,
  Settings,
  Upload,
  Send,
  BarChart3,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  Eye,
  Download,
  Globe,
  Infinity,
  ArrowLeft,
  Server,
  Key,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SMTPConfiguration } from '@/components/email/SMTPConfiguration';
import { DNSVerification } from '@/components/email/DNSVerification';
import { ContactManager } from '@/components/email/ContactManager';
import { EmailComposer } from '@/components/email/EmailComposer';
import { CampaignDashboard } from '@/components/email/CampaignDashboard';
import { EmailPreview } from '@/components/email/EmailPreview';

export default function EmailMarketing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smtpStatus, setSMTPStatus] = useState<'pending' | 'configured' | 'verified'>('pending');
  const [dnsStatus, setDNSStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [contactCount, setContactCount] = useState(0);
  const [campaignStats, setCampaignStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0
  });

  // Mock real-time stats update
  useEffect(() => {
    const interval = setInterval(() => {
      if (campaignStats.sent > 0) {
        setCampaignStats(prev => ({
          sent: prev.sent,
          delivered: Math.min(prev.sent, prev.delivered + Math.floor(Math.random() * 3)),
          opened: Math.min(prev.delivered, prev.opened + Math.floor(Math.random() * 2)),
          clicked: Math.min(prev.opened, prev.clicked + Math.floor(Math.random() * 1))
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [campaignStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'configured':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'configured':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    Backlink <Infinity className="h-5 w-5" /> Email Marketing
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Professional email broadcasting platform for SEO partners
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(smtpStatus)}`}>
                  {getStatusIcon(smtpStatus)}
                  SMTP: {smtpStatus}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dnsStatus)}`}>
                  {getStatusIcon(dnsStatus)}
                  DNS: {dnsStatus}
                </div>
              </div>
              
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {contactCount.toLocaleString()} contacts
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              SMTP Setup
            </TabsTrigger>
            <TabsTrigger value="dns" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              DNS Verification
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CampaignDashboard 
              stats={campaignStats}
              onStatsUpdate={setCampaignStats}
            />
          </TabsContent>

          <TabsContent value="smtp" className="space-y-6">
            <SMTPConfiguration 
              onStatusChange={setSMTPStatus}
              currentStatus={smtpStatus}
            />
          </TabsContent>

          <TabsContent value="dns" className="space-y-6">
            <DNSVerification 
              onStatusChange={setDNSStatus}
              currentStatus={dnsStatus}
            />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <ContactManager 
              onContactCountChange={setContactCount}
              currentCount={contactCount}
            />
          </TabsContent>

          <TabsContent value="compose" className="space-y-6">
            <EmailComposer 
              contactCount={contactCount}
              smtpConfigured={smtpStatus === 'configured'}
              dnsVerified={dnsStatus === 'verified'}
              onCampaignStart={(stats) => setCampaignStats(stats)}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <EmailPreview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
