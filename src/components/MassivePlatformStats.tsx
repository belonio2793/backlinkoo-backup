import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  TrendingUp, 
  Globe, 
  Shield, 
  Users, 
  Star,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { PlatformConfigService } from '@/services/platformConfigService';
import { massivePlatformManager } from '@/services/massivePlatformManager';

interface PlatformStats {
  total: number;
  active: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  averageDA: number;
  highAuthorityCount: number;
}

export const MassivePlatformStats: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [massiveModeEnabled, setMassiveModeEnabled] = useState(true);

  const loadStats = async () => {
    try {
      const platformStats = PlatformConfigService.getPlatformStats();
      setStats(platformStats);
    } catch (error) {
      console.error('Error loading platform stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    PlatformConfigService.refreshPlatforms();
    await loadStats();
  };

  const toggleMassiveMode = () => {
    const newMode = !massiveModeEnabled;
    setMassiveModeEnabled(newMode);
    PlatformConfigService.setMassivePlatformMode(newMode);
    setIsLoading(true);
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 animate-pulse" />
            Loading Platform Database...
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

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Database className="w-5 h-5" />
            Platform Database Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load platform statistics</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web2_platforms': return <Globe className="w-4 h-4" />;
      case 'social_bookmarking': return <Users className="w-4 h-4" />;
      case 'directory_submission': return <Database className="w-4 h-4" />;
      case 'profile_creation': return <Users className="w-4 h-4" />;
      case 'forum_communities': return <Users className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle>Platform Database</CardTitle>
            {massiveModeEnabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                Massive Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMassiveMode}
              className={massiveModeEnabled ? 'bg-green-50 border-green-300' : ''}
            >
              {massiveModeEnabled ? 'Disable' : 'Enable'} Massive Mode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          {massiveModeEnabled 
            ? `Intelligent platform management with ${stats.active.toLocaleString()} active publishing opportunities`
            : 'Basic platform rotation with curated platforms'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Total Platforms</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
                <div className="text-sm text-green-600">Active Platforms</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.averageDA}</div>
                <div className="text-sm text-purple-600">Average DA</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.highAuthorityCount.toLocaleString()}</div>
                <div className="text-sm text-orange-600">High Authority (DA 80+)</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform Utilization</span>
                <span className="text-sm text-gray-500">
                  {((stats.active / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(stats.active / stats.total) * 100} 
                className="h-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-3">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <div>
                      <div className="font-medium">{formatCategoryName(category)}</div>
                      <div className="text-sm text-gray-500">{count.toLocaleString()} platforms</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {((count / stats.active) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Automation Difficulty
              </h4>
              <div className="grid gap-2">
                {Object.entries(stats.byDifficulty).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex items-center justify-between p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(difficulty)}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </Badge>
                      <span className="text-sm">{count.toLocaleString()} platforms</span>
                    </div>
                    <Progress 
                      value={(count / stats.active) * 100} 
                      className="w-24 h-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Quality Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">High Authority Sites:</span>
                  <span className="ml-2 font-medium">{stats.highAuthorityCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Average Domain Authority:</span>
                  <span className="ml-2 font-medium">{stats.averageDA}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {massiveModeEnabled && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Massive Mode Active</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Using intelligent platform selection from {stats.active.toLocaleString()} high-quality platforms 
              with automated difficulty assessment and domain authority filtering.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MassivePlatformStats;
