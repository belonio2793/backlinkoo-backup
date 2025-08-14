import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Target,
  Link,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  TrendingUp,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { directAutomationExecutor, DirectExecutionResult } from '@/services/directAutomationExecutor';

// Target website configuration - easily expandable
const TARGET_WEBSITES = [
  {
    id: 'telegraph',
    name: 'Telegraph',
    domain: 'telegra.ph',
    icon: '📝',
    status: 'active',
    domainRating: 85,
    averageViews: '10K+',
    publishTime: '< 30s',
    description: 'Instant publishing platform with high domain authority'
  },
  // Future websites can be added here
  {
    id: 'medium-coming-soon',
    name: 'Medium',
    domain: 'medium.com',
    icon: '✍️',
    status: 'coming-soon',
    domainRating: 95,
    averageViews: '50K+',
    publishTime: '< 60s',
    description: 'Professional publishing platform (Coming Soon)'
  },
  {
    id: 'linkedin-coming-soon',
    name: 'LinkedIn Articles',
    domain: 'linkedin.com',
    icon: '💼',
    status: 'coming-soon',
    domainRating: 98,
    averageViews: '25K+',
    publishTime: '< 45s',
    description: 'Professional network publishing (Coming Soon)'
  }
];

interface CampaignResult extends DirectExecutionResult {
  id: string;
  timestamp: string;
  targetWebsite: string;
}

export default function AutomationSimplified() {
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<CampaignResult[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    campaignName: '',
    targetUrl: '',
    keywords: '',
    anchorTexts: ''
  });

  // Auto-format URL
  const formatUrl = (url: string): string => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formattedUrl = formatUrl(e.target.value);
    setFormData({ ...formData, targetUrl: formattedUrl });
  };

  // Auto-generate campaign name
  const generateCampaignName = (keywords: string, targetUrl: string): string => {
    if (!keywords || !targetUrl) return '';
    
    const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
    const primaryKeywords = keywordsList.slice(0, 2).join(' & ');
    
    let domain = '';
    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = targetUrl.split('/')[0].replace('www.', '');
    }

    return `${primaryKeywords} → ${domain}`;
  };

  // Update campaign name when keywords or URL change
  useEffect(() => {
    const autoName = generateCampaignName(formData.keywords, formData.targetUrl);
    setFormData(prev => ({ ...prev, campaignName: autoName }));
  }, [formData.keywords, formData.targetUrl]);

  const executeAutomation = async () => {
    // Validation
    if (!formData.targetUrl || !formData.keywords || !formData.anchorTexts) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    setCurrentStep('Preparing campaign...');

    try {
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const anchorTextsArray = formData.anchorTexts.split(',').map(a => a.trim()).filter(a => a);

      // Step 1: Validation
      setCurrentStep('Validating inputs...');
      setExecutionProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Content Generation
      setCurrentStep('Generating keyword-relevant content...');
      setExecutionProgress(40);

      // Step 3: Content Enhancement
      setCurrentStep('Adding anchor text links...');
      setExecutionProgress(60);

      // Step 4: Publishing
      setCurrentStep('Publishing to target website...');
      setExecutionProgress(80);

      const result = await directAutomationExecutor.executeWorkflow({
        keywords: keywordsArray,
        anchor_texts: anchorTextsArray,
        target_url: formData.targetUrl,
        user_id: user?.id || 'guest-user'
      });

      setExecutionProgress(100);
      setCurrentStep('Complete!');

      if (result.success) {
        const campaignResult: CampaignResult = {
          ...result,
          id: `campaign-${Date.now()}`,
          timestamp: new Date().toISOString(),
          targetWebsite: result.target_platform || 'Telegraph'
        };

        setResults(prev => [campaignResult, ...prev]);

        // Clear form
        setFormData({
          campaignName: '',
          targetUrl: '',
          keywords: '',
          anchorTexts: ''
        });

        toast.success(
          `🎉 Campaign completed successfully! Article published with ${result.word_count} words in ${Math.round((result.execution_time_ms || 0) / 1000)}s`
        );
      } else {
        toast.error(`Campaign failed: ${result.error}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Execution failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
      setCurrentStep('');
    }
  };

  const activeWebsites = TARGET_WEBSITES.filter(site => site.status === 'active');
  const comingSoonWebsites = TARGET_WEBSITES.filter(site => site.status === 'coming-soon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automated Link Building</h1>
          <p className="text-gray-600 text-lg">Generate quality content and build high-authority backlinks automatically</p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Campaign Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Create Link Building Campaign
              </CardTitle>
              <CardDescription>
                Enter your details and we'll generate keyword-relevant content with your anchor text links and publish to high-authority sites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="target-url">Target URL *</Label>
                  <Input
                    id="target-url"
                    type="url"
                    placeholder="https://yourwebsite.com/target-page"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    onBlur={handleUrlBlur}
                  />
                  <p className="text-xs text-gray-500">
                    The page you want to build backlinks to
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Auto-generated from keywords and URL"
                    value={formData.campaignName}
                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Automatically generated or customize your own
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords *</Label>
                <Textarea
                  id="keywords"
                  placeholder="SEO tools, link building, digital marketing, content optimization"
                  rows={3}
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Comma-separated keywords for content generation and SEO targeting
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anchor-texts">Anchor Texts *</Label>
                <Textarea
                  id="anchor-texts"
                  placeholder="best SEO tools, powerful platform, learn more, your brand name"
                  rows={3}
                  value={formData.anchorTexts}
                  onChange={(e) => setFormData({ ...formData, anchorTexts: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Comma-separated anchor texts that will link back to your target URL
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Target Websites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publishing Network
              </CardTitle>
              <CardDescription>
                High-authority websites where your content will be published
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Active Websites */}
                <div>
                  <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Available Now ({activeWebsites.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeWebsites.map((website) => (
                      <div key={website.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{website.icon}</span>
                          <div>
                            <h5 className="font-medium text-green-800">{website.name}</h5>
                            <p className="text-xs text-green-600">{website.domain}</p>
                          </div>
                          <Badge className="bg-green-500 text-white ml-auto">Live</Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-3">{website.description}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="font-medium text-green-800">DA {website.domainRating}</p>
                            <p className="text-green-600">Authority</p>
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{website.averageViews}</p>
                            <p className="text-green-600">Avg Views</p>
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{website.publishTime}</p>
                            <p className="text-green-600">Publish</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coming Soon Websites */}
                {comingSoonWebsites.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Coming Soon ({comingSoonWebsites.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {comingSoonWebsites.map((website) => (
                        <div key={website.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4 opacity-75">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl grayscale">{website.icon}</span>
                            <div>
                              <h5 className="font-medium text-blue-800">{website.name}</h5>
                              <p className="text-xs text-blue-600">{website.domain}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto">Soon</Badge>
                          </div>
                          <p className="text-sm text-blue-700 mb-3">{website.description}</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="font-medium text-blue-800">DA {website.domainRating}</p>
                              <p className="text-blue-600">Authority</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-800">{website.averageViews}</p>
                              <p className="text-blue-600">Avg Views</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-800">{website.publishTime}</p>
                              <p className="text-blue-600">Publish</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Execution Button & Progress */}
          <Card>
            <CardContent className="p-6">
              {isExecuting ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{currentStep}</p>
                      <Progress value={executionProgress} className="mt-2" />
                    </div>
                    <span className="text-sm text-gray-500">{executionProgress}%</span>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={executeAutomation}
                  disabled={!formData.targetUrl || !formData.keywords || !formData.anchorTexts}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Automated Link Building Campaign
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Campaign Results
                </CardTitle>
                <CardDescription>
                  Your published articles and generated backlinks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-green-800">{result.article_title}</h4>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-green-600">Platform</p>
                              <p className="font-medium text-green-800">{result.targetWebsite}</p>
                            </div>
                            <div>
                              <p className="text-green-600">Word Count</p>
                              <p className="font-medium text-green-800">{result.word_count} words</p>
                            </div>
                            <div>
                              <p className="text-green-600">Execution Time</p>
                              <p className="font-medium text-green-800">{Math.round((result.execution_time_ms || 0) / 1000)}s</p>
                            </div>
                            <div>
                              <p className="text-green-600">Anchor Text</p>
                              <p className="font-medium text-green-800">{result.anchor_text_used}</p>
                            </div>
                          </div>

                          <p className="text-xs text-green-600">
                            Published {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>

                        <div className="ml-4">
                          {result.article_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(result.article_url, '_blank')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Article
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <MessageSquare className="h-5 w-5" />
                How Our Automation Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-blue-800 mb-2">Content Generation</h4>
                  <p className="text-sm text-blue-600">AI creates keyword-relevant, high-quality content tailored to your niche</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-purple-800 mb-2">Anchor Text Integration</h4>
                  <p className="text-sm text-purple-600">Your anchor texts are naturally integrated with links to your target URL</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-green-800 mb-2">Automated Publishing</h4>
                  <p className="text-sm text-green-600">Content is published to high-authority websites in our network</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <h4 className="font-medium text-orange-800 mb-2">Instant Results</h4>
                  <p className="text-sm text-orange-600">Get immediate links to your published articles and backlinks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
