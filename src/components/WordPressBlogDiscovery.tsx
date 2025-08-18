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
  Zap,
  Eye,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { wordpressCommentService } from '@/services/wordpressCommentService';

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
  totalChecked: number;
  removed404s: number;
  testsPassed: number;
  testsFailed: number;
  liveLinks: number;
  averageSuccessRate: number;
  averageQualityScore: number;
}

const WordPressBlogDiscovery = () => {
  const [discoveredBlogs, setDiscoveredBlogs] = useState<WordPressBlog[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [testingProgress, setTestingProgress] = useState(0);
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<DiscoveryStats>({
    totalFound: 0,
    totalChecked: 0,
    removed404s: 0,
    testsPassed: 0,
    testsFailed: 0,
    liveLinks: 0,
    averageSuccessRate: 0,
    averageQualityScore: 0
  });

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    website: '',
    comment: ''
  });

  const { toast } = useToast();

  // Main discovery query as specified
  const mainDiscoveryQuery = '"powered by wordpress" "leave a comment"';

  // Start WordPress blog discovery
  const startDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryProgress(0);
    setValidationProgress(0);
    setDiscoveredBlogs([]);

    try {
      toast({
        title: "🔍 Starting Discovery",
        description: "Searching for WordPress blogs with comment forms...",
      });

      // Use real discovery service with progress tracking
      const updateProgressCallback = (progress: number) => {
        setDiscoveryProgress(progress * 0.4); // Discovery is 40% of total
      };

      const updateValidationCallback = (progress: number) => {
        setValidationProgress(progress);
        setDiscoveryProgress(40 + (progress * 0.6)); // Validation is 60% of total
      };

      // Set up progress monitoring (simulated)
      const progressInterval = setInterval(() => {
        if (discoveryProgress < 40) {
          setDiscoveryProgress(prev => Math.min(40, prev + 5));
        }
      }, 500);

      const result = await wordpressCommentService.discoverWordPressBlogs(40);
      clearInterval(progressInterval);

      setDiscoveredBlogs(result.blogs);
      setDiscoveryProgress(100);
      setValidationProgress(100);

      // Update stats
      const statsData = wordpressCommentService.getDiscoveryStats(result.blogs);
      setStats(prev => ({
        ...prev,
        totalFound: statsData.total,
        totalChecked: result.validationStats.totalChecked,
        removed404s: result.validationStats.removed404s,
        averageSuccessRate: statsData.averageSuccessRate,
        averageQualityScore: result.validationStats.averageQualityScore
      }));

      toast({
        title: "✅ Discovery Complete",
        description: `Found ${result.totalFound} validated WordPress blogs (${result.validationStats.removed404s} 404s removed)`,
      });

      // Additional validation summary
      if (result.validationStats.removed404s > 0) {
        toast({
          title: "🛡️ Validation Summary",
          description: `Checked ${result.validationStats.totalChecked} sites, removed ${result.validationStats.removed404s} dead links, confirmed ${result.validationStats.wordpressConfirmed} WordPress sites`,
        });
      }

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

    try {
      toast({
        title: "🚀 Starting Tests",
        description: `Testing comment submission on ${selectedBlogsList.length} blogs...`,
      });

      // Update all selected blogs to testing status
      setDiscoveredBlogs(prev => prev.map(b =>
        selectedBlogs.has(b.id) ? { ...b, testStatus: 'testing' } : b
      ));

      // Use real service for bulk testing
      const result = await wordpressCommentService.bulkTestCommentSubmission(selectedBlogsList, userDetails);

      // Update blogs with test results
      setDiscoveredBlogs(prev => prev.map(blog => {
        const testResult = result.results.find(r => r.blogId === blog.id);
        if (testResult) {
          return {
            ...blog,
            testStatus: testResult.success ? 'success' : 'failed',
            liveCommentUrl: testResult.liveUrl,
            lastTested: new Date()
          };
        }
        return blog;
      }));

      // Update progress to 100%
      setTestingProgress(100);

      // Update stats
      setStats(prev => ({
        ...prev,
        testsPassed: prev.testsPassed + result.successful,
        testsFailed: prev.testsFailed + result.failed,
        liveLinks: prev.liveLinks + result.successful
      }));

      toast({
        title: "🎯 Testing Complete",
        description: `${result.successful} successful, ${result.failed} failed out of ${result.tested} tests`,
      });

      // Show live links
      if (result.liveLinks.length > 0) {
        toast({
          title: "🔗 Live Links Available",
          description: `${result.liveLinks.length} live backlinks created! Check the Results tab.`,
        });
      }

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
      case 'validating': return <Eye className="w-4 h-4 animate-pulse text-purple-600" />;
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Checked</p>
                <p className="text-xl font-bold">{stats.totalChecked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-xl font-bold text-green-600">{stats.totalFound}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">404s Removed</p>
                <p className="text-xl font-bold text-red-600">{stats.removed404s}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Tests Passed</p>
                <p className="text-xl font-bold text-green-600">{stats.testsPassed}</p>
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
                <p className="text-sm text-gray-600">Quality</p>
                <p className="text-xl font-bold text-orange-600">{stats.averageQualityScore}</p>
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
                Search for WordPress blogs using: {mainDiscoveryQuery}
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
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {discoveryProgress <= 40 ? 'Searching WordPress blogs...' :
                         discoveryProgress <= 90 ? 'Validating websites (checking for 404s)...' :
                         'Filtering valid blogs...'}
                      </span>
                      <span>{Math.round(discoveryProgress)}%</span>
                    </div>
                    <Progress value={discoveryProgress} />
                  </div>

                  {discoveryProgress > 40 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-purple-600">
                        <span>🔍 Validation Progress</span>
                        <span>{Math.round(validationProgress)}%</span>
                      </div>
                      <Progress value={validationProgress} className="h-2" />
                      <div className="text-xs text-gray-500 flex items-center gap-4">
                        <span>• Checking accessibility</span>
                        <span>• Confirming WordPress</span>
                        <span>• Finding comment forms</span>
                        <span>• Removing 404s</span>
                      </div>
                    </div>
                  )}
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
                                  {blog.validation && (
                                    <div className="flex items-center gap-2 text-xs">
                                      {blog.validation.isAccessible && <Badge variant="outline" className="bg-green-50 text-green-700">Accessible</Badge>}
                                      {blog.validation.isWordPress && <Badge variant="outline" className="bg-blue-50 text-blue-700">WordPress</Badge>}
                                      {blog.validation.hasCommentForm && <Badge variant="outline" className="bg-purple-50 text-purple-700">Comments</Badge>}
                                      {blog.validation.qualityScore > 0 && (
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                          Q: {blog.validation.qualityScore}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
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
