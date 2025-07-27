import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ExternalLink, Copy, ArrowRight, Plus, BarChart3 } from 'lucide-react';

interface MinimalisticSuccessSectionProps {
  publishedUrl: string;
  generatedPost: any;
  primaryKeyword: string;
  targetUrl: string;
  currentUser: any;
  onCreateAnother?: () => void;
}

export function MinimalisticSuccessSection({
  publishedUrl,
  generatedPost,
  primaryKeyword,
  targetUrl,
  currentUser,
  onCreateAnother
}: MinimalisticSuccessSectionProps) {
  const { toast } = useToast();

  const blogUrl = publishedUrl || `${window.location.origin}/blog/${generatedPost?.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(blogUrl);
    toast({
      title: "Link copied",
      description: "Blog post URL copied to clipboard"
    });
  };

  const handleViewPost = () => {
    window.open(blogUrl, '_blank');
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-8">
        {/* Success Icon and Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Content Published Successfully
          </h2>
          <p className="text-gray-600">
            Your article about "{primaryKeyword}" is now live
          </p>
        </div>

        {/* URL Display */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Live article URL</p>
                <p className="font-mono text-sm text-gray-900 truncate">
                  {blogUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="ml-4 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Article Preview */}
        <div className="mb-8">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {generatedPost?.title || `Complete Guide to ${primaryKeyword}`}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>Published today</span>
                <span>•</span>
                <span>{generatedPost?.word_count || 1200}+ words</span>
                <span>•</span>
                <span className="text-green-600">Live</span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">
                Professional content with strategic backlinks to {targetUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleViewPost}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Article
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCopyUrl}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Status Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {currentUser ? 'Permanent backlink' : 'Trial backlink (24 hours)'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {generatedPost?.seo_score || 85}
            </div>
            <div className="text-sm text-gray-600">SEO Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {generatedPost?.word_count || 1200}+
            </div>
            <div className="text-sm text-gray-600">Words</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {currentUser ? '∞' : '24h'}
            </div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
          {currentUser && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCreateAnother}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Another
          </Button>
        </div>

        {/* Next Steps */}
        {!currentUser && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowRight className="h-3 w-3 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Want to keep this backlink forever?
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Register your account to make this backlink permanent and create unlimited posts.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
