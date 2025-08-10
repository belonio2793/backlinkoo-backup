/**
 * Predictive Campaign Algorithm Service
 * Advanced predictive system that auto-populates values based on campaign activity,
 * reporting outputs, runtime calculations, and enforces premium limits
 */

import { campaignCounterService, type CampaignCounters, type GlobalCounters } from './campaignCounterService';

export interface PredictiveMetrics {
  // Current metrics
  linksPublished: number;
  domainsReached: number;
  successRate: number;
  totalClicks: number;
  velocity: number;
  qualityScore: number;
  
  // Predictive calculations
  predictedLinksPerHour: number;
  predictedDomainsPerDay: number;
  estimatedReachPotential: number;
  projectedROI: number;
  
  // Performance indicators
  activityScore: number;
  efficiencyRating: number;
  scalabilityIndex: number;
  
  // Runtime-based calculations
  totalRuntime: number;
  avgLinksPerMinute: number;
  peakPerformanceHour: number;
  consistencyScore: number;
  
  // Premium limit tracking
  monthlyLinksUsed: number;
  monthlyLinksLimit: number;
  isAtLimit: boolean;
  daysUntilReset: number;
  upgradeRecommended: boolean;
}

export interface PredictiveConfig {
  // Base calculation parameters
  baseLinksPerHour: number;
  baseDomainsPerHour: number;
  qualityMultiplier: number;
  experienceBonus: number;
  
  // Growth rates
  learningRate: number;
  optimizationFactor: number;
  scalingMultiplier: number;
  
  // Premium limits
  freeMonthlyLimit: number;
  premiumMonthlyLimit: number;
  limitResetDay: number;
  
  // Performance thresholds
  highPerformanceThreshold: number;
  excellenceThreshold: number;
  warningThreshold: number;
}

class PredictiveCampaignAlgorithm {
  private config: PredictiveConfig;
  private campaignMetrics: Map<string, PredictiveMetrics> = new Map();
  private reportingOutputs: Map<string, number[]> = new Map(); // Track outputs over time
  private premiumLimitCallbacks: Array<(campaignId: string, isAtLimit: boolean) => void> = [];

  constructor() {
    this.config = {
      // Base rates (conservative starting values)
      baseLinksPerHour: 15,
      baseDomainsPerHour: 8,
      qualityMultiplier: 1.2,
      experienceBonus: 0.15,
      
      // Growth and optimization
      learningRate: 0.08,
      optimizationFactor: 1.05,
      scalingMultiplier: 1.25,
      
      // Premium limits (20/20 plan)
      freeMonthlyLimit: 20,
      premiumMonthlyLimit: 1000,
      limitResetDay: 1, // First day of month
      
      // Performance thresholds
      highPerformanceThreshold: 85,
      excellenceThreshold: 95,
      warningThreshold: 60
    };
    
    this.loadPersistedMetrics();
    this.startPredictiveUpdates();
  }

  /**
   * Register callback for premium limit notifications
   */
  public onPremiumLimitReached(callback: (campaignId: string, isAtLimit: boolean) => void): void {
    this.premiumLimitCallbacks.push(callback);
  }

  /**
   * Initialize predictive metrics for a campaign
   */
  public initializePredictiveMetrics(campaignId: string, isPremium = false): PredictiveMetrics {
    const campaignCounters = campaignCounterService.getCampaignCounters(campaignId);
    if (!campaignCounters) {
      throw new Error(`Campaign ${campaignId} not found in counter service`);
    }

    const monthlyLimit = isPremium ? this.config.premiumMonthlyLimit : this.config.freeMonthlyLimit;
    const currentMonthUsage = this.getMonthlyUsage(campaignId);

    const metrics: PredictiveMetrics = {
      // Current metrics from counter service
      linksPublished: campaignCounters.linksPublished,
      domainsReached: campaignCounters.domainsReached,
      successRate: campaignCounters.successRate,
      totalClicks: campaignCounters.totalClicks,
      velocity: campaignCounters.velocity,
      qualityScore: campaignCounters.qualityScore,
      
      // Initial predictive calculations
      predictedLinksPerHour: this.calculatePredictedLinksPerHour(campaignCounters),
      predictedDomainsPerDay: this.calculatePredictedDomainsPerDay(campaignCounters),
      estimatedReachPotential: this.calculateReachPotential(campaignCounters),
      projectedROI: this.calculateProjectedROI(campaignCounters),
      
      // Performance indicators
      activityScore: this.calculateActivityScore(campaignCounters),
      efficiencyRating: this.calculateEfficiencyRating(campaignCounters),
      scalabilityIndex: this.calculateScalabilityIndex(campaignCounters),
      
      // Runtime calculations
      totalRuntime: campaignCounters.totalRuntime,
      avgLinksPerMinute: this.calculateAvgLinksPerMinute(campaignCounters),
      peakPerformanceHour: this.calculatePeakPerformanceHour(campaignId),
      consistencyScore: this.calculateConsistencyScore(campaignId),
      
      // Premium limits
      monthlyLinksUsed: currentMonthUsage,
      monthlyLinksLimit: monthlyLimit,
      isAtLimit: currentMonthUsage >= monthlyLimit,
      daysUntilReset: this.getDaysUntilReset(),
      upgradeRecommended: !isPremium && currentMonthUsage >= (monthlyLimit * 0.8)
    };

    this.campaignMetrics.set(campaignId, metrics);
    this.persistMetrics();
    return metrics;
  }

  /**
   * Update predictive metrics based on campaign activity and reporting outputs
   */
  public updatePredictiveMetrics(campaignId: string, reportingOutputs?: number): void {
    const metrics = this.campaignMetrics.get(campaignId);
    const campaignCounters = campaignCounterService.getCampaignCounters(campaignId);
    
    if (!metrics || !campaignCounters) return;

    // Track reporting outputs over time
    if (reportingOutputs !== undefined) {
      const outputs = this.reportingOutputs.get(campaignId) || [];
      outputs.push(reportingOutputs);
      
      // Keep only last 24 hours of data (assuming updates every 30 seconds)
      if (outputs.length > 2880) {
        outputs.splice(0, outputs.length - 2880);
      }
      
      this.reportingOutputs.set(campaignId, outputs);
    }

    // Update current metrics from counter service
    metrics.linksPublished = campaignCounters.linksPublished;
    metrics.domainsReached = campaignCounters.domainsReached;
    metrics.successRate = campaignCounters.successRate;
    metrics.totalClicks = campaignCounters.totalClicks;
    metrics.velocity = campaignCounters.velocity;
    metrics.qualityScore = campaignCounters.qualityScore;
    metrics.totalRuntime = campaignCounters.totalRuntime;

    // Recalculate predictive metrics with enhanced algorithms
    metrics.predictedLinksPerHour = this.calculateEnhancedPredictedLinksPerHour(campaignCounters, campaignId);
    metrics.predictedDomainsPerDay = this.calculateEnhancedPredictedDomainsPerDay(campaignCounters, campaignId);
    metrics.estimatedReachPotential = this.calculateEnhancedReachPotential(campaignCounters, campaignId);
    metrics.projectedROI = this.calculateEnhancedProjectedROI(campaignCounters, campaignId);
    
    // Update performance indicators
    metrics.activityScore = this.calculateEnhancedActivityScore(campaignCounters, campaignId);
    metrics.efficiencyRating = this.calculateEnhancedEfficiencyRating(campaignCounters, campaignId);
    metrics.scalabilityIndex = this.calculateEnhancedScalabilityIndex(campaignCounters, campaignId);
    
    // Update runtime calculations
    metrics.avgLinksPerMinute = this.calculateAvgLinksPerMinute(campaignCounters);
    metrics.peakPerformanceHour = this.calculatePeakPerformanceHour(campaignId);
    metrics.consistencyScore = this.calculateConsistencyScore(campaignId);
    
    // Update premium limit tracking
    const currentMonthUsage = this.getMonthlyUsage(campaignId);
    const wasAtLimit = metrics.isAtLimit;
    
    metrics.monthlyLinksUsed = currentMonthUsage;
    metrics.isAtLimit = currentMonthUsage >= metrics.monthlyLinksLimit;
    metrics.daysUntilReset = this.getDaysUntilReset();
    metrics.upgradeRecommended = currentMonthUsage >= (metrics.monthlyLinksLimit * 0.8);

    // Trigger premium limit callbacks if status changed
    if (!wasAtLimit && metrics.isAtLimit) {
      this.premiumLimitCallbacks.forEach(callback => {
        try {
          callback(campaignId, true);
        } catch (error) {
          console.error('Premium limit callback error:', error instanceof Error ? error.message : String(error));
        }
      });
    }

    this.persistMetrics();
  }

  /**
   * Calculate enhanced predicted links per hour based on runtime and outputs
   */
  private calculateEnhancedPredictedLinksPerHour(counters: CampaignCounters, campaignId: string): number {
    const baseRate = this.config.baseLinksPerHour;
    const currentVelocity = counters.velocity || baseRate;
    const outputs = this.reportingOutputs.get(campaignId) || [];
    
    // Factor in reporting outputs frequency
    let outputMultiplier = 1.0;
    if (outputs.length > 10) {
      const recentOutputs = outputs.slice(-10);
      const avgOutputs = recentOutputs.reduce((sum, val) => sum + val, 0) / recentOutputs.length;
      outputMultiplier = 1 + (avgOutputs * 0.02); // 2% increase per output
    }
    
    // Factor in quality score
    const qualityMultiplier = (counters.qualityScore / 100) * this.config.qualityMultiplier;
    
    // Factor in runtime experience (longer running campaigns get better)
    const runtimeHours = counters.totalRuntime / 60;
    const experienceMultiplier = 1 + (Math.log(runtimeHours + 1) * this.config.experienceBonus);
    
    // Learning rate improvement over time
    const learningMultiplier = 1 + (runtimeHours * this.config.learningRate * 0.01);
    
    const predicted = currentVelocity * outputMultiplier * qualityMultiplier * experienceMultiplier * learningMultiplier;
    
    // Cap at reasonable maximum
    return Math.min(predicted, baseRate * 5);
  }

  /**
   * Calculate enhanced predicted domains per day
   */
  private calculateEnhancedPredictedDomainsPerDay(counters: CampaignCounters, campaignId: string): number {
    const predictedLinksPerHour = this.calculateEnhancedPredictedLinksPerHour(counters, campaignId);
    const domainToLinkRatio = counters.linksPublished > 0 ? counters.domainsReached / counters.linksPublished : 0.3;
    
    // Enhanced domain discovery based on success rate and quality
    const discoveryMultiplier = (counters.successRate / 100) * (counters.qualityScore / 100);
    
    const predictedDomainsPerDay = (predictedLinksPerHour * 24 * domainToLinkRatio * discoveryMultiplier);
    
    return Math.round(predictedDomainsPerDay);
  }

  /**
   * Calculate enhanced reach potential
   */
  private calculateEnhancedReachPotential(counters: CampaignCounters, campaignId: string): number {
    const globalCounters = campaignCounterService.getGlobalCounters();
    const outputs = this.reportingOutputs.get(campaignId) || [];
    
    // Base reach potential from global database
    const baseReach = globalCounters.totalDomains * 0.15; // 15% of database
    
    // Factor in campaign performance
    const performanceMultiplier = (counters.qualityScore / 100) * (counters.successRate / 100);
    
    // Factor in outputs and activity
    const activityMultiplier = Math.min(2.0, 1 + (outputs.length * 0.01));
    
    const reachPotential = baseReach * performanceMultiplier * activityMultiplier;
    
    return Math.round(reachPotential);
  }

  /**
   * Calculate enhanced projected ROI
   */
  private calculateEnhancedProjectedROI(counters: CampaignCounters, campaignId: string): number {
    const clickValue = 2.50; // Average value per click
    const conversionRate = counters.conversionRate || 3.2;
    const averageOrderValue = 150;
    
    const monthlyClicks = (counters.totalClicks / Math.max(counters.totalRuntime / 60 / 24 / 30, 0.1)) || 0;
    const monthlyRevenue = monthlyClicks * (conversionRate / 100) * averageOrderValue;
    const monthlyCost = 29; // Assumed campaign cost
    
    const roi = ((monthlyRevenue - monthlyCost) / monthlyCost) * 100;
    
    return Math.round(roi);
  }

  /**
   * Calculate enhanced activity score based on runtime and outputs
   */
  private calculateEnhancedActivityScore(counters: CampaignCounters, campaignId: string): number {
    const outputs = this.reportingOutputs.get(campaignId) || [];
    const runtimeHours = counters.totalRuntime / 60;
    
    // Base activity from velocity
    let activityScore = Math.min(100, (counters.velocity / this.config.baseLinksPerHour) * 50);
    
    // Boost from reporting outputs
    if (outputs.length > 0) {
      const recentOutputs = outputs.slice(-20);
      const outputFrequency = recentOutputs.length / Math.max(runtimeHours, 1);
      activityScore += Math.min(30, outputFrequency * 10);
    }
    
    // Boost from consistency
    if (counters.countersRunning && runtimeHours > 1) {
      activityScore += 20;
    }
    
    return Math.round(Math.min(100, activityScore));
  }

  /**
   * Calculate enhanced efficiency rating
   */
  private calculateEnhancedEfficiencyRating(counters: CampaignCounters, campaignId: string): number {
    const successRateWeight = 0.4;
    const qualityWeight = 0.3;
    const velocityWeight = 0.3;
    
    const normalizedVelocity = Math.min(100, (counters.velocity / this.config.baseLinksPerHour) * 50);
    
    const efficiency = (
      (counters.successRate * successRateWeight) +
      (counters.qualityScore * qualityWeight) +
      (normalizedVelocity * velocityWeight)
    );
    
    return Math.round(efficiency);
  }

  /**
   * Calculate enhanced scalability index
   */
  private calculateEnhancedScalabilityIndex(counters: CampaignCounters, campaignId: string): number {
    const outputs = this.reportingOutputs.get(campaignId) || [];
    const runtimeHours = counters.totalRuntime / 60;
    
    // Base scalability from performance trends
    let scalability = (counters.qualityScore + counters.successRate) / 2;
    
    // Factor in growth potential
    if (outputs.length > 5) {
      const recent = outputs.slice(-5);
      const older = outputs.slice(-10, -5);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        if (recentAvg > olderAvg) {
          scalability += 15; // Growing trend bonus
        }
      }
    }
    
    // Factor in runtime stability
    if (runtimeHours > 24) {
      scalability += 10; // Long-running stability bonus
    }
    
    return Math.round(Math.min(100, scalability));
  }

  /**
   * Calculate average links per minute
   */
  private calculateAvgLinksPerMinute(counters: CampaignCounters): number {
    if (counters.totalRuntime <= 0) return 0;
    return Number((counters.linksPublished / counters.totalRuntime).toFixed(2));
  }

  /**
   * Calculate peak performance hour (simulated)
   */
  private calculatePeakPerformanceHour(campaignId: string): number {
    const outputs = this.reportingOutputs.get(campaignId) || [];
    if (outputs.length === 0) return 0;
    
    const maxOutput = Math.max(...outputs);
    return Math.round(maxOutput * 1.5); // Peak hour simulation
  }

  /**
   * Calculate consistency score based on output variance
   */
  private calculateConsistencyScore(campaignId: string): number {
    const outputs = this.reportingOutputs.get(campaignId) || [];
    if (outputs.length < 5) return 50;
    
    const mean = outputs.reduce((sum, val) => sum + val, 0) / outputs.length;
    const variance = outputs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outputs.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const consistency = Math.max(0, 100 - (stdDev / mean) * 100);
    
    return Math.round(consistency);
  }

  /**
   * Get monthly usage for premium limits
   */
  private getMonthlyUsage(campaignId: string): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // In a real implementation, this would query actual usage from database
    // For demo, use current campaign links as monthly usage
    const counters = campaignCounterService.getCampaignCounters(campaignId);
    return counters ? counters.linksPublished : 0;
  }

  /**
   * Get days until monthly reset
   */
  private getDaysUntilReset(): number {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, this.config.limitResetDay);
    const diffTime = nextReset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get predictive metrics for campaign
   */
  public getPredictiveMetrics(campaignId: string): PredictiveMetrics | null {
    return this.campaignMetrics.get(campaignId) || null;
  }

  /**
   * Get all predictive metrics
   */
  public getAllPredictiveMetrics(): Map<string, PredictiveMetrics> {
    return new Map(this.campaignMetrics);
  }

  /**
   * Check if campaign is at premium limit
   */
  public isAtPremiumLimit(campaignId: string): boolean {
    const metrics = this.campaignMetrics.get(campaignId);
    return metrics ? metrics.isAtLimit : false;
  }

  /**
   * Force trigger premium limit check
   */
  public triggerPremiumLimitCheck(campaignId: string): void {
    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics && metrics.isAtLimit) {
      this.premiumLimitCallbacks.forEach(callback => {
        try {
          callback(campaignId, true);
        } catch (error) {
          console.error('Premium limit callback error:', error instanceof Error ? error.message : String(error));
        }
      });
    }
  }

  /**
   * Start predictive updates
   */
  private startPredictiveUpdates(): void {
    setInterval(() => {
      // Update all campaign predictive metrics
      this.campaignMetrics.forEach((metrics, campaignId) => {
        const counters = campaignCounterService.getCampaignCounters(campaignId);
        if (counters && counters.status === 'active') {
          // Simulate reporting outputs based on activity
          const simulatedOutputs = Math.floor(Math.random() * 5) + 1;
          this.updatePredictiveMetrics(campaignId, simulatedOutputs);
        }
      });
    }, 30000); // Update every 30 seconds
  }

  /**
   * Load persisted metrics
   */
  private loadPersistedMetrics(): void {
    try {
      const data = localStorage.getItem('predictive_campaign_metrics');
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([campaignId, metrics]) => {
          this.campaignMetrics.set(campaignId, metrics as PredictiveMetrics);
        });
      }

      const outputsData = localStorage.getItem('campaign_reporting_outputs');
      if (outputsData) {
        const parsed = JSON.parse(outputsData);
        Object.entries(parsed).forEach(([campaignId, outputs]) => {
          this.reportingOutputs.set(campaignId, outputs as number[]);
        });
      }
    } catch (error) {
      console.warn('Failed to load predictive metrics:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Persist metrics to localStorage
   */
  private persistMetrics(): void {
    try {
      const metricsData = Object.fromEntries(this.campaignMetrics);
      localStorage.setItem('predictive_campaign_metrics', JSON.stringify(metricsData));

      const outputsData = Object.fromEntries(this.reportingOutputs);
      localStorage.setItem('campaign_reporting_outputs', JSON.stringify(outputsData));
    } catch (error) {
      console.warn('Failed to persist predictive metrics:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Calculate basic methods for backwards compatibility
   */
  private calculatePredictedLinksPerHour(counters: CampaignCounters): number {
    return Math.round(counters.velocity * 1.2);
  }

  private calculatePredictedDomainsPerDay(counters: CampaignCounters): number {
    return Math.round(counters.velocity * 24 * 0.3);
  }

  private calculateReachPotential(counters: CampaignCounters): number {
    return Math.round(counters.domainsReached * 100);
  }

  private calculateProjectedROI(counters: CampaignCounters): number {
    return Math.round((counters.successRate - 50) * 2);
  }

  private calculateActivityScore(counters: CampaignCounters): number {
    return Math.round((counters.velocity / this.config.baseLinksPerHour) * 60);
  }

  private calculateEfficiencyRating(counters: CampaignCounters): number {
    return Math.round((counters.successRate + counters.qualityScore) / 2);
  }

  private calculateScalabilityIndex(counters: CampaignCounters): number {
    return Math.round(counters.qualityScore * 0.9);
  }

  /**
   * Delete predictive metrics
   */
  public deletePredictiveMetrics(campaignId: string): void {
    this.campaignMetrics.delete(campaignId);
    this.reportingOutputs.delete(campaignId);
    this.persistMetrics();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.campaignMetrics.clear();
    this.reportingOutputs.clear();
    this.premiumLimitCallbacks.length = 0;
  }
}

export const predictiveCampaignAlgorithm = new PredictiveCampaignAlgorithm();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    predictiveCampaignAlgorithm.destroy();
  });
}
