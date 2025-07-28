import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PromptOverlay } from '@/components/ui/prompt-overlay';
import { useToast } from '@/hooks/use-toast';
import { productionAIContentManager } from '@/services/productionAIContentManager';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import { Loader2, Plus, X, Link, Target, Hash, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BlogFormProps {
  onContentGenerated: (content: any) => void;
}

export function BlogForm({ onContentGenerated }: BlogFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [contentType, setContentType] = useState('how-to');
  const [wordCount, setWordCount] = useState('1500');
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [promptOverlayVisible, setPromptOverlayVisible] = useState(false);
  const [testingProviders, setTestingProviders] = useState(false);
  const [testWorkflowStep, setTestWorkflowStep] = useState('');
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const { toast } = useToast();

  const addSecondaryKeyword = () => {
    if (newSecondaryKeyword.trim() && !secondaryKeywords.includes(newSecondaryKeyword.trim())) {
      setSecondaryKeywords([...secondaryKeywords, newSecondaryKeyword.trim()]);
      setNewSecondaryKeyword('');
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
  };

  const generateContent = async () => {
    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setTestingProviders(true);

    try {
      // Step 1: Run AI test workflow to validate providers
      setTestWorkflowStep('Testing AI provider connectivity...');

      const workflowResult = await aiTestWorkflow.processCompleteWorkflow({
        websiteUrl: targetUrl,
        keyword: primaryKeyword,
        anchorText: secondaryKeywords[0] || primaryKeyword,
        sessionId: crypto.randomUUID()
      });

      const { testResult, blogResult } = workflowResult;
      setProviderStatuses(testResult.providerStatuses);

      if (!testResult.success) {
        throw new Error(`AI provider validation failed: ${testResult.errors.join(', ')}`);
      }

      setTestWorkflowStep('Generating optimized blog content...');

      if (blogResult.success && blogResult.blogUrl) {
        // Success! Return the published blog URL
        onContentGenerated({
          ...blogResult,
          metadata: {
            ...blogResult.metadata,
            targetUrl,
            primaryKeyword,
            secondaryKeywords,
            contentType,
            wordCount: parseInt(wordCount),
            tone,
            customInstructions,
            testResult,
            workingProviders: testResult.workingProviders,
            recommendedProvider: testResult.recommendedProvider
          }
        });

        toast({
          title: "Blog Generated Successfully!",
          description: `Your blog post is now live at: ${blogResult.blogUrl}`,
        });
      } else {
        throw new Error(blogResult.error || 'Blog generation failed after successful provider validation');
      }

    } catch (error) {
      console.error('Content generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setTestingProviders(false);
      setTestWorkflowStep('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Target & Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                placeholder="https://example.com/target-page"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword</Label>
              <Input
                id="primaryKeyword"
                placeholder="e.g., best SEO practices"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Secondary Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add secondary keyword"
                  value={newSecondaryKeyword}
                  onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSecondaryKeyword()}
                />
                <Button type="button" onClick={addSecondaryKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {secondaryKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSecondaryKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="how-to">How-To Guide</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="news">News Article</SelectItem>
                  <SelectItem value="opinion">Opinion Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Word Count</Label>
              <Select value={wordCount} onValueChange={setWordCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="800">800 words</SelectItem>
                  <SelectItem value="1200">1,200 words</SelectItem>
                  <SelectItem value="1500">1,500 words</SelectItem>
                  <SelectItem value="2000">2,000 words</SelectItem>
                  <SelectItem value="2500">2,500 words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Overlay Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Auto-Generated Content Prompt
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromptOverlayVisible(!promptOverlayVisible)}
            >
              {promptOverlayVisible ? 'Hide Prompt' : 'Show Prompt'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PromptOverlay
            websiteUrl={targetUrl}
            keyword={primaryKeyword}
            anchorText={secondaryKeywords[0]} // Use first secondary keyword as anchor text
            isVisible={promptOverlayVisible}
            onToggleVisibility={() => setPromptOverlayVisible(!promptOverlayVisible)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Additional Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any specific instructions for content generation (e.g., include statistics, mention specific tools, target audience details...)"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Button 
        onClick={generateContent} 
        disabled={isGenerating} 
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Content...
          </>
        ) : (
          'Generate SEO Blog Post'
        )}
      </Button>
    </div>
  );
}
