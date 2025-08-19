import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Target,
  Globe,
  Link2,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Filter,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Zap,
  BarChart3,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { useToast } from '@/hooks/use-toast';
import FormDiscoveryWidget from '@/components/discovery/FormDiscoveryWidget';
import UrlValidator from '@/components/discovery/UrlValidator';
import AutomationCompatibilityTester from '@/components/discovery/AutomationCompatibilityTester';

interface DiscoveryResult {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  opportunity_score: number;
  difficulty: 'low' | 'medium' | 'high';
  platform_type: string;
  discovery_method: string;
  estimated_da: number;
  estimated_traffic: number;
  has_comment_form: boolean;
  has_guest_posting: boolean;
  contact_info: string[];
  last_checked: string;
  status: 'pending' | 'analyzing' | 'verified' | 'contacted' | 'rejected';
}

interface DiscoverySession {
  id: string;
  query: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  start_time: string;
  results_count: number;
  progress: number;
  platforms_scanned: string[];
  current_platform: string;
}

const AutomationDiscovery = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthState();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Discovery session state
  const [currentSession, setCurrentSession] = useState<DiscoverySession | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);
  const [discoveryDepth, setDiscoveryDepth] = useState('medium');
  const [maxResults, setMaxResults] = useState(100);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [minOpportunityScore, setMinOpportunityScore] = useState(70);

  // Analytics state
  const [sessionStats, setSessionStats] = useState({
    total_discovered: 0,
    high_opportunity: 0,
    verified_contacts: 0,
    avg_difficulty: 'medium' as const,
    top_platforms: [] as string[]
  });

  const availablePlatforms = [
    { id: 'all', name: 'All Platforms', icon: '🌐' },
    { id: 'wordpress', name: 'WordPress Sites', icon: '📝' },
    { id: 'medium', name: 'Medium', icon: '✍️' },
    { id: 'dev_to', name: 'Dev.to', icon: '💻' },
    { id: 'hashnode', name: 'Hashnode', icon: '📊' },
    { id: 'ghost', name: 'Ghost Blogs', icon: '👻' },
    { id: 'substack', name: 'Substack', icon: '📬' },
    { id: 'linkedin', name: 'LinkedIn Articles', icon: '💼' },
    { id: 'reddit', name: 'Reddit', icon: '🔴' },
    { id: 'forums', name: 'Forums', icon: '💬' },
    { id: 'directories', name: 'Directories', icon: '📁' }
  ];

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      return;
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAuthenticated, authLoading]);

  const startDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryResults([]);

    try {
      const response = await fetch('/.netlify/functions/discovery-engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: `automation_discovery_${Date.now()}`,
          maxResults,
          discoveryDepth
        }),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Unknown error';
        }
        console.error('Discovery API Error:', response.status, errorText);
        throw new Error(`Discovery failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const sessionId = data.sessionId;

      toast({
        title: "Automation Discovery Started",
        description: "Finding URLs compatible with your automation platform...",
      });

      // Start polling for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/.netlify/functions/discovery-engine?sessionId=${sessionId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            if (statusData.session) {
              setCurrentSession(statusData.session);

              if (statusData.session.status === 'completed') {
                setIsDiscovering(false);
                clearInterval(pollInterval);
                updateSessionStats();
                toast({
                  title: "Discovery Complete",
                  description: `Found ${statusData.results?.length || 0} opportunities!`,
                });
              } else if (statusData.session.status === 'error') {
                setIsDiscovering(false);
                clearInterval(pollInterval);
                toast({
                  title: "Discovery Error",
                  description: "Discovery session encountered an error.",
                  variant: "destructive"
                });
              }
            }

            if (statusData.results && statusData.results.length > discoveryResults.length) {
              setDiscoveryResults(statusData.results);
            }
          }
        } catch (error) {
          console.error('Error polling discovery status:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Store interval reference for cleanup
      eventSourceRef.current = { close: () => clearInterval(pollInterval) };

    } catch (error) {
      setIsDiscovering(false);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to start discovery session",
        variant: "destructive"
      });
    }
  };

  const pauseDiscovery = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsDiscovering(false);
    setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const updateSessionStats = () => {
    const high_opportunity = discoveryResults.filter(r => r.opportunity_score >= 80).length;
    const verified_contacts = discoveryResults.filter(r => r.contact_info.length > 0).length;
    const platformCounts = discoveryResults.reduce((acc, result) => {
      acc[result.platform_type] = (acc[result.platform_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const top_platforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([platform]) => platform);

    setSessionStats({
      total_discovered: discoveryResults.length,
      high_opportunity,
      verified_contacts,
      avg_difficulty: 'medium',
      top_platforms
    });
  };

  const filteredResults = discoveryResults.filter(result => {
    if (filterDifficulty !== 'all' && result.difficulty !== filterDifficulty) return false;
    if (result.opportunity_score < minOpportunityScore) return false;
    return true;
  });

  const exportResults = () => {
    const csvContent = [
      ['URL', 'Domain', 'Title', 'Opportunity Score', 'Difficulty', 'Platform', 'DA', 'Traffic', 'Comment Form', 'Guest Posting', 'Contact Info'].join(','),
      ...filteredResults.map(result => [
        result.url,
        result.domain,
        result.title.replace(/,/g, ';'),
        result.opportunity_score,
        result.difficulty,
        result.platform_type,
        result.estimated_da,
        result.estimated_traffic,
        result.has_comment_form ? 'Yes' : 'No',
        result.has_guest_posting ? 'Yes' : 'No',
        result.contact_info.join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discovery_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to access the automation discovery engine.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Automation-Compatible URL Discovery
          </h1>
          <p className="text-lg text-gray-600">
            Find working URLs compatible with your automation platform for maximum link publishing success
          </p>
        </div>

        <Tabs defaultValue="discovery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Results ({filteredResults.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discovery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Discovery Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Discovery Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your link building opportunity discovery session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">🚀 Automation Focus</h4>
                    <p className="text-sm text-blue-700">
                      This discovery engine finds URLs that are specifically compatible with your automation platform,
                      focusing on technical requirements rather than topics. No search query needed!
                    </p>
                  </div>

                  <div>
                    <Label>Automation Platform Types</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {[
                        { id: 'api_platforms', name: '🔌 API Platforms (Telegraph, Medium, Dev.to)', desc: 'Instant publishing via APIs' },
                        { id: 'form_platforms', name: '📝 Form Submission Sites', desc: 'Automated form completion' },
                        { id: 'directory_sites', name: '📁 Directory Submissions', desc: 'Business/URL directories' },
                        { id: 'comment_forms', name: '💬 Comment Forms', desc: 'Blog comment opportunities' },
                        { id: 'profile_creation', name: '👤 Profile Creation', desc: 'Social/professional profiles' }
                      ].map(platform => (
                        <div
                          key={platform.id}
                          className="p-3 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="font-medium text-green-800">{platform.name}</div>
                          <div className="text-xs text-green-600">{platform.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discovery-depth">Discovery Depth</Label>
                      <Select value={discoveryDepth} onValueChange={setDiscoveryDepth}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light (Fast)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="deep">Deep (Comprehensive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="max-results">Max Results</Label>
                      <Select value={maxResults.toString()} onValueChange={(value) => setMaxResults(parseInt(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50 Results</SelectItem>
                          <SelectItem value="100">100 Results</SelectItem>
                          <SelectItem value="250">250 Results</SelectItem>
                          <SelectItem value="500">500 Results</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {!isDiscovering ? (
                      <Button onClick={startDiscovery} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Start Discovery
                      </Button>
                    ) : (
                      <Button onClick={pauseDiscovery} variant="outline" className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Discovery
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Discovery Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSession ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Session Status</span>
                        <Badge variant={currentSession.status === 'running' ? 'default' : 'secondary'}>
                          {currentSession.status}
                        </Badge>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{currentSession.progress}%</span>
                        </div>
                        <Progress value={currentSession.progress} className="w-full" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current Platform</span>
                          <p className="font-medium">{currentSession.current_platform || 'Initializing...'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Results Found</span>
                          <p className="font-medium">{discoveryResults.length}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Platforms Scanned</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentSession.platforms_scanned.map(platform => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No active discovery session</p>
                      <p className="text-sm">Configure and start a discovery session to see real-time progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <FormDiscoveryWidget />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Automation Compatibility Testing */}
            <AutomationCompatibilityTester
              results={discoveryResults}
              onTestComplete={(testResults) => {
                console.log('Automation compatibility testing complete:', testResults);
              }}
            />

            <Separator />

            {/* URL Validation Section */}
            <UrlValidator
              results={discoveryResults}
              onValidationComplete={(validatedResults) => {
                console.log('Validation complete:', validatedResults);
              }}
            />

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Label htmlFor="filter-difficulty">Difficulty</Label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="min-score">Min Score</Label>
                  <Input
                    id="min-score"
                    type="number"
                    value={minOpportunityScore}
                    onChange={(e) => setMinOpportunityScore(parseInt(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDiscoveryResults([])}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="outline" onClick={exportResults} disabled={filteredResults.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                    <p className="text-gray-600 mb-4">
                      Start a discovery session to find link building opportunities
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{result.title}</h3>
                            <Badge variant={result.difficulty === 'low' ? 'default' : result.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                              {result.difficulty}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {result.domain}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              DA: {result.estimated_da}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {result.estimated_traffic.toLocaleString()} traffic
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {result.opportunity_score}%
                          </div>
                          <div className="text-xs text-gray-500">Opportunity</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{result.platform_type}</Badge>
                          {result.has_comment_form && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Comment Form
                            </Badge>
                          )}
                          {result.has_guest_posting && (
                            <Badge variant="outline" className="text-blue-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Guest Posting
                            </Badge>
                          )}
                          {result.contact_info.length > 0 && (
                            <Badge variant="outline" className="text-purple-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Contact Info
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Discovered</p>
                      <p className="text-2xl font-bold">{sessionStats.total_discovered}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">High Opportunity</p>
                      <p className="text-2xl font-bold text-green-600">{sessionStats.high_opportunity}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified Contacts</p>
                      <p className="text-2xl font-bold text-purple-600">{sessionStats.verified_contacts}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Difficulty</p>
                      <p className="text-2xl font-bold capitalize">{sessionStats.avg_difficulty}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Platforms</CardTitle>
                <CardDescription>Platforms with the most opportunities discovered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionStats.top_platforms.map((platform, index) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="capitalize">{platform}</span>
                      </div>
                      <Badge variant="outline">
                        {discoveryResults.filter(r => r.platform_type === platform).length} results
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discovery Settings</CardTitle>
                <CardDescription>
                  Configure default settings for discovery sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Settings Coming Soon</AlertTitle>
                  <AlertDescription>
                    Advanced discovery settings and preferences will be available in the next update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AutomationDiscovery;
