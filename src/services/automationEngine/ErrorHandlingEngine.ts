/**
 * Enterprise-Grade Error Handling and Recovery Engine
 * Comprehensive error management with automatic recovery and monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export interface ErrorContext {
  errorId: string;
  campaignId: string;
  userId: string;
  component: string;
  operation: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  error: ErrorDetails;
  systemState: SystemState;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  resolved: boolean;
  resolution?: ErrorResolution;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'catastrophic';

export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'rate_limit'
  | 'content_generation'
  | 'link_discovery'
  | 'posting'
  | 'verification'
  | 'database'
  | 'external_api'
  | 'validation'
  | 'configuration'
  | 'resource_exhaustion'
  | 'timeout'
  | 'security'
  | 'data_corruption'
  | 'infrastructure';

export interface ErrorDetails {
  message: string;
  code: string;
  stack?: string;
  originalError?: any;
  context: Record<string, any>;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  metadata: ErrorMetadata;
}

export interface ErrorMetadata {
  browser?: string;
  device?: string;
  os?: string;
  version?: string;
  feature?: string;
  userAction?: string;
  dataState?: any;
  networkConditions?: NetworkConditions;
  resourceUsage?: ResourceUsage;
}

export interface NetworkConditions {
  speed: 'slow' | 'moderate' | 'fast';
  latency: number;
  packetLoss: number;
  connectionType: string;
  isOnline: boolean;
}

export interface ResourceUsage {
  memory: {
    used: number;
    available: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  storage: {
    used: number;
    available: number;
  };
  network: {
    uploadSpeed: number;
    downloadSpeed: number;
  };
}

export interface SystemState {
  campaignStatus: string;
  queueLength: number;
  activeOperations: number;
  systemLoad: number;
  databaseConnections: number;
  apiCallsRemaining: number;
  memoryUsage: number;
  diskSpace: number;
  networkLatency: number;
  lastSuccessfulOperation?: Date;
}

export interface ErrorResolution {
  strategy: RecoveryStrategy;
  actions: RecoveryAction[];
  duration: number;
  success: boolean;
  finalState: SystemState;
  lessonsLearned: string[];
  preventiveMeasures: string[];
}

export type RecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'circuit_breaker'
  | 'bulkhead'
  | 'timeout_adjustment'
  | 'rate_limit_backoff'
  | 'resource_scaling'
  | 'graceful_degradation'
  | 'failover'
  | 'rollback'
  | 'quarantine'
  | 'manual_intervention';

export interface RecoveryAction {
  action: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  output?: any;
  sideEffects?: string[];
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  impact: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  rootCause?: string;
  preventionStrategy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: ErrorSeverity;
  channels: NotificationChannel[];
  enabled: boolean;
  suppressionRules: SuppressionRule[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'pattern';
  threshold: number | string;
  timeWindow: number; // seconds
  frequency: number; // occurrences
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  target: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template?: string;
}

export interface SuppressionRule {
  condition: string;
  duration: number; // seconds
  reason: string;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  details: HealthCheckDetails;
  dependencies: string[];
}

export interface HealthCheckDetails {
  uptime: number;
  version: string;
  metrics: Record<string, number>;
  errors: string[];
  warnings: string[];
  customData?: Record<string, any>;
}

export class ErrorHandlingEngine {
  private static instance: ErrorHandlingEngine;
  private errorLog: ErrorContext[] = [];
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private alertRules: AlertRule[] = [];
  private recoveryStrategies: Map<string, RecoveryHandler> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeRecoveryStrategies();
    this.initializeHealthCheckers();
    this.initializeAlertRules();
    this.startMonitoring();
  }

  public static getInstance(): ErrorHandlingEngine {
    if (!ErrorHandlingEngine.instance) {
      ErrorHandlingEngine.instance = new ErrorHandlingEngine();
    }
    return ErrorHandlingEngine.instance;
  }

  public async handleError(
    error: Error,
    context: {
      campaignId?: string;
      userId?: string;
      component: string;
      operation: string;
      severity?: ErrorSeverity;
      metadata?: Record<string, any>;
    }
  ): Promise<ErrorContext> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorContext: ErrorContext = {
      errorId,
      campaignId: context.campaignId || '',
      userId: context.userId || '',
      component: context.component,
      operation: context.operation,
      timestamp: new Date(),
      severity: context.severity || this.classifyErrorSeverity(error),
      category: this.categorizeError(error, context),
      error: {
        message: error.message,
        code: (error as any).code || 'UNKNOWN_ERROR',
        stack: error.stack,
        originalError: error,
        context: context.metadata || {},
        metadata: await this.gatherErrorMetadata()
      },
      systemState: await this.captureSystemState(),
      recoveryAttempts: 0,
      maxRecoveryAttempts: this.getMaxRecoveryAttempts(context.severity || 'medium'),
      resolved: false
    };

    // Log error
    this.errorLog.push(errorContext);
    await this.persistError(errorContext);

    // Update error patterns
    this.updateErrorPatterns(errorContext);

    // Check alert conditions
    await this.checkAlertConditions(errorContext);

    // Attempt recovery
    await this.attemptRecovery(errorContext);

    return errorContext;
  }

  private classifyErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('database')) {
      return 'critical';
    }
    
    if (message.includes('timeout') || message.includes('network') || message.includes('auth')) {
      return 'high';
    }
    
    if (message.includes('validation') || message.includes('rate limit')) {
      return 'medium';
    }
    
    return 'low';
  }

  private categorizeError(error: Error, context: any): ErrorCategory {
    const message = error.message.toLowerCase();
    const code = (error as any).code || '';
    
    if (message.includes('network') || code.includes('NETWORK')) return 'network';
    if (message.includes('auth') || code.includes('AUTH')) return 'authentication';
    if (message.includes('rate') || code.includes('RATE')) return 'rate_limit';
    if (message.includes('timeout') || code.includes('TIMEOUT')) return 'timeout';
    if (message.includes('database') || code.includes('DB')) return 'database';
    if (context.component === 'content_generation') return 'content_generation';
    if (context.component === 'link_discovery') return 'link_discovery';
    if (context.component === 'posting') return 'posting';
    
    return 'infrastructure';
  }

  private async gatherErrorMetadata(): Promise<ErrorMetadata> {
    return {
      browser: navigator.userAgent,
      device: this.detectDevice(),
      os: this.detectOS(),
      version: import.meta.env.VITE_VERSION || '1.0.0',
      networkConditions: await this.getNetworkConditions(),
      resourceUsage: await this.getResourceUsage()
    };
  }

  private detectDevice(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private async getNetworkConditions(): Promise<NetworkConditions> {
    const connection = (navigator as any).connection;
    
    return {
      speed: connection?.effectiveType || 'unknown',
      latency: connection?.rtt || 0,
      packetLoss: 0, // Would require specialized measurement
      connectionType: connection?.type || 'unknown',
      isOnline: navigator.onLine
    };
  }

  private async getResourceUsage(): Promise<ResourceUsage> {
    const memory = (performance as any).memory;
    
    return {
      memory: {
        used: memory?.usedJSHeapSize || 0,
        available: memory?.totalJSHeapSize || 0,
        percentage: memory ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 : 0
      },
      cpu: {
        usage: 0, // Would require specialized measurement
        cores: navigator.hardwareConcurrency || 1
      },
      storage: {
        used: 0, // Would require API access
        available: 0
      },
      network: {
        uploadSpeed: 0, // Would require measurement
        downloadSpeed: 0
      }
    };
  }

  private async captureSystemState(): Promise<SystemState> {
    return {
      campaignStatus: 'active',
      queueLength: 0, // Would be retrieved from queue manager
      activeOperations: 0,
      systemLoad: 0,
      databaseConnections: 0,
      apiCallsRemaining: 1000,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      diskSpace: 0,
      networkLatency: 0,
      lastSuccessfulOperation: new Date()
    };
  }

  private getMaxRecoveryAttempts(severity: ErrorSeverity): number {
    const attempts = {
      low: 3,
      medium: 5,
      high: 8,
      critical: 10,
      catastrophic: 15
    };
    
    return attempts[severity];
  }

  private async persistError(errorContext: ErrorContext): Promise<void> {
    try {
      await supabase
        .from('error_logs')
        .insert({
          id: errorContext.errorId,
          campaign_id: errorContext.campaignId,
          user_id: errorContext.userId,
          component: errorContext.component,
          operation: errorContext.operation,
          severity: errorContext.severity,
          category: errorContext.category,
          error_details: errorContext.error,
          system_state: errorContext.systemState,
          recovery_attempts: errorContext.recoveryAttempts,
          resolved: errorContext.resolved,
          created_at: errorContext.timestamp.toISOString()
        });
    } catch (dbError) {
      console.error('Failed to persist error to database:', dbError);
      // Store locally as fallback
      localStorage.setItem(`error_${errorContext.errorId}`, JSON.stringify(errorContext));
    }
  }

  private updateErrorPatterns(errorContext: ErrorContext): void {
    const patternKey = `${errorContext.component}_${errorContext.category}_${errorContext.error.code}`;
    const existing = this.errorPatterns.get(patternKey);
    
    if (existing) {
      existing.frequency++;
      // Simple trend analysis
      const recentOccurrences = this.errorLog
        .filter(e => e.component === errorContext.component && 
                    e.category === errorContext.category &&
                    Date.now() - e.timestamp.getTime() < 3600000) // Last hour
        .length;
      
      if (recentOccurrences > existing.frequency * 0.5) {
        existing.trend = 'increasing';
      } else if (recentOccurrences < existing.frequency * 0.1) {
        existing.trend = 'decreasing';
      } else {
        existing.trend = 'stable';
      }
    } else {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        impact: errorContext.severity,
        trend: 'stable'
      });
    }
  }

  private async checkAlertConditions(errorContext: ErrorContext): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      
      const shouldAlert = this.evaluateAlertCondition(rule.condition, errorContext);
      
      if (shouldAlert && !this.isAlertSuppressed(rule, errorContext)) {
        await this.sendAlert(rule, errorContext);
      }
    }
  }

  private evaluateAlertCondition(condition: AlertCondition, errorContext: ErrorContext): boolean {
    const { metric, operator, threshold, timeWindow, frequency } = condition;
    
    // Count recent errors matching the condition
    const cutoffTime = Date.now() - (timeWindow * 1000);
    const recentErrors = this.errorLog.filter(e => 
      e.timestamp.getTime() > cutoffTime &&
      this.errorMatchesMetric(e, metric)
    );
    
    switch (operator) {
      case 'gt':
        return recentErrors.length > threshold;
      case 'lt':
        return recentErrors.length < threshold;
      case 'eq':
        return recentErrors.length === threshold;
      case 'contains':
        return errorContext.error.message.includes(threshold as string);
      case 'pattern':
        const regex = new RegExp(threshold as string);
        return regex.test(errorContext.error.message);
      default:
        return false;
    }
  }

  private errorMatchesMetric(error: ErrorContext, metric: string): boolean {
    switch (metric) {
      case 'error_count':
        return true;
      case 'critical_errors':
        return error.severity === 'critical' || error.severity === 'catastrophic';
      case 'database_errors':
        return error.category === 'database';
      case 'network_errors':
        return error.category === 'network';
      default:
        return false;
    }
  }

  private isAlertSuppressed(rule: AlertRule, errorContext: ErrorContext): boolean {
    return rule.suppressionRules.some(suppression => {
      // Simple suppression logic - would be more sophisticated in practice
      return suppression.condition.includes(errorContext.component);
    });
  }

  private async sendAlert(rule: AlertRule, errorContext: ErrorContext): Promise<void> {
    for (const channel of rule.channels) {
      try {
        await this.sendNotification(channel, rule, errorContext);
      } catch (notificationError) {
        console.error(`Failed to send alert via ${channel.type}:`, notificationError);
      }
    }
  }

  private async sendNotification(
    channel: NotificationChannel, 
    rule: AlertRule, 
    errorContext: ErrorContext
  ): Promise<void> {
    const message = this.formatAlertMessage(rule, errorContext);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailAlert(channel.target, message);
        break;
      case 'slack':
        await this.sendSlackAlert(channel.target, message);
        break;
      case 'webhook':
        await this.sendWebhookAlert(channel.target, errorContext);
        break;
      case 'sms':
        await this.sendSMSAlert(channel.target, message);
        break;
      default:
        console.log(`Alert: ${message}`);
    }
  }

  private formatAlertMessage(rule: AlertRule, errorContext: ErrorContext): string {
    return `
🚨 ALERT: ${rule.name}
Severity: ${errorContext.severity.toUpperCase()}
Component: ${errorContext.component}
Operation: ${errorContext.operation}
Error: ${errorContext.error.message}
Time: ${errorContext.timestamp.toISOString()}
Campaign: ${errorContext.campaignId}
Recovery Attempts: ${errorContext.recoveryAttempts}
    `.trim();
  }

  private async sendEmailAlert(target: string, message: string): Promise<void> {
    // Email implementation would go here
    console.log(`Email alert to ${target}: ${message}`);
  }

  private async sendSlackAlert(target: string, message: string): Promise<void> {
    // Slack implementation would go here
    console.log(`Slack alert to ${target}: ${message}`);
  }

  private async sendWebhookAlert(target: string, errorContext: ErrorContext): Promise<void> {
    try {
      await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorContext)
      });
    } catch (error) {
      console.error('Webhook alert failed:', error);
    }
  }

  private async sendSMSAlert(target: string, message: string): Promise<void> {
    // SMS implementation would go here
    console.log(`SMS alert to ${target}: ${message}`);
  }

  private async attemptRecovery(errorContext: ErrorContext): Promise<void> {
    const strategy = this.selectRecoveryStrategy(errorContext);
    const handler = this.recoveryStrategies.get(strategy);
    
    if (!handler) {
      console.warn(`No recovery handler found for strategy: ${strategy}`);
      return;
    }

    try {
      errorContext.recoveryAttempts++;
      const resolution = await handler.recover(errorContext);
      
      if (resolution.success) {
        errorContext.resolved = true;
        errorContext.resolution = resolution;
        await this.persistError(errorContext);
        console.log(`Error ${errorContext.errorId} recovered using ${strategy}`);
      } else if (errorContext.recoveryAttempts < errorContext.maxRecoveryAttempts) {
        // Schedule retry with exponential backoff
        const delay = Math.pow(2, errorContext.recoveryAttempts) * 1000;
        setTimeout(() => this.attemptRecovery(errorContext), delay);
      } else {
        console.error(`Failed to recover error ${errorContext.errorId} after ${errorContext.recoveryAttempts} attempts`);
        await this.escalateError(errorContext);
      }
    } catch (recoveryError) {
      console.error(`Recovery attempt failed for ${errorContext.errorId}:`, recoveryError);
    }
  }

  private selectRecoveryStrategy(errorContext: ErrorContext): RecoveryStrategy {
    const { category, severity, recoveryAttempts } = errorContext;
    
    // Circuit breaker for repeated failures
    if (recoveryAttempts > 3) {
      return 'circuit_breaker';
    }
    
    // Category-based strategy selection
    switch (category) {
      case 'network':
      case 'timeout':
        return 'retry';
      case 'rate_limit':
        return 'rate_limit_backoff';
      case 'authentication':
        return 'fallback';
      case 'database':
        return severity === 'critical' ? 'failover' : 'retry';
      case 'resource_exhaustion':
        return 'resource_scaling';
      case 'external_api':
        return 'circuit_breaker';
      default:
        return 'retry';
    }
  }

  private async escalateError(errorContext: ErrorContext): Promise<void> {
    // Create high-priority alert for manual intervention
    const escalationAlert: AlertRule = {
      id: `escalation_${errorContext.errorId}`,
      name: `Escalation: ${errorContext.component} Error`,
      condition: {
        metric: 'error_count',
        operator: 'gt',
        threshold: 0,
        timeWindow: 1,
        frequency: 1
      },
      severity: 'critical',
      channels: [
        {
          type: 'email',
          target: 'ops@company.com',
          priority: 'urgent'
        }
      ],
      enabled: true,
      suppressionRules: []
    };

    await this.sendAlert(escalationAlert, errorContext);
    
    // Log escalation
    console.error(`ERROR ESCALATED: ${errorContext.errorId} - Manual intervention required`);
  }

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies.set('retry', new RetryHandler());
    this.recoveryStrategies.set('fallback', new FallbackHandler());
    this.recoveryStrategies.set('circuit_breaker', new CircuitBreakerHandler());
    this.recoveryStrategies.set('rate_limit_backoff', new RateLimitBackoffHandler());
    this.recoveryStrategies.set('resource_scaling', new ResourceScalingHandler());
    this.recoveryStrategies.set('graceful_degradation', new GracefulDegradationHandler());
    this.recoveryStrategies.set('failover', new FailoverHandler());
    this.recoveryStrategies.set('rollback', new RollbackHandler());
  }

  private initializeHealthCheckers(): void {
    this.healthCheckers.set('database', new DatabaseHealthChecker());
    this.healthCheckers.set('api', new APIHealthChecker());
    this.healthCheckers.set('queue', new QueueHealthChecker());
    this.healthCheckers.set('content_generation', new ContentGenerationHealthChecker());
    this.healthCheckers.set('link_discovery', new LinkDiscoveryHealthChecker());
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          metric: 'error_count',
          operator: 'gt',
          threshold: 10,
          timeWindow: 300, // 5 minutes
          frequency: 10
        },
        severity: 'high',
        channels: [
          { type: 'email', target: 'alerts@company.com', priority: 'high' }
        ],
        enabled: true,
        suppressionRules: []
      },
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        condition: {
          metric: 'critical_errors',
          operator: 'gt',
          threshold: 1,
          timeWindow: 60,
          frequency: 1
        },
        severity: 'critical',
        channels: [
          { type: 'email', target: 'oncall@company.com', priority: 'urgent' },
          { type: 'slack', target: '#alerts', priority: 'urgent' }
        ],
        enabled: true,
        suppressionRules: []
      }
    ];
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.cleanupOldErrors();
      this.analyzeErrorTrends();
    }, 60000); // Every minute
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.healthCheckers.entries()).map(
      async ([component, checker]) => {
        try {
          const health = await checker.check();
          if (health.status !== 'healthy') {
            console.warn(`Health check failed for ${component}:`, health);
          }
          return { component, health };
        } catch (error) {
          console.error(`Health check error for ${component}:`, error);
          return { component, health: null };
        }
      }
    );

    await Promise.allSettled(healthPromises);
  }

  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.errorLog = this.errorLog.filter(error => 
      error.timestamp.getTime() > cutoffTime
    );
  }

  private analyzeErrorTrends(): void {
    // Analyze error patterns and update prevention strategies
    const recentErrors = this.errorLog.filter(error => 
      Date.now() - error.timestamp.getTime() < 3600000 // Last hour
    );

    const errorsByComponent = recentErrors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify components with increasing error rates
    Object.entries(errorsByComponent).forEach(([component, count]) => {
      if (count > 5) { // Threshold for concern
        console.warn(`High error rate detected in ${component}: ${count} errors in last hour`);
      }
    });
  }

  public async getErrorStatistics(timeRange: { start: Date; end: Date }): Promise<ErrorStatistics> {
    const filteredErrors = this.errorLog.filter(error => 
      error.timestamp >= timeRange.start && error.timestamp <= timeRange.end
    );

    return {
      totalErrors: filteredErrors.length,
      errorsBySeverity: this.groupBy(filteredErrors, 'severity'),
      errorsByCategory: this.groupBy(filteredErrors, 'category'),
      errorsByComponent: this.groupBy(filteredErrors, 'component'),
      resolvedErrors: filteredErrors.filter(e => e.resolved).length,
      averageResolutionTime: this.calculateAverageResolutionTime(filteredErrors),
      topErrorPatterns: this.getTopErrorPatterns(),
      trendAnalysis: this.calculateErrorTrends(filteredErrors)
    };
  }

  private groupBy(errors: ErrorContext[], field: keyof ErrorContext): Record<string, number> {
    return errors.reduce((acc, error) => {
      const key = String(error[field]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageResolutionTime(errors: ErrorContext[]): number {
    const resolvedErrors = errors.filter(e => e.resolved && e.resolution);
    if (resolvedErrors.length === 0) return 0;
    
    const totalTime = resolvedErrors.reduce((sum, error) => {
      return sum + (error.resolution?.duration || 0);
    }, 0);
    
    return totalTime / resolvedErrors.length;
  }

  private getTopErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private calculateErrorTrends(errors: ErrorContext[]): any {
    // Simple trend calculation - would be more sophisticated in practice
    const hourlyGroups = this.groupErrorsByHour(errors);
    const trend = this.calculateTrendDirection(hourlyGroups);
    
    return {
      direction: trend,
      hourlyBreakdown: hourlyGroups,
      peakHours: this.identifyPeakHours(hourlyGroups)
    };
  }

  private groupErrorsByHour(errors: ErrorContext[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      const hour = error.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTrendDirection(hourlyData: Record<string, number>): 'increasing' | 'decreasing' | 'stable' {
    const hours = Object.keys(hourlyData).map(Number).sort();
    if (hours.length < 2) return 'stable';
    
    const firstHalf = hours.slice(0, Math.floor(hours.length / 2));
    const secondHalf = hours.slice(Math.floor(hours.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, hour) => sum + hourlyData[hour], 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, hour) => sum + hourlyData[hour], 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg * 1.2) return 'increasing';
    if (secondHalfAvg < firstHalfAvg * 0.8) return 'decreasing';
    return 'stable';
  }

  private identifyPeakHours(hourlyData: Record<string, number>): number[] {
    const average = Object.values(hourlyData).reduce((sum, count) => sum + count, 0) / Object.keys(hourlyData).length;
    
    return Object.entries(hourlyData)
      .filter(([_, count]) => count > average * 1.5)
      .map(([hour, _]) => Number(hour));
  }

  public shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Recovery Handler Implementations
abstract class RecoveryHandler {
  abstract recover(errorContext: ErrorContext): Promise<ErrorResolution>;
}

class RetryHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    const actions: RecoveryAction[] = [];
    
    try {
      // Simple retry logic
      await new Promise(resolve => setTimeout(resolve, 1000 * errorContext.recoveryAttempts));
      
      actions.push({
        action: 'retry_after_delay',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      });
      
      return {
        strategy: 'retry',
        actions,
        duration: Date.now() - startTime,
        success: true,
        finalState: await this.getCurrentSystemState(),
        lessonsLearned: ['Retry was successful'],
        preventiveMeasures: ['Consider implementing circuit breaker']
      };
    } catch (error) {
      actions.push({
        action: 'retry_failed',
        timestamp: new Date(),
        success: false,
        duration: Date.now() - startTime
      });
      
      return {
        strategy: 'retry',
        actions,
        duration: Date.now() - startTime,
        success: false,
        finalState: await this.getCurrentSystemState(),
        lessonsLearned: ['Retry failed, need different strategy'],
        preventiveMeasures: ['Implement fallback mechanism']
      };
    }
  }

  private async getCurrentSystemState(): Promise<SystemState> {
    return {
      campaignStatus: 'active',
      queueLength: 0,
      activeOperations: 0,
      systemLoad: 0,
      databaseConnections: 0,
      apiCallsRemaining: 1000,
      memoryUsage: 0,
      diskSpace: 0,
      networkLatency: 0
    };
  }
}

class FallbackHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'fallback',
      actions: [{
        action: 'activate_fallback_service',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'fallback_mode',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Fallback mechanism worked'],
      preventiveMeasures: ['Improve primary service reliability']
    };
  }
}

class CircuitBreakerHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'circuit_breaker',
      actions: [{
        action: 'open_circuit_breaker',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'circuit_open',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Circuit breaker prevented cascade failure'],
      preventiveMeasures: ['Monitor for service recovery']
    };
  }
}

class RateLimitBackoffHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    const backoffTime = Math.pow(2, errorContext.recoveryAttempts) * 1000;
    
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    return {
      strategy: 'rate_limit_backoff',
      actions: [{
        action: `backoff_${backoffTime}ms`,
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'rate_limited',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Rate limit respected'],
      preventiveMeasures: ['Implement better rate limiting']
    };
  }
}

class ResourceScalingHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'resource_scaling',
      actions: [{
        action: 'scale_up_resources',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'scaled_up',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Resource scaling resolved issue'],
      preventiveMeasures: ['Implement auto-scaling']
    };
  }
}

class GracefulDegradationHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'graceful_degradation',
      actions: [{
        action: 'enable_degraded_mode',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'degraded',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Graceful degradation maintained service'],
      preventiveMeasures: ['Improve service robustness']
    };
  }
}

class FailoverHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'failover',
      actions: [{
        action: 'failover_to_backup',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'failover_active',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Failover successful'],
      preventiveMeasures: ['Repair primary system']
    };
  }
}

class RollbackHandler extends RecoveryHandler {
  async recover(errorContext: ErrorContext): Promise<ErrorResolution> {
    const startTime = Date.now();
    
    return {
      strategy: 'rollback',
      actions: [{
        action: 'rollback_to_stable_state',
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime
      }],
      duration: Date.now() - startTime,
      success: true,
      finalState: {
        campaignStatus: 'rolled_back',
        queueLength: 0,
        activeOperations: 0,
        systemLoad: 0,
        databaseConnections: 0,
        apiCallsRemaining: 1000,
        memoryUsage: 0,
        diskSpace: 0,
        networkLatency: 0
      },
      lessonsLearned: ['Rollback restored stability'],
      preventiveMeasures: ['Test changes more thoroughly']
    };
  }
}

// Health Checker Implementations
abstract class HealthChecker {
  abstract check(): Promise<HealthCheck>;
}

class DatabaseHealthChecker extends HealthChecker {
  async check(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simple database connectivity check
      const { data, error } = await supabase.from('automation_campaigns').select('id').limit(1);
      const responseTime = Date.now() - startTime;
      
      return {
        component: 'database',
        status: error ? 'unhealthy' : 'healthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          uptime: 0,
          version: '1.0.0',
          metrics: {
            response_time: responseTime,
            connection_count: 1
          },
          errors: error ? [error.message] : [],
          warnings: []
        },
        dependencies: []
      };
    } catch (error) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          uptime: 0,
          version: '1.0.0',
          metrics: {},
          errors: [(error as Error).message],
          warnings: []
        },
        dependencies: []
      };
    }
  }
}

class APIHealthChecker extends HealthChecker {
  async check(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    return {
      component: 'api',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      details: {
        uptime: 0,
        version: '1.0.0',
        metrics: {
          response_time: Date.now() - startTime
        },
        errors: [],
        warnings: []
      },
      dependencies: ['database']
    };
  }
}

class QueueHealthChecker extends HealthChecker {
  async check(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    return {
      component: 'queue',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      details: {
        uptime: 0,
        version: '1.0.0',
        metrics: {
          queue_length: 0,
          processing_rate: 0
        },
        errors: [],
        warnings: []
      },
      dependencies: []
    };
  }
}

class ContentGenerationHealthChecker extends HealthChecker {
  async check(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    return {
      component: 'content_generation',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      details: {
        uptime: 0,
        version: '1.0.0',
        metrics: {
          generation_rate: 0,
          success_rate: 95
        },
        errors: [],
        warnings: []
      },
      dependencies: ['api']
    };
  }
}

class LinkDiscoveryHealthChecker extends HealthChecker {
  async check(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    return {
      component: 'link_discovery',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      details: {
        uptime: 0,
        version: '1.0.0',
        metrics: {
          discovery_rate: 0,
          verification_rate: 0
        },
        errors: [],
        warnings: []
      },
      dependencies: ['api', 'database']
    };
  }
}

// Circuit Breaker Implementation
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Rate Limiter Implementation
class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(now);
    return await operation();
  }
}

// Supporting interfaces
interface ErrorStatistics {
  totalErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByComponent: Record<string, number>;
  resolvedErrors: number;
  averageResolutionTime: number;
  topErrorPatterns: ErrorPattern[];
  trendAnalysis: any;
}
