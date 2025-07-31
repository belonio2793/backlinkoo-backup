import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { templateBlogGenerator } from '@/services/templateBlogGenerator';
import { 
  Wand2, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface TemplateQueryBoxProps {
  placeholder?: string;
  className?: string;
  onSuccess?: (post: any) => void;
}

export function TemplateQueryBox({ 
  placeholder = "Try: Generate a 1000 word blog post on sustainable living including eco-friendly products hyperlinked to https://example.com/products",
  className = "",
  onSuccess
}: TemplateQueryBoxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<any>(null);
  const [lastPost, setLastPost] = useState<any>(null);

  // Parse query when user types
  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    if (value.trim().length > 20) {
      const parsed = templateBlogGenerator.parseTemplateQuery(value);
      setParsedQuery(parsed);
    } else {
      setParsedQuery(null);
    }
  };

  // Generate blog post
  const handleGenerate = async () => {
    if (!parsedQuery) {
      toast({
        title: "Invalid Query",
        description: "Please use a format like: Generate a 1000 word blog post on [topic] including [anchor text] hyperlinked to [URL]",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const result = await templateBlogGenerator.generateFromTemplate(parsedQuery, user?.id);
      
      if (result.success && result.post) {
        setLastPost(result.post);
        setQuery('');
        setParsedQuery(null);
        
        toast({
          title: "🎉 Blog Generated!",
          description: `Created "${result.post.title}" successfully.`,
        });

        onSuccess?.(result.post);
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again with a different query.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Examples */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          <Lightbulb className="mr-1 h-3 w-3" />
          Quick Start
        </Badge>
        {[
          'Generate a 1500 word blog post on "digital marketing" including "SEO tools" hyperlinked to "https://example.com/seo"',
          'Write a 1000 word blog post about "healthy cooking" with a hyperlinked "recipe app" linked to "https://example.com/app"'
        ].map((example, index) => (
          <button
            key={index}
            onClick={() => handleQueryChange(example)}
            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            Example {index + 1}
          </button>
        ))}
      </div>

      {/* Query Input */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="min-h-16 resize-none"
          />

          {/* Query Status */}
          {query && (
            <div className="space-y-2">
              {parsedQuery ? (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-green-800">Query parsed successfully!</div>
                    <div className="text-green-700 mt-1">
                      <strong>Topic:</strong> {parsedQuery.keyword} • 
                      <strong> Link:</strong> {parsedQuery.anchorText} → {parsedQuery.url.substring(0, 30)}...
                    </div>
                  </div>
                </div>
              ) : query.length > 20 ? (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1 text-sm text-amber-800">
                    Try a format like: "Generate a [number] word blog post on [topic] including [anchor text] hyperlinked to [URL]"
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!parsedQuery || isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Generated Post */}
      {lastPost && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">{lastPost.title}</h3>
                <p className="text-sm text-green-700 mt-1">
                  Blog post generated with {lastPost.metadata.wordCount} words
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" asChild>
                    <a href={lastPost.publishedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(lastPost.publishedUrl)}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
