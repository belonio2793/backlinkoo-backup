import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { contentFilterService } from '@/services/contentFilterService';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  Settings,
  TestTube,
  AlertCircle,
  BarChart3,
  Clock,
  Filter,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

export function ContentFilterManager() {
  const { toast } = useToast();
  
  // Filter configuration state
  const [config, setConfig] = useState({
    enabled: true,
    blockExplicitContent: true,
    blockGambling: true,
    blockAdultContent: true,
    blockHateSpeech: true,
    customBlockedTerms: [] as string[],
    whitelist: [] as string[]
  });

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    blocked: 0,
    allowed: 0,
    blockRate: '0',
    byCategory: {},
    topBlockedTerms: []
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [newBlockedTerm, setNewBlockedTerm] = useState('');
  const [newWhitelistTerm, setNewWhitelistTerm] = useState('');

  useEffect(() => {
    loadConfiguration();
    loadStatistics();
  }, []);

  const loadConfiguration = async () => {
    try {
      const currentConfig = contentFilterService.getConfiguration();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content filter configuration',
        variant: 'destructive'
      });
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const filterStats = await contentFilterService.getFilterStats(7);
      setStats(filterStats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      await contentFilterService.updateConfiguration(config);
      toast({
        title: 'Configuration Saved',
        description: 'Content filter settings have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  const testContentFilter = () => {
    if (!testContent.trim()) {
      toast({
        title: 'Test Content Required',
        description: 'Please enter some content to test',
        variant: 'destructive'
      });
      return;
    }

    const result = contentFilterService.testContent(testContent);
    setTestResult(result);
  };

  const addBlockedTerm = () => {
    if (!newBlockedTerm.trim()) return;
    
    const updatedTerms = [...config.customBlockedTerms, newBlockedTerm.trim()];
    setConfig({ ...config, customBlockedTerms: updatedTerms });
    setNewBlockedTerm('');
  };

  const removeBlockedTerm = (index: number) => {
    const updatedTerms = config.customBlockedTerms.filter((_, i) => i !== index);
    setConfig({ ...config, customBlockedTerms: updatedTerms });
  };

  const addWhitelistTerm = () => {
    if (!newWhitelistTerm.trim()) return;
    
    const updatedTerms = [...config.whitelist, newWhitelistTerm.trim()];
    setConfig({ ...config, whitelist: updatedTerms });
    setNewWhitelistTerm('');
  };

  const removeWhitelistTerm = (index: number) => {
    const updatedTerms = config.whitelist.filter((_, i) => i !== index);
    setConfig({ ...config, whitelist: updatedTerms });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Content Filter Management
          </h2>
          <p className="text-gray-600">
            Configure content filtering to block explicit terms and inappropriate content
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStatistics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
          <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
            <Settings className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                <div className="text-sm text-gray-600">Blocked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.allowed}</div>
                <div className="text-sm text-gray-600">Allowed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.blockRate}%</div>
                <div className="text-sm text-gray-600">Block Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Filter Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Content Filtering Enabled</Label>
                <p className="text-sm text-gray-600">Master switch for all content filtering</p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="explicit">Block Explicit Content</Label>
                <p className="text-sm text-gray-600">Block adult, pornographic, and explicit material</p>
              </div>
              <Switch
                id="explicit"
                checked={config.blockExplicitContent}
                onCheckedChange={(checked) => setConfig({ ...config, blockExplicitContent: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="gambling">Block Gambling Content</Label>
                <p className="text-sm text-gray-600">Block casino, betting, and gambling-related content</p>
              </div>
              <Switch
                id="gambling"
                checked={config.blockGambling}
                onCheckedChange={(checked) => setConfig({ ...config, blockGambling: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="adult">Block Adult Content</Label>
                <p className="text-sm text-gray-600">Block mature and adult-oriented content</p>
              </div>
              <Switch
                id="adult"
                checked={config.blockAdultContent}
                onCheckedChange={(checked) => setConfig({ ...config, blockAdultContent: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hate">Block Hate Speech</Label>
                <p className="text-sm text-gray-600">Block discriminatory and offensive content</p>
              </div>
              <Switch
                id="hate"
                checked={config.blockHateSpeech}
                onCheckedChange={(checked) => setConfig({ ...config, blockHateSpeech: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Tester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Content Filter Tester
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testContent">Test Content</Label>
              <Textarea
                id="testContent"
                placeholder="Enter content to test against the current filter settings..."
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={testContentFilter} className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              Test Content
            </Button>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.isAllowed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.isAllowed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {testResult.isAllowed ? 'Content Allowed' : 'Content Blocked'}
                  </span>
                  {!testResult.isAllowed && (
                    <Badge className={getSeverityColor(testResult.severity)}>
                      {testResult.severity.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {!testResult.isAllowed && (
                  <>
                    <p className="text-sm text-gray-700 mb-2">{testResult.reason}</p>
                    
                    {testResult.blockedTerms.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Blocked Terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {testResult.blockedTerms.map((term: string, index: number) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {testResult.suggestions && testResult.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {testResult.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Terms Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Blocked Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Custom Blocked Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add blocked term..."
                value={newBlockedTerm}
                onChange={(e) => setNewBlockedTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addBlockedTerm()}
              />
              <Button onClick={addBlockedTerm} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {config.customBlockedTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <span className="text-sm">{term}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlockedTerm(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {config.customBlockedTerms.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No custom blocked terms</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Whitelist Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Whitelist Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add whitelisted term..."
                value={newWhitelistTerm}
                onChange={(e) => setNewWhitelistTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addWhitelistTerm()}
              />
              <Button onClick={addWhitelistTerm} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {config.whitelist.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                  <span className="text-sm">{term}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWhitelistTerm(index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {config.whitelist.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No whitelisted terms</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Blocked Terms */}
      {stats.topBlockedTerms && stats.topBlockedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Most Frequently Blocked Terms (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topBlockedTerms.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <span className="text-sm font-medium">{item.term}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {config.enabled ? (
              <>
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Content filtering is active</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-600 font-medium">Content filtering is disabled</span>
              </>
            )}
            <div className="ml-auto text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
