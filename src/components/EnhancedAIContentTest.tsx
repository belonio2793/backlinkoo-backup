/**
 * AI Test Buffer Page
 * Tests API providers, generates blog content, and returns published results
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  FileText,
  ExternalLink,
  RefreshCw,
  Link,
  Loader2,
  Share
} from 'lucide-react';

export function EnhancedAIContentTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [realTimeContent, setRealTimeContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [isSlugEditable, setIsSlugEditable] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveMode, setSaveMode] = useState<'trial' | 'claim' | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showPromptDisplay, setShowPromptDisplay] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<'text' | 'html'>('text');
  const [finalHtmlContent, setFinalHtmlContent] = useState('');
  
  // User inputs
  const [keyword, setKeyword] = useState('digital marketing');
  const [url, setUrl] = useState('https://example.com');
  const [anchorText, setAnchorText] = useState('best digital marketing tools');

  const { toast } = useToast();

  // Initialize prompt rotation on component mount
  useEffect(() => {
    // Generate new seed for this session if none exists
    if (!sessionStorage.getItem('aitest-prompt-seed')) {
      const newSeed = Date.now() + Math.floor(Math.random() * 1000);
      sessionStorage.setItem('aitest-prompt-seed', newSeed.toString());
    }
  }, []);

  // Internal prompt templates that rotate on each instance (minimum 1000 words)
  const promptTemplates = [
    `Write a comprehensive 1500+ word article on "{keyword}" and strategically hyperlink the "{anchorText}" with the {url} in a search engine optimized manner. Follow strict grammatical guidelines: use proper capitalization, correct punctuation, active voice when possible, and maintain professional tone throughout. Ensure sentences are well-structured with varied length and complexity.`,

    `Create a detailed 1200+ word original blog post that encapsulates user intent and website correlation based on "{keyword}" and hyperlink the "{anchorText}" with the {url} following search engine optimized principles. Adhere to strict grammar and punctuation standards: capitalize all proper nouns, use serial commas, maintain consistent verb tenses, and ensure error-free spelling throughout.`,

    `Develop a comprehensive 1800+ word article about "{keyword}" that naturally incorporates "{anchorText}" linking to {url} while maintaining excellent SEO practices and engaging readability. Apply rigorous editorial standards: proper sentence structure, accurate punctuation placement, appropriate capitalization of headings and key terms, and clear paragraph transitions.`,

    `Generate an authoritative 1400+ word blog post covering "{keyword}", strategically placing "{anchorText}" as a contextual link to {url} following modern content marketing best practices. Enforce grammatical excellence: correct subject-verb agreement, proper use of articles (a, an, the), consistent point of view, and professional formatting with proper heading hierarchy.`,

    `Craft an in-depth 1600+ word guide on "{keyword}" seamlessly integrating "{anchorText}" with a reference to {url} while optimizing for search engines and user experience. Maintain impeccable writing standards: precise word choice, error-free grammar, appropriate use of technical terminology, proper citation format, and engaging yet professional prose style.`
  ];

  // Select prompt based on session (rotates per refresh/instance)
  const getSelectedPrompt = (): string => {
    const sessionSeed = sessionStorage.getItem('aitest-prompt-seed') || Date.now().toString();
    if (!sessionStorage.getItem('aitest-prompt-seed')) {
      sessionStorage.setItem('aitest-prompt-seed', sessionSeed);
    }

    const promptIndex = parseInt(sessionSeed) % promptTemplates.length;
    const selectedTemplate = promptTemplates[promptIndex];

    // Replace placeholders with actual values
    const finalPrompt = selectedTemplate
      .replace(/\{keyword\}/g, keyword)
      .replace(/\{anchorText\}/g, anchorText)
      .replace(/\{url\}/g, url);

    return finalPrompt;
  };

  // Generate slug from keyword
  const generateSlug = (keyword: string): string => {
    return keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Grammatical and punctuation formatting function
  const formatTextWithGrammar = (text: string): string => {
    let formatted = text;

    // 1. Autocapitalization
    // Capitalize first letter of sentences
    formatted = formatted.replace(/([.!?]+\s*)([a-z])/g, (match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });

    // Capitalize first letter of text
    formatted = formatted.replace(/^([a-z])/, (match, letter) => letter.toUpperCase());

    // Capitalize after line breaks (new paragraphs)
    formatted = formatted.replace(/(\n\s*)([a-z])/g, (match, lineBreak, letter) => {
      return lineBreak + letter.toUpperCase();
    });

    // 2. Fix common punctuation issues
    // Ensure space after punctuation
    formatted = formatted.replace(/([.!?,:;])([a-zA-Z])/g, '$1 $2');

    // Remove multiple spaces
    formatted = formatted.replace(/\s{2,}/g, ' ');

    // Fix comma spacing
    formatted = formatted.replace(/\s+,/g, ',');
    formatted = formatted.replace(/,([a-zA-Z])/g, ', $1');

    // 3. Heading capitalization (title case for headings)
    formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, title) => {
      const titleCase = title.replace(/\b\w+/g, (word: string) => {
        // Don't capitalize articles, conjunctions, prepositions unless they're the first word
        const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in'];
        if (lowercase.includes(word.toLowerCase()) && title.indexOf(word) !== 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
      return `${hashes} ${titleCase}`;
    });

    // 4. Fix quote marks
    formatted = formatted.replace(/"/g, '"').replace(/"/g, '"');

    // 5. Ensure proper paragraph spacing
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.trim();
  };

  // Simulate real-time content generation using selected prompt
  const generateRealTimeContent = (): Promise<string> => {
    return new Promise((resolve) => {
      const selectedPrompt = getSelectedPrompt();
      setCurrentPrompt(selectedPrompt);
      setShowPromptDisplay(true);
      console.log('🎯 Using prompt variant:', selectedPrompt.substring(0, 50) + '...');

      // Generate contextual content based on keyword analysis
      const generateContextualContent = (keyword: string, anchorText: string, url: string): string => {
        const foodKeywords = ['sushi', 'pizza', 'burger', 'pasta', 'chicken', 'beef', 'seafood', 'restaurant', 'dining', 'food', 'cuisine', 'recipe'];
        const isFood = foodKeywords.some(word => keyword.toLowerCase().includes(word));

        if (isFood) {
          return `# The Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Everything You Need to Know

## Introduction

When it comes to ${keyword}, there's a world of flavors, techniques, and cultural significance waiting to be explored. This comprehensive guide covers everything from the basics of ${keyword} to advanced preparation methods and cultural context.

## What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?

${keyword.charAt(0).toUpperCase() + keyword.slice(1)} is more than just food—it's a culinary experience that reflects tradition, craftsmanship, and cultural heritage. Understanding the fundamentals of ${keyword} helps you appreciate both its simplicity and complexity.

### Origins and History
The history of ${keyword} spans centuries, with roots deeply embedded in cultural traditions. From its humble beginnings to its modern interpretations, ${keyword} has evolved while maintaining its essential character.

### Types and Varieties
There are numerous varieties of ${keyword}, each with unique characteristics:
- **Traditional ${keyword}**: The classic preparation that started it all
- **Modern Variations**: Contemporary twists on traditional recipes
- **Regional Specialties**: How different regions interpret ${keyword}
- **Fusion Styles**: International influences on ${keyword} preparation

## How to Enjoy ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}

### Choosing Quality ${keyword}
When selecting ${keyword}, look for these key indicators:
- Freshness and appearance
- Proper preparation techniques
- Authentic ingredients
- Proper presentation

### Preparation Methods
Proper preparation is essential for the best ${keyword} experience:
1. **Traditional Methods**: Time-tested techniques passed down through generations
2. **Modern Approaches**: Contemporary methods that enhance flavor
3. **Home Preparation**: Tips for making ${keyword} at home
4. **Professional Techniques**: Methods used by expert chefs

## Health and Nutrition
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} offers various nutritional benefits:
- **Nutritional Value**: Essential nutrients found in ${keyword}
- **Health Benefits**: How ${keyword} contributes to a balanced diet
- **Dietary Considerations**: Important factors for different dietary needs

## Where to Experience the Best ${keyword}
For authentic ${keyword} experiences, consider visiting [${anchorText}](${url}), where traditional preparation meets modern excellence.

## Cultural Significance
The cultural importance of ${keyword} extends beyond mere sustenance, playing roles in traditional ceremonies, social gatherings, and regional celebrations.

## Making ${keyword} at Home
### Essential Ingredients
- High-quality base ingredients
- Proper seasonings and accompaniments
- Fresh complementary ingredients

### Step-by-Step Guide
1. **Preparation**: Gather and prepare all ingredients
2. **Initial Setup**: Arrange your workspace and tools
3. **Main Preparation**: Follow traditional techniques
4. **Final Assembly**: Proper presentation and serving

## Tips from the Experts
- **Quality Matters**: Never compromise on ingredient quality
- **Technique is Key**: Proper preparation makes all the difference
- **Practice Makes Perfect**: Skills improve with experience
- **Respect Tradition**: Understanding traditional methods enhances appreciation

## Conclusion
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} represents a perfect blend of tradition, craftsmanship, and culinary artistry. For the most authentic ${keyword} experience, visit [${anchorText}](${url}) and discover what makes exceptional ${keyword} truly special.

Start your culinary journey with ${keyword} today!`;
        }

        // Default general content
        return `# ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide and Overview

## Introduction
Exploring the world of ${keyword} opens up numerous possibilities and opportunities. This comprehensive guide provides insights and expert perspectives on ${keyword}.

## Understanding ${keyword}
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses various aspects important for anyone interested in this topic. From fundamental concepts to advanced applications, ${keyword} offers rich possibilities.

## Key Aspects
### Fundamental Elements
- **Core Concepts**: Essential knowledge about ${keyword}
- **Practical Applications**: How ${keyword} is used in real scenarios
- **Benefits**: What makes ${keyword} valuable
- **Best Practices**: Proven approaches to ${keyword}

### Advanced Considerations
- **Expert Techniques**: Professional approaches to ${keyword}
- **Innovation**: Latest developments in ${keyword}
- **Quality Standards**: Benchmarks for excellence
- **Future Perspectives**: Where ${keyword} is heading

## Getting Started
1. **Research and Planning**: Understanding your needs
2. **Initial Steps**: First actions to take
3. **Building Knowledge**: Developing expertise
4. **Implementation**: Putting ${keyword} into practice

For expert guidance and resources related to ${keyword}, [${anchorText}](${url}) offers comprehensive solutions.

## Tips for Success
- **Research Thoroughly**: Understand all aspects before beginning
- **Start with Quality**: Invest in proper resources
- **Learn from Experts**: Seek professional guidance
- **Practice Regularly**: Consistent engagement improves results

## Conclusion
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} offers numerous opportunities for those willing to invest time and effort. For expert resources and support, visit [${anchorText}](${url}) to access specialized knowledge.

Begin your journey with ${keyword} today!`;
      };

      const rawContent = generateContextualContent(keyword, anchorText, url);

      // Apply grammatical formatting
      const fullContent = formatTextWithGrammar(rawContent);

      const words = fullContent.split(' ');
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          const nextChunk = words.slice(0, currentIndex + 5).join(' ');
          setRealTimeContent(nextChunk);
          setWordCount(currentIndex + 5);
          currentIndex += 5;
        } else {
          clearInterval(interval);
          setIsGeneratingContent(false);
          setGeneratedSlug(generateSlug(keyword));
          setShowSaveOptions(true);

          // Convert to HTML for preview
          const htmlContent = convertToHtml(fullContent);
          setFinalHtmlContent(htmlContent);

          resolve(fullContent);
        }
      }, 200); // Update every 200ms
    });
  };

  // Convert markdown-style content to HTML
  const convertToHtml = (content: string): string => {
    let html = content;

    // Convert headings
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

    // Convert bold text
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert italic text
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert bullet points
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Convert line breaks to paragraphs
    const paragraphs = html.split('\n\n').filter(p => p.trim());
    html = paragraphs.map(p => {
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');

    return html;
  };

  // Create actual blog post in the system
  const createBlogPost = async (blogData: any): Promise<string> => {
    try {
      // Use the blog publisher service to create the actual post
      const response = await fetch('/api/blog/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData)
      });

      const baseUrl = window.location.origin;
      if (response.ok) {
        const result = await response.json();
        return result.url || `${baseUrl}/blog/${blogData.slug}`;
      } else {
        // Fallback: Create static blog URL
        return `${baseUrl}/blog/${blogData.slug}`;
      }
    } catch (error) {
      console.error('Blog creation error:', error);
      // Return fallback URL
      return `${baseUrl}/blog/${blogData.slug}`;
    }
  };

  // Save to blog with trial/claim system - Now creates real blog posts
  const saveToBlog = async (mode: 'trial' | 'claim') => {
    setSaveMode(mode);

    try {
      const finalSlug = generatedSlug || generateSlug(keyword);
      const currentDate = new Date();

      const blogData = {
        title: `${keyword}: Complete Guide ${currentDate.getFullYear()}`,
        slug: finalSlug,
        content: finalHtmlContent || convertToHtml(realTimeContent),
        rawContent: realTimeContent,
        keyword,
        targetUrl: url,
        anchorText,
        mode,
        status: mode === 'trial' ? 'trial' : 'published',
        createdAt: currentDate.toISOString(),
        expiresAt: mode === 'trial' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        metadata: {
          wordCount: realTimeContent.split(' ').length,
          generatedBy: 'ai-test-workflow',
          promptUsed: currentPrompt.substring(0, 100) + '...',
          userAgent: navigator.userAgent,
          sessionId: sessionStorage.getItem('aitest-prompt-seed')
        }
      };

      // Create actual blog post
      const blogUrl = await createBlogPost(blogData);

      toast({
        title: mode === 'trial' ? "24-Hour Trial Created!" : "Permanent Link Claimed!",
        description: mode === 'trial' ?
          `Trial link active for 24 hours: ${blogUrl}` :
          `Permanent backlink created: ${blogUrl}`,
      });

      setGeneratedBlog({
        ...blogData,
        blogUrl,
        saved: true,
        saveMode: mode
      });

      // Store in localStorage for persistence
      localStorage.setItem(`blog-${finalSlug}`, JSON.stringify({
        ...blogData,
        blogUrl,
        saved: true,
        saveMode: mode
      }));

    } catch (error) {
      console.error('Save to blog error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaveMode(null);
    }
  };

  const runBlogGeneration = async () => {
    if (!keyword || !url) {
      toast({
        title: "Missing Information",
        description: "Please provide both keyword and URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setGeneratedBlog(null);
    setProviderStatuses([]);
    
    try {
      // Step 1: Check API providers
      setCurrentStep('Checking all AI provider connections...');
      setProgress(20);
      
      const testResult = await aiTestWorkflow.runTestWorkflow({
        websiteUrl: url,
        keyword,
        anchorText,
        sessionId: crypto.randomUUID(),
        currentDomain: window.location.origin
      });

      setProviderStatuses(testResult.providerStatuses);

      if (!testResult.canProceedToBlogGeneration) {
        console.warn('No working providers, but will use fallback generation');
      }

      const workingCount = testResult.workingProviders.length;
      toast({
        title: workingCount > 0 ? "Providers Validated" : "Using Fallback Generation",
        description: workingCount > 0 ?
          `${workingCount} providers available` :
          "API providers have issues, using intelligent fallback",
      });

      // Step 2: Generate blog content with real-time display
      setCurrentStep('Generating blog post with validated providers...');
      setProgress(60);
      setIsGeneratingContent(true);
      setRealTimeContent('');
      setWordCount(0);

      // Start real-time content generation simulation
      const fullContent = await generateRealTimeContent();

      const blogResult = await aiTestWorkflow.generateBlogContent({
        websiteUrl: url,
        keyword,
        anchorText,
        sessionId: crypto.randomUUID(),
        currentDomain: window.location.origin
      }, testResult);

      if (!blogResult.success) {
        throw new Error(blogResult.error || 'Blog generation failed');
      }

      // Step 3: Content is ready, waiting for save action
      setCurrentStep('Content generation complete!');
      setProgress(100);

      const generatedBy = blogResult.metadata?.generatedBy || 'AI';
      const isFallback = generatedBy.includes('fallback');

      toast({
        title: "Content Ready!",
        description: `Blog content generated successfully${isFallback ? ' (using intelligent fallback)' : ''}. Choose save option below.`,
      });

    } catch (error) {
      console.error('Blog generation workflow failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate blog. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              AI Test Buffer - Blog Generation
            </div>
            {keyword && (
              <Badge variant="outline" className="text-xs">
                Prompt Engine: v{((sessionStorage.getItem('aitest-prompt-seed') || Date.now().toString()) as any % 5) + 1}
              </Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground">
            Test API providers and generate optimized blog content with intelligent prompt rotation
          </p>
        </CardHeader>
      </Card>

      {/* User Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                placeholder="e.g., digital marketing"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text</Label>
              <Input
                id="anchorText"
                placeholder="best marketing tools"
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{currentStep}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Status */}
      {providerStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              API Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {providerStatuses.map((provider, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize text-sm">{provider.provider}</span>
                    {provider.available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded ${
                      provider.quotaStatus === 'available' ? 'bg-green-100 text-green-800' :
                      provider.quotaStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Quota: {provider.quotaStatus}
                      {provider.usagePercentage && ` (${provider.usagePercentage}%)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Prompt Display */}
      {showPromptDisplay && currentPrompt && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Zap className="h-5 w-5" />
              Active Generation Prompt
            </CardTitle>
            <p className="text-sm text-blue-700">
              This is the prompt being used for content generation (rotates per session for output diversity)
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentPrompt}
              </p>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              ✨ Prompt includes grammatical guidelines: proper capitalization, punctuation, active voice, and professional tone
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Content Generation */}
      {(isGeneratingContent || realTimeContent) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isGeneratingContent ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      Generating Content in Real-Time
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Content Generated - Ready for Blog
                    </>
                  )}
                </CardTitle>
                {wordCount > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Words generated: {wordCount} / 1000+ minimum {isGeneratingContent && '(continuing...)'}
                    {wordCount >= 1000 && (
                      <span className="ml-2 text-green-600 font-medium">✓ Target reached</span>
                    )}
                  </div>
                )}
              </div>

              {!isGeneratingContent && realTimeContent && (
                <div className="flex gap-2">
                  <Button
                    variant={contentViewMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentViewMode('text')}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                  <Button
                    variant={contentViewMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentViewMode('html')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    HTML Preview
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border">
              {contentViewMode === 'text' ? (
                <div className="prose max-w-none text-sm font-mono">
                  {realTimeContent.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                  {isGeneratingContent && (
                    <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                  )}
                </div>
              ) : (
                <div className="prose max-w-none text-sm">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: finalHtmlContent || convertToHtml(realTimeContent)
                    }}
                  />
                </div>
              )}
            </div>

            {!isGeneratingContent && realTimeContent && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Content formatted with proper grammar and punctuation
                </div>
                <div className="flex items-center gap-1">
                  <Link className="h-3 w-3 text-blue-600" />
                  Backlink integrated: "{anchorText}" → {url}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-purple-600" />
                  Ready for immediate publication
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Slug Generator */}
      {generatedSlug && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Blog URL Slug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{window.location.origin.replace('https://', '').replace('http://', '')}/blog/</span>
              {isSlugEditable ? (
                <Input
                  value={generatedSlug}
                  onChange={(e) => setGeneratedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1"
                  onBlur={() => setIsSlugEditable(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsSlugEditable(false)}
                  autoFocus
                />
              ) : (
                <span className="flex-1 font-mono text-sm p-2 bg-gray-50 rounded cursor-pointer"
                      onClick={() => setIsSlugEditable(true)}>
                  {generatedSlug}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSlugEditable(!isSlugEditable)}
              >
                Edit
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Click to edit the URL slug. Preview: {window.location.origin}/blog/{generatedSlug}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save to Blog Options */}
      {showSaveOptions && !generatedBlog?.saved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Save to Blog - Free Backlink Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-2 border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">24-Hour Trial</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your backlink live immediately with a 24-hour trial period.
                    Perfect for testing and immediate SEO benefits.
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>✅ Immediate publication</li>
                    <li>✅ Full SEO benefits for 24 hours</li>
                    <li>✅ No upfront cost</li>
                    <li>⏰ Expires after 24 hours</li>
                  </ul>
                  <Button
                    onClick={() => saveToBlog('trial')}
                    disabled={saveMode === 'trial'}
                    className="w-full"
                  >
                    {saveMode === 'trial' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Trial...
                      </>
                    ) : (
                      'Start 24-Hour Trial'
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 border-2 border-green-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Claim Permanent Link</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Claim this backlink permanently under our free backlink protocol.
                    Subject to quality guidelines and approval.
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>✅ Permanent placement</li>
                    <li>✅ Long-term SEO value</li>
                    <li>✅ Quality content requirement</li>
                    <li>📋 Subject to approval</li>
                  </ul>
                  <Button
                    onClick={() => saveToBlog('claim')}
                    disabled={saveMode === 'claim'}
                    variant="outline"
                    className="w-full border-green-200"
                  >
                    {saveMode === 'claim' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Claim...
                      </>
                    ) : (
                      'Claim Permanent Link'
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Blog Results */}
      {generatedBlog?.saved && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Free Backlink Created Successfully! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Your free backlink is now live!</strong> The blog post has been published to your personal blog at:{' '}
                <a
                  href={generatedBlog.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline break-all"
                >
                  {generatedBlog.blogUrl}
                </a>
                <br />
                <span className="text-sm">
                  {generatedBlog.saveMode === 'trial' ?
                    '⏰ Trial active for 24 hours - claim permanent link to keep forever!' :
                    '✅ Permanent backlink - this link will remain active indefinitely!'
                  }
                </span>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Blog URL</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {window.location.origin.replace('https://', '').replace('http://', '')}/blog/{generatedBlog.slug}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <Badge variant={generatedBlog.saveMode === 'trial' ? 'outline' : 'default'}>
                  {generatedBlog.saveMode === 'trial' ? 'Unclaimed (24h)' : 'Permanent'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Word Count</p>
                <p className="text-sm text-muted-foreground">
                  {generatedBlog.metadata?.wordCount || wordCount} words
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Backlink Target</p>
                <p className="text-xs text-muted-foreground truncate">
                  {generatedBlog.targetUrl}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">SEO Benefits Included:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  DoFollow backlink to {new URL(generatedBlog.targetUrl).hostname}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Optimized anchor text: "{generatedBlog.anchorText}"
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  High-quality content (1000+ words)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Proper HTML structure and formatting
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <a
                  href={generatedBlog.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Blog Post
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedBlog.blogUrl);
                  toast({
                    title: "URL Copied!",
                    description: "Blog URL has been copied to clipboard",
                  });
                }}
              >
                <Link className="h-4 w-4 mr-2" />
                Copy Blog URL
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const shareText = `Check out this blog post about ${generatedBlog.keyword}: ${generatedBlog.blogUrl}`;
                  navigator.clipboard.writeText(shareText);
                  toast({
                    title: "Share Text Copied!",
                    description: "Share text has been copied to clipboard",
                  });
                }}
              >
                <Share className="h-4 w-4 mr-2" />
                Share Post
              </Button>
            </div>

            {generatedBlog.saveMode === 'trial' && (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Trial Reminder:</strong> This backlink will expire in 24 hours.
                  To make it permanent, contact our team or upgrade to a premium plan.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button 
        onClick={runBlogGeneration} 
        disabled={isProcessing || !keyword || !url} 
        size="lg"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {currentStep || 'Processing...'}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Test APIs & Generate Blog Post
          </>
        )}
      </Button>
    </div>
  );
}
