import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { enhancedBlogContentGenerator } from '@/services/enhancedBlogContentGenerator';
import { blogService } from '@/services/blogService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Wand2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Link,
  Target,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}

export function BlogGenerationTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Test inputs
  const [keyword, setKeyword] = useState('SEO optimization');
  const [anchorText, setAnchorText] = useState('professional SEO services');
  const [targetUrl, setTargetUrl] = useState('https://example.com/seo-services');
  
  // Test results
  const [isTestingGeneration, setIsTestingGeneration] = useState(false);
  const [isTestingFullFlow, setIsTestingFullFlow] = useState(false);
  const [generationResult, setGenerationResult] = useState<TestResult | null>(null);
  const [fullFlowResult, setFullFlowResult] = useState<TestResult | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [createdBlogPost, setCreatedBlogPost] = useState<any>(null);

  // Predefined test cases
  const testCases = [
    {
      keyword: 'digital marketing strategies',
      anchorText: 'expert marketing consultation',
      targetUrl: 'https://marketingexperts.com/consultation'
    },
    {
      keyword: 'web development best practices',
      anchorText: 'professional web development',
      targetUrl: 'https://webdev.com/services'
    },
    {
      keyword: 'content creation tools',
      anchorText: 'advanced content tools',
      targetUrl: 'https://contenttools.com/platform'
    }
  ];

  // Test content generation only
  const testContentGeneration = async () => {
    if (!keyword || !anchorText || !targetUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsTestingGeneration(true);
    setGenerationResult(null);
    setGeneratedContent(null);

    const startTime = Date.now();

    try {
      console.log('🧪 Testing content generation...');
      
      const result = await enhancedBlogContentGenerator.generateContent({
        keyword,
        anchorText,
        targetUrl,
        userId: user?.id
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        setGenerationResult({
          success: true,
          message: `Content generated successfully in ${duration}ms`,
          data: result,
          duration
        });
        setGeneratedContent(result);
        
        toast({
          title: "Generation Test Passed! ✅",
          description: `Generated ${result.wordCount} words in ${duration}ms`,
        });
      } else {
        setGenerationResult({
          success: false,
          message: result.error || 'Content generation failed',
          duration
        });
        
        toast({
          title: "Generation Test Failed",
          description: result.error || 'Content generation failed',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setGenerationResult({
        success: false,
        message: error.message || 'Test failed with unexpected error',
        duration
      });
      
      toast({
        title: "Test Error",
        description: error.message || 'Unexpected error during test',
        variant: "destructive"
      });
    } finally {
      setIsTestingGeneration(false);
    }
  };

  // Test full blog creation flow
  const testFullBlogFlow = async () => {
    if (!generatedContent) {
      toast({
        title: "No Generated Content",
        description: "Please run content generation test first",
        variant: "destructive"
      });
      return;
    }

    setIsTestingFullFlow(true);
    setFullFlowResult(null);
    setCreatedBlogPost(null);

    const startTime = Date.now();

    try {
      console.log('🧪 Testing full blog creation flow...');
      
      // Calculate SEO score (simple calculation for testing)
      const seoScore = Math.min(95, Math.max(70, generatedContent.wordCount / 10));
      
      const blogPost = await blogService.createBlogPost({
        title: generatedContent.title,
        content: generatedContent.content,
        targetUrl: generatedContent.targetUrl,
        anchorText: generatedContent.anchorText,
        primaryKeyword: keyword,
        wordCount: generatedContent.wordCount,
        readingTime: Math.ceil(generatedContent.wordCount / 200),
        seoScore,
        customSlug: `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      }, user?.id, true); // Create as trial post

      const duration = Date.now() - startTime;

      setFullFlowResult({
        success: true,
        message: `Blog post created successfully in ${duration}ms`,
        data: blogPost,
        duration
      });
      setCreatedBlogPost(blogPost);
      
      toast({
        title: "Full Flow Test Passed! 🎉",
        description: `Blog post created with slug: ${blogPost.slug}`,
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      setFullFlowResult({
        success: false,
        message: error.message || 'Blog creation failed',
        duration
      });
      
      toast({
        title: "Full Flow Test Failed",
        description: error.message || 'Blog creation failed',
        variant: "destructive"
      });
    } finally {
      setIsTestingFullFlow(false);
    }
  };

  // Load a test case
  const loadTestCase = (testCase: typeof testCases[0]) => {
    setKeyword(testCase.keyword);
    setAnchorText(testCase.anchorText);
    setTargetUrl(testCase.targetUrl);
  };

  // Run all tests
  const runAllTests = async () => {
    for (const testCase of testCases) {
      setKeyword(testCase.keyword);
      setAnchorText(testCase.anchorText);
      setTargetUrl(testCase.targetUrl);
      
      await testContentGeneration();
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Blog Generation System Test
        </h1>
        <p className="text-gray-600">
          Test the enhanced blog content generation and creation system
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Test</TabsTrigger>
          <TabsTrigger value="predefined">Predefined Cases</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Manual Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="keyword">Target Keyword</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g., SEO optimization"
                  />
                </div>
                <div>
                  <Label htmlFor="anchorText">Anchor Text</Label>
                  <Input
                    id="anchorText"
                    value={anchorText}
                    onChange={(e) => setAnchorText(e.target.value)}
                    placeholder="e.g., professional SEO services"
                  />
                </div>
                <div>
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input
                    id="targetUrl"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={testContentGeneration}
                  disabled={isTestingGeneration}
                  className="flex items-center gap-2"
                >
                  {isTestingGeneration ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Test Content Generation
                </Button>

                <Button
                  onClick={testFullBlogFlow}
                  disabled={isTestingFullFlow || !generatedContent}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isTestingFullFlow ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Test Full Blog Creation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generation Result */}
            {generationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {generationResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Content Generation Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={generationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {generationResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  {generationResult.success && generatedContent && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Generated Title:</Label>
                        <p className="text-sm text-gray-700 mt-1">{generatedContent.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Word Count:</Label>
                        <Badge variant="secondary">{generatedContent.wordCount} words</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Content Preview:</Label>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                          {generatedContent.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Full Flow Result */}
            {fullFlowResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {fullFlowResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Blog Creation Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={fullFlowResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription>
                      {fullFlowResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  {fullFlowResult.success && createdBlogPost && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Blog Post ID:</Label>
                        <p className="text-sm text-gray-700 mt-1 font-mono">{createdBlogPost.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Slug:</Label>
                        <p className="text-sm text-gray-700 mt-1 font-mono">{createdBlogPost.slug}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Published URL:</Label>
                        <a 
                          href={`/blog/${createdBlogPost.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Blog Post <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predefined" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Predefined Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {testCases.map((testCase, index) => (
                  <Card key={index} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => loadTestCase(testCase)}>
                    <h4 className="font-semibold text-sm mb-2">Test Case {index + 1}</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p><strong>Keyword:</strong> {testCase.keyword}</p>
                      <p><strong>Anchor:</strong> {testCase.anchorText}</p>
                      <p><strong>URL:</strong> {testCase.targetUrl}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <Button onClick={runAllTests} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Run All Test Cases
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Generated Content Analysis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Textarea
                        value={generatedContent.content}
                        readOnly
                        className="min-h-[200px] bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{generatedContent.wordCount}</div>
                      <div className="text-sm text-gray-600">Words Generated</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedContent.content.includes(generatedContent.anchorText) ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600">Anchor Text Included</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {generatedContent.content.includes(generatedContent.targetUrl) ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600">Link Included</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.ceil(generatedContent.wordCount / 200)}
                      </div>
                      <div className="text-sm text-gray-600">Reading Time (min)</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results available. Run a test to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BlogGenerationTest;
