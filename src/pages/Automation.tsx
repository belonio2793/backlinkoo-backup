import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, Target, FileText, Link } from 'lucide-react';

interface Campaign {
  id: string;
  targetUrl: string;
  keyword: string;
  anchorText: string;
  status: 'pending' | 'generating' | 'publishing' | 'completed' | 'paused';
  createdAt: string;
  publishedLinks: string[];
}

const Automation = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [formData, setFormData] = useState({
    targetUrl: '',
    keyword: '',
    anchorText: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.targetUrl || !formData.keyword || !formData.anchorText) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    // Basic URL validation
    try {
      new URL(formData.targetUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid target URL",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleCreateCampaign = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    
    try {
      // Create new campaign
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        targetUrl: formData.targetUrl,
        keyword: formData.keyword,
        anchorText: formData.anchorText,
        status: 'pending',
        createdAt: new Date().toISOString(),
        publishedLinks: []
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      // Reset form
      setFormData({
        targetUrl: '',
        keyword: '',
        anchorText: ''
      });

      toast({
        title: "Campaign Created",
        description: "Your link building campaign has been created and will start processing shortly."
      });

      // TODO: Start campaign processing
      // This will trigger content generation and publishing

    } catch (error) {
      console.error('Campaign creation error:', error);
      toast({
        title: "Campaign Creation Failed",
        description: "There was an error creating your campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'publishing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'generating': return <FileText className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      case 'completed': return <Link className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Link Building Automation</h1>
          <p className="text-lg text-gray-600">
            Automatically generate and publish high-quality content with backlinks to your target URL
          </p>
        </div>

        {/* Campaign Creation Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Create New Campaign
            </CardTitle>
            <CardDescription>
              Enter your target URL, keyword, and anchor text to generate and publish backlink content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                placeholder="https://example.com"
                value={formData.targetUrl}
                onChange={(e) => handleInputChange('targetUrl', e.target.value)}
              />
              <p className="text-sm text-gray-500">The URL where your backlink will point</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword *</Label>
              <Input
                id="keyword"
                placeholder="digital marketing"
                value={formData.keyword}
                onChange={(e) => handleInputChange('keyword', e.target.value)}
              />
              <p className="text-sm text-gray-500">The main topic for content generation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text *</Label>
              <Input
                id="anchorText"
                placeholder="best digital marketing tools"
                value={formData.anchorText}
                onChange={(e) => handleInputChange('anchorText', e.target.value)}
              />
              <p className="text-sm text-gray-500">The clickable text for your backlink</p>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Generate 3 unique 1000-word articles using different prompts</li>
                <li>Format content with your anchor text linked to your target URL</li>
                <li>Publish to Telegraph.ph automatically</li>
                <li>Track published links in your reporting dashboard</li>
              </ol>
            </div>

            <Button 
              onClick={handleCreateCampaign}
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Start Link Building Campaign
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        {campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>
                Track the progress of your link building campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(campaign.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </Badge>
                        <span className="font-medium">{campaign.keyword}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Target URL:</strong> {campaign.targetUrl}</p>
                        <p><strong>Anchor Text:</strong> {campaign.anchorText}</p>
                        <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleString()}</p>
                      </div>

                      {campaign.publishedLinks.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Published Links:</p>
                          {campaign.publishedLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {link}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Info */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Publishing Platforms</CardTitle>
            <CardDescription>
              Current and upcoming platforms for content publication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Telegraph.ph</span>
                </div>
                <p className="text-sm text-gray-600">
                  Anonymous publishing platform with instant publication
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-medium">More Platforms</span>
                </div>
                <p className="text-sm text-gray-600">
                  Additional platforms coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Automation;
