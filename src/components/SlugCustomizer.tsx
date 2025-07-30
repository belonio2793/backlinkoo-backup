import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugGenerationService, type SlugSuggestion, type SlugOptions } from '@/services/slugGenerationService';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Sparkles,
  Target,
  Calendar,
  Hash,
  Shuffle
} from 'lucide-react';

interface SlugCustomizerProps {
  title: string;
  keywords?: string[];
  content?: string;
  category?: string;
  initialSlug?: string;
  onSlugChange: (slug: string) => void;
  className?: string;
}

export function SlugCustomizer({
  title,
  keywords = [],
  content,
  category,
  initialSlug,
  onSlugChange,
  className
}: SlugCustomizerProps) {
  const { toast } = useToast();
  const [customSlug, setCustomSlug] = useState(initialSlug || '');
  const [suggestions, setSuggestions] = useState<SlugSuggestion[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug || '');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Options
  const [includeDate, setIncludeDate] = useState(false);
  const [includeKeyword, setIncludeKeyword] = useState(true);
  const [separator, setSeparator] = useState<'-' | '_' | '.'>('-');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [title, keywords, includeDate, includeKeyword, separator]);

  useEffect(() => {
    if (customSlug) {
      validateCustomSlug(customSlug);
    }
  }, [customSlug]);

  const generateSuggestions = async () => {
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      const options: SlugOptions = {
        title,
        customSlug: customSlug.trim() || undefined,
        keywords,
        includeDate,
        includeKeyword,
        separator
      };

      const newSuggestions = await slugGenerationService.generateSlugSuggestions(options);
      setSuggestions(newSuggestions);
      
      // Auto-select best available suggestion if no slug is selected
      if (!selectedSlug && newSuggestions.length > 0) {
        const bestSuggestion = newSuggestions.find(s => s.isAvailable) || newSuggestions[0];
        setSelectedSlug(bestSuggestion.slug);
        onSlugChange(bestSuggestion.slug);
      }
    } catch (error) {
      console.error('Failed to generate slug suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate slug suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCustomSlug = (slug: string) => {
    const validation = slugGenerationService.validateSlug(slug);
    setValidationErrors(validation.errors);
  };

  const handleSlugSelect = (slug: string) => {
    setSelectedSlug(slug);
    setCustomSlug(slug);
    onSlugChange(slug);
  };

  const handleCustomSlugChange = (value: string) => {
    setCustomSlug(value);
    if (value.trim()) {
      setSelectedSlug(value);
      onSlugChange(value);
    }
  };

  const generateRandomSlug = async () => {
    setLoading(true);
    try {
      const randomOptions: SlugOptions = {
        title,
        keywords,
        randomSuffix: true,
        separator
      };
      
      const uniqueSlug = await slugGenerationService.generateUniqueSlug(randomOptions);
      setSelectedSlug(uniqueSlug);
      setCustomSlug(uniqueSlug);
      onSlugChange(uniqueSlug);
      
      toast({
        title: "Random Slug Generated",
        description: "A unique random slug has been generated for you.",
      });
    } catch (error) {
      console.error('Failed to generate random slug:', error);
      toast({
        title: "Error",
        description: "Failed to generate random slug. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copySlugToClipboard = async () => {
    const fullUrl = `${window.location.origin}/blog/${selectedSlug}`;
    await navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Copied!",
      description: "Blog URL copied to clipboard.",
    });
  };

  const getSlugIcon = (type: string) => {
    switch (type) {
      case 'custom': return <Target className="h-4 w-4" />;
      case 'title-based': return <Hash className="h-4 w-4" />;
      case 'keyword-based': return <Sparkles className="h-4 w-4" />;
      case 'date-based': return <Calendar className="h-4 w-4" />;
      case 'random': return <Shuffle className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          URL Slug Customization
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize your blog post URL for better SEO and shareability
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* URL Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium mb-2 block">Preview URL</Label>
          <div className="flex items-center gap-2 p-2 bg-white border rounded text-sm font-mono">
            <span className="text-muted-foreground">{window.location.origin}/blog/</span>
            <span className="font-semibold text-blue-600">{selectedSlug || 'your-slug-here'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copySlugToClipboard}
              className="h-6 w-6 p-0"
              disabled={!selectedSlug}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/blog/${selectedSlug}`, '_blank')}
              className="h-6 w-6 p-0"
              disabled={!selectedSlug}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
            <TabsTrigger value="custom">Custom Slug</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            
            {/* Options */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={generateSuggestions}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Suggestions
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? 'Hide' : 'Show'} Options
              </Button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-date"
                        checked={includeDate}
                        onCheckedChange={setIncludeDate}
                      />
                      <Label htmlFor="include-date" className="text-sm">Include Date</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-keyword"
                        checked={includeKeyword}
                        onCheckedChange={setIncludeKeyword}
                      />
                      <Label htmlFor="include-keyword" className="text-sm">Optimize Keywords</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="separator" className="text-sm">Separator</Label>
                      <Select value={separator} onValueChange={(value: any) => setSeparator(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">Hyphen (-)</SelectItem>
                          <SelectItem value="_">Underscore (_)</SelectItem>
                          <SelectItem value=".">Dot (.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions List */}
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.slice(0, 8).map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSlug === suggestion.slug
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSlugSelect(suggestion.slug)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {getSlugIcon(suggestion.type)}
                        <span className="font-mono text-sm">{suggestion.slug}</span>
                        {selectedSlug === suggestion.slug && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={suggestion.isAvailable ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {suggestion.isAvailable ? 'Available' : 'Taken'}
                        </Badge>
                        <span className={`text-xs font-medium ${getScoreColor(suggestion.score)}`}>
                          {suggestion.score}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No suggestions available. Try entering a title first.</p>
                </div>
              )}
            </div>

            {/* Generate Random Slug */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={generateRandomSlug}
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Generate Random Unique Slug
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-slug">Custom Slug</Label>
              <Input
                id="custom-slug"
                value={customSlug}
                onChange={(e) => handleCustomSlugChange(e.target.value)}
                placeholder="enter-your-custom-slug"
                className="font-mono"
              />
              
              {validationErrors.length > 0 && (
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only. Avoid starting or ending with separators.
              </div>
            </div>

            {/* Slug Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SEO Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Keep it under 50 characters for best SEO</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Include your main keyword if possible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Use hyphens to separate words</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Make it descriptive and readable</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span>Avoid changing slugs after publishing</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Missing import fix
import { Settings } from 'lucide-react';
