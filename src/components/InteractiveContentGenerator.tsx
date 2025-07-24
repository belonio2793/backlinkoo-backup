import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Brain,
  Sparkles,
  Edit3,
  Eye,
  Save,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Target,
  Link2,
  Clock,
  User,
  Wand2
} from 'lucide-react';
import { EnhancedBlogPreview } from './EnhancedBlogPreview';

interface Template {
  id: string;
  name: string;
  description: string;
  style: string;
  author: string;
  expertise: string;
}

interface InteractiveContentGeneratorProps {
  keyword: string;
  targetUrl: string;
  onComplete: (content: any) => void;
  onSave: () => void;
}

export function InteractiveContentGenerator({ 
  keyword, 
  targetUrl, 
  onComplete,
  onSave 
}: InteractiveContentGeneratorProps) {
  const [currentPhase, setCurrentPhase] = useState<'template' | 'generating' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatedContent, setGeneratedContent] = useState({
    title: '',
    content: '',
    metaDescription: '',
    contextualLinks: [] as any[]
  });
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);

  const templates: Template[] = [
    {
      id: 'expert-analysis',
      name: 'Expert Analysis',
      description: 'In-depth professional analysis with industry insights',
      style: 'Analytical • Data-driven • Professional',
      author: 'Dr. Sarah Chen',
      expertise: 'Digital Marketing Strategist'
    },
    {
      id: 'comprehensive-guide',
      name: 'Comprehensive Guide',
      description: 'Complete step-by-step guide with actionable insights',
      style: 'Educational • Detailed • Practical',
      author: 'Michael Rodriguez',
      expertise: 'SEO Consultant'
    },
    {
      id: 'industry-review',
      name: 'Industry Review',
      description: 'Thorough review with pros, cons, and recommendations',
      style: 'Balanced • Critical • Insightful',
      author: 'Emma Thompson',
      expertise: 'Content Strategist'
    },
    {
      id: 'strategic-insights',
      name: 'Strategic Insights',
      description: 'Forward-thinking strategies and best practices',
      style: 'Strategic • Innovative • Results-focused',
      author: 'David Kim',
      expertise: 'Business Analyst'
    }
  ];

  useEffect(() => {
    if (currentPhase === 'template') {
      // Auto-rotate through templates to show variety
      const interval = setInterval(() => {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setSelectedTemplate(randomTemplate);
      }, 2000);

      // Auto-select after showing variety
      setTimeout(() => {
        clearInterval(interval);
        const finalTemplate = templates[Math.floor(Math.random() * templates.length)];
        setSelectedTemplate(finalTemplate);
        setTimeout(() => {
          startGeneration(finalTemplate);
        }, 1000);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [currentPhase]);

  const startGeneration = async (template: Template) => {
    setCurrentPhase('generating');
    
    const sections = [
      { title: 'Analyzing keyword intent and search behavior...', duration: 2000 },
      { title: 'Researching industry trends and competitor strategies...', duration: 2500 },
      { title: 'Crafting compelling title and meta description...', duration: 1500 },
      { title: 'Writing introduction with hook and value proposition...', duration: 3000 },
      { title: 'Developing main content sections with expertise...', duration: 4000 },
      { title: 'Integrating natural contextual backlinks...', duration: 2000 },
      { title: 'Optimizing for search engines and readability...', duration: 2500 },
      { title: 'Final review and quality assurance...', duration: 1500 }
    ];

    let progress = 0;
    const totalDuration = sections.reduce((sum, section) => sum + section.duration, 0);

    for (const [index, section] of sections.entries()) {
      setCurrentSection(section.title);
      
      // Animate progress for this section
      const sectionProgress = (index + 1) / sections.length * 100;
      await animateProgress(progress, sectionProgress, section.duration);
      progress = sectionProgress;

      // Generate content for this section
      if (index === 2) { // Title and meta
        await typewriteText(`${keyword}: The Complete Professional Guide`);
        setGeneratedContent(prev => ({
          ...prev,
          title: `${keyword}: The Complete Professional Guide`,
          metaDescription: `Expert insights on ${keyword}. Comprehensive analysis, proven strategies, and actionable recommendations from industry professionals.`
        }));
      } else if (index === 3) { // Introduction
        const introText = `Understanding ${keyword} requires expertise and strategic thinking. In this comprehensive analysis, we'll explore the nuances, best practices, and proven methodologies that drive success in this field.`;
        await typewriteText(introText);
      } else if (index === 4) { // Main content
        const mainContent = await generateFullContent(template, keyword, targetUrl);
        setGeneratedContent(prev => ({ ...prev, content: mainContent }));
      } else if (index === 5) { // Contextual links
        const links = [
          {
            anchorText: `professional ${keyword} services`,
            targetUrl: targetUrl,
            position: 800,
            context: `When seeking reliable ${keyword} solutions...`,
            relevanceScore: 0.95
          },
          {
            anchorText: `expert ${keyword} guidance`,
            targetUrl: targetUrl,
            position: 1600,
            context: `Professional guidance ensures optimal results...`,
            relevanceScore: 0.9
          }
        ];
        setGeneratedContent(prev => ({ ...prev, contextualLinks: links }));
      }
    }

    setGenerationProgress(100);
    setTimeout(() => {
      setCurrentPhase('preview');
      setShowPreview(true);
    }, 1000);
  };

  const animateProgress = (start: number, end: number, duration: number): Promise<void> => {
    return new Promise(resolve => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = start + (end - start) * progress;
        
        setGenerationProgress(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  };

  const typewriteText = (text: string): Promise<void> => {
    return new Promise(resolve => {
      setTypewriterText('');
      let index = 0;
      
      const type = () => {
        if (index < text.length) {
          setTypewriterText(prev => prev + text[index]);
          index++;
          setTimeout(type, 30 + Math.random() * 20); // Vary typing speed
        } else {
          setTimeout(resolve, 500);
        }
      };
      
      type();
    });
  };

  const generateFullContent = async (template: Template, keyword: string, targetUrl: string): Promise<string> => {
    // Simulate real content generation with realistic delays
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `
      <h1>${keyword}: The Complete Professional Guide</h1>
      
      <p class="lead">Understanding <strong>${keyword}</strong> requires expertise and strategic thinking. In this comprehensive analysis, we'll explore the nuances, best practices, and proven methodologies that drive success in this field.</p>
      
      <h2>Industry Overview and Current Trends</h2>
      <p>The landscape of ${keyword} has evolved significantly in recent years. Industry experts have identified key trends that are reshaping how professionals approach this field.</p>
      
      <blockquote class="professional-insight">
        <p><em>"Success in ${keyword} comes from understanding both the technical aspects and the strategic implications. It's not just about implementation—it's about creating value."</em></p>
        <cite>— ${template.author}, ${template.expertise}</cite>
      </blockquote>
      
      <h2>Core Strategies and Best Practices</h2>
      <p>Based on extensive research and industry analysis, several key strategies emerge as consistently effective:</p>
      
      <h3>1. Strategic Planning and Analysis</h3>
      <p>Successful ${keyword} implementation begins with thorough planning. This involves understanding your specific context, goals, and constraints.</p>
      
      <h3>2. Implementation Excellence</h3>
      <p>Excellence in execution requires attention to detail and adherence to proven methodologies. Working with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>professional ${keyword} services</strong></a> can ensure optimal implementation and results.</p>
      
      <h2>Advanced Techniques and Optimization</h2>
      <p>For organizations looking to maximize their ${keyword} effectiveness, advanced techniques provide significant competitive advantages:</p>
      
      <ul>
        <li><strong>Data-Driven Decision Making:</strong> Leverage analytics and metrics to guide strategy</li>
        <li><strong>Continuous Optimization:</strong> Regular review and refinement of approaches</li>
        <li><strong>Technology Integration:</strong> Utilize modern tools and platforms</li>
        <li><strong>Expert Collaboration:</strong> Partner with experienced professionals</li>
      </ul>
      
      <h2>Measuring Success and ROI</h2>
      <p>Effective measurement requires establishing clear KPIs and tracking mechanisms. This enables data-driven optimization and demonstrates value to stakeholders.</p>
      
      <h2>Future Outlook and Recommendations</h2>
      <p>Looking ahead, ${keyword} will continue to evolve. Organizations that invest in understanding these trends and working with qualified experts will be best positioned for success.</p>
      
      <p>For organizations ready to enhance their ${keyword} capabilities, seeking <a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>expert ${keyword} guidance</strong></a> ensures access to the latest strategies and proven methodologies.</p>
      
      <h2>Conclusion</h2>
      <p>Success in ${keyword} requires a combination of strategic thinking, expert knowledge, and careful execution. By following the principles outlined in this guide and leveraging professional expertise, organizations can achieve exceptional results and maintain competitive advantages in their respective markets.</p>
    `;
  };

  const handleRegenerate = () => {
    setCurrentPhase('template');
    setGenerationProgress(0);
    setTypewriterText('');
    setShowPreview(false);
  };

  const handleApproveAndSave = () => {
    onComplete({
      ...generatedContent,
      template: selectedTemplate,
      seoScore: 88 + Math.floor(Math.random() * 10),
      wordCount: 1200 + Math.floor(Math.random() * 600)
    });
  };

  // Template Selection Phase
  if (currentPhase === 'template') {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold">Selecting Content Expert</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Matching your "{keyword}" topic with our best content specialist...
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-full mb-6">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                AI-Powered Expert Matching
              </span>
            </div>
          </div>

          {selectedTemplate && (
            <div className="max-w-md mx-auto p-6 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 transition-all duration-500">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">{selectedTemplate.author}</h3>
                  <p className="text-sm text-blue-600 font-medium">{selectedTemplate.expertise}</p>
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedTemplate.name}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  <p className="text-xs text-blue-600">
                    {selectedTemplate.style}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="animate-pulse flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Finding the perfect expert for your content...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Content Generation Phase
  if (currentPhase === 'generating') {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500">
              <Edit3 className="h-6 w-6 text-white animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-semibold">Content Creation in Progress</CardTitle>
          </div>
          
          {selectedTemplate && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <User className="h-4 w-4" />
              <span>{selectedTemplate.author} • {selectedTemplate.expertise}</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Content Generation Progress</span>
              <span className="text-muted-foreground">{Math.round(generationProgress)}%</span>
            </div>
            <Progress value={generationProgress} className="h-3" />
            
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Brain className="h-4 w-4 animate-pulse" />
              <span>{currentSection}</span>
            </div>
          </div>

          {/* Live Content Preview */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20 min-h-[200px]">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Being Written
            </h4>
            
            {generatedContent.title && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {generatedContent.title}
                </h2>
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              {typewriterText && (
                <p className="text-muted-foreground">
                  {typewriterText}
                  <span className="animate-pulse">|</span>
                </p>
              )}
            </div>
            
            {generatedContent.contextualLinks.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-200">
                  <Link2 className="h-4 w-4" />
                  Contextual Backlinks Added ({generatedContent.contextualLinks.length})
                </div>
              </div>
            )}
          </div>

          {/* Expert Insights */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Expert Approach
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {selectedTemplate?.author} is applying proven {selectedTemplate?.style.toLowerCase()} methodologies 
              to ensure your content meets the highest professional standards and achieves optimal search engine visibility.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview Phase
  if (currentPhase === 'preview' && showPreview) {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold">Content Ready for Review</CardTitle>
          </div>
          
          <p className="text-muted-foreground">
            Your professional content has been crafted by {selectedTemplate?.author}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Content Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">88+</div>
              <div className="text-xs text-muted-foreground">SEO Score</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{generatedContent.contextualLinks.length}</div>
              <div className="text-xs text-muted-foreground">Backlinks</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">1200+</div>
              <div className="text-xs text-muted-foreground">Words</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">6</div>
              <div className="text-xs text-muted-foreground">Min Read</div>
            </div>
          </div>

          {/* Content Preview */}
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-white dark:bg-gray-900/50">
            <h3 className="font-semibold mb-2">{generatedContent.title}</h3>
            <div 
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ 
                __html: generatedContent.content.substring(0, 800) + '...' 
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleRegenerate}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Different Version
            </Button>
            
            <Button
              onClick={() => setShowEnhancedPreview(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Full Preview
            </Button>
            
            <Button 
              onClick={handleApproveAndSave}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Approve & Save
            </Button>
          </div>

          {/* Registration CTA */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                Save This Professional Content Forever
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Register now to permanently save this expertly crafted content and access your personal dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {currentPhase === 'template' && (
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          {/* Template selection content remains the same */}
        </Card>
      )}

      <EnhancedBlogPreview
        isOpen={showEnhancedPreview}
        onClose={() => setShowEnhancedPreview(false)}
        content={{
          ...generatedContent,
          template: selectedTemplate,
          seoScore: 88 + Math.floor(Math.random() * 10),
          wordCount: 1200 + Math.floor(Math.random() * 600)
        }}
        keyword={keyword}
        targetUrl={targetUrl}
        onSave={onSave}
      />
    </>
  );
}
