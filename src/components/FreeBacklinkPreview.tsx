import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { FreeBacklinkResult } from '@/services/simpleAIContentEngine';
import RegistrationModal from './RegistrationModal';
import {
  Eye,
  Code,
  Download,
  Trash2,
  RotateCcw,
  Clock,
  ExternalLink,
  Hash,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  UserPlus,
  Save,
  Timer,
  TrendingUp,
  Link,
  Sparkles
} from 'lucide-react';

interface FreeBacklinkPreviewProps {
  content: FreeBacklinkResult | null;
  onRegenerate?: (newContent: FreeBacklinkResult) => void;
  onDelete?: () => void;
}

export function FreeBacklinkPreview({ content, onRegenerate, onDelete }: FreeBacklinkPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });
  const { toast } = useToast();

  useEffect(() => {
    if (!content) return;

    const updateTimer = () => {
      const remaining = freeBacklinkService.getTimeRemaining(content);
      setTimeRemaining(remaining);
      
      if (remaining.expired && onDelete) {
        toast({
          title: "Post Expired",
          description: "This free blog post has expired and will be automatically deleted.",
          variant: "destructive"
        });
        onDelete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [content, onDelete, toast]);

  if (!content) {
    return (
      <Card className="border-dashed border-2 border-purple-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-purple-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">No Content Generated</h3>
          <p className="text-muted-foreground">
            Generate a free backlink blog post to see the preview here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const newContent = await freeBacklinkService.regeneratePost(content.id);
      if (newContent && onRegenerate) {
        onRegenerate(newContent);
        toast({
          title: "Content Regenerated! ✨",
          description: "Your blog post has been regenerated with fresh content.",
        });
      } else {
        throw new Error('Failed to regenerate content');
      }
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate content",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = () => {
    if (freeBacklinkService.deletePost(content.id)) {
      toast({
        title: "Post Deleted",
        description: "Your blog post has been deleted successfully.",
      });
      if (onDelete) onDelete();
    }
  };

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(content.content);
    toast({
      title: "Content Copied!",
      description: "The HTML content has been copied to your clipboard.",
    });
  };

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/free-backlink/${content.id}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "The shareable URL has been copied to your clipboard.",
    });
  };

  const handleSaveAccount = () => {
    setRegistrationModalOpen(true);
  };

  const exportPost = () => {
    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `free-backlink-${content.slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timeProgress = content ? 
    ((24 * 60 * 60 * 1000 - (new Date(content.expiresAt).getTime() - new Date().getTime())) / (24 * 60 * 60 * 1000)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Expiration Warning */}
      <Alert className={`border-2 ${timeRemaining.expired ? 'border-red-200 bg-red-50' : 
        timeRemaining.hours < 1 ? 'border-orange-200 bg-orange-50' : 
        'border-blue-200 bg-blue-50'}`}>
        <Timer className={`h-4 w-4 ${timeRemaining.expired ? 'text-red-600' : 
          timeRemaining.hours < 1 ? 'text-orange-600' : 'text-blue-600'}`} />
        <AlertDescription className={timeRemaining.expired ? 'text-red-800' : 
          timeRemaining.hours < 1 ? 'text-orange-800' : 'text-blue-800'}>
          {timeRemaining.expired ? (
            <strong>⏰ This post has expired and will be automatically deleted.</strong>
          ) : (
            <>
              <strong>⏰ Auto-Delete Timer:</strong> This free post expires in{' '}
              <span className="font-mono">
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              {' '}unless you save it by registering an account.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Timer Progress Bar */}
      {!timeRemaining.expired && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className="font-mono text-blue-600">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
          <Progress 
            value={Math.max(0, 100 - timeProgress)} 
            className="h-2"
          />
        </div>
      )}

      {/* Save Account CTA */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Save This Post Forever!</h3>
                <p className="text-sm text-green-700">
                  Register a free account to save this post permanently and unlock advanced features.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSaveAccount}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              Save & Register
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Post Overview */}
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Your Free Backlink Post
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className={viewMode === 'preview' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'html' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('html')}
                className={viewMode === 'html' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <Code className="h-4 w-4 mr-1" />
                HTML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-800">Title</p>
              <p className="text-sm text-purple-700 font-semibold">{content.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-800">Word Count</p>
              <p className="text-sm text-purple-700 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {content.wordCount} words
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-800">Reading Time</p>
              <p className="text-sm text-purple-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {content.readingTime} min
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-800">SEO Score</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {content.seoScore}/100
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Meta Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Meta Description</p>
            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
              {content.metaDescription}
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Hash className="h-4 w-4" />
              Keywords
            </p>
            <div className="flex flex-wrap gap-2">
              {content.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Target URL */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Link className="h-4 w-4" />
              Backlink Target
            </p>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div>
                <p className="text-sm font-medium">Target URL:</p>
                <a 
                  href={content.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {content.targetUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Badge variant="secondary">
                Anchor: {content.anchorText}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewMode === 'preview' ? <Eye className="h-5 w-5" /> : <Code className="h-5 w-5" />}
            Content {viewMode === 'preview' ? 'Preview' : 'HTML Source'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'preview' ? (
            <div 
              className="prose prose-purple max-w-none prose-headings:text-purple-900 prose-a:text-purple-600 prose-a:font-semibold prose-strong:text-purple-800"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          ) : (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyContent}
                className="absolute top-2 right-2 z-10"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap border">
                {content.content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Primary Actions */}
            <Button 
              onClick={handleSaveAccount}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Forever
            </Button>

            <Button 
              onClick={handleRegenerate}
              disabled={isRegenerating || timeRemaining.expired}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>

            {/* Secondary Actions */}
            <Button variant="outline" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>

            <Button variant="outline" onClick={exportPost}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>

            {/* Destructive Action */}
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="sm:col-span-2 lg:col-span-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {content.usage && (content.usage.tokens > 0 || content.usage.cost > 0) && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generation Details:</span>
              <div className="flex gap-4">
                <span>Tokens: {content.usage.tokens}</span>
                <span>Cost: ${content.usage.cost.toFixed(4)}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  FREE for you!
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        postTitle={content?.title}
        trigger="save_post"
      />
    </div>
  );
}
