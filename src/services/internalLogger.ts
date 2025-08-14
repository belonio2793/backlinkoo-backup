/**
 * Internal Logger System
 * Captures all errors, runtime issues, and development logs internally
 * for automated debugging and resolution
 */

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  };
}

class InternalLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorCapturing();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorCapturing(): void {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('unhandled_error', event.error?.message || 'Unknown error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('unhandled_rejection', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.error('console_error', args.join(' '), { args });
      originalConsoleError.apply(console, args);
    };
  }

  private addLog(entry: Omit<LogEntry, 'id' | 'timestamp' | 'context'>): void {
    const logEntry: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId
      }
    };

    this.logs.push(logEntry);

    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in localStorage for persistence
    this.persistLogs();
  }

  private persistLogs(): void {
    try {
      localStorage.setItem('internal_logs', JSON.stringify(this.logs.slice(-100))); // Store last 100 logs
    } catch (error) {
      // Handle storage quota exceeded
    }
  }

  debug(category: string, message: string, data?: any): void {
    this.addLog({ level: 'debug', category, message, data });
  }

  info(category: string, message: string, data?: any): void {
    this.addLog({ level: 'info', category, message, data });
  }

  warn(category: string, message: string, data?: any): void {
    this.addLog({ level: 'warn', category, message, data });
  }

  error(category: string, message: string, data?: any, stackTrace?: string): void {
    this.addLog({ level: 'error', category, message, data, stackTrace });
  }

  critical(category: string, message: string, data?: any, stackTrace?: string): void {
    this.addLog({ level: 'critical', category, message, data, stackTrace });
  }

  // Analysis methods
  getErrorsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category && log.level === 'error');
  }

  getRecentErrors(minutes: number = 10): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => 
      log.level === 'error' && new Date(log.timestamp) > cutoff
    );
  }

  getCampaignErrors(): LogEntry[] {
    return this.logs.filter(log => 
      log.category.includes('campaign') || 
      log.message.toLowerCase().includes('campaign') ||
      log.message.includes('expected JSON array')
    );
  }

  getSupabaseErrors(): LogEntry[] {
    return this.logs.filter(log => 
      log.category.includes('supabase') || 
      log.message.toLowerCase().includes('supabase') ||
      log.data?.error?.message
    );
  }

  // Pattern analysis
  analyzeErrorPatterns(): {
    mostCommonErrors: { message: string; count: number }[];
    errorTrends: { category: string; count: number }[];
    criticalIssues: LogEntry[];
  } {
    const errorCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const criticalIssues: LogEntry[] = [];

    this.logs.forEach(log => {
      if (log.level === 'error' || log.level === 'critical') {
        errorCounts.set(log.message, (errorCounts.get(log.message) || 0) + 1);
        categoryCounts.set(log.category, (categoryCounts.get(log.category) || 0) + 1);
        
        if (log.level === 'critical') {
          criticalIssues.push(log);
        }
      }
    });

    return {
      mostCommonErrors: Array.from(errorCounts.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      errorTrends: Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      criticalIssues
    };
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('internal_logs');
  }

  // Get specific log types
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsSince(timestamp: string): LogEntry[] {
    return this.logs.filter(log => log.timestamp > timestamp);
  }
}

export const internalLogger = new InternalLogger();
export default internalLogger;
