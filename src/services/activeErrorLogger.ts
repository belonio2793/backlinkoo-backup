/**
 * Active Error Logger and Debugging System
 * Real-time error tracking and debugging for automation system development
 */

import { supabase } from '@/integrations/supabase/client';
// Note: ErrorHandlingEngine removed with automation cleanup

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  component: string;
  operation: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId: string;
  stackTrace?: string;
  context: {
    url: string;
    userAgent: string;
    campaignId?: string;
    automationType?: string;
    buildStep?: string;
  };
}

export interface AutomationMetrics {
  component: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorCount: number;
  retryCount: number;
  metadata: Record<string, any>;
}

class ActiveErrorLogger {
  private static instance: ActiveErrorLogger;
  private logs: DebugLog[] = [];
  private metrics: AutomationMetrics[] = [];
  private sessionId: string;
  private subscribers: ((log: DebugLog) => void)[] = [];
  // private errorEngine: ErrorHandlingEngine; // Removed with automation cleanup
  private isDevMode: boolean;
  private maxLogSize = 1000; // Keep last 1000 logs in memory
  private persistInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // this.errorEngine = ErrorHandlingEngine.getInstance(); // Removed with automation cleanup
    this.isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.initializeLogging();
    this.startPersistanceLoop();
  }

  public static getInstance(): ActiveErrorLogger {
    if (!ActiveErrorLogger.instance) {
      ActiveErrorLogger.instance = new ActiveErrorLogger();
    }
    return ActiveErrorLogger.instance;
  }

  private initializeLogging(): void {
    // Override console methods to capture logs
    if (this.isDevMode) {
      this.interceptConsoleLogs();
    }

    // Listen to unhandled errors
    window.addEventListener('error', (event) => {
      this.logError('global', 'unhandled_error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Listen to unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('global', 'unhandled_promise_rejection', event.reason, {
        type: 'promise_rejection'
      });
    });

    this.logInfo('system', 'logger_initialized', 'Active error logger started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE
    });
  }

  private interceptConsoleLogs(): void {
    const originalMethods = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Intercept console.error for automation-related errors
    console.error = (...args) => {
      originalMethods.error(...args);
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      if (this.isAutomationRelated(message)) {
        this.logError('console', 'console_error', new Error(message), {
          originalArgs: args,
          captured: true
        });
      }
    };

    // Intercept console.warn for automation warnings
    console.warn = (...args) => {
      originalMethods.warn(...args);
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      if (this.isAutomationRelated(message)) {
        this.logWarn('console', 'console_warn', message, {
          originalArgs: args,
          captured: true
        });
      }
    };
  }

  private isAutomationRelated(message: string): boolean {
    const keywords = [
      'automation', 'campaign', 'backlink', 'engine', 'discovery',
      'posting', 'content generation', 'link building', 'seo',
      'database', 'supabase', 'error', 'failed', 'timeout'
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }

  public logDebug(component: string, operation: string, message: string, data?: any): void {
    this.addLog('debug', component, operation, message, data);
  }

  public logInfo(component: string, operation: string, message: string, data?: any): void {
    this.addLog('info', component, operation, message, data);
  }

  public logWarn(component: string, operation: string, message: string, data?: any): void {
    this.addLog('warn', component, operation, message, data);
  }

  public logError(component: string, operation: string, error: Error | any, data?: any): void {
    const message = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    this.addLog('error', component, operation, message, data, stackTrace);

    // Send to ErrorHandlingEngine for comprehensive error handling
    // ErrorHandlingEngine removed with automation cleanup
    // if (error instanceof Error) {
    //   this.errorEngine.handleError(error, {
    //     component,
    //     operation,
    //     severity: 'high',
    //     metadata: data
    //   }).catch(console.error);
    // }
  }

  public logCritical(component: string, operation: string, message: string, data?: any): void {
    this.addLog('critical', component, operation, message, data);
  }

  private addLog(
    level: DebugLog['level'],
    component: string,
    operation: string,
    message: string,
    data?: any,
    stackTrace?: string
  ): void {
    const log: DebugLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      component,
      operation,
      message,
      data,
      sessionId: this.sessionId,
      stackTrace,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        campaignId: data?.campaignId,
        automationType: data?.automationType,
        buildStep: data?.buildStep
      }
    };

    this.logs.push(log);

    // Keep memory usage under control
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(log);
      } catch (error) {
        console.error('Error in log subscriber:', error);
      }
    });

    // Console output for development
    if (this.isDevMode) {
      const timestamp = log.timestamp.toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}:${operation}]`;
      
      switch (level) {
        case 'debug':
          console.log(`%c${prefix} ${message}`, 'color: #888', data);
          break;
        case 'info':
          console.log(`%c${prefix} ${message}`, 'color: #007acc', data);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, data);
          break;
        case 'error':
        case 'critical':
          console.error(`${prefix} ${message}`, data);
          break;
      }
    }
  }

  public startOperationMetrics(component: string, operation: string, metadata: Record<string, any> = {}): string {
    const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: AutomationMetrics = {
      component,
      operation,
      startTime: Date.now(),
      success: false,
      errorCount: 0,
      retryCount: 0,
      metadata: { ...metadata, metricId }
    };

    this.metrics.push(metric);
    
    this.logDebug(component, operation, 'Operation started', { metricId, metadata });
    
    return metricId;
  }

  public endOperationMetrics(metricId: string, success: boolean, metadata: Record<string, any> = {}): void {
    const metric = this.metrics.find(m => m.metadata.metricId === metricId);
    if (!metric) {
      this.logWarn('metrics', 'end_operation', 'Metric not found', { metricId });
      return;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.metadata = { ...metric.metadata, ...metadata };

    this.logInfo(metric.component, metric.operation, 
      `Operation ${success ? 'completed' : 'failed'} in ${metric.duration}ms`, 
      { metricId, success, duration: metric.duration, ...metadata }
    );
  }

  public incrementErrorCount(metricId: string): void {
    const metric = this.metrics.find(m => m.metadata.metricId === metricId);
    if (metric) {
      metric.errorCount++;
      this.logWarn(metric.component, metric.operation, 'Error count incremented', { 
        metricId, 
        errorCount: metric.errorCount 
      });
    }
  }

  public incrementRetryCount(metricId: string): void {
    const metric = this.metrics.find(m => m.metadata.metricId === metricId);
    if (metric) {
      metric.retryCount++;
      this.logInfo(metric.component, metric.operation, 'Retry attempt', { 
        metricId, 
        retryCount: metric.retryCount 
      });
    }
  }

  public subscribe(callback: (log: DebugLog) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public getLogs(filter?: {
    level?: DebugLog['level'];
    component?: string;
    operation?: string;
    since?: Date;
  }): DebugLog[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.component) {
        filteredLogs = filteredLogs.filter(log => log.component === filter.component);
      }
      if (filter.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filter.operation);
      }
      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getMetrics(): AutomationMetrics[] {
    return [...this.metrics].sort((a, b) => b.startTime - a.startTime);
  }

  public clearLogs(): void {
    this.logs = [];
    this.logInfo('system', 'clear_logs', 'Logs cleared manually');
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.logInfo('system', 'clear_metrics', 'Metrics cleared manually');
  }

  public getSystemHealth(): {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    criticalCount: number;
    recentErrors: DebugLog[];
    avgOperationTime: number;
    failureRate: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentLogs = this.getLogs({ since: oneHourAgo });
    
    const errorCount = recentLogs.filter(log => log.level === 'error').length;
    const warnCount = recentLogs.filter(log => log.level === 'warn').length;
    const criticalCount = recentLogs.filter(log => log.level === 'critical').length;

    const recentMetrics = this.metrics.filter(m => m.startTime > oneHourAgo.getTime() && m.duration);
    const avgOperationTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length
      : 0;

    const failureRate = recentMetrics.length > 0 
      ? recentMetrics.filter(m => !m.success).length / recentMetrics.length
      : 0;

    return {
      totalLogs: recentLogs.length,
      errorCount,
      warnCount,
      criticalCount,
      recentErrors: recentLogs.filter(log => log.level === 'error' || log.level === 'critical').slice(0, 10),
      avgOperationTime,
      failureRate
    };
  }

  private startPersistanceLoop(): void {
    // Persist logs to database every 30 seconds in development
    if (this.isDevMode) {
      this.persistInterval = setInterval(() => {
        this.persistLogs().catch(error => {
          console.error('Failed to persist logs:', error);
        });
      }, 30000);
    }
  }

  private async persistLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      const logsToSave = this.logs.slice(-100); // Save last 100 logs
      
      const { error } = await supabase
        .from('automation_debug_logs')
        .insert(
          logsToSave.map(log => ({
            id: log.id,
            session_id: log.sessionId,
            timestamp: log.timestamp.toISOString(),
            level: log.level,
            component: log.component,
            operation: log.operation,
            message: log.message,
            data: log.data,
            stack_trace: log.stackTrace,
            context: log.context,
            user_id: log.userId
          }))
        );

      if (error) {
        throw error;
      }

      this.logDebug('system', 'persist_logs', `Persisted ${logsToSave.length} logs to database`);
    } catch (error) {
      // Don't log this error to avoid infinite loops
      console.error('Failed to persist logs to database:', error);
    }
  }

  public async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'component', 'operation', 'message', 'data'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.component,
          log.operation,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.data || {}).replace(/"/g, '""')}"`
        ].join(','))
      ];
      
      return csvRows.join('\n');
    }
  }

  public shutdown(): void {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
    
    // Final persist
    this.persistLogs().catch(console.error);
    
    this.logInfo('system', 'shutdown', 'Active error logger shutting down');
  }
}

// Export singleton instance
export const activeLogger = ActiveErrorLogger.getInstance();

// Convenience functions for quick logging
export const debugLog = {
  debug: (component: string, operation: string, message: string, data?: any) => 
    activeLogger.logDebug(component, operation, message, data),
  
  info: (component: string, operation: string, message: string, data?: any) => 
    activeLogger.logInfo(component, operation, message, data),
  
  warn: (component: string, operation: string, message: string, data?: any) => 
    activeLogger.logWarn(component, operation, message, data),
  
  error: (component: string, operation: string, error: Error | any, data?: any) => 
    activeLogger.logError(component, operation, error, data),
  
  critical: (component: string, operation: string, message: string, data?: any) => 
    activeLogger.logCritical(component, operation, message, data),

  startOperation: (component: string, operation: string, metadata?: Record<string, any>) =>
    activeLogger.startOperationMetrics(component, operation, metadata),

  endOperation: (metricId: string, success: boolean, metadata?: Record<string, any>) =>
    activeLogger.endOperationMetrics(metricId, success, metadata),

  incrementError: (metricId: string) => activeLogger.incrementErrorCount(metricId),
  incrementRetry: (metricId: string) => activeLogger.incrementRetryCount(metricId)
};

export default activeLogger;
