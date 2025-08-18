import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Ban,
  RefreshCw,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Settings,
  BarChart3
} from 'lucide-react';
import { automaticPlatformFilter, type FilteringRule } from '@/services/automaticPlatformFilter';

interface FilteringStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  blacklistedPlatforms: number;
  temporarilyDisabled: number;
  averageSuccessRate: number;
}

export const AutomaticFilteringMonitor: React.FC = () => {
  const [stats, setStats] = useState<FilteringStats | null>(null);
  const [filteringRules, setFilteringRules] = useState<FilteringRule[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const filteringStats = await automaticPlatformFilter.getPlatformFilteringStats();
      setStats(filteringStats);
      
      const rules = automaticPlatformFilter.getFilteringRules();
      setFilteringRules(rules);
    } catch (error) {
      console.error('Error loading filtering stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      automaticPlatformFilter.stopMonitoring();
      setIsMonitoring(false);
    } else {
      automaticPlatformFilter.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const toggleRule = (ruleId: string) => {
    const rule = filteringRules.find(r => r.id === ruleId);
    if (rule) {
      automaticPlatformFilter.updateFilteringRule(ruleId, { isActive: !rule.isActive });
      setFilteringRules(prev => 
        prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r)
      );
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'blacklist': return <Ban className="w-4 h-4 text-red-600" />;
      case 'temporary_disable': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'mark_unreliable': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'consecutive_failures': return 'Consecutive Failures';
      case 'timeout_threshold': return 'Timeout Threshold';
      case 'success_rate': return 'Low Success Rate';
      case 'error_pattern': return 'Error Pattern Match';
      default: return condition;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'blacklist': return 'Blacklist';
      case 'temporary_disable': return 'Temporary Disable';
      case 'mark_unreliable': return 'Mark Unreliable';
      default: return action;
    }
  };

  useEffect(() => {
    loadStats();
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 animate-pulse" />
            Loading Filtering Monitor...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle>Automatic Platform Filtering</CardTitle>
            {isMonitoring && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMonitoring}
              className={isMonitoring ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          Automatically monitors publishing attempts and removes failed platforms to prevent retry failures
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Filtering Rules</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
                    <div className="text-sm text-blue-600">Total Attempts</div>
                    <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.successfulAttempts}</div>
                    <div className="text-sm text-green-600">Successful</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.averageSuccessRate}% success rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
                    <div className="text-sm text-red-600">Failed</div>
                    <div className="text-xs text-gray-500 mt-1">Auto-filtered</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.blacklistedPlatforms}</div>
                    <div className="text-sm text-orange-600">Blacklisted</div>
                    <div className="text-xs text-gray-500 mt-1">Permanently removed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.temporarilyDisabled}</div>
                    <div className="text-sm text-yellow-600">Disabled</div>
                    <div className="text-xs text-gray-500 mt-1">Temporarily paused</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.averageSuccessRate}%</div>
                    <div className="text-sm text-purple-600">Success Rate</div>
                    <div className="text-xs text-gray-500 mt-1">Overall performance</div>
                  </div>
                </div>

                {/* Success Rate Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Platform Success Rate</span>
                    <span className="text-sm text-gray-500">{stats.averageSuccessRate}%</span>
                  </div>
                  <Progress 
                    value={stats.averageSuccessRate} 
                    className={`h-3 ${stats.averageSuccessRate >= 80 ? 'bg-green-100' : stats.averageSuccessRate >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}
                  />
                  <div className="text-xs text-gray-500">
                    {stats.averageSuccessRate >= 80 ? 'Excellent performance' :
                     stats.averageSuccessRate >= 60 ? 'Good performance' :
                     stats.averageSuccessRate >= 40 ? 'Fair performance' : 'Poor performance - check platforms'}
                  </div>
                </div>

                {/* Status Alerts */}
                {stats.blacklistedPlatforms > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <Ban className="h-4 w-4" />
                    <AlertDescription className="text-red-700">
                      <strong>{stats.blacklistedPlatforms} platforms blacklisted</strong> due to repeated failures. 
                      These platforms have been automatically removed from campaign rotation.
                    </AlertDescription>
                  </Alert>
                )}

                {stats.temporarilyDisabled > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-yellow-700">
                      <strong>{stats.temporarilyDisabled} platforms temporarily disabled</strong> due to recent failures. 
                      They will be re-enabled automatically after the timeout period.
                    </AlertDescription>
                  </Alert>
                )}

                {stats.averageSuccessRate >= 90 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">
                      <strong>Excellent performance!</strong> Platform filtering is working effectively with {stats.averageSuccessRate}% success rate.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Active Filtering Rules</h4>
              <Badge variant="outline">
                {filteringRules.filter(r => r.isActive).length} of {filteringRules.length} active
              </Badge>
            </div>

            <div className="space-y-3">
              {filteringRules.map((rule) => (
                <div key={rule.id} className={`p-4 border rounded-lg ${rule.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getActionIcon(rule.action)}
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-gray-600">{getConditionLabel(rule.condition)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Threshold:</span>
                      <span className="font-medium">
                        {rule.condition === 'timeout_threshold' ? `${rule.threshold}ms` :
                         rule.condition === 'success_rate' ? `${rule.threshold}%` :
                         rule.threshold}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Action:</span>
                      <span className="font-medium">{getActionLabel(rule.action)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="border-blue-200 bg-blue-50 mt-4">
              <Settings className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                Filtering rules automatically monitor publishing attempts and take action when platforms fail. 
                Adjust thresholds and actions based on your campaign requirements and platform reliability expectations.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="font-medium mb-2">Recent Filtering Activity</h4>
              <p className="text-sm">
                Activity log will show recent automatic filtering actions here.
                {!isMonitoring && (
                  <><br />Start monitoring to begin tracking platform performance.</>
                )}
              </p>
              {!isMonitoring && (
                <Button 
                  className="mt-4" 
                  onClick={toggleMonitoring}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Monitoring
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutomaticFilteringMonitor;
