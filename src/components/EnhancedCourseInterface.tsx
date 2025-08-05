import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Lock,
  Star,
  Clock,
  Users,
  TrendingUp,
  Target,
  Search,
  Link,
  BarChart3,
  Lightbulb,
  Award,
  ChevronRight,
  ChevronLeft,
  Download,
  MessageSquare,
  Eye,
  FileText,
  Video,
  ArrowRight,
  ArrowLeft,
  X,
  Menu,
  Home,
  BookmarkCheck,
  Zap
} from 'lucide-react';

interface CourseLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
  content?: string;
  resources?: string[];
  quiz?: {
    questions: number;
    passingScore: number;
  };
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  lessons: CourseLesson[];
  estimatedTime: string;
  totalLessons: number;
  completedLessons: number;
  locked: boolean;
}

interface EnhancedCourseInterfaceProps {
  isPremium?: boolean;
  onUpgrade?: () => void;
}

// Simple markdown to HTML converter
const formatMarkdownContent = (content: string): string => {
  // Helper function to process inline markdown in text
  const processInlineMarkdown = (text: string): string => {
    return text
      // Bold text **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Italic text *text*
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
      // Inline code `code`
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');
  };

  const lines = content.split('\n');
  const formattedLines = lines.map(line => {
    // Headers (process inline formatting in headers too)
    if (line.startsWith('### ')) {
      return `<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">${processInlineMarkdown(line.substring(4))}</h3>`;
    }
    if (line.startsWith('## ')) {
      return `<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-800">${processInlineMarkdown(line.substring(3))}</h2>`;
    }
    if (line.startsWith('# ')) {
      return `<h1 class="text-2xl font-bold mt-8 mb-6 text-gray-900">${processInlineMarkdown(line.substring(2))}</h1>`;
    }
    // List items (process inline formatting in list items)
    if (line.startsWith('- ')) {
      return `<div class="ml-4 mb-2">• ${processInlineMarkdown(line.substring(2))}</div>`;
    }
    // Numbered lists (process inline formatting in numbered lists)
    if (/^\d+\./.test(line)) {
      return `<div class="ml-4 mb-2">${processInlineMarkdown(line)}</div>`;
    }
    // Empty lines
    if (line.trim() === '') {
      return '<div class="mb-4"></div>';
    }
    // Regular paragraphs (process inline formatting)
    return `<p class="mb-4">${processInlineMarkdown(line)}</p>`;
  });

  return formattedLines.join('');
};

export function EnhancedCourseInterface({ isPremium = false, onUpgrade }: EnhancedCourseInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [activeModule, setActiveModule] = useState<string>('');
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [userProgress, setUserProgress] = useState<{ [key: string]: boolean }>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courseView, setCourseView] = useState<'overview' | 'lesson'>('overview');

  // Course data with comprehensive content
  const courseModules: CourseModule[] = [
    {
      id: 'fundamentals',
      title: 'SEO Fundamentals',
      description: 'Master the essential concepts of search engine optimization',
      icon: <Search className="h-6 w-6" />,
      estimatedTime: '8 hours',
      totalLessons: 6,
      completedLessons: 2,
      locked: false,
      lessons: [
        {
          id: 'seo-intro',
          title: 'What is SEO and Why It Matters',
          description: 'Understanding search engines and organic traffic fundamentals',
          duration: '15 min',
          difficulty: 'Beginner',
          completed: true,
          locked: false,
          content: `# What is SEO and Why It Matters

## Introduction
Search Engine Optimization (SEO) is the practice of increasing the quantity and quality of traffic to your website through organic search engine results.

## Key Concepts
- **Organic Traffic**: Visitors who find your website through unpaid search results
- **Search Engines**: Google and other platforms that index web content
- **Rankings**: Position of your pages in search engine results pages (SERPs)

## Why SEO Matters
1. **Cost-effective**: Unlike paid advertising, organic traffic is free
2. **Long-term results**: Good SEO can provide sustained traffic for years
3. **Credibility**: Higher rankings often translate to increased trust
4. **Better user experience**: SEO best practices improve site usability

## Getting Started
- Understand your audience and their search behavior
- Research relevant keywords for your business
- Create high-quality, valuable content
- Optimize your website's technical foundation`,
          resources: ['SEO Glossary PDF', 'Search Engine Guide', 'Beginner Checklist'],
          quiz: { questions: 5, passingScore: 80 }
        },
        {
          id: 'search-engines',
          title: 'How Search Engines Work',
          description: 'Deep dive into crawling, indexing, and ranking processes',
          duration: '22 min',
          difficulty: 'Beginner',
          completed: true,
          locked: false,
          content: `# How Search Engines Work

## The Three-Step Process

### 1. Crawling
Search engines use automated programs called "crawlers" or "spiders" to discover and visit web pages.

### 2. Indexing
After crawling, search engines analyze and store information about web pages in their index.

### 3. Ranking
When users search, engines determine which pages are most relevant and useful for that query.

## Key Components
- **Crawl Budget**: How many pages a search engine will crawl on your site
- **Robots.txt**: File that tells crawlers which pages to avoid
- **Sitemaps**: Files that help search engines discover your content
- **Page Quality**: How search engines evaluate content value and relevance`,
          resources: ['Google Algorithm Overview', 'Crawler Documentation', 'Technical SEO Guide'],
          quiz: { questions: 8, passingScore: 75 }
        },
        {
          id: 'ranking-factors',
          title: 'Top 200 Ranking Factors',
          description: 'Complete breakdown of what affects search rankings',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false,
          content: `# Top 200 Ranking Factors

## Content Factors
- Content quality and uniqueness
- Content length and depth
- Keyword usage and relevance
- Content freshness and updates

## Technical Factors
- Page loading speed
- Mobile-friendliness
- HTTPS security
- Site architecture

## Authority Factors
- Backlink quality and quantity
- Domain authority
- Social signals
- Brand mentions

## User Experience Factors
- Click-through rates
- Bounce rate
- Time on page
- Core Web Vitals`,
          resources: ['Ranking Factors Checklist', 'Google Guidelines', 'SEO Audit Template']
        },
        {
          id: 'seo-tools',
          title: 'Essential SEO Tools',
          description: 'Free and paid tools every SEO professional needs',
          duration: '35 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          content: `# Essential SEO Tools

## Free Tools
### Google Search Console
- Monitor search performance
- Submit sitemaps
- Check for technical issues
- View search queries

### Google Analytics
- Track website traffic
- Understand user behavior
- Measure conversions
- Analyze traffic sources

## Paid Tools
### Ahrefs
- Comprehensive backlink analysis
- Keyword research
- Competitor analysis
- Site auditing

### SEMrush
- All-in-one SEO toolkit
- PPC research
- Social media monitoring
- Content marketing tools`,
          resources: ['Tools Comparison Chart', 'Setup Guides', 'Free Tools List']
        },
        {
          id: 'seo-strategy',
          title: 'Building Your SEO Strategy',
          description: 'Create a comprehensive SEO plan for your business',
          duration: '40 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false,
          content: `# Building Your SEO Strategy

## Step 1: Goal Setting
Define clear, measurable objectives for your SEO efforts.

## Step 2: Audience Research
Understand your target audience and their search behavior.

## Step 3: Competitor Analysis
Analyze what your competitors are doing and find opportunities.

## Step 4: Keyword Strategy
Develop a comprehensive keyword targeting plan.

## Step 5: Content Planning
Create a content calendar based on your keyword research.

## Step 6: Technical Foundation
Ensure your website is technically optimized for search engines.`,
          resources: ['Strategy Template', 'Goal Setting Worksheet', 'Competitor Analysis Guide']
        },
        {
          id: 'measuring-success',
          title: 'Measuring SEO Success',
          description: 'KPIs and metrics that matter for SEO performance',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          content: `# Measuring SEO Success

## Key Performance Indicators (KPIs)

### Organic Traffic
- Total organic sessions
- Organic traffic growth rate
- Traffic from target keywords

### Rankings
- Average position for target keywords
- Number of keywords ranking in top 10
- Featured snippet captures

### Conversions
- Organic conversion rate
- Revenue from organic traffic
- Goal completions from search

### Technical Health
- Page load speed
- Core Web Vitals scores
- Crawl errors and issues`,
          resources: ['KPI Dashboard Template', 'Reporting Guide', 'Analytics Setup']
        }
      ]
    },
    {
      id: 'keyword-research',
      title: 'Keyword Research Mastery',
      description: 'Advanced keyword research techniques and strategies',
      icon: <Target className="h-6 w-6" />,
      estimatedTime: '12 hours',
      totalLessons: 8,
      completedLessons: 0,
      locked: false,
      lessons: [
        {
          id: 'keyword-fundamentals',
          title: 'Keyword Research Fundamentals',
          description: 'Understanding search intent and keyword types',
          duration: '25 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          content: `# Keyword Research Fundamentals

## Understanding Search Intent

### Informational Intent
Users seeking information or answers to questions.
- "How to optimize website speed"
- "What is SEO"
- "Best practices for content marketing"

### Navigational Intent
Users looking for specific websites or pages.
- "Facebook login"
- "Amazon customer service"
- "Nike official website"

### Commercial Intent
Users researching products or services before buying.
- "Best SEO tools comparison"
- "iPhone vs Samsung reviews"
- "Top digital marketing agencies"

### Transactional Intent
Users ready to make a purchase or take action.
- "Buy running shoes online"
- "SEO consultant near me"
- "Download WordPress plugin"

## Keyword Types

### Head Keywords
- 1-2 words
- High search volume
- High competition
- Broad intent

### Body Keywords
- 2-3 words
- Medium search volume
- Medium competition
- More specific intent

### Long-tail Keywords
- 3+ words
- Lower search volume
- Lower competition
- Very specific intent`,
          resources: ['Search Intent Guide', 'Keyword Types Cheat Sheet'],
          quiz: { questions: 10, passingScore: 80 }
        },
        {
          id: 'keyword-tools',
          title: 'Advanced Keyword Research Tools',
          description: 'Master professional keyword research platforms',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false,
          content: `# Advanced Keyword Research Tools

## Google Keyword Planner
- Free tool from Google Ads
- Search volume data
- Competition insights
- Bid suggestions

## Professional Tools

### Ahrefs Keywords Explorer
- Keyword difficulty scores
- SERP analysis
- Related keywords
- Click metrics

### SEMrush Keyword Magic Tool
- Massive keyword database
- Keyword clustering
- SERP features data
- Competitive analysis

### Moz Keyword Explorer
- Priority scores
- SERP analysis
- Organic CTR data
- Related suggestions`,
          resources: ['Tool Comparison Guide', 'Setup Tutorials', 'Advanced Features Guide']
        }
      ]
    },
    {
      id: 'on-page-seo',
      title: 'On-Page SEO Mastery',
      description: 'Optimize your content and website structure for maximum visibility',
      icon: <BookOpen className="h-6 w-6" />,
      estimatedTime: '15 hours',
      totalLessons: 10,
      completedLessons: 0,
      locked: !isPremium,
      lessons: [
        {
          id: 'title-optimization',
          title: 'Title Tag Optimization',
          description: 'Craft compelling titles that rank and convert',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: !isPremium,
          content: `# Title Tag Optimization

## Best Practices
- Keep titles under 60 characters
- Include primary keyword near the beginning
- Make them compelling and clickable
- Avoid keyword stuffing
- Use power words when appropriate

## Title Tag Templates
- [Primary Keyword] - [Secondary Keyword] | [Brand]
- How to [Action] [Primary Keyword] in [Year]
- [Number] [Primary Keyword] Tips for [Audience]
- [Primary Keyword]: [Benefit/Solution] for [Target Audience]

## Examples of Great Title Tags
- "SEO Guide: How to Rank #1 on Google in 2024"
- "15 Content Marketing Tools Every Marketer Needs"
- "WordPress SEO: Complete Optimization Guide for Beginners"`,
          resources: ['Title Tag Templates', 'Power Words List', 'A/B Testing Guide']
        }
      ]
    },
    {
      id: 'technical-seo',
      title: 'Technical SEO',
      description: 'Master the technical aspects of search engine optimization',
      icon: <BarChart3 className="h-6 w-6" />,
      estimatedTime: '18 hours',
      totalLessons: 12,
      completedLessons: 0,
      locked: !isPremium,
      lessons: [
        {
          id: 'site-speed',
          title: 'Page Speed Optimization',
          description: 'Make your website lightning fast for better rankings',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: !isPremium
        }
      ]
    }
  ];

  // Calculate overall progress
  const totalLessons = courseModules.reduce((sum, module) => sum + module.totalLessons, 0);
  const completedLessons = courseModules.reduce((sum, module) => sum + module.completedLessons, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Initialize with first module
  useEffect(() => {
    if (courseModules.length > 0 && !activeModule) {
      setActiveModule(courseModules[0].id);
    }
  }, [courseModules, activeModule]);

  const activeModuleData = courseModules.find(m => m.id === activeModule);

  const handleLessonClick = (lesson: CourseLesson) => {
    if (lesson.locked && !isPremium) {
      toast({
        title: "Premium Content",
        description: "Upgrade to Premium to access this lesson",
        variant: "destructive"
      });
      onUpgrade?.();
      return;
    }

    setCurrentLesson(lesson);
    setCourseView('lesson');
  };

  const markLessonComplete = (lessonId: string) => {
    setUserProgress(prev => ({ ...prev, [lessonId]: true }));

    // Update lesson completed status in course modules
    courseModules.forEach(module => {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        module.completedLessons += 1;
      }
    });

    // Update current lesson state if it's the one being completed
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson({
        ...currentLesson,
        completed: true
      });
    }

    toast({
      title: "Lesson Completed! 🎉",
      description: "Great job! Keep up the momentum.",
    });
  };

  const getNextLesson = (currentLessonId: string): CourseLesson | null => {
    for (const module of courseModules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      if (currentIndex !== -1) {
        // Check if there's a next lesson in the same module
        if (currentIndex < module.lessons.length - 1) {
          return module.lessons[currentIndex + 1];
        }
        // Check next module
        const moduleIndex = courseModules.findIndex(m => m.id === module.id);
        if (moduleIndex < courseModules.length - 1) {
          const nextModule = courseModules[moduleIndex + 1];
          return nextModule.lessons[0] || null;
        }
      }
    }
    return null;
  };

  const getPreviousLesson = (currentLessonId: string): CourseLesson | null => {
    for (const module of courseModules) {
      const currentIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      if (currentIndex !== -1) {
        // Check if there's a previous lesson in the same module
        if (currentIndex > 0) {
          return module.lessons[currentIndex - 1];
        }
        // Check previous module
        const moduleIndex = courseModules.findIndex(m => m.id === module.id);
        if (moduleIndex > 0) {
          const prevModule = courseModules[moduleIndex - 1];
          return prevModule.lessons[prevModule.lessons.length - 1] || null;
        }
      }
    }
    return null;
  };

  const renderCourseOverview = () => (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-transparent text-gray-900 p-8 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">SEO Academy</h1>
            <p className="text-gray-600 text-lg">Complete Search Engine Optimization Masterclass</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <div className="text-gray-500">Complete</div>
          </div>
        </div>
        <div className="mt-6">
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{completedLessons} of {totalLessons} lessons completed</span>
            <span>~53 hours total</span>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{totalLessons}</div>
                <div className="text-sm text-muted-foreground">Total Lessons</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of lessons across all modules</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">53</div>
                <div className="text-sm text-muted-foreground">Hours Content</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total estimated time to complete all course content</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Certificates</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Certificates available upon module completion</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">15K+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Students who have enrolled in this course</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Course Modules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Course Modules</h2>
        <div className="grid gap-4">
          {courseModules.map((module) => (
            <Tooltip key={module.id}>
              <TooltipTrigger asChild>
                <Card
                  className={`cursor-pointer transition-all ${
                    module.id === activeModule ? 'ring-2 ring-blue-500' : ''
                  } ${module.locked ? 'opacity-60' : ''}`}
                  onClick={() => !module.locked && setActiveModule(module.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-lg ${module.locked ? 'bg-gray-100' : 'bg-blue-100'}`}>
                          {module.locked ? <Lock className="h-6 w-6 text-gray-400" /> : module.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">{module.title}</h3>
                            {module.locked && <Badge variant="secondary">Premium</Badge>}
                          </div>
                          <p className="text-muted-foreground mb-3">{module.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {module.totalLessons} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {module.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              {module.completedLessons}/{module.totalLessons} complete
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {module.totalLessons > 0 && (
                      <div className="mt-4">
                        <Progress
                          value={(module.completedLessons / module.totalLessons) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{module.locked ? 'Upgrade to Premium to access this module' : `Click to view ${module.title} lessons and content`}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Current Module Lessons */}
      {activeModuleData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{activeModuleData.title} - Lessons</h2>
            <Badge variant="outline">{activeModuleData.lessons.length} lessons</Badge>
          </div>
          <div className="grid gap-3">
            {activeModuleData.lessons.map((lesson, index) => (
              <Tooltip key={lesson.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer transition-all ${
                      lesson.locked ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-green-100 text-green-600'
                              : lesson.locked
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : lesson.locked ? (
                              <Lock className="h-5 w-5" />
                            ) : (
                              <PlayCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}
                              </span>
                              <Badge
                                variant={lesson.difficulty === 'Beginner' ? 'default' :
                                        lesson.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {lesson.difficulty}
                              </Badge>
                              {lesson.quiz && (
                                <Badge variant="outline" className="text-xs">
                                  Quiz: {lesson.quiz.questions} questions
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{lesson.locked ? 'Premium lesson - upgrade to access' : `Click to start lesson: ${lesson.title}`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLessonView = () => {
    if (!currentLesson) return null;

    const nextLesson = getNextLesson(currentLesson.id);
    const prevLesson = getPreviousLesson(currentLesson.id);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Lesson Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCourseView('overview')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Course
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to the course overview and module selection</p>
                  </TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-xl font-semibold">{currentLesson.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentLesson.duration}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {currentLesson.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!currentLesson.completed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark this lesson as completed and track your progress</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {currentLesson.completed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This lesson has been completed successfully</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Lesson Content */}
            <div className="prose max-w-none">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownContent(currentLesson.content || 'Lesson content will be available here...')
                }}
              />
            </div>


          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div>
              {prevLesson && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentLesson(prevLesson)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous: {prevLesson.title}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to the previous lesson: {prevLesson.title}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div>
              {nextLesson && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setCurrentLesson(nextLesson)}
                      className="flex items-center gap-2"
                    >
                      Next: {nextLesson.title}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Continue to the next lesson: {nextLesson.title}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {courseView === 'overview' ? (
          <div className="max-w-6xl mx-auto p-6">
            {renderCourseOverview()}
          </div>
        ) : (
          renderLessonView()
        )}
      </div>
    </TooltipProvider>
  );
}

export default EnhancedCourseInterface;
