import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { blogPublisher } from '@/services/blogPublisher';
import {
  Eye,
  Code,
  Share,
  Download,
  Edit,
  Globe,
  Calendar,
  Hash,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  Zap,
  Link
} from 'lucide-react';

interface BlogPreviewProps {
  content: any;
}

export function BlogPreview({ content }: BlogPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  if (!content) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Content Generated</h3>
          <p className="text-muted-foreground">
            Generate a blog post first to see the preview here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const publishPost = async () => {
    if (!content) return;

    setIsPublishing(true);

    toast({
      title: "Publishing Blog Post",
      description: "Your blog post is being published and backlink created...",
    });

    try {
      const result = await blogPublisher.publishPost({
        title: content.title,
        slug: content.slug,
        content: content.content,
        metaDescription: content.metaDescription,
        keywords: content.keywords,
        targetUrl: content.targetUrl,
        status: 'published',
        createdAt: content.createdAt
      });

      if (result.success) {
        toast({
          title: "Blog Post Published Successfully",
          description: `Your post is live at ${result.publishedUrl} and backlink created!`,
        });

        // Update content status
        content.status = 'published';
        content.publishedAt = new Date().toISOString();
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish blog post",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const exportPost = () => {
    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blog-post-${content.slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const textToCopy = content.blogUrl || content.content;
    await navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: content.blogUrl ? "Blog URL has been copied." : "Blog post HTML content has been copied.",
    });
  };

  const generateBacklinkUrl = () => {
    return `https://backlinkoo.com/blog/${content.slug}`;
  };

  return (
    <div className="space-y-6">
      {/* AI Workflow Results */}
      {content.blogUrl && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Blog Successfully Generated!</strong> Your blog post is now live at:{' '}
            <a
              href={content.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:no-underline"
            >
              {content.blogUrl}
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Test Workflow Results */}
      {content.metadata?.testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              AI Workflow Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Test Duration
                </p>
                <p className="text-sm text-muted-foreground">
                  {content.metadata.testResult.testDuration}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Working Providers</p>
                <p className="text-sm text-muted-foreground">
                  {content.metadata.testResult.workingProviders.length} available
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Recommended Provider</p>
                <Badge variant="outline" className="text-xs">
                  {content.metadata.testResult.recommendedProvider}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Provider Status Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {content.metadata.testResult.providerStatuses.map((provider: any, index: number) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{provider.provider}</span>
                      {provider.available ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 bg-red-600 rounded-full" />
                      )}
                    </div>
                    <div className={`text-xs px-1 py-0.5 rounded ${
                      provider.quotaStatus === 'available' ? 'bg-green-100 text-green-800' :
                      provider.quotaStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {provider.quotaStatus}
                      {provider.usagePercentage && ` (${provider.usagePercentage}%)`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Post Overview
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'html' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('html')}
              >
                <Code className="h-4 w-4 mr-1" />
                HTML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Title</p>
              <p className="text-sm text-muted-foreground">{content.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Word Count</p>
              <p className="text-sm text-muted-foreground">{content.wordCount} words</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(content.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <Badge variant="secondary">{content.status}</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Meta Description</p>
            <p className="text-sm text-muted-foreground">{content.metaDescription}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Hash className="h-4 w-4" />
              Keywords
            </p>
            <div className="flex flex-wrap gap-2">
              {content.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline">{keyword}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              Target URL
            </p>
            <a 
              href={content.targetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {content.targetUrl}
            </a>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Backlink URL</p>
            <p className="text-sm text-muted-foreground font-mono bg-gray-50 p-2 rounded">
              {generateBacklinkUrl()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Content {viewMode === 'preview' ? 'Preview' : 'HTML Source'}</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'preview' ? (
            <div
              className="prose max-w-none blog-content prose-strong:font-bold prose-strong:text-foreground [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          ) : (
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
              {content.content}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {content.blogUrl ? (
              <>
                <Button asChild>
                  <a
                    href={content.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Published Blog
                  </a>
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Blog URL
                </Button>
              </>
            ) : (
              <Button
                onClick={publishPost}
                disabled={isPublishing}
                className="flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4" />
                    Publish & Create Backlink
                  </>
                )}
              </Button>
            )}

            <Button variant="outline" onClick={copyToClipboard}>
              <Code className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
            <Button variant="outline" onClick={exportPost}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
