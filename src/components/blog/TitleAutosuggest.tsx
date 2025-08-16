/**
 * Title Autosuggest Component
 * 
 * Provides intelligent title suggestions and corrections for blog posts
 * with real-time feedback and variation options.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BlogTitleService } from '@/services/blogTitleService';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Copy,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Zap,
  Heart,
  HelpCircle
} from 'lucide-react';

interface TitleAutosuggestProps {
  initialTitle?: string;
  onTitleSelect?: (title: string) => void;
  onTitleChange?: (title: string) => void;
  showVariations?: boolean;
  blogPostId?: string;
  placeholder?: string;
}

const STYLE_ICONS = {
  'original': Award,
  'question': HelpCircle,
  'how-to': Target,
  'listicle': TrendingUp,
  'ultimate-guide': Sparkles,
  'power-words': Zap,
  'emotional': Heart
};

const STYLE_COLORS = {
  'original': 'bg-gray-100 text-gray-800',
  'question': 'bg-blue-100 text-blue-800',
  'how-to': 'bg-green-100 text-green-800',
  'listicle': 'bg-purple-100 text-purple-800',
  'ultimate-guide': 'bg-yellow-100 text-yellow-800',
  'power-words': 'bg-red-100 text-red-800',
  'emotional': 'bg-pink-100 text-pink-800'
};

export function TitleAutosuggest({ 
  initialTitle = '', 
  onTitleSelect, 
  onTitleChange,
  showVariations = true,
  blogPostId,
  placeholder = "Enter your blog post title..."
}: TitleAutosuggestProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  // Analyze title and generate suggestions
  const analysis = useMemo(() => {
    if (!title.trim()) return null;
    return BlogTitleService.analyzeTitleCorrections(title);
  }, [title]);

  const suggestions = useMemo(() => {
    if (!analysis?.corrected) return [];
    return BlogTitleService.generateTitleVariations(analysis.corrected);
  }, [analysis]);

  // Auto-show suggestions when typing
  useEffect(() => {
    if (title.length > 10 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [title, suggestions]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  const handleSelectTitle = (selectedTitle: string) => {
    setTitle(selectedTitle);
    onTitleSelect?.(selectedTitle);
    onTitleChange?.(selectedTitle);
    toast({
      title: "Title Selected",
      description: "Your new title has been applied!",
      duration: 2000
    });
  };

  const handleCorrectTitle = async () => {
    if (!blogPostId || !analysis?.corrections.length) return;
    
    setIsAnalyzing(true);
    try {
      const result = await BlogTitleService.correctBlogPostTitle(blogPostId);
      
      if (result.success) {
        setTitle(result.correctedTitle);
        onTitleSelect?.(result.correctedTitle);
        onTitleChange?.(result.correctedTitle);
        
        toast({
          title: "Title Corrected!",
          description: `Fixed ${result.corrections.length} issue(s) in your title.`,
        });
      } else {
        toast({
          title: "Correction Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to correct title. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Title copied to clipboard",
        duration: 1500
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Blog Post Title</label>
        <div className="relative">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          {title && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Title Analysis */}
      {analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Title Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Corrections Needed */}
            {analysis.corrections.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-2">
                    <p className="font-medium">
                      {analysis.corrections.length} correction(s) suggested:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {analysis.corrections.map((correction, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            {correction.from}
                          </span>
                          →
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {correction.to}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {correction.type}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {blogPostId && (
                      <Button
                        onClick={handleCorrectTitle}
                        disabled={isAnalyzing}
                        size="sm"
                        className="mt-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Correcting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Apply Corrections
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Quality Score */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  analysis.confidence >= 80 ? 'bg-green-500' :
                  analysis.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">Quality Score: {analysis.confidence}/100</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="h-4 w-4" />
                {analysis.confidence >= 80 ? 'Excellent' :
                 analysis.confidence >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>

            {/* Corrected Title Preview */}
            {analysis.corrected !== analysis.original && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Corrected Title:</label>
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 flex-1">{analysis.corrected}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectTitle(analysis.corrected)}
                  >
                    Use This
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Title Variations */}
      {showVariations && showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Title Variations
              <Badge variant="secondary" className="ml-auto">
                {suggestions.length} suggestions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const Icon = STYLE_ICONS[suggestion.style as keyof typeof STYLE_ICONS];
                const colorClass = STYLE_COLORS[suggestion.style as keyof typeof STYLE_COLORS];
                
                return (
                  <div
                    key={index}
                    className="group flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 flex-1">{suggestion.title}</span>
                      <Badge className={`text-xs ${colorClass}`}>
                        {suggestion.style.replace('-', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        {suggestion.score}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion.title)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectTitle(suggestion.title)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {suggestions.length > 5 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Suggestions are ranked by engagement potential and SEO value
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {!showSuggestions && title.length < 10 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Start typing your title to see suggestions and corrections</p>
              <p className="text-xs mt-1">We'll help you create an engaging, SEO-friendly title</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
