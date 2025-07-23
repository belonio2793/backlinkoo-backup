import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Rocket, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Globe,
  Zap,
  Shield,
  Users,
  FileText,
  Link as LinkIcon,
  TrendingUp,
  Star,
  Eye,
  Download,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { multiApiContentGenerator, type MultiAPIContentParams, type GeneratedCampaign } from '@/services/multiApiContentGenerator';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  targetUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  contentType: 'blog-post' | 'editorial' | 'guest-post' | 'resource-page';
  wordCount: number;
  tone: string;
  userEmail: string;
}

export function EnhancedCampaignForm() {
  const [formData, setFormData] = useState<FormData>({
    targetUrl: '',
    primaryKeyword: '',
    secondaryKeywords: '',
    contentType: 'blog-post',
    wordCount: 1500,
    tone: 'professional',
    userEmail: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const generationSteps = [
    { label: 'Analyzing keywords', duration: 2000 },
    { label: 'Generating SEO-optimized content', duration: 3000 },
    { label: 'Creating contextual links', duration: 2000 },
    { label: 'Enhancing with AI providers', duration: 2500 },
    { label: 'Calculating SEO metrics', duration: 1500 },
    { label: 'Finalizing campaign', duration: 1000 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetUrl || !formData.primaryKeyword) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least a target URL and primary keyword',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Simulate progress through generation steps
      let progress = 0;
      for (const [index, step] of generationSteps.entries()) {
        setCurrentStep(step.label);
        
        await new Promise(resolve => {
          const interval = setInterval(() => {
            progress += 2;
            setGenerationProgress(progress);
            
            if (progress >= (index + 1) * (100 / generationSteps.length)) {
              clearInterval(interval);
              resolve(null);
            }
          }, step.duration / 50);
        });
      }

      const params: MultiAPIContentParams = {
        targetUrl: formData.targetUrl,
        primaryKeyword: formData.primaryKeyword,
        secondaryKeywords: formData.secondaryKeywords.split(',').map(k => k.trim()).filter(k => k),
        contentType: formData.contentType,
        wordCount: formData.wordCount,
        tone: formData.tone,
        autoDelete: !user, // Auto-delete if not logged in
        userEmail: formData.userEmail,
        userId: user?.id
      };

      const campaign = await multiApiContentGenerator.generateCampaignContent(params);
      setGeneratedCampaign(campaign);

      toast({
        title: 'Campaign Generated Successfully!',
        description: `Your SEO-optimized content is ready with ${campaign.content.contextualLinks.length} contextual links`,
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating your campaign. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
      setCurrentStep('Complete');
    }
  };

  const handleSaveCampaign = async () => {
    if (!generatedCampaign || !formData.userEmail) return;

    try {
      // If user is not logged in, prompt them to register
      if (!currentUser) {
        toast({
          title: 'Registration Required',
          description: 'Please create an account to save your campaign permanently',
          variant: 'destructive'
        });
        return;
      }

      const success = await multiApiContentGenerator.saveCampaignForUser(
        generatedCampaign.id,
        currentUser.id
      );

      if (success) {
        toast({
          title: 'Campaign Saved!',
          description: 'Your campaign has been saved to your dashboard',
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Unable to save campaign. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getContentTypeDescription = (type: string) => {
    const descriptions = {
      'blog-post': 'Informative blog post with how-to structure',
      'editorial': 'Opinion-based editorial with strong viewpoint',
      'guest-post': 'Review-style guest post for other websites',
      'resource-page': 'Comprehensive resource list and guide'
    };
    return descriptions[type as keyof typeof descriptions];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">AI Content Generator</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate SEO-optimized content with contextual backlinks using multiple AI providers
        </p>
        
        {/* Feature highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Badge variant="secondary" className="gap-2">
            <Target className="h-3 w-3" />
            SEO Optimized
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <LinkIcon className="h-3 w-3" />
            Contextual Links
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <Zap className="h-3 w-3" />
            Multi-API Enhanced
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <Clock className="h-3 w-3" />
            24h Auto-Delete
          </Badge>
        </div>
      </div>

      {!generatedCampaign ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Campaign Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Target Website URL *
                    </Label>
                    <Input
                      id="target-url"
                      type="url"
                      placeholder="https://your-website.com"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primary-keyword" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Primary Keyword *
                    </Label>
                    <Input
                      id="primary-keyword"
                      placeholder="e.g., digital marketing"
                      value={formData.primaryKeyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-keywords" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Secondary Keywords
                    </Label>
                    <Textarea
                      id="secondary-keywords"
                      placeholder="SEO optimization, content marketing, online advertising"
                      value={formData.secondaryKeywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryKeywords: e.target.value }))}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select 
                      value={formData.contentType} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, contentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog-post">Blog Post</SelectItem>
                        <SelectItem value="editorial">Editorial</SelectItem>
                        <SelectItem value="guest-post">Guest Post</SelectItem>
                        <SelectItem value="resource-page">Resource Page</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getContentTypeDescription(formData.contentType)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="word-count">Word Count</Label>
                    <Select 
                      value={formData.wordCount.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, wordCount: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="800">800 words (Short)</SelectItem>
                        <SelectItem value="1200">1,200 words (Medium)</SelectItem>
                        <SelectItem value="1500">1,500 words (Long)</SelectItem>
                        <SelectItem value="2000">2,000 words (Comprehensive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Content Tone</Label>
                    <Select 
                      value={formData.tone} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Email (Optional)
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.userEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required to save campaigns permanently
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning for non-registered users */}
              {!currentUser && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        24-Hour Auto-Delete Notice
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your generated content will be automatically deleted after 24 hours unless you create an account with Backlinkoo.com
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Generate AI Content Campaign
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generating Your Campaign</h3>
                <span className="text-sm text-muted-foreground">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                {currentStep}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Campaign Results */}
      {generatedCampaign && (
        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Campaign Generated Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">SEO Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {generatedCampaign.seoMetrics.seoScore}/100
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">Contextual Links</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {generatedCampaign.content.contextualLinks.length}
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">Readability</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {generatedCampaign.seoMetrics.readabilityScore}/100
                  </div>
                </div>
              </div>

              {generatedCampaign.deleteAt && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      Auto-Delete Scheduled
                    </span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This campaign will be deleted on {new Date(generatedCampaign.deleteAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button className="flex-1" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Content
                </Button>
                <Button className="flex-1" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
                {!generatedCampaign.isRegistered && (
                  <Button className="flex-1" onClick={handleSaveCampaign}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Permanently
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Title</Label>
                  <p className="text-lg font-medium">{generatedCampaign.content.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Meta Description</Label>
                  <p className="text-sm text-muted-foreground">{generatedCampaign.content.metaDescription}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Content Preview</Label>
                  <div 
                    className="prose prose-sm max-w-none border rounded-lg p-4 max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: generatedCampaign.content.content.substring(0, 1000) + '...' 
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Contextual Links</Label>
                  <div className="space-y-2">
                    {generatedCampaign.content.contextualLinks.map((link, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{link.anchorText}</span>
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {Math.round(link.seoRelevance * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{link.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
