import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Save,
  CheckCircle,
  Plus,
  BarChart3,
  Link,
  Target,
  Globe,
  Search,
  Settings,
  Zap,
  TrendingUp,
  Users,
  Loader2
} from 'lucide-react';

interface CampaignIntegrationProps {
  reportData: {
    id: string;
    campaignName: string;
    backlinks: any[];
    results: any[];
    reportUrl: string;
  };
  onSaveSuccess?: () => void;
}

interface AdditionalService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  credits: number;
  selected: boolean;
}

export function CampaignIntegration({ reportData, onSaveSuccess }: CampaignIntegrationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState({
    name: reportData.campaignName,
    description: '',
    clientName: '',
    clientEmail: '',
    budget: '',
    timeline: ''
  });
  
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([
    {
      id: 'indexing',
      name: 'Indexing Service',
      description: 'Force Google to crawl and index your backlinks faster',
      icon: <Search className="h-4 w-4" />,
      price: 0.25,
      credits: 1,
      selected: false
    },
    {
      id: 'tier2',
      name: 'Tier 2 Backlinks',
      description: 'Build supporting links to your primary backlinks',
      icon: <Link className="h-4 w-4" />,
      price: 1.50,
      credits: 5,
      selected: false
    },
    {
      id: 'tier3',
      name: 'Tier 3 Link Building',
      description: 'Create a comprehensive link pyramid structure',
      icon: <TrendingUp className="h-4 w-4" />,
      price: 2.00,
      credits: 10,
      selected: false
    },
    {
      id: 'profile',
      name: 'Link Profile Analysis',
      description: 'Generate detailed link profile report with recommendations',
      icon: <BarChart3 className="h-4 w-4" />,
      price: 1.00,
      credits: 3,
      selected: false
    },
    {
      id: 'monitoring',
      name: 'Link Monitoring',
      description: 'Monthly monitoring and alerts for link status changes',
      icon: <Globe className="h-4 w-4" />,
      price: 0.50,
      credits: 2,
      selected: false
    },
    {
      id: 'optimization',
      name: 'Anchor Text Optimization',
      description: 'Optimize anchor text distribution for better SEO',
      icon: <Target className="h-4 w-4" />,
      price: 0.75,
      credits: 2,
      selected: false
    }
  ]);

  const { toast } = useToast();

  const toggleService = (serviceId: string) => {
    setAdditionalServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, selected: !service.selected }
        : service
    ));
  };

  const calculateTotals = () => {
    const selectedServices = additionalServices.filter(s => s.selected);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalCredits = selectedServices.reduce((sum, s) => sum + s.credits, 0);
    
    return {
      selectedCount: selectedServices.length,
      totalPrice: totalPrice * reportData.backlinks.length, // Multiply by number of backlinks
      totalCredits: totalCredits * reportData.backlinks.length,
      perBacklink: totalPrice
    };
  };

  const saveToDashboard = async () => {
    setIsSaving(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save campaigns to your dashboard.',
          variant: 'destructive'
        });
        return;
      }

      const totals = calculateTotals();
      const selectedServices = additionalServices.filter(s => s.selected);

      // Create campaign entry
      const campaignData = {
        name: campaignDetails.name,
        description: campaignDetails.description || `Backlink verification report with ${reportData.backlinks.length} links`,
        target_url: reportData.backlinks[0]?.targetUrl || '',
        keywords: reportData.backlinks.map(bl => bl.anchorText),
        status: 'completed',
        links_requested: reportData.backlinks.length,
        links_delivered: reportData.results.filter(r => r.status === 'found').length,
        completed_backlinks: reportData.results
          .filter(r => r.status === 'found')
          .map(r => r.sourceUrl),
        user_id: user.id,
        credits_used: Math.max(1, totals.totalCredits),
        campaign_type: 'backlink_verification',
        additional_services: selectedServices.map(s => ({
          name: s.name,
          description: s.description,
          credits: s.credits * reportData.backlinks.length,
          price: s.price * reportData.backlinks.length
        })),
        report_url: reportData.reportUrl,
        client_info: {
          name: campaignDetails.clientName,
          email: campaignDetails.clientEmail,
          budget: campaignDetails.budget,
          timeline: campaignDetails.timeline
        },
        metrics: {
          total_backlinks: reportData.backlinks.length,
          active_backlinks: reportData.results.filter(r => r.status === 'found').length,
          success_rate: (reportData.results.filter(r => r.status === 'found').length / reportData.backlinks.length) * 100,
          avg_domain_authority: Math.round(
            reportData.results.reduce((sum, r) => sum + r.domainAuthority, 0) / reportData.results.length
          ),
          avg_page_authority: Math.round(
            reportData.results.reduce((sum, r) => sum + r.pageAuthority, 0) / reportData.results.length
          )
        }
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Campaign Saved Successfully!',
        description: `"${campaignDetails.name}" has been added to your dashboard with ${selectedServices.length} additional services.`,
      });

      onSaveSuccess?.();

    } catch (error) {
      console.error('Save campaign error:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save campaign to dashboard.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save to Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignDetails.name}
                onChange={(e) => setCampaignDetails(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name (Optional)</Label>
              <Input
                id="clientName"
                value={campaignDetails.clientName}
                onChange={(e) => setCampaignDetails(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Client or company name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email (Optional)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={campaignDetails.clientEmail}
                onChange={(e) => setCampaignDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                value={campaignDetails.budget}
                onChange={(e) => setCampaignDetails(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="$5,000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description (Optional)</Label>
            <Textarea
              id="description"
              value={campaignDetails.description}
              onChange={(e) => setCampaignDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the campaign objectives and strategy..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Additional Services
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enhance your backlink campaign with professional SEO services
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalServices.map((service) => (
              <div
                key={service.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  service.selected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => toggleService(service.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {service.icon}
                    <h4 className="font-medium">{service.name}</h4>
                  </div>
                  {service.selected && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">${service.price}/link</span>
                    <span className="text-muted-foreground"> • {service.credits} credits</span>
                  </div>
                  
                  {service.selected && (
                    <Badge variant="default" className="text-xs">
                      Total: ${(service.price * reportData.backlinks.length).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Service Summary */}
          {totals.selectedCount > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <h4 className="font-medium mb-2">Selected Services Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Services:</span>
                  <div className="font-medium">{totals.selectedCount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Per Backlink:</span>
                  <div className="font-medium">${totals.perBacklink.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Price:</span>
                  <div className="font-medium">${totals.totalPrice.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Credits:</span>
                  <div className="font-medium">{totals.totalCredits}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Campaign Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{reportData.backlinks.length}</div>
              <div className="text-sm text-muted-foreground">Total Backlinks</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.results.filter(r => r.status === 'found').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  reportData.results.reduce((sum, r) => sum + r.domainAuthority, 0) / reportData.results.length
                )}
              </div>
              <div className="text-sm text-muted-foreground">Avg DA</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {((reportData.results.filter(r => r.status === 'found').length / reportData.backlinks.length) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          <Button
            onClick={saveToDashboard}
            disabled={isSaving || !campaignDetails.name}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Campaign...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save to Dashboard ({totals.totalCredits || 1} credits)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Campaign will be saved with verification report and selected additional services
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
