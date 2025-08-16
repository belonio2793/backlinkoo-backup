/**
 * Blog Standardization Admin Component
 * 
 * Admin interface for applying consistent formatting standards
 * to all blog posts based on premium design patterns.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BlogContentStandardizationService } from '@/services/blogContentStandardizationService';
import { blogService } from '@/services/blogService';
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileText,
  TrendingUp,
  Eye,
  Settings,
  Zap,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react';

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  qualityScore: number;
  needsStandardization: boolean;
  contentLength: number;
}

export function BlogStandardization() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPostSummary[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [processResults, setProcessResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [previewContent, setPreviewContent] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    try {
      const blogServiceInstance = new blogService();
      const { data: posts, error } = await blogServiceInstance.getBlogPosts({});

      if (error) {
        toast({
          title: "Load Failed",
          description: "Failed to fetch blog posts for analysis.",
          variant: "destructive"
        });
        return;
      }

      if (!posts || posts.length === 0) {
        setBlogPosts([]);
        return;
      }

      // Analyze each post
      const analyzedPosts: BlogPostSummary[] = [];
      
      for (const post of posts) {
        const qualityScore = calculateContentQuality(post.content || '');
        const needsStandardization = qualityScore < 85;
        
        analyzedPosts.push({
          id: post.id,
          title: post.title || 'Untitled',
          slug: post.slug || '',
          status: post.status || 'draft',
          qualityScore,
          needsStandardization,
          contentLength: (post.content || '').length
        });
      }

      // Sort by quality score (lowest first)
      analyzedPosts.sort((a, b) => a.qualityScore - b.qualityScore);
      setBlogPosts(analyzedPosts);

      // Auto-select posts that need standardization
      const postsNeedingWork = analyzedPosts
        .filter(p => p.needsStandardization)
        .slice(0, 20) // Limit to first 20
        .map(p => p.id);
      setSelectedPosts(postsNeedingWork);

    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze blog posts.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateContentQuality = (content: string): number => {
    let score = 0;

    // Basic HTML structure (30 points)
    if (content.includes('<h1>') || content.includes('<h2>')) score += 15;
    if (content.includes('<p>')) score += 10;
    if (!content.match(/<script|javascript:|onclick/i)) score += 5;

    // Content organization (25 points)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    if (wordCount > 300) score += 10;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 8;
    if (content.includes('<blockquote>')) score += 7;

    // Links and media (20 points)
    if (content.includes('<a')) score += 10;
    if (content.includes('target="_blank"')) score += 5;
    if (content.includes('<img')) score += 5;

    // Typography and styling (15 points)
    if (content.includes('class=')) score += 8;
    if (!content.includes('<script>')) score += 7;

    // Formatting consistency (10 points)
    const inconsistencies = [
      content.match(/<h1>/g)?.length! > 1,
      content.includes('<br><br>'),
      content.match(/\s{3,}/),
      content.match(/<p>\s*<\/p>/)
    ].filter(Boolean).length;

    score += Math.max(0, 10 - (inconsistencies * 2));

    return Math.min(100, score);
  };

  const handleStandardizeSelected = async () => {
    if (selectedPosts.length === 0) {
      toast({
        title: "No Posts Selected",
        description: "Please select posts to standardize.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessResults(null);

    try {
      toast({
        title: "Standardization Started",
        description: `Processing ${selectedPosts.length} blog posts...`,
      });

      const result = await BlogContentStandardizationService.bulkStandardizeBlogPosts(
        selectedPosts,
        {
          applyToDatabase: true,
          preserveOriginal: true,
          batchSize: 5,
          skipHighQuality: false
        }
      );

      setProcessResults(result);
      
      // Reload posts to show updated quality scores
      await loadBlogPosts();

      toast({
        title: "Standardization Complete",
        description: `Successfully processed ${result.successful} posts. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      });

    } catch (error) {
      console.error('Standardization error:', error);
      toast({
        title: "Standardization Failed",
        description: "An error occurred during the standardization process.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handlePreviewStandardization = async () => {
    if (!previewContent.trim()) {
      toast({
        title: "No Content",
        description: "Please enter content to preview.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await BlogContentStandardizationService.previewStandardization(
        previewContent,
        'Preview Title'
      );
      setPreviewResult(result);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to generate preview.",
        variant: "destructive"
      });
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const selectAllPosts = () => {
    setSelectedPosts(blogPosts.map(p => p.id));
  };

  const selectNeedingWork = () => {
    setSelectedPosts(blogPosts.filter(p => p.needsStandardization).map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  const postsNeedingWork = blogPosts.filter(p => p.needsStandardization).length;
  const averageQuality = blogPosts.length > 0 
    ? Math.round(blogPosts.reduce((sum, p) => sum + p.qualityScore, 0) / blogPosts.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            Blog Content Standardization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Apply consistent premium formatting standards to all blog posts. This process will enhance 
              typography, fix HTML structure, standardize links, and apply the elite blog design system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{blogPosts.length}</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{postsNeedingWork}</p>
                    <p className="text-sm text-muted-foreground">Need Work</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{averageQuality}%</p>
                    <p className="text-sm text-muted-foreground">Avg Quality</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{selectedPosts.length}</p>
                    <p className="text-sm text-muted-foreground">Selected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Formatting Standards Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Typography Enhancements</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Premium heading hierarchy (H1: 3.5rem, H2: 2.5rem, H3: 1.875rem)</li>
                    <li>• Enhanced paragraph styling (1.25rem, 1.9 line-height)</li>
                    <li>• Drop cap for first paragraph</li>
                    <li>• Optimized font features and smoothing</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Structure & Layout</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Consistent spacing and margins</li>
                    <li>• Enhanced lists with premium styling</li>
                    <li>• Standardized link formatting</li>
                    <li>• Premium blockquotes and code blocks</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Security & Validation</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• XSS protection and HTML sanitization</li>
                    <li>• Malformed content detection and repair</li>
                    <li>• Link attribute standardization</li>
                    <li>• Content structure validation</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Media & Accessibility</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Enhanced image wrappers and captions</li>
                    <li>• Responsive design optimizations</li>
                    <li>• Accessibility improvements</li>
                    <li>• Print and dark mode support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button onClick={selectNeedingWork} variant="outline" size="sm">
                    Select Posts Needing Work ({postsNeedingWork})
                  </Button>
                  <Button onClick={selectAllPosts} variant="outline" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear Selection
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleStandardizeSelected}
                disabled={isProcessing || selectedPosts.length === 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Standardizing {selectedPosts.length} posts...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Standardize {selectedPosts.length} Selected Posts
                  </>
                )}
              </Button>
              {isProcessing && (
                <div className="mt-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center mt-2">{progress}% complete</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Analyzing blog posts...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blogPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPosts.includes(post.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => togglePostSelection(post.id)}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => togglePostSelection(post.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <h4 className="font-medium">{post.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{post.slug}</span>
                            <Badge variant="outline">{post.status}</Badge>
                            <span>{post.contentLength} chars</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            post.qualityScore >= 80 ? 'text-green-600' :
                            post.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {post.qualityScore}%
                          </div>
                          <div className="text-xs text-gray-500">Quality</div>
                        </div>
                        {post.needsStandardization && (
                          <Badge variant="destructive">Needs Work</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview Standardization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preview-content">Content to Preview</Label>
                <Textarea
                  id="preview-content"
                  value={previewContent}
                  onChange={(e) => setPreviewContent(e.target.value)}
                  placeholder="Enter HTML content to see how it will be standardized..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <Button onClick={handlePreviewStandardization}>
                <Eye className="h-4 w-4 mr-2" />
                Generate Preview
              </Button>

              {previewResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Quality Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span>Before: {previewResult.qualityImprovement.before}%</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>After: {previewResult.qualityImprovement.after}%</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Improvements Applied</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {previewResult.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Standardized Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap max-h-96">
                        {previewResult.preview}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {processResults ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Standardization Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{processResults.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{processResults.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{processResults.totalProcessed}</div>
                    <div className="text-sm text-blue-700">Total Processed</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {processResults.results.map((result: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.postTitle}</h4>
                        <Badge variant={result.result.success ? "default" : "destructive"}>
                          {result.result.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                      
                      {result.result.success && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span>Quality: {result.result.qualityScore.before}% → {result.result.qualityScore.after}%</span>
                            <span className="text-green-600">
                              +{result.result.qualityScore.after - result.result.qualityScore.before} points
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {result.result.improvementsApplied.map((improvement: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {improvement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Run a standardization process to see results here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
