/**
 * Comprehensive Automation Logging System
 * Handles development logs, error tracking, and campaign monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'campaign' | 'url_discovery' | 'article_submission' | 'system' | 'database' | 'api';

export interface AutomationLog {
  id?: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  campaign_id?: string;
  user_id?: string;
  error_stack?: string;
  session_id: string;
  environment: 'development' | 'production';
}

class AutomationLogger {
  private sessionId: string;
  private userId?: string;
  private environment: 'development' | 'production';
  private logs: AutomationLog[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.environment = import.meta.env.MODE === 'development' ? 'development' : 'production';
    
    // Initialize console logging in development
    if (this.environment === 'development') {
      console.log('🚀 Automation Logger initialized', { sessionId: this.sessionId });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        // Handle Error objects
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
            code: (value as any).code
          };
        }
        // Handle functions
        if (typeof value === 'function') {
          return '[Function]';
        }
        // Handle circular references
        return value;
      });
    } catch (error) {
      try {
        // Fallback: convert to string
        return String(obj);
      } catch {
        return '[Unserializable Object]';
      }
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.info('system', 'User authenticated', { userId });
  }

  async log(level: LogLevel, category: LogCategory, message: string, data?: any, campaignId?: string, error?: Error) {
    const logEntry: AutomationLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? this.safeStringify(data) : undefined,
      campaign_id: campaignId,
      user_id: this.userId,
      error_stack: error?.stack,
      session_id: this.sessionId,
      environment: this.environment
    };

    // Store in memory for immediate access
    this.logs.push(logEntry);

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console logging in development
    if (this.environment === 'development') {
      const consoleMethod = this.getConsoleMethod(level);
      const prefix = this.getCategoryEmoji(category);
      
      consoleMethod(
        `${prefix} [${level.toUpperCase()}] ${category}:`,
        message,
        data ? data : '',
        campaignId ? `(Campaign: ${campaignId})` : ''
      );
      
      if (error) {
        console.error('Stack trace:', error.stack);
      }
    }

    // Store in database (async, don't wait)
    this.storeInDatabase(logEntry).catch(err => {
      console.warn('Failed to store log in database:', err);
    });
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case 'debug': return console.debug;
      case 'info': return console.info;
      case 'warn': return console.warn;
      case 'error':
      case 'critical': return console.error;
      default: return console.log;
    }
  }

  private getCategoryEmoji(category: LogCategory): string {
    switch (category) {
      case 'campaign': return '🎯';
      case 'url_discovery': return '🔍';
      case 'article_submission': return '📝';
      case 'system': return '⚙️';
      case 'database': return '🗄️';
      case 'api': return '🌐';
      default: return '📋';
    }
  }

  private async storeInDatabase(logEntry: AutomationLog) {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .insert(logEntry);

      if (error) {
        // If table doesn't exist, create it
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('Automation logs table does not exist. Logs will only be stored in memory.');
          return;
        }
        throw error;
      }
    } catch (error) {
      // Silently fail database logging to avoid infinite loops
      if (this.environment === 'development') {
        console.warn('Database logging failed:', error);
      }
    }
  }

  // Convenience methods
  debug(category: LogCategory, message: string, data?: any, campaignId?: string) {
    return this.log('debug', category, message, data, campaignId);
  }

  info(category: LogCategory, message: string, data?: any, campaignId?: string) {
    return this.log('info', category, message, data, campaignId);
  }

  warn(category: LogCategory, message: string, data?: any, campaignId?: string) {
    return this.log('warn', category, message, data, campaignId);
  }

  error(category: LogCategory, message: string, data?: any, campaignId?: string, error?: Error) {
    return this.log('error', category, message, data, campaignId, error);
  }

  critical(category: LogCategory, message: string, data?: any, campaignId?: string, error?: Error) {
    return this.log('critical', category, message, data, campaignId, error);
  }

  // Campaign-specific logging
  campaignCreated(campaignId: string, campaignData: any) {
    return this.info('campaign', 'Campaign created', campaignData, campaignId);
  }

  campaignStarted(campaignId: string) {
    return this.info('campaign', 'Campaign started', {}, campaignId);
  }

  campaignPaused(campaignId: string) {
    return this.info('campaign', 'Campaign paused', {}, campaignId);
  }

  urlDiscovered(campaignId: string, url: string, metadata?: any) {
    return this.info('url_discovery', 'New URL discovered', { url, metadata }, campaignId);
  }

  articleSubmitted(campaignId: string, targetUrl: string, status: 'success' | 'failed', details?: any) {
    const level = status === 'success' ? 'info' : 'error';
    return this.log(level, 'article_submission', `Article submission ${status}`, 
      { targetUrl, details }, campaignId);
  }

  // Get logs for debugging
  getRecentLogs(count: number = 100): AutomationLog[] {
    return this.logs.slice(-count);
  }

  getLogsForCampaign(campaignId: string): AutomationLog[] {
    return this.logs.filter(log => log.campaign_id === campaignId);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs (development only)
  clearLogs() {
    if (this.environment === 'development') {
      this.logs = [];
      console.log('🧹 Automation logs cleared');
    }
  }
}

// Global instance
export const automationLogger = new AutomationLogger();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).automationLogger = automationLogger;
  console.log('🔧 Automation logger available at window.automationLogger');
}

export default automationLogger;
