import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { templateBlogGenerator, type TemplateQuery } from '@/services/templateBlogGenerator';
import {
  Sparkles,
  Wand2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Link,
  Hash,
  Timer,
  Eye,
  RefreshCw,
  Lightbulb,
  Target,
  ExternalLink
} from 'lucide-react';

export function EnhancedBlogGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for template query processing
  const [queryInput, setQueryInput] = useState('');
  const [parsedQuery, setParsedQuery] = useState<TemplateQuery | null>(null);
  const [isParsingQuery, setIsParsingQuery] = useState(false);
  
  // State for manual input mode
  const [manualMode, setManualMode] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [wordCount, setWordCount] = useState(1000);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastGeneratedPost, setLastGeneratedPost] = useState<any>(null);

  // Parse query input in real-time
  useEffect(() => {
    if (queryInput.trim().length > 10) {
      setIsParsingQuery(true);
      const timeoutId = setTimeout(() => {
        const parsed = templateBlogGenerator.parseTemplateQuery(queryInput);
        setParsedQuery(parsed);
        setIsParsingQuery(false);
        
        // Auto-populate manual fields if query is parsed
        if (parsed) {
          setKeyword(parsed.keyword);
          setAnchorText(parsed.anchorText);
          setTargetUrl(parsed.url);
          setWordCount(parsed.wordCount || 1000);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setParsedQuery(null);
      setIsParsingQuery(false);
    }
  }, [queryInput]);

  // Handle blog generation
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(10);

      let templateQuery: TemplateQuery;

      if (parsedQuery && !manualMode) {
        // Use parsed query
        templateQuery = parsedQuery;
        setGenerationProgress(25);
      } else {
        // Use manual inputs
        if (!keyword || !anchorText || !targetUrl) {
          toast({
            title: "Missing Information",
            description: "Please provide keyword, anchor text, and target URL.",
            variant: "destructive"
          });
          return;
        }

        templateQuery = {
          rawQuery: `Generate a ${wordCount} word blog post on "${keyword}" including "${anchorText}" hyperlinked to "${targetUrl}"`,
          keyword,
          anchorText,
          url: targetUrl,
          wordCount
        };
        setGenerationProgress(25);
      }

      // Validate URL
      try {
        new URL(templateQuery.url);
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid URL for the backlink.",
          variant: "destructive"
        });
        return;
      }

      setGenerationProgress(40);

      // Generate blog post
      const result = await templateBlogGenerator.generateFromTemplate(templateQuery, user?.id);
      
      setGenerationProgress(90);

      if (result.success && result.post) {
        setLastGeneratedPost(result.post);
        setGenerationProgress(100);
        
        toast({
          title: "🎉 Blog Post Generated!",
          description: `Successfully created "${result.post.title}" using template: ${result.templateUsed}`,
        });

        // Clear form
        setQueryInput('');
        setParsedQuery(null);
        if (manualMode) {
          setKeyword('');
          setAnchorText('');
          setTargetUrl('');
          setWordCount(1000);
        }
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error: any) {
      console.error('Blog generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  // Template examples
  const templateExamples = [
    'Generate a 1500 word blog post on "sustainable gardening" including the "eco-friendly tools" hyperlinked to "https://example.com/tools"',
    'Write a 1000 word blog post about "digital marketing strategies" with a hyperlinked "marketing automation" linked to "https://example.com/automation"',
    'Produce a 1200-word blog post on "healthy meal prep" that links "nutrition tracker" to "https://example.com/tracker"'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Blog Generator</h1>
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate high-quality blog posts using natural language queries or manual input. 
          Perfect for creating SEO-optimized content with contextual backlinks.
        </p>
      </div>

      {/* Template Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Natural Language Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Describe what you want to create</Label>
            <Textarea
              id="query"
              placeholder="Try: Generate a 1000 word blog post on sustainable living including eco-friendly products hyperlinked to https://example.com/products"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Template Examples */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Example templates:</Label>
            <div className="space-y-2">
              {templateExamples.map((example, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                  onClick={() => setQueryInput(example)}
                >
                  <code className="text-blue-600">{example}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Query parsing status */}
          {isParsingQuery && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Parsing query...</span>
            </div>
          )}

          {/* Parsed query display */}
          {parsedQuery && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Query successfully parsed!</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Keyword:</strong> {parsedQuery.keyword}
                    </div>
                    <div>
                      <strong>Anchor Text:</strong> {parsedQuery.anchorText}
                    </div>
                    <div>
                      <strong>Target URL:</strong> 
                      <a href={parsedQuery.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {parsedQuery.url}
                      </a>
                    </div>
                  </div>
                  <div className="text-sm">
                    <strong>Word Count:</strong> {parsedQuery.wordCount} words
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {queryInput && !parsedQuery && !isParsingQuery && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to parse this query. Try using the manual input mode below or follow one of the example templates.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Mode Toggle */}
      <div className="flex items-center justify-center">
        <Button
          variant={manualMode ? "default" : "outline"}
          onClick={() => setManualMode(!manualMode)}
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          {manualMode ? "Using Manual Mode" : "Switch to Manual Mode"}
        </Button>
      </div>

      {/* Manual Input Form */}
      {manualMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Manual Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Main Keyword
                </Label>
                <Input
                  id="keyword"
                  placeholder="e.g., sustainable living"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anchorText">
                  <Link className="inline h-4 w-4 mr-1" />
                  Anchor Text
                </Label>
                <Input
                  id="anchorText"
                  placeholder="e.g., eco-friendly products"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetUrl">
                  <ExternalLink className="inline h-4 w-4 mr-1" />
                  Target URL
                </Label>
                <Input
                  id="targetUrl"
                  placeholder="https://example.com/products"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordCount">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Word Count
                </Label>
                <Input
                  id="wordCount"
                  type="number"
                  min="500"
                  max="3000"
                  step="100"
                  value={wordCount}
                  onChange={(e) => setWordCount(parseInt(e.target.value) || 1000)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!parsedQuery && (!keyword || !anchorText || !targetUrl))}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Generating... {generationProgress}%
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Blog Post
            </>
          )}
        </Button>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-600">
            Creating your blog post... This may take a minute.
          </div>
        </div>
      )}

      {/* Generated Post Preview */}
      {lastGeneratedPost && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Blog Post Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{lastGeneratedPost.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <FileText className="mr-1 h-3 w-3" />
                  {lastGeneratedPost.metadata.wordCount} words
                </Badge>
                <Badge variant="outline">
                  <Hash className="mr-1 h-3 w-3" />
                  {lastGeneratedPost.metadata.keyword}
                </Badge>
                <Badge variant="outline">
                  <Link className="mr-1 h-3 w-3" />
                  {lastGeneratedPost.metadata.anchorText}
                </Badge>
                <Badge variant="outline">
                  <Timer className="mr-1 h-3 w-3" />
                  Expires in 24h
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button asChild>
                <a href={lastGeneratedPost.publishedUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  View Post
                </a>
              </Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(lastGeneratedPost.publishedUrl)}>
                <Link className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
