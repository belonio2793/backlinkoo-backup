import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Target, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Edit,
  Save,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SEOContentFormatter, type SEOFormattingOptions } from '@/services/seoContentFormatter';
import { SEOOptimizedBlogTemplate } from './SEOOptimizedBlogTemplate';

interface BlogGenerationForm {
  title: string;
  targetKeyword: string;
  anchorText: string;
  targetUrl: string;
  contentPrompt: string;
  tone: 'professional' | 'casual' | 'educational' | 'persuasive';
  wordCount: number;
}

export function SEOOptimizedBlogGenerator() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BlogGenerationForm>({
    title: '',
    targetKeyword: '',
    anchorText: '',
    targetUrl: '',
    contentPrompt: '',
    tone: 'professional',
    wordCount: 1000
  });

  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [formattedContent, setFormattedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (field: keyof BlogGenerationForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateContent = async () => {
    if (!formData.title || !formData.targetKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and target keyword.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI content generation with a more sophisticated template
      const mockContent = generateMockContent(formData);
      setGeneratedContent(mockContent);
      
      // Automatically format the content for SEO
      await formatContentForSEO(mockContent);
      
      toast({
        title: "Content Generated! ✨",
        description: "Your SEO-optimized blog post has been created successfully.",
      });
    } catch (error) {
      console.error('Content generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatContentForSEO = async (content: string) => {
    setIsFormatting(true);
    try {
      const options: SEOFormattingOptions = {
        targetKeyword: formData.targetKeyword,
        anchorText: formData.anchorText,
        targetUrl: formData.targetUrl,
        maxHeadingLevel: 4,
        optimizeForReadability: true,
        addSchemaMarkup: true
      };

      const formatted = SEOContentFormatter.formatContent(content, formData.title, options);
      setFormattedContent(formatted);
      
      toast({
        title: "Content Optimized! 🚀",
        description: `SEO score: ${formatted.seoScore}/100 - Content has been optimized for search engines.`,
      });
    } catch (error) {
      console.error('Content formatting failed:', error);
      toast({
        title: "Formatting Failed",
        description: "Failed to optimize content for SEO.",
        variant: "destructive"
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const regenerateContent = () => {
    if (generatedContent) {
      generateContent();
    }
  };

  const savePost = async () => {
    if (!formattedContent) {
      toast({
        title: "No Content to Save",
        description: "Please generate and format content first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Here you would integrate with your blog service
      toast({
        title: "Post Saved! 💾",
        description: "Your SEO-optimized blog post has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save the blog post.",
        variant: "destructive"
      });
    }
  };

  // Generate mock content based on form data
  const generateMockContent = (data: BlogGenerationForm): string => {
    const { title, targetKeyword, contentPrompt, tone, wordCount } = data;
    
    const introduction = `Welcome to our comprehensive guide on ${targetKeyword}. In this detailed article, we'll explore everything you need to know about ${title.toLowerCase()}. Whether you're a beginner or looking to expand your knowledge, this guide will provide valuable insights and practical advice.`;
    
    const sections = [
      {
        heading: `Understanding ${targetKeyword}`,
        content: `${targetKeyword} is an essential concept that affects many aspects of modern life. To fully grasp its importance, we need to examine the fundamental principles and how they apply in real-world scenarios. This comprehensive understanding will help you make informed decisions and achieve better results in your endeavors.`
      },
      {
        heading: `Key Benefits and Advantages`,
        content: `There are numerous benefits to understanding and implementing ${targetKeyword} effectively. First, it provides a solid foundation for future growth and development. Second, it helps optimize your approach and improve overall efficiency. Third, it enables you to stay competitive in today's fast-paced environment. These advantages make it crucial for anyone serious about achieving success.`
      },
      {
        heading: `Best Practices and Implementation`,
        content: `Implementing ${targetKeyword} successfully requires following proven best practices. Start by establishing clear goals and objectives. Next, develop a systematic approach that addresses all key components. Finally, monitor your progress regularly and make adjustments as needed. This methodical approach ensures optimal results and long-term sustainability.`
      },
      {
        heading: `Common Challenges and Solutions`,
        content: `While working with ${targetKeyword}, you may encounter various challenges. These can include technical difficulties, resource limitations, or implementation complexities. However, with proper planning and the right strategies, these obstacles can be overcome. The key is to remain flexible and adapt your approach based on specific circumstances and requirements.`
      },
      {
        heading: `Future Trends and Opportunities`,
        content: `The landscape of ${targetKeyword} continues to evolve rapidly. Emerging technologies and changing market conditions create new opportunities for innovation and growth. Staying informed about these trends is essential for maintaining a competitive edge. By anticipating future developments, you can position yourself for continued success and maximize your potential.`
      }
    ];

    // Adjust content length based on target word count
    const targetSectionCount = Math.max(3, Math.min(8, Math.floor(wordCount / 150)));
    const selectedSections = sections.slice(0, targetSectionCount);

    // Add content prompt if provided
    if (contentPrompt) {
      selectedSections.push({
        heading: 'Additional Insights',
        content: contentPrompt
      });
    }

    // Generate conclusion
    const conclusion = `In conclusion, mastering ${targetKeyword} is essential for achieving your goals and staying competitive. By following the guidelines and best practices outlined in this article, you'll be well-equipped to succeed. Remember to stay informed about the latest developments and continue learning to maximize your potential. Start implementing these strategies today and experience the benefits for yourself.`;

    // Combine all content
    const fullContent = [
      introduction,
      ...selectedSections.map(section => `${section.heading}\n\n${section.content}`),
      conclusion
    ].join('\n\n');

    return fullContent;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SEO-Optimized Blog Generator
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create professionally formatted, SEO-optimized blog posts with proper structure, 
          formatting, and search engine optimization.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Blog Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold">Blog Post Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter your blog post title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetKeyword" className="text-sm font-semibold">Target Keyword *</Label>
                <Input
                  id="targetKeyword"
                  value={formData.targetKeyword}
                  onChange={(e) => handleInputChange('targetKeyword', e.target.value)}
                  placeholder="Main keyword to optimize for..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone" className="text-sm font-semibold">Tone</Label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => handleInputChange('tone', e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="educational">Educational</option>
                    <option value="persuasive">Persuasive</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="wordCount" className="text-sm font-semibold">Word Count</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    value={formData.wordCount}
                    onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value) || 1000)}
                    min="300"
                    max="3000"
                    step="100"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SEO Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4" />
                SEO Configuration
              </h3>

              <div>
                <Label htmlFor="anchorText" className="text-sm font-semibold">Anchor Text</Label>
                <Input
                  id="anchorText"
                  value={formData.anchorText}
                  onChange={(e) => handleInputChange('anchorText', e.target.value)}
                  placeholder="Text for your target link..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetUrl" className="text-sm font-semibold">Target URL</Label>
                <Input
                  id="targetUrl"
                  value={formData.targetUrl}
                  onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contentPrompt" className="text-sm font-semibold">Additional Content Prompt</Label>
                <Textarea
                  id="contentPrompt"
                  value={formData.contentPrompt}
                  onChange={(e) => handleInputChange('contentPrompt', e.target.value)}
                  placeholder="Any specific content or points you want to include..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={generateContent}
                disabled={isGenerating || !formData.title || !formData.targetKeyword}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate SEO Content
                  </>
                )}
              </Button>

              {generatedContent && (
                <div className="flex gap-2">
                  <Button
                    onClick={regenerateContent}
                    variant="outline"
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              )}

              {formattedContent && (
                <Button
                  onClick={savePost}
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Blog Post
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Display */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-gray-600" />
                Generated Content
              </span>
              {formattedContent && (
                <Badge variant="default" className="bg-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  SEO Score: {formattedContent.seoScore}/100
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!generatedContent ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Generate content to see your SEO-optimized blog post here</p>
              </div>
            ) : isFormatting ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
                <p className="text-gray-600">Optimizing content for SEO...</p>
              </div>
            ) : previewMode && formattedContent ? (
              <div className="border rounded-lg overflow-hidden">
                <SEOOptimizedBlogTemplate
                  title={formattedContent.title}
                  content={formattedContent.content}
                  metaDescription={formattedContent.metaDescription}
                  keywords={formattedContent.keywords}
                  targetUrl={formData.targetUrl}
                  anchorText={formData.anchorText}
                  readingTime={formattedContent.readingTime}
                  seoScore={formattedContent.seoScore}
                  viewCount={0}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {formattedContent && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Content has been optimized for SEO with proper structure, formatting, and keyword optimization.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {formattedContent ? formattedContent.content : generatedContent}
                  </pre>
                </div>

                {formattedContent && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-800">Content Stats</div>
                      <div className="text-blue-700">
                        <div>Words: {formattedContent.wordCount}</div>
                        <div>Reading time: {formattedContent.readingTime} min</div>
                        <div>Headings: {formattedContent.headings.length}</div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-800">SEO Keywords</div>
                      <div className="text-purple-700 text-xs">
                        {formattedContent.keywords.slice(0, 5).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
