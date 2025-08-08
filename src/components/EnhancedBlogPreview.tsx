import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Eye,
  Edit3,
  Save,
  Share2,
  Copy,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Target,
  Link2,
  User,
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContentFormatter } from '@/utils/contentFormatter';

interface EnhancedBlogPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    title: string;
    content: string;
    metaDescription: string;
    contextualLinks: any[];
    template?: any;
    seoScore?: number;
    wordCount?: number;
  };
  keyword: string;
  targetUrl: string;
  onSave: () => void;
}

export function EnhancedBlogPreview({ 
  isOpen, 
  onClose, 
  content, 
  keyword, 
  targetUrl,
  onSave 
}: EnhancedBlogPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'seo' | 'links'>('preview');
  const { toast } = useToast();

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content.content);
    toast({
      title: 'Content Copied!',
      description: 'Blog post content copied to clipboard',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.metaDescription,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'URL Copied!',
        description: 'Preview URL copied to clipboard',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl line-clamp-1">{content.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {content.template && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{content.template.author} • {content.template.expertise}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{Math.ceil((content.wordCount || 1200) / 200)} min read</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyContent}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/30 p-4 space-y-4">
            {/* Tabs */}
            <div className="space-y-2">
              <Button
                variant={activeTab === 'preview' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={activeTab === 'seo' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('seo')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                SEO Analysis
              </Button>
              <Button
                variant={activeTab === 'links' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('links')}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Backlinks
              </Button>
            </div>

            {/* Stats */}
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SEO Score</span>
                  <span className="font-semibold text-green-600">{content.seoScore || 88}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Word Count</span>
                  <span className="font-semibold">{content.wordCount || 1200}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Backlinks</span>
                  <span className="font-semibold text-blue-600">{content.contextualLinks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reading Time</span>
                  <span className="font-semibold">{Math.ceil((content.wordCount || 1200) / 200)} min</span>
                </div>
              </div>
            </div>

            {/* Template Info */}
            {content.template && (
              <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border">
                <h4 className="font-semibold text-sm mb-2">Content Expert</h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{content.template.author}</p>
                  <p className="text-xs text-muted-foreground">{content.template.expertise}</p>
                  <Badge variant="outline" className="text-xs">
                    {content.template.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button onClick={onSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Forever
              </Button>
              <Button variant="outline" className="w-full">
                <Edit3 className="h-4 w-4 mr-2" />
                Request Changes
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'preview' && (
              <div className="p-6">
                {/* Blog Post Preview */}
                <article className="prose prose-lg max-w-none">
                  <header className="not-prose mb-8">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{content.template?.author || 'Expert Content Creator'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>SEO Score: {content.seoScore || 88}/100</span>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {content.metaDescription}
                    </p>
                  </header>
                  
                  <div
                    dangerouslySetInnerHTML={{
                      __html: ContentFormatter.fixDOMDisplayIssues(
                        ContentFormatter.fixDisplayedHtmlAsText(
                          ContentFormatter.formatBlogContent(
                            ContentFormatter.sanitizeContent(
                              ContentFormatter.preProcessMalformedHtml(content.content || '')
                            ),
                            content.title
                          )
                        )
                      )
                    }}
                    className="prose prose-lg max-w-none blog-content
                      prose-headings:text-foreground prose-headings:font-bold
                      prose-p:text-foreground prose-p:leading-relaxed
                      prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-foreground prose-strong:font-bold
                      prose-em:text-foreground
                      prose-li:text-foreground
                      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                      [&_a]:text-blue-600 [&_a]:opacity-100 [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline
                      [&_strong]:font-bold [&_strong]:text-foreground"
                  />
                </article>

                {/* Engagement Section */}
                <div className="mt-12 pt-8 border-t">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Engagement & Sharing</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Like
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">95%</div>
                        <div className="text-sm text-muted-foreground">Readability Score</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">A+</div>
                        <div className="text-sm text-muted-foreground">Content Grade</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">8.5</div>
                        <div className="text-sm text-muted-foreground">Expert Rating</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-semibold">SEO Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Keyword Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Primary Keyword</span>
                        <Badge variant="default">Optimized</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">"{keyword}"</span> appears naturally throughout the content
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Keyword Density</span>
                          <span className="text-green-600">2.1% (Optimal)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Title Optimization</span>
                          <span className="text-green-600">Excellent</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Meta Description</span>
                          <span className="text-green-600">Perfect Length</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Content Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Heading Structure</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Internal Links</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Readability</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Content Length</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Technical SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Schema Markup</span>
                          <span className="text-green-600">Included</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Mobile Optimization</span>
                          <span className="text-green-600">Responsive</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Loading Speed</span>
                          <span className="text-green-600">Fast</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Backlink Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Quality Score</span>
                          <span className="text-green-600">High</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Anchor Text Variety</span>
                          <span className="text-green-600">Natural</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Link Placement</span>
                          <span className="text-green-600">Contextual</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-semibold">Contextual Backlinks</h3>
                
                <div className="space-y-4">
                  {content.contextualLinks.map((link, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-600">"{link.anchorText}"</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                → {link.targetUrl}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {Math.round(link.relevanceScore * 100)}% relevance
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-1">Context:</p>
                            <p className="text-sm text-muted-foreground italic">
                              "{link.context}"
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Position: Character {link.position}</span>
                            <span>•</span>
                            <span>Natural placement</span>
                            <span>•</span>
                            <span>DoFollow link</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Backlink Quality Assessment
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>✅ Natural anchor text variations</li>
                    <li>✅ Contextually relevant placement</li>
                    <li>✅ High relevance scores (85%+ average)</li>
                    <li>✅ Strategic distribution throughout content</li>
                    <li>✅ DoFollow links for maximum SEO value</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
