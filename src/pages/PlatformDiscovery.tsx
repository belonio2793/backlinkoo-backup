import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Globe, 
  Target,
  Database,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  MessageSquare,
  FileText,
  Users,
  Link,
  TrendingUp,
  Filter,
  Download,
  Upload,
  Zap,
  Settings,
  BarChart3,
  Shield,
  Clock,
  Star,
  AlertTriangle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { platformDiscoveryService } from '@/services/platformDiscoveryService';

interface DiscoveryTarget {
  id: string;
  url: string;
  domain: string;
  title?: string;
  type: 'wordpress_comment' | 'guest_posting' | 'forum' | 'directory' | 'web2' | 'contextual' | 'social';
  linkOpportunities: string[];
  domainAuthority?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number;
  linkType: 'dofollow' | 'nofollow' | 'mixed';
  requirements: string[];
  discoveryMethod: string;
  lastChecked?: Date;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'integrated';
  metadata: {
    platform?: string;
    category?: string;
    traffic?: number;
    responseTime?: number;
    securityLevel?: string;
    contentRequirements?: string[];
    submissionMethod?: string;
  };
}

interface DiscoveryConfig {
  keywords: string[];
  targetTypes: string[];
  minDomainAuthority: number;
  maxDifficulty: string;
  includeDofollow: boolean;
  includeNofollow: boolean;
  regions: string[];
  languages: string[];
  maxResults: number;
}

interface DiscoveryStats {
  totalFound: number;
  validated: number;
  integrated: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  averageDomainAuthority: number;
  averageSuccessRate: number;
}

const PlatformDiscovery = () => {
  const [discoveredTargets, setDiscoveredTargets] = useState<DiscoveryTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [integrationProgress, setIntegrationProgress] = useState(0);
  
  const [config, setConfig] = useState<DiscoveryConfig>({
    keywords: [],
    targetTypes: ['wordpress_comment', 'guest_posting', 'forum', 'directory'],
    minDomainAuthority: 20,
    maxDifficulty: 'medium',
    includeDofollow: true,
    includeNofollow: true,
    regions: ['US', 'UK', 'CA', 'AU'],
    languages: ['en'],
    maxResults: 100
  });

  const [stats, setStats] = useState<DiscoveryStats>({
    totalFound: 0,
    validated: 0,
    integrated: 0,
    byType: {},
    byDifficulty: {},
    averageDomainAuthority: 0,
    averageSuccessRate: 0
  });

  const [activeKeyword, setActiveKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const { toast } = useToast();

  // Discovery methods available
  const discoveryMethods = [
    {
      id: 'footprint_analysis',
      name: 'Footprint Analysis',
      description: 'Advanced search footprints to find platform opportunities',
      icon: Search,
      targetTypes: ['wordpress_comment', 'forum', 'directory'],
      estimatedResults: '500-2000'
    },
    {
      id: 'competitor_backlinks',
      name: 'Competitor Backlink Analysis',
      description: 'Analyze competitor backlinks to find link opportunities',
      icon: BarChart3,
      targetTypes: ['guest_posting', 'contextual', 'directory'],
      estimatedResults: '100-500'
    },
    {
      id: 'web2_platforms',
      name: 'Web 2.0 Platform Discovery',
      description: 'Find high-authority Web 2.0 platforms for content publishing',
      icon: Globe,
      targetTypes: ['web2'],
      estimatedResults: '50-200'
    },
    {
      id: 'forum_discovery',
      name: 'Forum & Community Discovery',
      description: 'Discover active forums and communities for engagement',
      icon: Users,
      targetTypes: ['forum'],
      estimatedResults: '200-800'
    },
    {
      id: 'guest_posting',
      name: 'Guest Posting Opportunities',
      description: 'Find sites accepting guest posts and submissions',
      icon: FileText,
      targetTypes: ['guest_posting'],
      estimatedResults: '50-300'
    },
    {
      id: 'social_platforms',
      name: 'Social Platform Discovery',
      description: 'Discover social platforms for profile and content links',
      icon: Users,
      targetTypes: ['social'],
      estimatedResults: '100-400'
    }
  ];

  // Platform types
  const platformTypes = [
    { id: 'wordpress_comment', name: 'WordPress Comments', color: 'bg-blue-50 text-blue-700', icon: MessageSquare },
    { id: 'guest_posting', name: 'Guest Posting', color: 'bg-green-50 text-green-700', icon: FileText },
    { id: 'forum', name: 'Forums', color: 'bg-purple-50 text-purple-700', icon: Users },
    { id: 'directory', name: 'Directories', color: 'bg-orange-50 text-orange-700', icon: Database },
    { id: 'web2', name: 'Web 2.0', color: 'bg-indigo-50 text-indigo-700', icon: Globe },
    { id: 'contextual', name: 'Contextual Links', color: 'bg-pink-50 text-pink-700', icon: Link },
    { id: 'social', name: 'Social Platforms', color: 'bg-cyan-50 text-cyan-700', icon: Users }
  ];

  // Start comprehensive discovery
  const startDiscovery = async (methods: string[] = ['footprint_analysis']) => {
    setIsDiscovering(true);
    setDiscoveryProgress(0);
    setDiscoveredTargets([]);

    try {
      toast({
        title: "🚀 Starting Platform Discovery",
        description: `Running ${methods.length} discovery method(s)...`,
      });

      let allTargets: DiscoveryTarget[] = [];
      
      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        const methodInfo = discoveryMethods.find(m => m.id === method);
        
        toast({
          title: `🔍 ${methodInfo?.name}`,
          description: methodInfo?.description,
        });

        // Run discovery method
        const targets = await platformDiscoveryService.runDiscoveryMethod(method, config);
        allTargets.push(...targets);

        setDiscoveredTargets([...allTargets]);
        setDiscoveryProgress(((i + 1) / methods.length) * 100);

        // Rate limiting between methods
        if (i < methods.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update stats
      updateStats(allTargets);

      toast({
        title: "✅ Discovery Complete",
        description: `Found ${allTargets.length} potential link opportunities`,
      });

    } catch (error) {
      toast({
        title: "❌ Discovery Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Validate discovered targets
  const validateTargets = async (targets: DiscoveryTarget[] = discoveredTargets) => {
    setIsValidating(true);
    setValidationProgress(0);

    try {
      toast({
        title: "🔍 Validating Targets",
        description: `Checking ${targets.length} discovered platforms...`,
      });

      const validatedTargets = await platformDiscoveryService.validateTargets(targets, (progress) => {
        setValidationProgress(progress);
      });

      setDiscoveredTargets(validatedTargets);
      updateStats(validatedTargets);

      const validCount = validatedTargets.filter(t => t.status === 'valid').length;
      const invalidCount = validatedTargets.filter(t => t.status === 'invalid').length;

      toast({
        title: "✅ Validation Complete",
        description: `${validCount} valid, ${invalidCount} invalid platforms`,
      });

    } catch (error) {
      toast({
        title: "❌ Validation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Integrate selected targets into main automation system
  const integrateTargets = async () => {
    if (selectedTargets.size === 0) {
      toast({
        title: "❌ No Targets Selected",
        description: "Please select targets to integrate",
        variant: "destructive"
      });
      return;
    }

    setIsIntegrating(true);
    setIntegrationProgress(0);

    try {
      const targetsToIntegrate = discoveredTargets.filter(t => selectedTargets.has(t.id));
      
      toast({
        title: "🔗 Integrating Platforms",
        description: `Adding ${targetsToIntegrate.length} platforms to automation system...`,
      });

      const result = await platformDiscoveryService.integratePlatforms(targetsToIntegrate, (progress) => {
        setIntegrationProgress(progress);
      });

      // Update target status
      setDiscoveredTargets(prev => prev.map(target => 
        selectedTargets.has(target.id) ? { ...target, status: 'integrated' } : target
      ));

      updateStats(discoveredTargets);

      toast({
        title: "✅ Integration Complete",
        description: `${result.successful} platforms added, ${result.failed} failed`,
      });

      // Clear selection
      setSelectedTargets(new Set());

    } catch (error) {
      toast({
        title: "❌ Integration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsIntegrating(false);
    }
  };

  // Update statistics
  const updateStats = (targets: DiscoveryTarget[]) => {
    const byType: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    let totalDA = 0;
    let totalSuccessRate = 0;

    targets.forEach(target => {
      byType[target.type] = (byType[target.type] || 0) + 1;
      byDifficulty[target.difficulty] = (byDifficulty[target.difficulty] || 0) + 1;
      totalDA += target.domainAuthority || 0;
      totalSuccessRate += target.successRate;
    });

    setStats({
      totalFound: targets.length,
      validated: targets.filter(t => t.status === 'valid').length,
      integrated: targets.filter(t => t.status === 'integrated').length,
      byType,
      byDifficulty,
      averageDomainAuthority: targets.length > 0 ? Math.round(totalDA / targets.length) : 0,
      averageSuccessRate: targets.length > 0 ? Math.round(totalSuccessRate / targets.length) : 0
    });
  };

  // Filter targets
  const filteredTargets = discoveredTargets.filter(target => {
    if (filterType !== 'all' && target.type !== filterType) return false;
    if (filterDifficulty !== 'all' && target.difficulty !== filterDifficulty) return false;
    return true;
  });

  // Toggle target selection
  const toggleTargetSelection = (targetId: string) => {
    setSelectedTargets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(targetId)) {
        newSet.delete(targetId);
      } else {
        newSet.add(targetId);
      }
      return newSet;
    });
  };

  // Select all filtered targets
  const selectAllFiltered = () => {
    const validTargets = filteredTargets.filter(t => t.status === 'valid').map(t => t.id);
    setSelectedTargets(new Set(validTargets));
  };

  // Get platform type info
  const getPlatformType = (type: string) => {
    return platformTypes.find(pt => pt.id === type) || platformTypes[0];
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validating': return <Eye className="w-4 h-4 animate-pulse text-purple-600" />;
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'invalid': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'integrated': return <Zap className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1800px] mx-auto space-y-6">
          
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900">Platform Discovery</h1>
              <Badge variant="secondary" className="text-sm">Advanced Footprint Analysis</Badge>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover link building opportunities across the web using advanced scraping and footprint analysis. 
              Find WordPress blogs, guest posting sites, forums, directories, and more.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Found</p>
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
                    <p className="text-sm text-gray-600">Validated</p>
                    <p className="text-xl font-bold text-green-600">{stats.validated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Integrated</p>
                    <p className="text-xl font-bold text-blue-600">{stats.integrated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg DA</p>
                    <p className="text-xl font-bold text-purple-600">{stats.averageDomainAuthority}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-bold text-orange-600">{stats.averageSuccessRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Selected</p>
                    <p className="text-xl font-bold text-indigo-600">{selectedTargets.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="discovery" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="discovery">Discovery Methods</TabsTrigger>
              <TabsTrigger value="results">Results & Validation</TabsTrigger>
              <TabsTrigger value="integration">Platform Integration</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Discovery Methods
                  </CardTitle>
                  <CardDescription>
                    Choose discovery methods to find link building opportunities across different platform types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Quick Keywords Input */}
                  <div className="space-y-2">
                    <Label>Target Keywords (comma-separated)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="SEO, digital marketing, web development..."
                        value={activeKeyword}
                        onChange={(e) => setActiveKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && activeKeyword.trim()) {
                            const newKeywords = activeKeyword.split(',').map(k => k.trim()).filter(k => k);
                            setConfig(prev => ({
                              ...prev,
                              keywords: [...new Set([...prev.keywords, ...newKeywords])]
                            }));
                            setActiveKeyword('');
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (activeKeyword.trim()) {
                            const newKeywords = activeKeyword.split(',').map(k => k.trim()).filter(k => k);
                            setConfig(prev => ({
                              ...prev,
                              keywords: [...new Set([...prev.keywords, ...newKeywords])]
                            }));
                            setActiveKeyword('');
                          }
                        }}
                        disabled={!activeKeyword.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {/* Keywords Display */}
                    {config.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.keywords.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="cursor-pointer"
                            onClick={() => {
                              setConfig(prev => ({
                                ...prev,
                                keywords: prev.keywords.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            {keyword} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discovery Methods Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {discoveryMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Icon className="w-6 h-6 text-blue-600" />
                                <div>
                                  <h3 className="font-semibold">{method.name}</h3>
                                  <p className="text-sm text-gray-600">{method.description}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  {method.targetTypes.map(type => {
                                    const platformType = getPlatformType(type);
                                    return (
                                      <Badge key={type} className={platformType.color} variant="outline">
                                        {platformType.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>Est. Results: {method.estimatedResults}</span>
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full"
                                onClick={() => startDiscovery([method.id])}
                                disabled={isDiscovering || config.keywords.length === 0}
                              >
                                {isDiscovering ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Discovering...
                                  </>
                                ) : (
                                  <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Start Discovery
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Bulk Discovery */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-900">Run All Discovery Methods</h3>
                          <p className="text-sm text-blue-700">
                            Execute all discovery methods for comprehensive platform identification
                          </p>
                        </div>
                        <Button 
                          size="lg"
                          onClick={() => startDiscovery(discoveryMethods.map(m => m.id))}
                          disabled={isDiscovering || config.keywords.length === 0}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isDiscovering ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Run All Methods
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discovery Progress */}
                  {isDiscovering && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Discovery Progress</span>
                            <span>{Math.round(discoveryProgress)}%</span>
                          </div>
                          <Progress value={discoveryProgress} />
                          <div className="text-xs text-gray-500 flex items-center gap-4">
                            <span>• Footprint analysis</span>
                            <span>• Platform detection</span>
                            <span>• Opportunity scoring</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Discovery Results ({filteredTargets.length})
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => validateTargets()}
                        disabled={isValidating || discoveredTargets.length === 0}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Validate All
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={selectAllFiltered}
                        disabled={filteredTargets.length === 0}
                      >
                        Select All Valid
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Review, validate, and select platforms for integration into your automation system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Filters */}
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <Label>Type:</Label>
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="all">All Types</option>
                        {platformTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label>Difficulty:</Label>
                      <select 
                        value={filterDifficulty} 
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Validation Progress */}
                  {isValidating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Validation Progress</span>
                        <span>{Math.round(validationProgress)}%</span>
                      </div>
                      <Progress value={validationProgress} />
                    </div>
                  )}

                  {/* Results List */}
                  {filteredTargets.length === 0 ? (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        No platforms discovered yet. Start a discovery method to find link building opportunities.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-3">
                        {filteredTargets.map((target) => {
                          const platformType = getPlatformType(target.type);
                          const PlatformIcon = platformType.icon;
                          
                          return (
                            <Card 
                              key={target.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedTargets.has(target.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                              }`}
                              onClick={() => toggleTargetSelection(target.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <PlatformIcon className="w-5 h-5 text-gray-600" />
                                      <div>
                                        <h3 className="font-medium">{target.domain}</h3>
                                        <p className="text-sm text-gray-600">{target.title || target.url}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={platformType.color} variant="outline">
                                        {platformType.name}
                                      </Badge>
                                      <Badge variant="outline">
                                        {target.difficulty}
                                      </Badge>
                                      <Badge variant="outline">
                                        {target.linkType}
                                      </Badge>
                                      {target.domainAuthority && (
                                        <Badge variant="outline">
                                          DA {target.domainAuthority}
                                        </Badge>
                                      )}
                                      <Badge variant="outline">
                                        {target.successRate}% success
                                      </Badge>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600">
                                      <p><strong>Opportunities:</strong> {target.linkOpportunities.join(', ')}</p>
                                      <p><strong>Method:</strong> {target.discoveryMethod}</p>
                                      {target.requirements.length > 0 && (
                                        <p><strong>Requirements:</strong> {target.requirements.join(', ')}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(target.status)}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(target.url, '_blank');
                                      }}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Platform Integration
                  </CardTitle>
                  <CardDescription>
                    Integrate selected platforms into your automation system as active link building targets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {selectedTargets.size === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No platforms selected for integration. Go to Results tab and select platforms to integrate.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-900">Ready for Integration</h3>
                            <p className="text-sm text-blue-700">
                              {selectedTargets.size} platforms selected for integration into automation system
                            </p>
                          </div>
                          <Button
                            onClick={integrateTargets}
                            disabled={isIntegrating}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isIntegrating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Integrating...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Integrate Platforms
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Integration Progress */}
                      {isIntegrating && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Integration Progress</span>
                            <span>{Math.round(integrationProgress)}%</span>
                          </div>
                          <Progress value={integrationProgress} />
                          <div className="text-xs text-gray-500 flex items-center gap-4">
                            <span>• Adding to platform database</span>
                            <span>• Configuring automation settings</span>
                            <span>• Testing connectivity</span>
                          </div>
                        </div>
                      )}

                      {/* Selected Platforms Preview */}
                      <div className="space-y-3">
                        <h3 className="font-semibold">Selected Platforms:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Array.from(selectedTargets).map(targetId => {
                            const target = discoveredTargets.find(t => t.id === targetId);
                            if (!target) return null;
                            
                            const platformType = getPlatformType(target.type);
                            
                            return (
                              <div key={targetId} className="flex items-center gap-3 p-3 border rounded">
                                <platformType.icon className="w-4 h-4" />
                                <div className="flex-1">
                                  <p className="font-medium">{target.domain}</p>
                                  <p className="text-sm text-gray-600">{platformType.name}</p>
                                </div>
                                <Badge className={platformType.color} variant="outline">
                                  {target.difficulty}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Discovery Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure discovery parameters for optimal platform identification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Configuration options would go here */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Domain Authority</Label>
                      <Input
                        type="number"
                        value={config.minDomainAuthority}
                        onChange={(e) => setConfig(prev => ({ ...prev, minDomainAuthority: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Maximum Results</Label>
                      <Input
                        type="number"
                        value={config.maxResults}
                        onChange={(e) => setConfig(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlatformDiscovery;
