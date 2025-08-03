import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download,
  MessageSquare
} from 'lucide-react';

interface SEOAcademyTabProps {
  isSubscribed: boolean;
  onUpgrade: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
  resources?: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  lessons: Lesson[];
  estimatedTime: string;
}

export function SEOAcademyTab({ isSubscribed, onUpgrade }: SEOAcademyTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState('fundamentals');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<{ [key: string]: boolean }>({});


  // Mock course data - in real implementation, this would come from a database
  const courseModules: Module[] = [
    {
      id: 'fundamentals',
      title: 'SEO Fundamentals',
      description: 'Master the basics of search engine optimization',
      icon: <Search className="h-6 w-6" />,
      estimatedTime: '8 hours',
      lessons: [
        {
          id: 'seo-intro',
          title: 'What is SEO and Why It Matters',
          description: 'Understanding search engines and organic traffic',
          duration: '15 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          resources: ['SEO Glossary', 'Search Engine Guide']
        },
        {
          id: 'search-engines',
          title: 'How Search Engines Work',
          description: 'Crawling, indexing, and ranking explained',
          duration: '20 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          resources: ['Google Algorithm Overview', 'Crawler Documentation']
        },
        {
          id: 'ranking-factors',
          title: 'Top 200 Ranking Factors',
          description: 'Complete breakdown of what affects rankings',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false,
          resources: ['Ranking Factors Checklist', 'Google Guidelines']
        },
        {
          id: 'seo-tools',
          title: 'Essential SEO Tools',
          description: 'Free and paid tools for SEO success',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false,
          resources: ['Tools Comparison Chart', 'Setup Guides']
        }
      ]
    },
    {
      id: 'keyword-research',
      title: 'Keyword Research Mastery',
      description: 'Find and target the right keywords for your business',
      icon: <Target className="h-6 w-6" />,
      estimatedTime: '12 hours',
      lessons: [
        {
          id: 'keyword-basics',
          title: 'Keyword Research Fundamentals',
          description: 'Understanding search intent and keyword types',
          duration: '25 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'keyword-tools',
          title: 'Keyword Research Tools',
          description: 'Master Google Keyword Planner, Ahrefs, and more',
          duration: '40 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'long-tail-keywords',
          title: 'Long-tail Keyword Strategy',
          description: 'Target low-competition, high-converting keywords',
          duration: '35 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'competitor-analysis',
          title: 'Competitor Keyword Analysis',
          description: 'Steal your competitors\' best keywords',
          duration: '50 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        },
        {
          id: 'keyword-clustering',
          title: 'Keyword Clustering & Mapping',
          description: 'Organize keywords for maximum impact',
          duration: '45 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        }
      ]
    },
    {
      id: 'on-page-seo',
      title: 'On-Page SEO',
      description: 'Optimize your content and website structure',
      icon: <BookOpen className="h-6 w-6" />,
      estimatedTime: '15 hours',
      lessons: [
        {
          id: 'title-tags',
          title: 'Writing Perfect Title Tags',
          description: 'Craft compelling titles that rank and convert',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'meta-descriptions',
          title: 'Meta Descriptions That Convert',
          description: 'Write descriptions that improve click-through rates',
          duration: '25 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'header-tags',
          title: 'Header Tag Optimization',
          description: 'Structure your content with H1, H2, H3 tags',
          duration: '20 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'content-optimization',
          title: 'Content Optimization Strategies',
          description: 'Create content that ranks and engages',
          duration: '60 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'internal-linking',
          title: 'Internal Linking Mastery',
          description: 'Build authority through strategic internal links',
          duration: '40 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'schema-markup',
          title: 'Schema Markup Implementation',
          description: 'Get rich snippets and enhanced SERP features',
          duration: '55 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        }
      ]
    },
    {
      id: 'technical-seo',
      title: 'Technical SEO',
      description: 'Optimize your website\'s technical foundation',
      icon: <BarChart3 className="h-6 w-6" />,
      estimatedTime: '18 hours',
      lessons: [
        {
          id: 'site-speed',
          title: 'Page Speed Optimization',
          description: 'Make your website lightning fast',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'mobile-optimization',
          title: 'Mobile-First SEO',
          description: 'Optimize for mobile search',
          duration: '35 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'crawlability',
          title: 'Website Crawlability',
          description: 'Help search engines understand your site',
          duration: '40 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        },
        {
          id: 'xml-sitemaps',
          title: 'XML Sitemaps',
          description: 'Create and optimize sitemaps',
          duration: '30 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'robots-txt',
          title: 'Robots.txt Optimization',
          description: 'Control search engine access',
          duration: '25 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        }
      ]
    },
    {
      id: 'link-building',
      title: 'Link Building Strategies',
      description: 'Build high-quality backlinks that boost rankings',
      icon: <Link className="h-6 w-6" />,
      estimatedTime: '20 hours',
      lessons: [
        {
          id: 'link-building-basics',
          title: 'Link Building Fundamentals',
          description: 'Understanding link equity and authority',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'guest-posting',
          title: 'Guest Posting Strategy',
          description: 'Get high-quality backlinks through content',
          duration: '50 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'broken-link-building',
          title: 'Broken Link Building',
          description: 'Turn broken links into opportunities',
          duration: '45 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        },
        {
          id: 'resource-pages',
          title: 'Resource Page Link Building',
          description: 'Get listed on valuable resource pages',
          duration: '40 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'digital-pr',
          title: 'Digital PR for SEO',
          description: 'Earn links through PR and outreach',
          duration: '60 min',
          difficulty: 'Advanced',
          completed: false,
          locked: false
        }
      ]
    },
    {
      id: 'analytics',
      title: 'SEO Analytics & Reporting',
      description: 'Measure and improve your SEO performance',
      icon: <TrendingUp className="h-6 w-6" />,
      estimatedTime: '10 hours',
      lessons: [
        {
          id: 'google-analytics',
          title: 'Google Analytics for SEO',
          description: 'Track organic traffic and user behavior',
          duration: '40 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'search-console',
          title: 'Google Search Console Mastery',
          description: 'Monitor search performance and fix issues',
          duration: '45 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        },
        {
          id: 'rank-tracking',
          title: 'Keyword Rank Tracking',
          description: 'Monitor your keyword positions',
          duration: '30 min',
          difficulty: 'Beginner',
          completed: false,
          locked: false
        },
        {
          id: 'seo-reporting',
          title: 'SEO Reporting & KPIs',
          description: 'Create reports that show ROI',
          duration: '35 min',
          difficulty: 'Intermediate',
          completed: false,
          locked: false
        }
      ]
    }
  ];

  const totalLessons = courseModules.reduce((total, module) => total + module.lessons.length, 0);
  const completedLessons = Object.values(userProgress).filter(Boolean).length;
  const progressPercentage = (completedLessons / totalLessons) * 100;

  const markLessonComplete = (lessonId: string) => {
    if (!isSubscribed) {
      toast({
        title: "Premium Feature",
        description: "Premium subscription required to track progress and earn certificates.",
        variant: "destructive"
      });
      return;
    }

    setUserProgress(prev => ({ ...prev, [lessonId]: true }));
    toast({
      title: "Lesson Completed!",
      description: "Great job! Keep up the momentum.",
    });
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (!isSubscribed) return <Lock className="h-4 w-4 text-gray-400" />;
    if (userProgress[lesson.id]) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <PlayCircle className="h-4 w-4 text-blue-600" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSubscribed) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-4">SEO Academy - Premium Feature</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Unlock the complete SEO Academy with 50+ comprehensive lessons, practical exercises, 
              and professional certifications. Available exclusively for Premium subscribers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
              <div className="p-4 bg-white rounded-lg border">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">50+ Lessons</div>
                <div className="text-sm text-gray-600">Comprehensive curriculum</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold">Certifications</div>
                <div className="text-sm text-gray-600">Earn verified certificates</div>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold">Expert Support</div>
                <div className="text-sm text-gray-600">Get help from pros</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Premium subscription required to access SEO Academy content.</p>
              <p className="mt-2">Contact support if you believe you should have access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-800">Your SEO Journey</CardTitle>
              <p className="text-blue-600 mt-1">Track your progress through the complete SEO curriculum</p>
            </div>
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{completedLessons} of {totalLessons} lessons completed</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedLessons}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalLessons - completedLessons}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.floor(completedLessons / 10)}
              </div>
              <div className="text-sm text-gray-600">Certificates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Modules Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {courseModules.map((module) => (
                <Button
                  key={module.id}
                  variant={activeModule === module.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setActiveModule(module.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-blue-600">{module.icon}</div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{module.title}</div>
                      <div className="text-xs text-gray-500">{module.lessons.length} lessons • {module.estimatedTime}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Lessons Content */}
        <div className="lg:col-span-2">
          {courseModules.map((module) => (
            activeModule === module.id && (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">{module.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getLessonIcon(lesson)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration}
                            </div>
                            {lesson.resources && (
                              <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {lesson.resources.length} resources
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {userProgress[lesson.id] ? (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => markLessonComplete(lesson.id)}
                            >
                              Start Lesson
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          ))}
        </div>
      </div>

      {/* Certification Section */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-600" />
            <div>
              <CardTitle className="text-yellow-800">SEO Certifications</CardTitle>
              <p className="text-yellow-600 mt-1">Earn professional certificates as you complete modules</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseModules.map((module) => {
              const moduleCompleted = module.lessons.every(lesson => userProgress[lesson.id]);
              return (
                <div key={module.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    {moduleCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-medium">{module.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Complete all {module.lessons.length} lessons to earn this certificate
                  </p>
                  {moduleCompleted ? (
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="mr-2 h-3 w-3" />
                      Download Certificate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      Certificate Locked
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Checkout Modal */}
      <PremiumCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          toast({
            title: "Welcome to Premium!",
            description: "You now have access to the complete SEO Academy!",
          });
          onUpgrade();
        }}
      />
    </div>
  );
}
