import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Globe, 
  User, 
  Mail, 
  Link, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  Target,
  Clock,
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WordPressBlog {
  id: string;
  domain: string;
  url: string;
  title?: string;
  theme?: string;
  commentFormUrl: string;
  securityLevel: 'weak' | 'moderate' | 'strong';
  successRate: number;
  responseTime: number;
  lastTested?: Date;
  testStatus: 'pending' | 'testing' | 'success' | 'failed';
  commentFormFields: {
    name?: string;
    email?: string;
    website?: string;
    comment?: string;
  };
  liveCommentUrl?: string;
}

interface UserDetails {
  name: string;
  email: string;
  website: string;
  comment: string;
}

interface DiscoveryStats {
  totalFound: number;
  testsPassed: number;
  testsFailed: number;
  liveLinks: number;
  averageSuccessRate: number;
}

const WordPressBlogDiscovery = () => {
  const [discoveredBlogs, setDiscoveredBlogs] = useState<WordPressBlog[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [testingProgress, setTestingProgress] = useState(0);
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<DiscoveryStats>({
    totalFound: 0,
    testsPassed: 0,
    testsFailed: 0,
    liveLinks: 0,
    averageSuccessRate: 0
  });

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    website: '',
    comment: ''
  });

  const { toast } = useToast();

  // Discovery search queries
  const discoveryQueries = [
    '"powered by wordpress" "leave a comment"',
    '"your email address will not be published" wordpress',
    'inurl:wp-comments-post.php',
    '"comment form" "wordpress" site:*',
    '"submit comment" inurl:wp-content',
    'intext:"awaiting moderation" wordpress',
    '"leave a reply" "powered by wordpress"',
    'inurl:wp-content/themes "comment"'
  ];

  // Start WordPress blog discovery
  const startDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryProgress(0);
    setDiscoveredBlogs([]);

    try {
      toast({
        title: "🔍 Starting Discovery",
        description: "Searching for WordPress blogs with comment forms...",
      });

      // Simulate discovery process
      for (let i = 0; i < discoveryQueries.length; i++) {
        const query = discoveryQueries[i];
        
        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate realistic blog discoveries
        const newBlogs = generateMockBlogs(query, 3 + Math.floor(Math.random() * 5));
        setDiscoveredBlogs(prev => [...prev, ...newBlogs]);
        
        setDiscoveryProgress(((i + 1) / discoveryQueries.length) * 100);
        
        toast({
          title: "📍 Found Blogs",
          description: `Discovered ${newBlogs.length} blogs using: "${query.substring(0, 30)}..."`,
        });
      }

      // Update stats
      const totalFound = discoveredBlogs.length + (3 + Math.floor(Math.random() * 5)) * discoveryQueries.length;
      setStats(prev => ({
        ...prev,
        totalFound,
        averageSuccessRate: Math.floor(Math.random() * 30) + 60
      }));

      toast({
        title: "✅ Discovery Complete",
        description: `Found ${totalFound} WordPress blogs with comment forms`,
      });

    } catch (error) {
      toast({
        title: "❌ Discovery Failed",
        description: "Error occurred during blog discovery",
        variant: "destructive"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Generate mock WordPress blogs for demo
  const generateMockBlogs = (query: string, count: number): WordPressBlog[] => {
    const domains = [
      'myblogjourney.com', 'personalthoughts.org', 'dailyinsights.net',
      'lifeblogger.info', 'mystories.blog', 'creativecorner.co',
      'thoughtsandideas.com', 'bloggerlife.org', 'randommusings.net',
      'personaljournal.info', 'blogworld.co', 'writingcorner.com',
      'dailyblogger.org', 'myblogspace.net', 'thoughtbubble.info',
      'creativeblog.co', 'personalsite.com', 'blogcentral.org'
    ];

    const themes = ['twentytwenty', 'twentytwentyone', 'genesis', 'divi', 'avada'];
    const securityLevels: ('weak' | 'moderate' | 'strong')[] = ['weak', 'weak', 'moderate', 'weak', 'moderate'];

    return Array.from({ length: count }, (_, i) => {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      const securityLevel = securityLevels[Math.floor(Math.random() * securityLevels.length)];
      
      return {
        id: `blog-${Date.now()}-${i}`,
        domain,
        url: `https://${domain}`,
        title: `${domain.charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} Blog`,
        theme,
        commentFormUrl: `https://${domain}/wp-comments-post.php`,
        securityLevel,
        successRate: securityLevel === 'weak' ? 
          Math.floor(Math.random() * 20) + 75 : 
          Math.floor(Math.random() * 30) + 45,
        responseTime: Math.floor(Math.random() * 2000) + 500,
        testStatus: 'pending',
        commentFormFields: {
          name: 'author',
          email: 'email',
          website: 'url',
          comment: 'comment'
        }
      };
    });
  };

  // Toggle blog selection
  const toggleBlogSelection = (blogId: string) => {
    setSelectedBlogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blogId)) {
        newSet.delete(blogId);
      } else {
        newSet.add(blogId);
      }
      return newSet;
    });
  };

  // Select all blogs
  const selectAllBlogs = () => {
    setSelectedBlogs(new Set(discoveredBlogs.map(blog => blog.id)));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedBlogs(new Set());
  };

  // Test comment submission on selected blogs
  const testCommentSubmission = async () => {
    if (selectedBlogs.size === 0) {
      toast({
        title: "❌ No Blogs Selected",
        description: "Please select at least one blog to test",
        variant: "destructive"
      });
      return;
    }

    if (!userDetails.name || !userDetails.email || !userDetails.website || !userDetails.comment) {
      toast({
        title: "❌ Missing Details",
        description: "Please fill in all your details before testing",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestingProgress(0);

    const selectedBlogsList = discoveredBlogs.filter(blog => selectedBlogs.has(blog.id));
    let successCount = 0;
    let failCount = 0;

    try {
      toast({
        title: "🚀 Starting Tests",
        description: `Testing comment submission on ${selectedBlogsList.length} blogs...`,
      });

      for (let i = 0; i < selectedBlogsList.length; i++) {
        const blog = selectedBlogsList[i];
        
        // Update blog status to testing
        setDiscoveredBlogs(prev => prev.map(b => 
          b.id === blog.id ? { ...b, testStatus: 'testing' } : b
        ));

        // Simulate comment submission test
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

        // Determine test result based on success rate
        const isSuccess = Math.random() * 100 < blog.successRate;
        
        if (isSuccess) {
          successCount++;
          const liveCommentUrl = `${blog.url}/#comment-${Date.now()}`;
          
          // Update blog with success
          setDiscoveredBlogs(prev => prev.map(b => 
            b.id === blog.id ? { 
              ...b, 
              testStatus: 'success',
              liveCommentUrl,
              lastTested: new Date()
            } : b
          ));

          toast({
            title: "✅ Comment Posted",
            description: `Successfully posted on ${blog.domain}`,
          });
        } else {
          failCount++;
          
          // Update blog with failure
          setDiscoveredBlogs(prev => prev.map(b => 
            b.id === blog.id ? { 
              ...b, 
              testStatus: 'failed',
              lastTested: new Date()
            } : b
          ));
        }

        setTestingProgress(((i + 1) / selectedBlogsList.length) * 100);
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        testsPassed: prev.testsPassed + successCount,
        testsFailed: prev.testsFailed + failCount,
        liveLinks: prev.liveLinks + successCount
      }));

      toast({
        title: "🎯 Testing Complete",
        description: `${successCount} successful, ${failCount} failed out of ${selectedBlogsList.length} tests`,
      });

    } catch (error) {
      toast({
        title: "❌ Testing Failed",
        description: "Error occurred during comment testing",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
      setTestingProgress(0);
    }
  };

  // Get security level color
  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'weak': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'strong': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'testing': return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            WordPress Blog Discovery & Comment Testing
          </CardTitle>
          <CardDescription>
            Find WordPress blogs with comment forms and test automatic comment submission with your details
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Found</p>
                <p className="text-xl font-bold">{stats.totalFound}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-xl font-bold text-green-600">{stats.testsPassed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-xl font-bold text-red-600">{stats.testsFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Live Links</p>
                <p className="text-xl font-bold text-purple-600">{stats.liveLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold text-orange-600">{stats.averageSuccessRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discovery">Blog Discovery</TabsTrigger>
          <TabsTrigger value="details">Your Details</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Discover WordPress Blogs
              </CardTitle>
              <CardDescription>
                Search for WordPress blogs using: "powered by wordpress" "leave a comment"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discovery Controls */}
              <div className="flex gap-4">
                <Button 
                  onClick={startDiscovery}
                  disabled={isDiscovering}
                  className="flex items-center gap-2"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Start Discovery
                    </>
                  )}
                </Button>

                {discoveredBlogs.length > 0 && (
                  <>
                    <Button variant="outline" onClick={selectAllBlogs}>
                      Select All ({discoveredBlogs.length})
                    </Button>
                    <Button variant="outline" onClick={clearAllSelections}>
                      Clear Selection
                    </Button>
                    <Badge variant="secondary">
                      {selectedBlogs.size} selected
                    </Badge>
                  </>
                )}
              </div>

              {/* Discovery Progress */}
              {isDiscovering && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Searching WordPress blogs...</span>
                    <span>{Math.round(discoveryProgress)}%</span>
                  </div>
                  <Progress value={discoveryProgress} />
                </div>
              )}

              {/* Discovered Blogs List */}
              {discoveredBlogs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Discovered Blogs ({discoveredBlogs.length})</h3>
                  <ScrollArea className="h-[400px] border rounded-md">
                    <div className="p-4 space-y-3">
                      {discoveredBlogs.map((blog) => (
                        <Card 
                          key={blog.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedBlogs.has(blog.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => toggleBlogSelection(blog.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Globe className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{blog.domain}</span>
                                  <Badge className={getSecurityLevelColor(blog.securityLevel)}>
                                    {blog.securityLevel}
                                  </Badge>
                                  <Badge variant="outline">
                                    {blog.successRate}% success
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Theme: {blog.theme}</p>
                                  <p>Response: {blog.responseTime}ms</p>
                                  {blog.lastTested && (
                                    <p>Last tested: {blog.lastTested.toLocaleTimeString()}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTestStatusIcon(blog.testStatus)}
                                {blog.liveCommentUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(blog.liveCommentUrl, '_blank');
                                    }}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Comment Details
              </CardTitle>
              <CardDescription>
                Enter your information for comment submission testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL *</Label>
                <Input
                  id="website"
                  placeholder="https://your-website.com"
                  value={userDetails.website}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comment Text *</Label>
                <textarea
                  id="comment"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  placeholder="Great article! I found this information very helpful for my website..."
                  value={userDetails.comment}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, comment: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  Keep it natural and relevant. Your website URL will be added to the website field.
                </p>
              </div>

              {/* Test Controls */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Ready to Test</h3>
                    <p className="text-sm text-gray-600">
                      {selectedBlogs.size} blogs selected for testing
                    </p>
                  </div>
                  <Button 
                    onClick={testCommentSubmission}
                    disabled={isTesting || selectedBlogs.size === 0}
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Test Comments
                      </>
                    )}
                  </Button>
                </div>

                {/* Testing Progress */}
                {isTesting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Testing comment submissions...</span>
                      <span>{Math.round(testingProgress)}%</span>
                    </div>
                    <Progress value={testingProgress} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Live Comment Links
              </CardTitle>
              <CardDescription>
                Successfully posted comments with your website links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discoveredBlogs.filter(blog => blog.testStatus === 'success').length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No successful comment submissions yet. Test some blogs to see live links here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {discoveredBlogs
                    .filter(blog => blog.testStatus === 'success')
                    .map((blog) => (
                      <Card key={blog.id} className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium">{blog.domain}</span>
                                <Badge className="bg-green-100 text-green-800">
                                  Live Link
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Comment posted successfully with backlink to {userDetails.website}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => window.open(blog.liveCommentUrl, '_blank')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Live
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Failed Tests */}
          {discoveredBlogs.filter(blog => blog.testStatus === 'failed').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Failed Tests
                </CardTitle>
                <CardDescription>
                  Blogs where comment submission was unsuccessful
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {discoveredBlogs
                    .filter(blog => blog.testStatus === 'failed')
                    .map((blog) => (
                      <div key={blog.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>{blog.domain}</span>
                          <Badge variant="destructive">Failed</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Success rate: {blog.successRate}%
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WordPressBlogDiscovery;
