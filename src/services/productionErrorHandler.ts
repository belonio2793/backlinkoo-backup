import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  component: string;
  operation: string;
  user_id?: string;
  campaign_id?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: ErrorLog[] = [];
  private isProcessingQueue = false;

  public static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  constructor() {
    // Process error queue every 30 seconds
    setInterval(() => {
      this.processErrorQueue();
    }, 30000);

    // Process immediately if queue gets large
    setInterval(() => {
      if (this.errorQueue.length >= 10) {
        this.processErrorQueue();
      }
    }, 5000);
  }

  public async logError(
    error: Error | string,
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      error_type: typeof error === 'string' ? 'application_error' : error.constructor.name,
      error_message: errorMessage,
      error_stack: errorStack,
      component: context.component,
      operation: context.operation,
      user_id: context.userId,
      campaign_id: context.campaignId,
      metadata: context.metadata,
      severity,
      created_at: new Date().toISOString()
    };

    // Add to queue for batch processing
    this.errorQueue.push(errorLog);

    // Log to console for development
    if (import.meta.env.DEV) {
      console.error(`[${severity.toUpperCase()}] ${context.component}.${context.operation}:`, error);
    }

    // Show user-friendly error messages for critical errors
    if (severity === 'critical') {
      this.showUserError(errorMessage, context);
    }

    // Process immediately for critical errors
    if (severity === 'critical' || this.errorQueue.length >= 5) {
      await this.processErrorQueue();
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const errorsToProcess = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const { error } = await supabase
        .from('error_logs')
        .insert(errorsToProcess);

      if (error) {
        console.error('Failed to log errors to database:', error);
        // Put errors back in queue to retry later
        this.errorQueue.unshift(...errorsToProcess);
      }
    } catch (error) {
      console.error('Error processing error queue:', error);
      // Put errors back in queue to retry later
      this.errorQueue.unshift(...errorsToProcess);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private showUserError(errorMessage: string, context: ErrorContext): void {
    let userMessage = 'An error occurred. Please try again.';

    // Provide more specific user-friendly messages based on context
    switch (context.component) {
      case 'automation':
        userMessage = 'Automation failed. The campaign has been paused for review.';
        break;
      case 'content_generation':
        userMessage = 'Content generation failed. Please check your API configuration.';
        break;
      case 'database':
        userMessage = 'Database connection failed. Please check your internet connection.';
        break;
      case 'payment':
        userMessage = 'Payment processing failed. Please check your billing information.';
        break;
      default:
        userMessage = errorMessage.length > 100 ? 'An unexpected error occurred.' : errorMessage;
    }

    toast.error(userMessage);
  }

  public async getErrorStats(userId: string, timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalErrors: number;
    criticalErrors: number;
    errorsByComponent: Record<string, number>;
    errorTrend: Array<{ time: string; count: number }>;
  }> {
    try {
      const startTime = new Date();
      switch (timeRange) {
        case 'hour':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case 'day':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(startTime.getDate() - 7);
          break;
      }

      const { data: errors, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startTime.toISOString());

      if (error) throw error;

      const totalErrors = errors?.length || 0;
      const criticalErrors = errors?.filter(e => e.severity === 'critical').length || 0;
      
      const errorsByComponent = errors?.reduce((acc, error) => {
        acc[error.component] = (acc[error.component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Simple error trend (could be enhanced with time bucketing)
      const errorTrend = errors?.map(error => ({
        time: error.created_at,
        count: 1
      })) || [];

      return {
        totalErrors,
        criticalErrors,
        errorsByComponent,
        errorTrend
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        criticalErrors: 0,
        errorsByComponent: {},
        errorTrend: []
      };
    }
  }

  public createErrorBoundary(component: string) {
    return {
      logError: (error: Error, operation: string, metadata?: Record<string, any>) => {
        this.logError(error, {
          component,
          operation,
          metadata
        }, 'high');
      }
    };
  }
}

// Create singleton instance
export const productionErrorHandler = ProductionErrorHandler.getInstance();

// Convenience functions
export const logError = (error: Error | string, context: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical') => {
  return productionErrorHandler.logError(error, context, severity);
};

export const getErrorStats = (userId: string, timeRange?: 'hour' | 'day' | 'week') => {
  return productionErrorHandler.getErrorStats(userId, timeRange);
};

export const createErrorBoundary = (component: string) => {
  return productionErrorHandler.createErrorBoundary(component);
};
