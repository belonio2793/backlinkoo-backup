import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Search, Database, Zap, Globe, Target, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import massPlatformDatabase from '@/data/massPlatformDatabase.json';
import { massPlatformDiscoveryService, type MassPlatformTarget, type PlatformDiscoveryQuery } from '@/services/massplatformDiscovery';

interface DiscoverySession {
  id: string;
  query: PlatformDiscoveryQuery;
  status: 'idle' | 'discovering' | 'validating' | 'completed' | 'error';
  progress: number;
  results: MassPlatformTarget[];
  startTime: Date;
  endTime?: Date;
  stats: {
    totalFound: number;
    validated: number;
    added: number;
    errors: number;
  };
}

export default function MassPlatformDiscovery() {
  const [session, setSession] = useState<DiscoverySession | null>(null);
  const [keywords, setKeywords] = useState('digital marketing, SEO, content marketing');
  const [platformTypes, setPlatformTypes] = useState<string[]>(['web2', 'directory', 'bookmark']);
  const [minDA, setMinDA] = useState(40);
  const [maxResults, setMaxResults] = useState(100);
  const [activeTab, setActiveTab] = useState('discover');

  // Platform database stats
  const databaseStats = {
    totalPlatforms: Object.values(massPlatformDatabase.platformCategories).reduce((sum, cat) => sum + cat.count, 0),
    averageDA: Math.round(Object.values(massPlatformDatabase.platformCategories).reduce((sum, cat) => sum + cat.averageDA, 0) / Object.keys(massPlatformDatabase.platformCategories).length),
    readyForAutomation: massPlatformDatabase.automationReadiness.easy.count + massPlatformDatabase.automationReadiness.medium.count,
    expectedDiscoverable: massPlatformDatabase.expectedResults.total_discoverable
  };

  const startDiscovery = async () => {
    if (!keywords.trim()) {
      toast.error('Please enter keywords for discovery');
      return;
    }

    const query: PlatformDiscoveryQuery = {
      keywords: keywords.split(',').map(k => k.trim()),
      platformTypes,
      minDA,
      limit: maxResults,
      allowsBacklinks: true
    };

    const newSession: DiscoverySession = {
      id: `discovery-${Date.now()}`,
      query,
      status: 'discovering',
      progress: 0,
      results: [],
      startTime: new Date(),
      stats: {
        totalFound: 0,
        validated: 0,
        added: 0,
        errors: 0
      }
    };

    setSession(newSession);
    setActiveTab('progress');

    try {
      // Start discovery process
      updateProgress(10, 'Initializing discovery engines...');
      
      await simulateDelay(1000);
      updateProgress(25, 'Searching for platforms...');
      
      const discoveryResult = await massPlatformDiscoveryService.discoverPlatforms(query);
      
      updateProgress(60, 'Validating discovered platforms...');
      
      const validatedPlatforms = await massPlatformDiscoveryService.validatePlatforms(discoveryResult.platforms);
      
      updateProgress(85, 'Adding platforms to rotation...');
      
      const addResult = await massPlatformDiscoveryService.addPlatformsToRotation(validatedPlatforms);
      
      updateProgress(100, 'Discovery completed!');
      
      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        results: validatedPlatforms,
        endTime: new Date(),
        stats: {
          totalFound: discoveryResult.totalFound,
          validated: validatedPlatforms.length,
          added: addResult.added,
          errors: addResult.failed
        }
      } : null);

      toast.success(`Discovery completed! Found ${validatedPlatforms.length} platforms, added ${addResult.added} to rotation.`);

    } catch (error) {
      console.error('Discovery error:', error);
      setSession(prev => prev ? { ...prev, status: 'error' } : null);
      toast.error('Discovery failed. Please try again.');
    }
  };

  const updateProgress = (progress: number, status: string) => {
    setSession(prev => prev ? { ...prev, progress, status: status as any } : null);
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const resetSession = () => {
    setSession(null);
    setActiveTab('discover');
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.round((endTime.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const PlatformTypeToggle = ({ type, label }: { type: string; label: string }) => (
    <Button
      variant={platformTypes.includes(type) ? "default" : "outline"}
      size="sm"
      onClick={() => {
        setPlatformTypes(prev => 
          prev.includes(type) 
            ? prev.filter(t => t !== type)
            : [...prev, type]
        );
      }}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Mass Platform Discovery</h1>
        <p className="text-gray-600 mt-2">
          Discover hundreds of high-DA platforms for automated backlink placement
        </p>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Database Platforms</p>
                <p className="text-2xl font-bold">{databaseStats.totalPlatforms.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Average DA</p>
                <p className="text-2xl font-bold">{databaseStats.averageDA}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Automation Ready</p>
                <p className="text-2xl font-bold">{databaseStats.readyForAutomation.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Discoverable</p>
                <p className="text-2xl font-bold">{databaseStats.expectedDiscoverable.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="discover">Discovery Setup</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="database">Platform Database</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Discovery Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure the automated platform discovery process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="digital marketing, SEO, content marketing"
                />
                <p className="text-sm text-gray-500">
                  Keywords will be used to find relevant platforms and opportunities
                </p>
              </div>

              <div className="space-y-2">
                <Label>Platform Types</Label>
                <div className="flex flex-wrap gap-2">
                  <PlatformTypeToggle type="web2" label="Web 2.0" />
                  <PlatformTypeToggle type="directory" label="Directories" />
                  <PlatformTypeToggle type="bookmark" label="Bookmarking" />
                  <PlatformTypeToggle type="profile" label="Profiles" />
                  <PlatformTypeToggle type="forum" label="Forums" />
                  <PlatformTypeToggle type="blog" label="Blogs" />
                  <PlatformTypeToggle type="social" label="Social" />
                  <PlatformTypeToggle type="qa" label="Q&A" />
                  <PlatformTypeToggle type="wiki" label="Wikis" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minDA">Minimum Domain Authority</Label>
                  <Input
                    id="minDA"
                    type="number"
                    value={minDA}
                    onChange={(e) => setMinDA(parseInt(e.target.value) || 30)}
                    min="20"
                    max="90"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxResults">Maximum Results</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The discovery process will search multiple sources including search engines, 
                  competitor analysis, and platform databases to find submission opportunities.
                  Results will be validated and automatically added to your platform rotation.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={startDiscovery}
                disabled={session?.status === 'discovering' || session?.status === 'validating'}
                className="w-full"
                size="lg"
              >
                {session?.status === 'discovering' || session?.status === 'validating' ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Discovering Platforms...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Mass Discovery
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {session ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Discovery Progress</span>
                  <Badge variant={
                    session.status === 'completed' ? 'default' :
                    session.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {session.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Started: {session.startTime.toLocaleTimeString()} • 
                  Duration: {formatDuration(session.startTime, session.endTime)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(session.progress)}%</span>
                  </div>
                  <Progress value={session.progress} className="w-full" />
                </div>

                {session.status === 'completed' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{session.stats.totalFound}</p>
                      <p className="text-sm text-gray-600">Found</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{session.stats.validated}</p>
                      <p className="text-sm text-gray-600">Validated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{session.stats.added}</p>
                      <p className="text-sm text-gray-600">Added</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{session.stats.errors}</p>
                      <p className="text-sm text-gray-600">Errors</p>
                    </div>
                  </div>
                )}

                {session.status === 'completed' && (
                  <div className="flex space-x-2">
                    <Button onClick={() => setActiveTab('results')} className="flex-1">
                      View Results
                    </Button>
                    <Button onClick={resetSession} variant="outline">
                      New Discovery
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Discovery</h3>
                <p className="text-gray-600 mb-4">Start a discovery session to see progress here</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Configure Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {session?.results && session.results.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Discovery Results</CardTitle>
                <CardDescription>
                  {session.results.length} platforms discovered and validated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.results.slice(0, 20).map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{platform.domain}</h4>
                            <p className="text-sm text-gray-600">{platform.url}</p>
                          </div>
                          <Badge variant="secondary">DA {platform.domainAuthority}</Badge>
                          <Badge variant={platform.difficulty === 'easy' ? 'default' : platform.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                            {platform.difficulty}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant="outline">{platform.platformType}</Badge>
                          <Badge variant="outline">{platform.submissionType}</Badge>
                          {platform.allowsBacklinks && <Badge variant="outline" className="text-green-600">Backlinks ✓</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="font-medium">{Math.round(platform.successRate)}%</p>
                      </div>
                    </div>
                  ))}
                  
                  {session.results.length > 20 && (
                    <div className="text-center p-4 border rounded-lg bg-gray-50">
                      <p className="text-gray-600">
                        Showing 20 of {session.results.length} results. 
                        <Button variant="link" className="ml-1">View All</Button>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600 mb-4">Complete a discovery session to see results here</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Start Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(massPlatformDatabase.platformCategories).map(([key, category]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.description}</CardTitle>
                  <CardDescription>
                    {category.count} platforms • Average DA {category.averageDA}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.platforms.slice(0, 5).map((platform, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{platform.domain}</p>
                          <p className="text-xs text-gray-600">{platform.type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">DA {platform.da}</Badge>
                          {platform.backlinks && <CheckCircle className="h-3 w-3 text-green-500" />}
                        </div>
                      </div>
                    ))}
                    {category.platforms.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{category.platforms.length - 5} more platforms
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
