/**
 * Predictive Campaign Dashboard
 * Real-time display of predictive algorithm metrics with premium modal integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Clock, 
  Award,
  AlertTriangle,
  Crown,
  Sparkles,
  Activity,
  DollarSign,
  Globe,
  Link
} from 'lucide-react';
import { usePredictiveCampaignAlgorithm, useAllPredictiveCampaigns, usePremiumLimitMonitor } from '@/hooks/usePredictiveCampaignAlgorithm';
import { useCampaignCounters } from '@/hooks/useCampaignCounters';
import { PremiumPlanModal } from '@/components/PremiumPlanModal';

interface PredictiveCampaignDashboardProps {
  campaignId?: string;
  isPremium?: boolean;
  compact?: boolean;
  showGlobalMetrics?: boolean;
}

export function PredictiveCampaignDashboard({ 
  campaignId, 
  isPremium = false, 
  compact = false,
  showGlobalMetrics = true 
}: PredictiveCampaignDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  const {
    predictiveMetrics,
    isLoading,
    isAtLimit,
    showPremiumModal,
    upgradeRecommended,
    openPremiumModal,
    closePremiumModal,
    formatMetric,
    getPerformanceColor,
    getStatusIndicator,
    initializePredictive
  } = usePredictiveCampaignAlgorithm({
    campaignId,
    isPremium,
    autoStart: true,
    enablePremiumModal: true
  });

  const { globalCounters } = useCampaignCounters();
  const { allMetrics } = useAllPredictiveCampaigns();
  const { totalLimitedCampaigns, isAnyAtLimit } = usePremiumLimitMonitor();

  // Initialize predictive metrics if not already done
  useEffect(() => {
    if (campaignId && !predictiveMetrics) {
      initializePredictive(campaignId, isPremium);
    }
  }, [campaignId, isPremium, predictiveMetrics, initializePredictive]);

  if (isLoading && !predictiveMetrics) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
            <span className="text-sm text-gray-600">Initializing predictive algorithm...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictiveMetrics && campaignId) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No predictive data available</p>
            <Button 
              size="sm" 
              className="mt-2"
              onClick={() => campaignId && initializePredictive(campaignId, isPremium)}
            >
              Initialize Algorithm
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = campaignId ? getStatusIndicator(campaignId) : null;

  if (compact) {
    return (
      <>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Predictive Engine</span>
                {statusInfo && (
                  <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
              {isAtLimit && (
                <Button size="sm" variant="outline" onClick={openPremiumModal}>
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
            
            {predictiveMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatMetric(predictiveMetrics.predictedLinksPerHour)}
                  </div>
                  <div className="text-xs text-gray-500">Links/Hour</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatMetric(predictiveMetrics.activityScore, 'percentage')}
                  </div>
                  <div className="text-xs text-gray-500">Activity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {formatMetric(predictiveMetrics.efficiencyRating, 'percentage')}
                  </div>
                  <div className="text-xs text-gray-500">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {formatMetric(predictiveMetrics.projectedROI, 'percentage')}
                  </div>
                  <div className="text-xs text-gray-500">ROI</div>
                </div>
              </div>
            )}

            {isAtLimit && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-700">
                    Monthly limit reached ({predictiveMetrics?.monthlyLinksUsed}/{predictiveMetrics?.monthlyLinksLimit})
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showPremiumModal && (
          <PremiumPlanModal 
            isOpen={showPremiumModal}
            onClose={closePremiumModal}
            trigger="limit_reached"
            campaignId={campaignId}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Predictive Campaign Engine</h2>
              <p className="text-sm text-gray-600">
                Real-time auto-populating metrics with advanced calculations
              </p>
            </div>
          </div>
          
          {isAnyAtLimit && (
            <Badge variant="outline" className="text-red-600 bg-red-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalLimitedCampaigns} Limited
            </Badge>
          )}
        </div>

        {/* Main Metrics Grid */}
        {predictiveMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Predicted Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Links/Hour</span>
                      <span className="text-sm font-semibold">
                        {formatMetric(predictiveMetrics.predictedLinksPerHour)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (predictiveMetrics.predictedLinksPerHour / 50) * 100)} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Domains/Day</span>
                      <span className="text-sm font-semibold">
                        {formatMetric(predictiveMetrics.predictedDomainsPerDay)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (predictiveMetrics.predictedDomainsPerDay / 200) * 100)} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Reach Potential</span>
                      <span className="text-sm font-semibold">
                        {formatMetric(predictiveMetrics.estimatedReachPotential)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (predictiveMetrics.estimatedReachPotential / 100000) * 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity & Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Activity Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(predictiveMetrics.activityScore)}`}>
                      {formatMetric(predictiveMetrics.activityScore, 'percentage')}
                    </div>
                    <div className="text-xs text-gray-500">Activity Level</div>
                  </div>
                  <Progress value={predictiveMetrics.activityScore} className="h-3" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Efficiency</span>
                      <div className={`font-semibold ${getPerformanceColor(predictiveMetrics.efficiencyRating)}`}>
                        {formatMetric(predictiveMetrics.efficiencyRating, 'percentage')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Scalability</span>
                      <div className={`font-semibold ${getPerformanceColor(predictiveMetrics.scalabilityIndex)}`}>
                        {formatMetric(predictiveMetrics.scalabilityIndex, 'percentage')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Runtime Analytics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Runtime Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Total Runtime</span>
                    <div className="text-lg font-semibold">
                      {Math.floor(predictiveMetrics.totalRuntime / 60)}h {Math.floor(predictiveMetrics.totalRuntime % 60)}m
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Avg Links/Min</span>
                    <div className="text-lg font-semibold">
                      {predictiveMetrics.avgLinksPerMinute}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Peak Performance</span>
                    <div className="text-lg font-semibold">
                      {formatMetric(predictiveMetrics.peakPerformanceHour)}/hr
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Consistency</span>
                    <div className={`text-sm font-semibold ${getPerformanceColor(predictiveMetrics.consistencyScore)}`}>
                      {formatMetric(predictiveMetrics.consistencyScore, 'percentage')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Limits & ROI */}
            <Card className={isAtLimit ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {isAtLimit ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-green-500" />
                  )}
                  {isAtLimit ? 'Limit Reached' : 'ROI & Limits'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Projected ROI</span>
                    <div className={`text-lg font-semibold ${getPerformanceColor(Math.abs(predictiveMetrics.projectedROI))}`}>
                      {formatMetric(predictiveMetrics.projectedROI, 'percentage')}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Monthly Usage</span>
                      <span className={`text-xs font-medium ${isAtLimit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMetric(predictiveMetrics.monthlyLinksUsed)}/{formatMetric(predictiveMetrics.monthlyLinksLimit)}
                      </span>
                    </div>
                    <Progress 
                      value={(predictiveMetrics.monthlyLinksUsed / predictiveMetrics.monthlyLinksLimit) * 100}
                      className={`h-2 ${isAtLimit ? 'bg-red-100' : ''}`}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Resets in {predictiveMetrics.daysUntilReset} days
                  </div>
                  
                  {(isAtLimit || upgradeRecommended) && (
                    <Button 
                      size="sm" 
                      className="w-full" 
                      variant={isAtLimit ? "default" : "outline"}
                      onClick={openPremiumModal}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {isAtLimit ? 'Upgrade Now' : 'Recommended'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Metrics Section */}
        {showGlobalMetrics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Global Discovery Engine Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatMetric(globalCounters.totalUrls)}
                  </div>
                  <div className="text-xs text-gray-500">Total URLs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatMetric(globalCounters.totalDomains)}
                  </div>
                  <div className="text-xs text-gray-500">Total Domains</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatMetric(globalCounters.activeCampaigns)}
                  </div>
                  <div className="text-xs text-gray-500">Active Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatMetric(globalCounters.totalLinksPublished)}
                  </div>
                  <div className="text-xs text-gray-500">Links Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {formatMetric(globalCounters.globalSuccessRate, 'percentage')}
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatMetric(globalCounters.averageQuality, 'percentage')}
                  </div>
                  <div className="text-xs text-gray-500">Avg Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Campaigns Overview */}
        {allMetrics.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                All Campaigns Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(allMetrics.entries()).map(([id, metrics]) => {
                  const status = getStatusIndicator(id);
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                        <span className="text-sm font-medium">{id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-blue-600">
                          {formatMetric(metrics.predictedLinksPerHour)}/hr
                        </div>
                        <div className={getPerformanceColor(metrics.activityScore)}>
                          {formatMetric(metrics.activityScore, 'percentage')}
                        </div>
                        <div className="text-gray-500">
                          {formatMetric(metrics.monthlyLinksUsed)}/{formatMetric(metrics.monthlyLinksLimit)}
                        </div>
                        {metrics.isAtLimit && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showPremiumModal && (
        <PremiumPlanModal 
          isOpen={showPremiumModal}
          onClose={closePremiumModal}
          trigger="limit_reached"
          campaignId={campaignId}
        />
      )}
    </>
  );
}
