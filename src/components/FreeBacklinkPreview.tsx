import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { GeneratedContentResult } from '@/services/openAIContentGenerator';
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
  Sparkles,
  Calendar,
  BarChart3,
  Settings,
  Star,
  Share
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

      {/* Enhanced Post Overview */}
      <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-bold">Your AI-Generated Blog Post</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              Free Content
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Enhanced Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{content.title}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Word Count</p>
                  <p className="text-lg font-bold text-green-600">{content.wordCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reading Time</p>
                  <p className="text-lg font-bold text-blue-600">{content.readingTime} min</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SEO Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-orange-600">{content.seoScore}</p>
                    <span className="text-sm text-gray-500">/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Meta Description */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Meta Description</h3>
            </div>
            <p className="text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-lg border-l-4 border-purple-200">
              "{content.metaDescription}"
            </p>
          </div>

          {/* Enhanced Keywords */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">SEO Keywords</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {content.keywords.length} keywords
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all px-3 py-1 font-medium"
                >
                  #{keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced Backlink Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Link className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Backlink Information</h3>
              <Badge className="bg-green-600 text-white">
                SEO Optimized
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-800">Target URL</p>
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </div>
                <a
                  href={content.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium break-all"
                >
                  {content.targetUrl}
                </a>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-100">
                <p className="text-sm font-medium text-green-800 mb-2">Anchor Text</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 font-medium">
                    "{content.anchorText}"
                  </Badge>
                  <span className="text-xs text-green-600">• Natural integration</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Content Preview */}
      <Card className="shadow-lg border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {viewMode === 'preview' ? <Eye className="h-5 w-5 text-purple-600" /> : <Code className="h-5 w-5 text-purple-600" />}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {viewMode === 'preview' ? 'Beautiful Content Preview' : 'HTML Source Code'}
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className={viewMode === 'preview' ? 'bg-purple-600 hover:bg-purple-700 shadow-md' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'html' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('html')}
                className={viewMode === 'html' ? 'bg-purple-600 hover:bg-purple-700 shadow-md' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
              >
                <Code className="h-4 w-4 mr-1" />
                HTML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'preview' ? (
            <div className="p-8 bg-white">
              {/* Blog Header */}
              <div className="mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="h-4 w-4" />
                  {new Date(content.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4" />
                  {content.readingTime} min read
                  <span className="mx-2">•</span>
                  <TrendingUp className="h-4 w-4" />
                  SEO Score: {content.seoScore}/100
                </div>
                <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                  {content.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {content.metaDescription}
                </p>
              </div>

              {/* Enhanced Content with Beautiful Typography */}
              <div
                className="prose prose-lg prose-purple max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                  prose-h1:text-4xl prose-h1:mb-6 prose-h1:leading-tight
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-purple-800 prose-h2:border-b prose-h2:border-purple-100 prose-h2:pb-3
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-purple-700
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                  prose-a:text-purple-600 prose-a:font-semibold prose-a:no-underline prose-a:bg-purple-50 prose-a:px-2 prose-a:py-1 prose-a:rounded-md prose-a:transition-all hover:prose-a:bg-purple-100 hover:prose-a:text-purple-700
                  prose-strong:text-purple-800 prose-strong:font-bold
                  prose-em:text-purple-600 prose-em:font-medium
                  prose-ul:space-y-3 prose-ol:space-y-3
                  prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-purple-200 prose-blockquote:bg-purple-50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:italic
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-purple-600
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-6
                  prose-table:border-collapse prose-table:border prose-table:border-gray-200
                  prose-th:bg-purple-50 prose-th:border prose-th:border-gray-200 prose-th:p-3 prose-th:font-semibold prose-th:text-purple-800
                  prose-td:border prose-td:border-gray-200 prose-td:p-3"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-sm font-medium text-gray-600 mr-2">Tags:</span>
                  {content.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      #{keyword}
                    </Badge>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-800 mb-2">Love this content?</h3>
                      <p className="text-sm text-purple-700 mb-4">
                        This high-quality blog post was generated using our AI-powered content creation tool.
                        Create your own professional content in minutes!
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                          onClick={handleSaveAccount}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Forever
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={handleCopyContent}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Content
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyContent}
                  className="bg-white/90 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-50 shadow-md"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-6 rounded-none">
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">HTML Source</span>
                  <Badge variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 text-xs">
                    {content.wordCount} words
                  </Badge>
                </div>
                <pre className="text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  <code className="language-html">{content.content}</code>
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Action Buttons */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-gray-800">Post Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Primary Actions Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Primary Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveAccount}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Forever
                  <Badge className="ml-2 bg-white/20 text-white text-xs">
                    Recommended
                  </Badge>
                </Button>

                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || timeRemaining.expired}
                  variant="outline"
                  className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-semibold transition-all duration-200 h-12"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate Content
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Secondary Actions Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Share className="h-4 w-4 text-blue-500" />
                Share & Export
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCopyContent}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Copy HTML
                </Button>

                <Button
                  variant="outline"
                  onClick={exportPost}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Danger Zone
              </h3>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post Now
              </Button>
            </div>
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
