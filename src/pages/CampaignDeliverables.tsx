import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle,
  Download,
  Eye,
  ExternalLink,
  Copy,
  FileText,
  Link as LinkIcon,
  TrendingUp,
  Star,
  Globe,
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Mail,
  MessageSquare,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CampaignDeliverable {
  id: string;
  name: string;
  target_url: string;
  keywords: string[];
  status: string;
  links_delivered: number;
  links_requested: number;
  completed_backlinks: string[];
  created_at: string;
  updated_at: string;
  content?: {
    title: string;
    metaDescription: string;
    content: string;
    contextualLinks: Array<{
      anchorText: string;
      targetUrl: string;
      position: number;
      context: string;
      seoRelevance: number;
    }>;
  };
  seoMetrics?: {
    readabilityScore: number;
    keywordDensity: number;
    seoScore: number;
  };
}

export function CampaignDeliverables() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDeliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (campaignId) {
      loadCampaignDeliverables();
    }
  }, [campaignId]);

  const loadCampaignDeliverables = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      
      // Mock additional content data (in production, this would come from a separate content table)
      const mockContent = {
        title: `Complete Guide to ${data.keywords[0] || 'Digital Marketing'}`,
        metaDescription: `Learn everything about ${data.keywords[0]} with our comprehensive guide. Expert tips, strategies, and best practices included.`,
        content: generateMockContent(data.keywords[0] || 'digital marketing', data.target_url),
        contextualLinks: [
          {
            anchorText: data.keywords[0] || 'digital marketing',
            targetUrl: data.target_url,
            position: 450,
            context: 'Understanding the fundamentals of digital marketing is crucial...',
            seoRelevance: 1.0
          },
          {
            anchorText: `${data.keywords[0]} solutions`,
            targetUrl: data.target_url,
            position: 1200,
            context: 'For comprehensive digital marketing solutions, consider...',
            seoRelevance: 0.8
          },
          {
            anchorText: 'professional services',
            targetUrl: data.target_url,
            position: 2100,
            context: 'Working with professional services can accelerate your...',
            seoRelevance: 0.7
          }
        ]
      };

      const mockSeoMetrics = {
        readabilityScore: 78,
        keywordDensity: 2.3,
        seoScore: 87
      };

      setCampaign({
        ...data,
        content: mockContent,
        seoMetrics: mockSeoMetrics
      });
    } catch (error) {
      console.error('Error loading campaign deliverables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign deliverables',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = (keyword: string, targetUrl: string) => {
    return `
      <h1>The Ultimate Guide to ${keyword}</h1>
      
      <p class="lead">In today's digital landscape, mastering <strong>${keyword}</strong> is essential for business success. This comprehensive guide will provide you with everything you need to know about ${keyword}, including proven strategies, best practices, and actionable insights.</p>
      
      <h2>What is ${keyword}?</h2>
      <p>Understanding <em>${keyword}</em> is fundamental to building a successful online presence. It encompasses various strategies and techniques that help businesses reach their target audience effectively.</p>
      
      <h2>Key Benefits of ${keyword}</h2>
      <ul>
        <li><strong>Increased visibility</strong> - Reach more potential customers</li>
        <li><strong>Better ROI</strong> - Maximize your marketing investment</li>
        <li><strong>Competitive advantage</strong> - Stay ahead of competitors</li>
        <li><strong>Long-term growth</strong> - Build sustainable business growth</li>
      </ul>
      
      <h2>Best Practices for ${keyword}</h2>
      <p>When implementing ${keyword} strategies, it's important to follow proven best practices that deliver results.</p>
      
      <h3>Strategy Development</h3>
      <p>Start with a comprehensive strategy that aligns with your business goals. Focus on understanding your target audience and their needs.</p>
      
      <h3>Implementation</h3>
      <p>Proper implementation is crucial for success. Consider working with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong><u>professional services</u></strong></a> to ensure optimal results.</p>
      
      <h2>Measuring Success</h2>
      <p>Track key metrics to measure the effectiveness of your ${keyword} efforts. Regular monitoring helps optimize performance and maximize ROI.</p>
      
      <h2>Conclusion</h2>
      <p>Mastering ${keyword} requires dedication, proper strategy, and continuous optimization. By following the strategies outlined in this guide, you'll be well-equipped to achieve your marketing goals.</p>
      
      <p>Ready to take your ${keyword} efforts to the next level? <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-link"><strong><u>Visit our comprehensive resource center</u></strong></a> for additional tools and expert guidance.</p>
    `;
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard',
    });
  };

  const handleDownloadHTML = () => {
    if (!campaign?.content) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaign.content.title}</title>
    <meta name="description" content="${campaign.content.metaDescription}">
    <meta name="keywords" content="${campaign.keywords.join(', ')}">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        .lead { font-size: 1.2em; font-weight: 500; margin-bottom: 1.5em; }
        .cta-link { color: #0066cc; text-decoration: none; }
        .cta-link:hover { text-decoration: underline; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    ${campaign.content.content}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.content.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: 'HTML file download has started',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg font-semibold">Loading campaign deliverables...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Campaign Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested campaign could not be found or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = Math.round((campaign.links_delivered / campaign.links_requested) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {format(new Date(campaign.created_at), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>{campaign.target_url}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge 
            variant={campaign.status === 'completed' ? 'default' : 'secondary'}
            className="capitalize"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {campaign.status}
          </Badge>
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Keywords</p>
                <p className="font-semibold">{campaign.keywords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <LinkIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Links Delivered</p>
                <p className="font-semibold">{campaign.links_delivered}/{campaign.links_requested}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SEO Score</p>
                <p className="font-semibold">{campaign.seoMetrics?.seoScore || 'N/A'}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-semibold">{completionPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Campaign Progress</h3>
              <span className="text-sm text-muted-foreground">{completionPercentage}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started {format(new Date(campaign.created_at), 'MMM dd')}</span>
              <span>{campaign.links_delivered} of {campaign.links_requested} links delivered</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Target URL</Label>
                  <p className="text-sm break-all">{campaign.target_url}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {campaign.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                    {campaign.status === 'completed' && (
                      <span className="text-sm text-green-600">All deliverables ready</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadHTML} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML Content
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('content')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Content
                </Button>
                
                <Button 
                  onClick={() => handleCopyContent(campaign.content?.content || '')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleDownloadHTML} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={() => handleCopyContent(campaign.content?.content || '')}
                  variant="outline" 
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-semibold">Title</Label>
                  <p className="text-sm">{campaign.content?.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Meta Description</Label>
                  <p className="text-sm">{campaign.content?.metaDescription}</p>
                </div>
              </div>

              {/* Content Preview */}
              <div className="border rounded-lg p-6 max-h-96 overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: campaign.content?.content || 'No content available' 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlinks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contextual Backlinks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.content?.contextualLinks.map((link, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{link.anchorText}</h4>
                        <p className="text-sm text-muted-foreground">{link.targetUrl}</p>
                      </div>
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        {Math.round(link.seoRelevance * 100)}% relevance
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Context</Label>
                      <p className="text-sm bg-muted/50 p-2 rounded italic">
                        "{link.context}"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>Position: {link.position}</span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview in content
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {campaign.seoMetrics?.seoScore || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                  <Progress 
                    value={campaign.seoMetrics?.seoScore || 0} 
                    className="mt-4" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Readability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {campaign.seoMetrics?.readabilityScore || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Flesch Score</p>
                  <Progress 
                    value={campaign.seoMetrics?.readabilityScore || 0} 
                    className="mt-4" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keyword Density</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {campaign.seoMetrics?.keywordDensity || 'N/A'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Primary keyword</p>
                  <Progress 
                    value={(campaign.seoMetrics?.keywordDensity || 0) * 20} 
                    className="mt-4" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Strengths
                  </h4>
                  <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <li>• Optimal keyword density maintained</li>
                    <li>• Strong content structure with proper headings</li>
                    <li>• Natural contextual link placement</li>
                    <li>• Good readability score</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                    <li>• Consider adding more internal links</li>
                    <li>• Include relevant images with alt text</li>
                    <li>• Add schema markup for better SEO</li>
                    <li>• Monitor performance metrics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
