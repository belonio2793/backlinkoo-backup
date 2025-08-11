import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Sparkles,
  Zap,
  FileText,
  Link2,
  Eye,
  Save,
  CheckCircle,
  User,
  Globe,
  TrendingUp,
  Code,
  Database,
  Cpu,
  Loader2,
  Monitor,
  Target,
  RefreshCw
} from 'lucide-react';
import { blogTemplateEngine } from '@/services/blogTemplateEngine';
import { liveBlogPublisher } from '@/services/liveBlogPublisher';

interface BlogPost {
  id: string;
  title: string;
  expert: {
    name: string;
    expertise: string;
    avatar: string;
  };
  progress: number;
  status: 'queued' | 'analyzing' | 'researching' | 'writing' | 'optimizing' | 'finalizing' | 'completed';
  currentTask: string;
  content?: any;
  previewUrl?: string;
  stats: {
    wordCount: number;
    seoScore: number;
    backlinks: number;
    readTime: number;
  };
  generationSteps: string[];
  currentStepIndex: number;
}

interface MultiBlogGeneratorProps {
  keyword: string;
  targetUrl: string;
  onComplete: (posts: BlogPost[]) => void;
  onSaveCampaign: () => void;
}

export function MultiBlogGenerator({ 
  keyword, 
  targetUrl, 
  onComplete,
  onSaveCampaign 
}: MultiBlogGeneratorProps) {
  const [phase, setPhase] = useState<'initializing' | 'generating' | 'preview'>('initializing');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeProcesses, setActiveProcesses] = useState<string[]>([]);
  const [showSystemMessages, setShowSystemMessages] = useState(true);
  const [codeStreamLines, setCodeStreamLines] = useState<string[]>([]);
  const [aiThoughts, setAiThoughts] = useState<string[]>([]);

  // Generate random expert names each time
  const generateRandomExperts = () => {
    const firstNames = [
      "Sarah", "Michael", "Emma", "David", "Lisa", "James", "Maria", "Alex", "Jessica", "Ryan",
      "Amanda", "Christopher", "Nicole", "Daniel", "Ashley", "Matthew", "Rachel", "Andrew", "Jennifer", "Kevin",
      "Samantha", "Brandon", "Natalie", "Jason", "Michelle", "Tyler", "Rebecca", "Eric", "Laura", "Jacob",
      "Stephanie", "Nathan", "Amy", "Brian", "Melissa", "Jonathan", "Kimberly", "Anthony", "Angela", "Justin"
    ];

    const lastNames = [
      "Chen", "Rodriguez", "Thompson", "Kim", "Wang", "Johnson", "Williams", "Brown", "Davis", "Miller",
      "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Garcia",
      "Martinez", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez",
      "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson"
    ];

    const titles = ["Dr.", "Prof.", "", "", "", "Ms.", "Mr.", "", "", ""];
    const avatars = ["👩‍💼", "👨‍💻", "👩‍🔬", "👨‍💼", "👩‍🎨", "👨‍🔬", "👩‍💻", "👨‍🎨", "👩‍🏫", "👨‍🏫"];

    const expertises = [
      "SEO Strategy & Content Optimization",
      "Technical Writing & Analysis",
      "Industry Research & Insights",
      "Business Strategy & Marketing",
      "Content Creation & Storytelling",
      "Digital Marketing & Analytics",
      "Content Strategy & Planning",
      "Market Research & Analysis",
      "Creative Writing & Branding",
      "Performance Marketing & Growth"
    ];

    const shuffledExpertises = [...expertises].sort(() => Math.random() - 0.5);

    return Array.from({ length: 5 }, (_, index) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const fullName = title ? `${title} ${firstName} ${lastName}` : `${firstName} ${lastName}`;

      return {
        name: fullName,
        expertise: shuffledExpertises[index],
        avatar: avatars[Math.floor(Math.random() * avatars.length)]
      };
    });
  };

  const experts = generateRandomExperts();

  const generationSteps = [
    "Analyzing keyword intent and market positioning",
    "Researching competitor strategies and content gaps",
    "Defining target audience and user personas",
    "Crafting compelling headlines and meta descriptions",
    "Structuring content architecture and flow",
    "Writing engaging introduction with value proposition",
    "Developing comprehensive main content sections",
    "Integrating natural contextual backlinks",
    "Optimizing for search engines and readability",
    "Performing quality assurance and final review"
  ];

  const systemMessages = [
    "🧠 AI Neural Networks: Initializing content generation algorithms...",
    "🔍 Data Mining: Scanning 50M+ web pages for keyword insights...",
    "⚡ Processing Power: Allocating GPU clusters for parallel generation...",
    "🎯 Targeting Engine: Analyzing user intent and search patterns...",
    "🔗 Link Intelligence: Mapping contextual placement opportunities...",
    "📊 SEO Analyzer: Evaluating ranking factors and optimization...",
    "✨ Content Synthesis: Merging expert knowledge with AI creativity...",
    "🚀 Quality Assurance: Running 47-point content evaluation..."
  ];

  useEffect(() => {
    console.log('🎯 MultiBlogGenerator mounted with:', { keyword, targetUrl });
    initializeBlogGeneration();
  }, []);

  const initializeBlogGeneration = async () => {
    console.log('🔄 Initializing blog generation with experts:', experts.length);

    // Initialize blog posts with experts
    const initialPosts: BlogPost[] = experts.map((expert, index) => ({
      id: `blog_${index + 1}`,
      title: generateInitialTitle(keyword, index),
      expert,
      progress: 0,
      status: 'queued',
      currentTask: 'Preparing content strategy...',
      stats: {
        wordCount: 0,
        seoScore: 0,
        backlinks: 0,
        readTime: 0
      },
      generationSteps: [...generationSteps],
      currentStepIndex: 0
    }));

    setBlogPosts(initialPosts);

    // Show system initialization
    await showSystemInitialization();

    // Start generating all blogs simultaneously
    setPhase('generating');
    startSimultaneousGeneration(initialPosts);
  };

  const generateInitialTitle = (keyword: string, index: number): string => {
    const titleVariations = [
      `The Ultimate ${keyword} Guide: Expert Analysis`,
      `${keyword} Mastery: Professional Strategies`,
      `Complete ${keyword} Blueprint: Industry Insights`,
      `Advanced ${keyword} Techniques: Proven Methods`,
      `${keyword} Excellence: Expert Recommendations`
    ];
    return titleVariations[index] || `${keyword}: Professional Guide`;
  };

  const showSystemInitialization = async (): Promise<void> => {
    const processes = [
      "Backlink ∞ Network Initialization",
      "Content Generation Engine Startup",
      "SEO Optimization Engine Loading",
      "Expert Knowledge Base Access",
      "Quality Assurance Systems Online"
    ];

    for (let i = 0; i < processes.length; i++) {
      setActiveProcesses(prev => [...prev, processes[i]]);
      
      // Add some code stream effects
      const codeLines = [
        `backlink_infinity.init_content_engine(keyword="${keyword}")`,
        `backlink_infinity.load_expert_writers(count=${experts.length})`,
        `backlink_infinity.configure_seo_targeting(url="${targetUrl}")`,
        `backlink_infinity.allocate_resources(cores=128, priority=high)`,
        `backlink_infinity.start_campaign_generation(posts=5, parallel=true)`
      ];
      
      if (i < codeLines.length) {
        setCodeStreamLines(prev => [...prev, `> ${codeLines[i]}`]);
      }

      // Add AI thoughts
      const thoughts = [
        "Analyzing semantic relationships in keyword context...",
        "Identifying high-value content opportunities...",
        "Mapping competitive landscape for positioning...",
        "Calculating optimal content structure patterns...",
        "Preparing contextual link placement strategies..."
      ];

      if (i < thoughts.length) {
        setAiThoughts(prev => [...prev, thoughts[i]]);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const startSimultaneousGeneration = async (posts: BlogPost[]) => {
    // Start all generations in parallel
    const generationPromises = posts.map((post, index) => 
      generateSingleBlog(post, index)
    );

    // Wait for all to complete
    const completedPosts = await Promise.all(generationPromises);
    
    // Update overall progress to 100%
    setOverallProgress(100);
    
    // Wait a moment then switch to preview
    setTimeout(() => {
      setPhase('preview');
      onComplete(completedPosts);
    }, 2000);
  };

  const generateSingleBlog = async (post: BlogPost, index: number): Promise<BlogPost> => {
    let currentPost = { ...post };

    for (let stepIndex = 0; stepIndex < generationSteps.length; stepIndex++) {
      const step = generationSteps[stepIndex];
      const stepProgress = ((stepIndex + 1) / generationSteps.length) * 100;

      // Update post status and progress
      currentPost = {
        ...currentPost,
        currentTask: step,
        progress: stepProgress,
        currentStepIndex: stepIndex,
        status: getStatusFromStep(stepIndex)
      };

      setBlogPosts(prevPosts => 
        prevPosts.map(p => p.id === post.id ? currentPost : p)
      );

      // Update overall progress
      setOverallProgress(prevProgress => {
        const totalSteps = generationSteps.length * blogPosts.length;
        const completedSteps = blogPosts.reduce((acc, p) => acc + p.currentStepIndex, 0) + stepIndex + 1;
        return Math.min(100, (completedSteps / totalSteps) * 100);
      });

      // Simulate realistic generation time with some variation
      const baseDelay = 1000 + (stepIndex * 200); // Longer for more complex steps
      const variation = Math.random() * 500; // Add some randomness
      await new Promise(resolve => setTimeout(resolve, baseDelay + variation));

      // Generate actual content for key steps
      if (stepIndex === 6) { // Main content generation
        const generatedContent = await blogTemplateEngine.generateBlogPost(keyword, targetUrl);
        const uniqueSlug = `${generatedContent.slug}-${Date.now()}-${index}`;
        const previewUrl = `${window.location.origin}/preview/${uniqueSlug}`;

        // Store in live blog publisher using slug as key for preview access
        const blogPost = {
          id: uniqueSlug,
          slug: uniqueSlug,
          title: generatedContent.title,
          content: generatedContent.content,
          metaDescription: generatedContent.metaDescription,
          keywords: [keyword],
          targetUrl,
          publishedUrl: previewUrl,
          status: 'published' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: undefined,
          isTrialPost: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 0,
          seoScore: generatedContent.seoScore,
          contextualLinks: generatedContent.contextualLinks,
          wordCount: generatedContent.wordCount
        };

        // Store by slug so BlogPreview can find it
        if (liveBlogPublisher.inMemoryPosts) {
          liveBlogPublisher.inMemoryPosts.set(uniqueSlug, blogPost);
          console.log(`✅ Blog post stored successfully:`, {
            slug: uniqueSlug,
            previewUrl,
            title: blogPost.title,
            contentLength: blogPost.content.length,
            totalStoredPosts: liveBlogPublisher.inMemoryPosts.size
          });
        }

        currentPost = {
          ...currentPost,
          content: generatedContent,
          previewUrl,
          title: generatedContent.title,
          stats: {
            wordCount: generatedContent.wordCount,
            seoScore: generatedContent.seoScore,
            backlinks: generatedContent.contextualLinks.length,
            readTime: generatedContent.readingTime
          }
        };
      }
    }

    // Mark as completed
    currentPost.status = 'completed';
    setBlogPosts(prevPosts => 
      prevPosts.map(p => p.id === post.id ? currentPost : p)
    );

    return currentPost;
  };

  const getStatusFromStep = (stepIndex: number): BlogPost['status'] => {
    if (stepIndex < 2) return 'analyzing';
    if (stepIndex < 4) return 'researching';
    if (stepIndex < 7) return 'writing';
    if (stepIndex < 9) return 'optimizing';
    return 'finalizing';
  };

  const getStatusColor = (status: BlogPost['status']) => {
    const colors = {
      'queued': 'bg-gray-100 text-gray-600',
      'analyzing': 'bg-blue-100 text-blue-600',
      'researching': 'bg-purple-100 text-purple-600',
      'writing': 'bg-green-100 text-green-600',
      'optimizing': 'bg-orange-100 text-orange-600',
      'finalizing': 'bg-yellow-100 text-yellow-600',
      'completed': 'bg-emerald-100 text-emerald-600'
    };
    return colors[status];
  };

  const getStatusIcon = (status: BlogPost['status']) => {
    const icons = {
      'queued': <Loader2 className="h-3 w-3" />,
      'analyzing': <Brain className="h-3 w-3 animate-pulse" />,
      'researching': <Database className="h-3 w-3 animate-pulse" />,
      'writing': <FileText className="h-3 w-3 animate-pulse" />,
      'optimizing': <Zap className="h-3 w-3 animate-pulse" />,
      'finalizing': <Target className="h-3 w-3 animate-pulse" />,
      'completed': <CheckCircle className="h-3 w-3" />
    };
    return icons[status];
  };

  // Initialization Phase
  if (phase === 'initializing') {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Cpu className="h-6 w-6 text-white animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              <span className="inline-flex items-center">
                Backlink ∞ Is Working
                <span className="ml-1 inline-flex">
                  <span className="animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                  <span className="animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                  <span className="animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                </span>
              </span>
            </CardTitle>
          </div>
          <p className="text-muted-foreground">
            Our advanced backlink generation system is preparing your 5-post campaign...
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Backlink ∞ Platform Status</span>
              <span className="text-muted-foreground">{Math.round((activeProcesses.length / 5) * 100)}%</span>
            </div>
            <Progress value={(activeProcesses.length / 5) * 100} className="h-3" />
          </div>

          {/* Active Processes */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Backlink ∞ Processes
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeProcesses.map((process, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span>{process}</span>
                  <Badge variant="outline" className="ml-auto text-xs">ACTIVE</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Code Stream */}
          {showSystemMessages && codeStreamLines.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Code className="h-4 w-4" />
                Platform Operations
              </h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs max-h-32 overflow-y-auto">
                {codeStreamLines.map((line, index) => (
                  <div key={index} className="mb-1">{line}</div>
                ))}
                <div className="animate-pulse">_</div>
              </div>
            </div>
          )}

          {/* AI Thoughts */}
          {aiThoughts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {aiThoughts.map((thought, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-purple-50 rounded">
                    <Sparkles className="h-3 w-3 text-purple-600 mt-0.5" />
                    <span className="text-purple-700">{thought}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Generation Phase
  if (phase === 'generating') {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500">
              <Zap className="h-6 w-6 text-white animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-semibold">🎉 Surprise! Generating 5 Professional Blog Posts</CardTitle>
          </div>
          <p className="text-muted-foreground">
            We're overdelivering! Instead of 1 blog post, our AI experts are crafting 5 high-quality pieces optimized for "{keyword}"
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Generation Progress</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
            
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <Globe className="h-4 w-4 animate-pulse" />
              <span>Processing in parallel across multiple AI systems...</span>
            </div>
          </div>

          {/* Blog Generation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
                {/* Expert Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{post.expert.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{post.expert.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{post.expert.expertise}</div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                    {getStatusIcon(post.status)}
                    <span className="ml-1 capitalize">{post.status}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(post.progress)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <Progress value={post.progress} className="h-2 mb-3" />

                {/* Current Task */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">{post.title}</div>
                  <div className="text-xs text-muted-foreground flex items-start gap-1">
                    <Loader2 className="h-3 w-3 animate-spin mt-0.5 flex-shrink-0" />
                    <span>{post.currentTask}</span>
                  </div>
                </div>

                {/* Stats Preview (shown when content is generated) */}
                {post.stats.wordCount > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{post.stats.seoScore}</div>
                      <div className="text-xs text-muted-foreground">SEO Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{post.stats.backlinks}</div>
                      <div className="text-xs text-muted-foreground">Backlinks</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Generation Insights */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Real-Time Generation Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {blogPosts.filter(p => p.status === 'completed').length}/5
                </div>
                <div className="text-blue-700">Blogs Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {blogPosts.reduce((sum, p) => sum + p.stats.wordCount, 0)}+
                </div>
                <div className="text-green-700">Total Words Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {blogPosts.reduce((sum, p) => sum + p.stats.backlinks, 0)}
                </div>
                <div className="text-purple-700">Contextual Backlinks</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview Phase
  if (phase === 'preview') {
    const completedBlogs = blogPosts.filter(p => p.status === 'completed');
    
    return (
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold">🎊 Bonus Complete! 5 Professional Blog Posts Ready</CardTitle>
          </div>
          <p className="text-muted-foreground">
            You asked for 1 blog post, but we delivered 5! Your expert-crafted content portfolio is ready for preview and publication
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Campaign Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{completedBlogs.length}</div>
              <div className="text-sm text-muted-foreground">Blog Posts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {completedBlogs.reduce((sum, p) => sum + p.stats.backlinks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Backlinks</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(completedBlogs.reduce((sum, p) => sum + p.stats.seoScore, 0) / completedBlogs.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg SEO Score</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {Math.round(completedBlogs.reduce((sum, p) => sum + p.stats.wordCount, 0) / 1000)}K
              </div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </div>
          </div>

          {/* Blog Preview Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generated Blog Posts</h3>
            <div className="grid gap-4">
              {completedBlogs.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{post.expert.avatar}</span>
                        <div>
                          <div className="text-sm font-medium">{post.expert.name}</div>
                          <div className="text-xs text-muted-foreground">{post.expert.expertise}</div>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{post.stats.wordCount} words</span>
                        <span>{post.stats.readTime} min read</span>
                        <span>SEO: {post.stats.seoScore}/100</span>
                        <span>{post.stats.backlinks} backlinks</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('Opening preview URL:', post.previewUrl);
                          window.open(post.previewUrl, '_blank');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Live Post
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Another Keyword
            </Button>

            <Button
              onClick={onSaveCampaign}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Now - Auto-Deletes in 24hrs!
            </Button>
          </div>

          {/* Registration CTA */}
          <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
            <div className="text-center space-y-3">
              <h4 className="text-lg font-semibold text-red-800">
                ⚠️ These 5 Backlinks Will Auto-Delete in 24 Hours!
              </h4>
              <p className="text-red-700">
                Each post above contains live backlinks to your website and is building SEO value right now!
                But they will be automatically deleted in 24 hours unless you create an account to keep them forever.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-red-600 mt-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Live & Active Now</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Building SEO Value</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>24hr Timer Started</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
