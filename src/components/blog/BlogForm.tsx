import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X, Link, Target, Hash } from 'lucide-react';

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
    
    try {
      // Simulate AI content generation with realistic structure
      const mockContent = await generateMockContent({
        targetUrl,
        primaryKeyword,
        secondaryKeywords,
        contentType,
        wordCount: parseInt(wordCount),
        tone,
        customInstructions
      });

      onContentGenerated(mockContent);
      
      toast({
        title: "Content Generated Successfully",
        description: `Generated ${wordCount}-word blog post about "${primaryKeyword}"`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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

// Mock content generation function (replace with actual AI API integration)
async function generateMockContent(params: any) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    title: `The Complete Guide to ${params.primaryKeyword}`,
    slug: params.primaryKeyword.toLowerCase().replace(/\s+/g, '-'),
    metaDescription: `Learn everything about ${params.primaryKeyword}. This comprehensive guide covers best practices, tips, and strategies for success.`,
    content: generateMockHtmlContent(params),
    targetUrl: params.targetUrl,
    keywords: [params.primaryKeyword, ...params.secondaryKeywords],
    wordCount: params.wordCount,
    createdAt: new Date().toISOString(),
    status: 'draft'
  };
}

function generateMockHtmlContent(params: any): string {
  const { primaryKeyword, secondaryKeywords, contentType, tone } = params;
  
  return `
    <h1>The Complete Guide to ${primaryKeyword}</h1>
    
    <p class="lead">In today's digital landscape, understanding <strong>${primaryKeyword}</strong> is crucial for success. This comprehensive guide will walk you through everything you need to know.</p>
    
    <h2>What is ${primaryKeyword}?</h2>
    <p>Before diving deep into the strategies and best practices, it's important to understand what <em>${primaryKeyword}</em> actually means and why it matters for your business.</p>
    
    <h2>Key Benefits of ${primaryKeyword}</h2>
    <ul>
      <li><strong>Improved Performance:</strong> Implementing proper ${primaryKeyword} strategies can significantly boost your results.</li>
      <li><strong>Cost Efficiency:</strong> When done correctly, ${primaryKeyword} provides excellent ROI.</li>
      <li><strong>Competitive Advantage:</strong> Stay ahead of competitors with advanced ${primaryKeyword} techniques.</li>
    </ul>
    
    <h2>Best Practices for ${primaryKeyword}</h2>
    <p>Here are the most effective strategies for implementing <strong>${primaryKeyword}</strong> in your workflow:</p>
    
    <h3>1. Strategic Planning</h3>
    <p>Start with a comprehensive plan that includes <em>${secondaryKeywords[0] || 'key considerations'}</em> and long-term objectives.</p>
    
    <h3>2. Implementation Steps</h3>
    <p>Follow these proven steps to ensure successful implementation of your ${primaryKeyword} strategy.</p>
    
    <h2>Common Mistakes to Avoid</h2>
    <p>Learn from these common pitfalls when working with <strong>${primaryKeyword}</strong>:</p>
    <blockquote>
      <p>"The biggest mistake is rushing the process without proper planning. Take time to understand ${primaryKeyword} thoroughly before implementation."</p>
    </blockquote>
    
    <h2>Advanced Techniques</h2>
    <p>For those ready to take their ${primaryKeyword} efforts to the next level, consider these advanced strategies that incorporate <em>${secondaryKeywords[1] || 'innovative approaches'}</em>.</p>
    
    <h2>Measuring Success</h2>
    <p>Track these key metrics to ensure your ${primaryKeyword} implementation is delivering results:</p>
    <ol>
      <li>Performance indicators</li>
      <li>ROI measurements</li>
      <li>User engagement metrics</li>
    </ol>
    
    <h2>Conclusion</h2>
    <p>Mastering <strong>${primaryKeyword}</strong> is essential for modern digital success. By following the strategies outlined in this guide, you'll be well-equipped to implement effective solutions.</p>
    
    <p>Ready to get started? <a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer"><u>Visit our comprehensive resource</u></a> for additional tools and support.</p>
  `;
}
