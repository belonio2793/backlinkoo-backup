import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Wand2,
  Info,
  CheckCircle,
  TrendingUp,
  Clock,
  BarChart3,
  Lightbulb,
  Globe,
  Zap,
  Eye,
  Star
} from 'lucide-react';

import { promptManager, type PromptTemplate, type PromptType } from '@/services/promptManager';
import { platformDiscoveryService, type ContentStrategy, type PlatformOpportunity } from '@/services/platformDiscoveryService';

interface EnhancedCampaignCreatorProps {
  onCampaignCreate: (campaignData: any) => Promise<void>;
  isCreating: boolean;
}

const EnhancedCampaignCreator: React.FC<EnhancedCampaignCreatorProps> = ({
  onCampaignCreate,
  isCreating
}) => {
  const [formData, setFormData] = useState({
    targetUrl: '',
    keyword: '',
    anchorText: ''
  });

  const [selectedPromptType, setSelectedPromptType] = useState<PromptType>('long-form-blog');
  const [contentStrategy, setContentStrategy] = useState<ContentStrategy | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showStrategy, setShowStrategy] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Generate content strategy when form data changes
  useEffect(() => {
    if (formData.keyword && formData.targetUrl && formData.anchorText) {
      const strategy = platformDiscoveryService.generateContentStrategy(
        formData.keyword,
        formData.targetUrl,
        formData.anchorText
      );
      setContentStrategy(strategy);
      setShowStrategy(true);
    } else {
      setShowStrategy(false);
    }
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatUrl = (url: string): string => {
    if (!url) return url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleCreateCampaign = async () => {
    const campaignData = {
      ...formData,
      targetUrl: formatUrl(formData.targetUrl),
      promptType: selectedPromptType,
      selectedPlatforms: selectedPlatforms,
      contentStrategy: contentStrategy
    };

    await onCampaignCreate(campaignData);
  };

  const togglePlatform = (platformName: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformName)
        ? prev.filter(p => p !== platformName)
        : [...prev, platformName]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPromptTypeDescription = (type: PromptType): string => {
    const descriptions = {
      'long-form-blog': 'Comprehensive 600-word blog posts with detailed insights',
      'microblog-social': 'Short, engaging social media posts (280 chars max)',
      'forum-reply': 'Helpful forum responses with natural link inclusion',
      'qa-answer': 'Step-by-step answers with additional resources',
      'press-release': 'Professional announcements and news format',
      'how-to-guide': 'Educational step-by-step instructional content',
      'directory-entry': 'Concise directory-style listings with clear CTAs'
    };
    return descriptions[type] || '';
  };

  const isFormValid = formData.targetUrl && formData.keyword && formData.anchorText;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Enhanced Campaign Creator
        </CardTitle>
        <CardDescription>
          Create intelligent backlink campaigns with AI-powered content strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Setup</TabsTrigger>
            <TabsTrigger value="strategy" disabled={!showStrategy}>
              Content Strategy
            </TabsTrigger>
            <TabsTrigger value="platforms" disabled={!showStrategy}>
              Platform Selection
            </TabsTrigger>
          </TabsList>

          {/* Basic Setup Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              {/* Target URL */}
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="targetUrl"
                    placeholder="https://example.com or example.com"
                    value={formData.targetUrl}
                    onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                    onBlur={(e) => {
                      const formatted = formatUrl(e.target.value);
                      if (formatted !== e.target.value) {
                        handleInputChange('targetUrl', formatted);
                      }
                    }}
                    className="flex-1"
                  />
                  {formData.targetUrl && !formData.targetUrl.startsWith('http') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange('targetUrl', formatUrl(formData.targetUrl))}
                      title="Add https:// to URL"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  The URL where your backlink will point
                </p>
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword *</Label>
                <Input
                  id="keyword"
                  placeholder="digital marketing"
                  value={formData.keyword}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  The main topic for content generation
                </p>
              </div>

              {/* Anchor Text */}
              <div className="space-y-2">
                <Label htmlFor="anchorText">Anchor Text *</Label>
                <Input
                  id="anchorText"
                  placeholder="best digital marketing tools"
                  value={formData.anchorText}
                  onChange={(e) => handleInputChange('anchorText', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  The clickable text for your backlink
                </p>
              </div>

              {/* Prompt Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="promptType">Content Type</Label>
                <Select
                  value={selectedPromptType}
                  onValueChange={(value: PromptType) => setSelectedPromptType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {promptManager.getAllPrompts().map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.type}>
                        <div className="flex flex-col">
                          <span className="font-medium">{prompt.name}</span>
                          <span className="text-xs text-gray-500">
                            {getPromptTypeDescription(prompt.type)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Progress to next tab */}
              {isFormValid && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700 flex items-center justify-between">
                    <span>Form complete! Review your content strategy.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('strategy')}
                      className="ml-4 border-green-300 text-green-700 hover:bg-green-100"
                    >
                      View Strategy
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Content Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            {contentStrategy && (
              <div className="space-y-4">
                {/* Strategy Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{contentStrategy.estimatedBacklinks.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Estimated Backlinks</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Globe className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{contentStrategy.platformOpportunities.length}</div>
                      <div className="text-sm text-gray-600">Compatible Platforms</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold capitalize">{contentStrategy.contentTone}</div>
                      <div className="text-sm text-gray-600">Recommended Tone</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommended Prompts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Recommended Content Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contentStrategy.recommendedPrompts.map((promptType) => {
                        const prompt = promptManager.getPromptById(promptType);
                        return prompt ? (
                          <Badge
                            key={promptType}
                            variant={promptType === selectedPromptType ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setSelectedPromptType(promptType)}
                          >
                            {prompt.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Continue to platforms */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => setActiveTab('platforms')}
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Select Platforms
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Platform Selection Tab */}
          <TabsContent value="platforms" className="space-y-4">
            {contentStrategy && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Platform Opportunities</h3>
                  <Badge variant="outline">
                    {selectedPlatforms.length} selected
                  </Badge>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {contentStrategy.platformOpportunities.map((opportunity, index) => (
                      <Card
                        key={opportunity.platform.name}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedPlatforms.includes(opportunity.platform.name)
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => togglePlatform(opportunity.platform.name)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{opportunity.platform.name}</h4>
                                <Badge className={getDifficultyColor(opportunity.difficulty)}>
                                  {opportunity.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                  DR {opportunity.platform.domainRating}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  Score: {opportunity.score}/100
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {opportunity.timeToPublish}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Reach: {opportunity.estimatedReach.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  Success: {opportunity.successProbability}%
                                </div>
                              </div>

                              <div className="space-y-1">
                                {opportunity.reasons.slice(0, 2).map((reason, i) => (
                                  <div key={i} className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Create Campaign Button */}
                <div className="flex flex-col gap-4">
                  {selectedPlatforms.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-blue-700">
                        Ready to create campaign with {selectedPlatforms.length} platform(s): {selectedPlatforms.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!isFormValid || selectedPlatforms.length === 0 || isCreating}
                    className="w-full h-12 text-lg font-medium"
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Create Enhanced Campaign
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedCampaignCreator;
