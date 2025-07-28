import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';

interface PromptOverlayProps {
  websiteUrl: string;
  keyword: string;
  anchorText?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

export function PromptOverlay({ 
  websiteUrl, 
  keyword, 
  anchorText, 
  isVisible = false,
  onToggleVisibility,
  className = ""
}: PromptOverlayProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePrompt = () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate progressive prompt generation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 20;
      });
    }, 300);

    // Auto-generate prompt based on inputs
    const anchor = anchorText || keyword;
    const currentYear = new Date().getFullYear();
    const wordCount = 1500; // Default word count

    const prompt = `Write ${wordCount} words on "${keyword}" and hyperlink the anchor text "${anchor}" with the URL ${websiteUrl} in a search engine optimized manner.

REQUIREMENTS:
- Create comprehensive, original content demonstrating expertise
- Natural integration of backlink "${anchor}" → ${websiteUrl}
- SEO-optimized structure with proper headings (H1, H2, H3)
- Engaging, value-driven content for target audience
- Professional tone with actionable insights
- Include relevant examples and practical tips

CONTENT STRUCTURE:
1. Compelling introduction with hook
2. Main sections with clear subheadings  
3. Natural backlink integration in context
4. Practical implementation guidance
5. Strong conclusion with clear CTA

ADVANCED REQUIREMENTS:
- Thorough research and comprehensive topic coverage
- E-A-T principles (Expertise, Authoritativeness, Trustworthiness)
- Natural language processing optimization
- Featured snippet and voice search optimization
- Semantic keyword integration
- Mobile-friendly content structure
- User experience focused writing

CONTENT GOALS:
- Answer user questions completely
- Establish topical authority
- Build reader trust through accuracy
- Drive engagement and conversions
- Natural backlink integration that adds value

Focus on user intent satisfaction while maintaining search engine optimization best practices for ${currentYear}.`;

    setGeneratedPrompt(prompt);
  };

  useEffect(() => {
    if (websiteUrl && keyword) {
      generatePrompt();
    }
  }, [websiteUrl, keyword, anchorText]);

  if (!websiteUrl || !keyword) {
    return (
      <Card className={`border-dashed border-2 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Enter website URL and keyword to see auto-generated prompt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Auto-Generated Content Prompt
            <Badge variant="secondary" className="text-xs">
              Non-editable
            </Badge>
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-8 w-8 p-0"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating optimized prompt...
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This prompt is automatically generated based on your website URL and keyword. 
              It's optimized for SEO and cannot be edited to ensure consistency.
            </AlertDescription>
          </Alert>

          <div className="relative">
            <div className="bg-gray-50 rounded-lg p-4 border max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                {generatedPrompt || 'Generating prompt...'}
              </pre>
            </div>
            
            {/* Overlay to prevent editing */}
            <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Prompt optimized for: {keyword}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={generatePrompt}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-700">Target URL</div>
              <div className="text-blue-600 truncate">{websiteUrl}</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-medium text-green-700">Keyword</div>
              <div className="text-green-600">{keyword}</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="font-medium text-purple-700">Anchor Text</div>
              <div className="text-purple-600">{anchorText || keyword}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
