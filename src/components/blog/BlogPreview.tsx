import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Loader2
} from 'lucide-react';

interface BlogPreviewProps {
  content: any;
}

export function BlogPreview({ content }: BlogPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
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
    toast({
      title: "Publishing Blog Post",
      description: "Your blog post is being published and backlink created...",
    });

    // Simulate publishing process
    setTimeout(() => {
      toast({
        title: "Blog Post Published",
        description: "Your post is live and backlink has been created successfully!",
      });
    }, 2000);
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
    await navigator.clipboard.writeText(content.content);
    toast({
      title: "Copied to Clipboard",
      description: "Blog post HTML content has been copied.",
    });
  };

  const generateBacklinkUrl = () => {
    return `https://backlinkoo.com/blog/${content.slug}`;
  };

  return (
    <div className="space-y-6">
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
              className="prose max-w-none"
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
            <Button onClick={publishPost} className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Publish & Create Backlink
            </Button>
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
