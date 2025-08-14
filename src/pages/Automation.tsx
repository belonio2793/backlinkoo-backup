import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, FileText, Link, BarChart3 } from 'lucide-react';
import { getOrchestrator } from '@/services/automationOrchestrator';
import AutomationReporting from '@/components/AutomationReporting';
import AutomationServiceStatus from '@/components/AutomationServiceStatus';

const Automation = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    targetUrl: '',
    keyword: '',
    anchorText: ''
  });
  const orchestrator = getOrchestrator();

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
      // Create new campaign using orchestrator
      await orchestrator.createCampaign({
        target_url: formData.targetUrl,
        keyword: formData.keyword,
        anchor_text: formData.anchorText
      });
      
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

    } catch (error) {
      console.error('Campaign creation error:', error);
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "There was an error creating your campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
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

        {/* Main Content */}
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Create Campaign
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports & Analytics
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Service Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="reports">
            <AutomationReporting />
          </TabsContent>

          <TabsContent value="status">
            <AutomationServiceStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Automation;
