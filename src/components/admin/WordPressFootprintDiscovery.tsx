import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Shield, Search, Target, Zap, Globe, Database, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import wordpressFootprints from '@/data/wordpressFootprints.json';
import { wordpressFootprintDiscoveryService, type WordPressTarget, type FootprintQuery } from '@/services/wordpressFootprintDiscovery';

interface DiscoverySession {
  id: string;
  query: FootprintQuery;
  status: 'idle' | 'discovering' | 'testing' | 'validating' | 'completed' | 'error';
  progress: number;
  targets: WordPressTarget[];
  startTime: Date;
  endTime?: Date;
  stats: {
    discovered: number;
    validated: number;
    linkTested: number;
    addedToRotation: number;
    averageSuccessRate: number;
  };
}

export default function WordPressFootprintDiscovery() {
  const [session, setSession] = useState<DiscoverySession | null>(null);
  const [themes, setThemes] = useState<string[]>(['twentyten', 'twentyeleven', 'genesis']);
  const [maxTargets, setMaxTargets] = useState(100);
  const [securityLevel, setSecurityLevel] = useState<'weak' | 'moderate' | 'strong'>('weak');
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [activeTab, setActiveTab] = useState('discover');

  // WordPress footprint stats
  const footprintStats = {
    totalThemes: Object.values(wordpressFootprints.themeFootprints).reduce((sum, category) => sum + category.themes.length, 0),
    totalPlugins: Object.values(wordpressFootprints.pluginFootprints).reduce((sum, category) => sum + category.plugins.length, 0),
    estimatedSites: wordpressFootprints.expectedResults.discovery_potential.vulnerable_sites,
    successRate: 65
  };

  const startDiscovery = async () => {
    if (!testUrl.trim()) {
      toast.error('Please enter a test URL for link placement validation');
      return;
    }

    const query: FootprintQuery = {
      themes,
      maxSecurityLevel: securityLevel,
      requiresCommentForm: true,
      limit: maxTargets
    };

    const newSession: DiscoverySession = {
      id: `wp-discovery-${Date.now()}`,
      query,
      status: 'discovering',
      progress: 0,
      targets: [],
      startTime: new Date(),
      stats: {
        discovered: 0,
        validated: 0,
        linkTested: 0,
        addedToRotation: 0,
        averageSuccessRate: 0
      }
    };

    setSession(newSession);
    setActiveTab('progress');

    try {
      // Phase 1: WordPress footprint discovery
      updateProgress(15, 'discovering', 'Scanning for WordPress footprints...');
      
      const discoveryResult = await wordpressFootprintDiscoveryService.discoverWordPressTargets(query);
      
      updateProgress(40, 'testing', 'Testing comment forms and link placement...');
      
      // Phase 2: Link placement testing
      const testResults = await wordpressFootprintDiscoveryService.bulkTestLinkPlacement(
        discoveryResult.targets, 
        testUrl
      );
      
      updateProgress(70, 'validating', 'Validating successful targets...');
      
      // Phase 3: Filter successful targets
      const successfulTargets = testResults.results
        .filter(r => r.result.success)
        .map(r => r.target);
      
      updateProgress(90, 'validating', 'Adding to platform rotation...');
      
      // Phase 4: Add to platform rotation
      const addResults = await wordpressFootprintDiscoveryService.addToActivePlatforms(successfulTargets);
      
      updateProgress(100, 'completed', 'WordPress discovery completed!');
      
      const avgSuccessRate = successfulTargets.length > 0 
        ? successfulTargets.reduce((sum, t) => sum + t.successRate, 0) / successfulTargets.length
        : 0;

      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        targets: successfulTargets,
        endTime: new Date(),
        stats: {
          discovered: discoveryResult.totalFound,
          validated: discoveryResult.validationResults.accessible,
          linkTested: testResults.tested,
          addedToRotation: addResults.added,
          averageSuccessRate: Math.round(avgSuccessRate)
        }
      } : null);

      toast.success(`WordPress discovery completed! Found ${successfulTargets.length} exploitable targets, added ${addResults.added} to rotation.`);

    } catch (error) {
      console.error('WordPress discovery error:', error);
      setSession(prev => prev ? { ...prev, status: 'error' } : null);
      toast.error('WordPress discovery failed. Please try again.');
    }
  };

  const updateProgress = (progress: number, status: DiscoverySession['status'], message: string) => {
    setSession(prev => prev ? { ...prev, progress, status } : null);
    // Optional: show progress message
  };

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

  const ThemeToggle = ({ theme }: { theme: string }) => (
    <Button
      variant={themes.includes(theme) ? "default" : "outline"}
      size="sm"
      onClick={() => {
        setThemes(prev => 
          prev.includes(theme) 
            ? prev.filter(t => t !== theme)
            : [...prev, theme]
        );
      }}
    >
      {theme}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">WordPress Footprint Discovery</h1>
        <p className="text-gray-600 mt-2">
          Discover vulnerable WordPress sites with exploitable comment forms and weak security
        </p>
      </div>

      {/* Discovery Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Theme Footprints</p>
                <p className="text-2xl font-bold">{footprintStats.totalThemes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Plugin Footprints</p>
                <p className="text-2xl font-bold">{footprintStats.totalPlugins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Vulnerable Sites</p>
                <p className="text-2xl font-bold">{(footprintStats.estimatedSites / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{footprintStats.successRate}%</p>
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
          <TabsTrigger value="footprints">Footprint Database</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>WordPress Discovery Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure the WordPress footprint discovery and exploitation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="testUrl">Test URL (for link placement validation)</Label>
                <Input
                  id="testUrl"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://example.com"
                />
                <p className="text-sm text-gray-500">
                  This URL will be used to test successful link placement on discovered targets
                </p>
              </div>

              <div className="space-y-2">
                <Label>Target WordPress Themes</Label>
                <div className="flex flex-wrap gap-2">
                  <ThemeToggle theme="twentyten" />
                  <ThemeToggle theme="twentyeleven" />
                  <ThemeToggle theme="twentytwelve" />
                  <ThemeToggle theme="genesis" />
                  <ThemeToggle theme="avada" />
                  <ThemeToggle theme="divi" />
                  <ThemeToggle theme="enfold" />
                  <ThemeToggle theme="bridge" />
                </div>
                <p className="text-sm text-gray-500">
                  Themes to search for. Popular themes often have more sites but better security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="securityLevel">Maximum Security Level</Label>
                  <select
                    id="securityLevel"
                    value={securityLevel}
                    onChange={(e) => setSecurityLevel(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="weak">Weak (Highest success rate)</option>
                    <option value="moderate">Moderate (Balanced)</option>
                    <option value="strong">Strong (Lower success rate)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTargets">Maximum Targets</Label>
                  <Input
                    id="maxTargets"
                    type="number"
                    value={maxTargets}
                    onChange={(e) => setMaxTargets(parseInt(e.target.value) || 100)}
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This discovery method finds vulnerable WordPress installations with exploitable 
                  comment forms and weak security. All targets will be tested for successful link 
                  placement before being added to your platform rotation.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={startDiscovery}
                disabled={session?.status === 'discovering' || session?.status === 'testing' || session?.status === 'validating'}
                className="w-full"
                size="lg"
              >
                {session?.status === 'discovering' || session?.status === 'testing' || session?.status === 'validating' ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Discovering WordPress Targets...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start WordPress Discovery
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
                  <span>WordPress Discovery Progress</span>
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
                      <p className="text-2xl font-bold text-blue-600">{session.stats.discovered}</p>
                      <p className="text-sm text-gray-600">Discovered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{session.stats.linkTested}</p>
                      <p className="text-sm text-gray-600">Link Tested</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{session.stats.addedToRotation}</p>
                      <p className="text-sm text-gray-600">Added to Rotation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{session.stats.averageSuccessRate}%</p>
                      <p className="text-sm text-gray-600">Avg Success Rate</p>
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
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Discovery</h3>
                <p className="text-gray-600 mb-4">Start a WordPress discovery session to see progress here</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Configure Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {session?.targets && session.targets.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>WordPress Discovery Results</CardTitle>
                <CardDescription>
                  {session.targets.length} exploitable WordPress sites discovered and validated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.targets.slice(0, 20).map((target) => (
                    <div key={target.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{target.domain}</h4>
                            <p className="text-sm text-gray-600">{target.url}</p>
                          </div>
                          <Badge variant="secondary">Theme: {target.theme}</Badge>
                          <Badge variant={target.securityLevel === 'weak' ? 'destructive' : target.securityLevel === 'moderate' ? 'secondary' : 'default'}>
                            {target.securityLevel}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {target.commentFormDetected && <Badge variant="outline" className="text-green-600">Comment Form ✓</Badge>}
                          {target.vulnerabilities.map((vuln, idx) => (
                            <Badge key={idx} variant="outline" className="text-red-600">{vuln}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="font-medium">{Math.round(target.successRate)}%</p>
                      </div>
                    </div>
                  ))}
                  
                  {session.targets.length > 20 && (
                    <div className="text-center p-4 border rounded-lg bg-gray-50">
                      <p className="text-gray-600">
                        Showing 20 of {session.targets.length} results. 
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
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600 mb-4">Complete a WordPress discovery session to see results here</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Start Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="footprints" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(wordpressFootprints.themeFootprints).map(([key, category]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.description}</CardTitle>
                  <CardDescription>
                    {category.themes.length} themes tracked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.themes.slice(0, 5).map((theme, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{theme.name}</p>
                          <p className="text-xs text-gray-600">{theme.vulnerability}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">{theme.success_rate}%</Badge>
                          <Badge variant="outline" className="text-xs">{(theme.estimated_sites / 1000).toFixed(0)}k sites</Badge>
                        </div>
                      </div>
                    ))}
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
