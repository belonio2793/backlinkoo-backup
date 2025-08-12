/**
 * Monitoring Alerts System
 * Real-time monitoring and alerting for critical automation failures
 */

import { activeLogger, debugLog } from './activeErrorLogger';
import { errorCategorization, trackError } from './errorCategorization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
}

export interface AlertCondition {
  type: 'error_count' | 'error_rate' | 'pattern_frequency' | 'health_score' | 'component_failure';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  timeWindow: number; // minutes
  filters?: {
    component?: string;
    level?: string;
    category?: string;
  };
}

export interface AlertAction {
  type: 'toast' | 'email' | 'webhook' | 'console' | 'storage' | 'function';
  target?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  config?: Record<string, any>;
}

export interface AlertTrigger {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  condition: AlertCondition;
  actualValue: number;
  threshold: number;
  message: string;
  actions: AlertAction[];
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

class MonitoringAlertsSystem {
  private static instance: MonitoringAlertsSystem;
  private alertRules: Map<string, AlertRule> = new Map();
  private alertTriggers: AlertTrigger[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  public static getInstance(): MonitoringAlertsSystem {
    if (!MonitoringAlertsSystem.instance) {
      MonitoringAlertsSystem.instance = new MonitoringAlertsSystem();
    }
    return MonitoringAlertsSystem.instance;
  }

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        description: 'Alert when critical errors occur',
        enabled: true,
        condition: {
          type: 'error_count',
          metric: 'critical_errors',
          operator: 'gte',
          threshold: 1,
          timeWindow: 5,
          filters: { level: 'critical' }
        },
        actions: [
          {
            type: 'toast',
            message: 'Critical error detected! Automation may be blocked.',
            priority: 'critical'
          },
          {
            type: 'console',
            message: '🚨 CRITICAL ERROR ALERT: Immediate attention required',
            priority: 'critical'
          }
        ],
        cooldownPeriod: 5,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        enabled: true,
        condition: {
          type: 'error_rate',
          metric: 'errors_per_minute',
          operator: 'gt',
          threshold: 10,
          timeWindow: 10
        },
        actions: [
          {
            type: 'toast',
            message: 'High error rate detected. Check automation system.',
            priority: 'high'
          },
          {
            type: 'console',
            message: '⚠️ HIGH ERROR RATE: System may be experiencing issues',
            priority: 'high'
          }
        ],
        cooldownPeriod: 15,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'database_failures',
        name: 'Database Connection Failures',
        description: 'Alert when database connectivity issues occur',
        enabled: true,
        condition: {
          type: 'error_count',
          metric: 'database_errors',
          operator: 'gte',
          threshold: 3,
          timeWindow: 5,
          filters: { category: 'database_connection' }
        },
        actions: [
          {
            type: 'toast',
            message: 'Database connection issues detected. Automation may be affected.',
            priority: 'high'
          },
          {
            type: 'console',
            message: '🔗 DATABASE ALERT: Connection issues affecting automation',
            priority: 'high'
          }
        ],
        cooldownPeriod: 10,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'api_integration_failures',
        name: 'API Integration Failures',
        description: 'Alert when external API integrations fail repeatedly',
        enabled: true,
        condition: {
          type: 'error_count',
          metric: 'api_errors',
          operator: 'gte',
          threshold: 5,
          timeWindow: 15,
          filters: { category: 'api_integration' }
        },
        actions: [
          {
            type: 'toast',
            message: 'API integration failures detected. Check API keys and limits.',
            priority: 'medium'
          },
          {
            type: 'console',
            message: '🔌 API ALERT: Integration issues detected',
            priority: 'medium'
          }
        ],
        cooldownPeriod: 20,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'campaign_failures',
        name: 'Campaign Operation Failures',
        description: 'Alert when campaign operations fail repeatedly',
        enabled: true,
        condition: {
          type: 'error_count',
          metric: 'campaign_errors',
          operator: 'gte',
          threshold: 3,
          timeWindow: 10,
          filters: { category: 'campaign_management' }
        },
        actions: [
          {
            type: 'toast',
            message: 'Campaign operation failures detected. Check campaign configuration.',
            priority: 'medium'
          }
        ],
        cooldownPeriod: 15,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'low_health_score',
        name: 'Low Automation Health Score',
        description: 'Alert when overall automation health drops below threshold',
        enabled: true,
        condition: {
          type: 'health_score',
          metric: 'automation_health',
          operator: 'lt',
          threshold: 50,
          timeWindow: 5
        },
        actions: [
          {
            type: 'toast',
            message: 'Automation health score is low. System needs attention.',
            priority: 'medium'
          },
          {
            type: 'console',
            message: '📊 HEALTH ALERT: Automation system health is degraded',
            priority: 'medium'
          }
        ],
        cooldownPeriod: 30,
        triggerCount: 0,
        createdAt: new Date()
      },
      {
        id: 'component_offline',
        name: 'Component Offline',
        description: 'Alert when critical automation components go offline',
        enabled: true,
        condition: {
          type: 'component_failure',
          metric: 'component_health',
          operator: 'eq',
          threshold: 0,
          timeWindow: 2
        },
        actions: [
          {
            type: 'toast',
            message: 'Critical automation component is offline!',
            priority: 'critical'
          },
          {
            type: 'console',
            message: '💀 COMPONENT OFFLINE: Critical automation component failed',
            priority: 'critical'
          }
        ],
        cooldownPeriod: 5,
        triggerCount: 0,
        createdAt: new Date()
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.isInitialized = true;
    
    debugLog.info('monitoring_alerts', 'initialize', 'Monitoring alert rules initialized', {
      ruleCount: defaultRules.length
    });
  }

  private startMonitoring(): void {
    // Check alerts every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 30000);

    debugLog.info('monitoring_alerts', 'start_monitoring', 'Alert monitoring started');
  }

  private async checkAlertConditions(): Promise<void> {
    if (!this.isInitialized) return;

    const now = new Date();
    let alertsChecked = 0;
    let alertsTriggered = 0;

    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
        const cooldownMs = rule.cooldownPeriod * 60 * 1000;
        if (timeSinceLastTrigger < cooldownMs) {
          continue;
        }
      }

      alertsChecked++;

      try {
        const shouldTrigger = await this.evaluateCondition(rule.condition);
        
        if (shouldTrigger.triggered) {
          await this.triggerAlert(rule, shouldTrigger.value);
          alertsTriggered++;
        }
      } catch (error) {
        debugLog.error('monitoring_alerts', 'check_condition', error, {
          ruleId,
          ruleName: rule.name
        });
      }
    }

    if (alertsChecked > 0) {
      debugLog.debug('monitoring_alerts', 'check_complete', 'Alert conditions checked', {
        rulesChecked: alertsChecked,
        alertsTriggered
      });
    }
  }

  private async evaluateCondition(condition: AlertCondition): Promise<{ triggered: boolean; value: number }> {
    const now = new Date();
    const timeWindowMs = condition.timeWindow * 60 * 1000;
    const cutoffTime = new Date(now.getTime() - timeWindowMs);

    let value = 0;

    switch (condition.type) {
      case 'error_count':
        value = await this.getErrorCount(condition, cutoffTime);
        break;
      case 'error_rate':
        value = await this.getErrorRate(condition, cutoffTime);
        break;
      case 'pattern_frequency':
        value = await this.getPatternFrequency(condition, cutoffTime);
        break;
      case 'health_score':
        value = await this.getHealthScore();
        break;
      case 'component_failure':
        value = await this.getComponentHealth(condition);
        break;
      default:
        return { triggered: false, value: 0 };
    }

    const triggered = this.compareValues(value, condition.operator, condition.threshold);
    
    return { triggered, value };
  }

  private async getErrorCount(condition: AlertCondition, cutoffTime: Date): Promise<number> {
    const logs = activeLogger.getLogs({
      since: cutoffTime,
      level: condition.filters?.level as any,
      component: condition.filters?.component
    });

    if (condition.filters?.category) {
      return logs.filter(log => {
        try {
          const category = errorCategorization.categorizeError(
            new Error(log.message), 
            log.component, 
            log.operation
          );
          return category === condition.filters?.category;
        } catch {
          return false;
        }
      }).length;
    }

    return logs.length;
  }

  private async getErrorRate(condition: AlertCondition, cutoffTime: Date): Promise<number> {
    const errorCount = await this.getErrorCount(condition, cutoffTime);
    const timeWindowMinutes = condition.timeWindow;
    return errorCount / timeWindowMinutes;
  }

  private async getPatternFrequency(condition: AlertCondition, cutoffTime: Date): Promise<number> {
    const patterns = errorCategorization.getPatterns({
      category: condition.filters?.category,
      resolved: false
    });

    return patterns.filter(pattern => 
      pattern.lastOccurrence >= cutoffTime
    ).reduce((sum, pattern) => sum + pattern.frequency, 0);
  }

  private async getHealthScore(): Promise<number> {
    const healthData = errorCategorization.getAutomationHealthScore();
    return healthData.score;
  }

  private async getComponentHealth(condition: AlertCondition): Promise<number> {
    // For component health, we check if there are recent logs from the component
    const logs = activeLogger.getLogs({
      component: condition.filters?.component,
      since: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    });

    // If component has activity, it's healthy (1), otherwise unhealthy (0)
    return logs.length > 0 ? 1 : 0;
  }

  private compareValues(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, actualValue: number): Promise<void> {
    const triggerId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const trigger: AlertTrigger = {
      id: triggerId,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: now,
      condition: rule.condition,
      actualValue,
      threshold: rule.condition.threshold,
      message: this.formatAlertMessage(rule, actualValue),
      actions: rule.actions,
      resolved: false
    };

    this.alertTriggers.push(trigger);

    // Update rule state
    rule.lastTriggered = now;
    rule.triggerCount++;

    // Execute alert actions
    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, trigger);
      } catch (error) {
        debugLog.error('monitoring_alerts', 'execute_action', error, {
          actionType: action.type,
          alertId: triggerId
        });
      }
    }

    // Log the alert
    debugLog.warn('monitoring_alerts', 'alert_triggered', trigger.message, {
      ruleId: rule.id,
      ruleName: rule.name,
      actualValue,
      threshold: rule.condition.threshold,
      triggerId
    });

    // Track this as an error pattern too
    trackError(
      new Error(`Alert triggered: ${rule.name}`),
      'monitoring_alerts',
      'alert_triggered'
    );
  }

  private formatAlertMessage(rule: AlertRule, actualValue: number): string {
    const { condition } = rule;
    return `${rule.name}: ${condition.metric} is ${actualValue} (threshold: ${condition.operator} ${condition.threshold})`;
  }

  private async executeAlertAction(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    switch (action.type) {
      case 'toast':
        this.showToastAlert(action, trigger);
        break;
      case 'console':
        this.showConsoleAlert(action, trigger);
        break;
      case 'email':
        await this.sendEmailAlert(action, trigger);
        break;
      case 'webhook':
        await this.sendWebhookAlert(action, trigger);
        break;
      case 'storage':
        await this.storeAlert(action, trigger);
        break;
      case 'function':
        await this.executeFunctionAlert(action, trigger);
        break;
    }
  }

  private showToastAlert(action: AlertAction, trigger: AlertTrigger): void {
    const variant = action.priority === 'critical' ? 'destructive' : 'default';
    
    toast(action.message, {
      description: `Triggered at ${trigger.triggeredAt.toLocaleTimeString()}`,
      duration: action.priority === 'critical' ? 0 : 5000, // Critical alerts don't auto-dismiss
      action: action.priority === 'critical' ? {
        label: 'Acknowledge',
        onClick: () => this.acknowledgeAlert(trigger.id)
      } : undefined
    });
  }

  private showConsoleAlert(action: AlertAction, trigger: AlertTrigger): void {
    const timestamp = trigger.triggeredAt.toISOString();
    const message = `[${timestamp}] ${action.message}`;
    
    switch (action.priority) {
      case 'critical':
        console.error(`%c${message}`, 'color: #fff; background: #dc2626; padding: 4px 8px; font-weight: bold;');
        break;
      case 'high':
        console.warn(`%c${message}`, 'color: #92400e; background: #fef3c7; padding: 4px 8px;');
        break;
      case 'medium':
        console.log(`%c${message}`, 'color: #1d4ed8; background: #dbeafe; padding: 4px 8px;');
        break;
      default:
        console.log(message);
    }
  }

  private async sendEmailAlert(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    // Email functionality would be implemented here
    // For now, we'll log the intent
    debugLog.info('monitoring_alerts', 'email_alert', 'Email alert would be sent', {
      target: action.target,
      message: action.message,
      triggerId: trigger.id
    });
  }

  private async sendWebhookAlert(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    if (!action.target) return;

    try {
      const response = await fetch(action.target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert: trigger,
          action,
          timestamp: trigger.triggeredAt.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      debugLog.info('monitoring_alerts', 'webhook_sent', 'Webhook alert sent successfully', {
        target: action.target,
        triggerId: trigger.id
      });
    } catch (error) {
      debugLog.error('monitoring_alerts', 'webhook_failed', error, {
        target: action.target,
        triggerId: trigger.id
      });
    }
  }

  private async storeAlert(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_alerts')
        .insert({
          id: trigger.id,
          rule_id: trigger.ruleId,
          rule_name: trigger.ruleName,
          triggered_at: trigger.triggeredAt.toISOString(),
          condition: trigger.condition,
          actual_value: trigger.actualValue,
          threshold: trigger.threshold,
          message: trigger.message,
          priority: action.priority,
          resolved: false
        });

      if (error) {
        throw error;
      }

      debugLog.info('monitoring_alerts', 'alert_stored', 'Alert stored to database', {
        triggerId: trigger.id
      });
    } catch (error) {
      debugLog.error('monitoring_alerts', 'storage_failed', error, {
        triggerId: trigger.id
      });
    }
  }

  private async executeFunctionAlert(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    // Custom function execution would be implemented here
    debugLog.info('monitoring_alerts', 'function_alert', 'Function alert would be executed', {
      config: action.config,
      triggerId: trigger.id
    });
  }

  public acknowledgeAlert(triggerId: string): void {
    const trigger = this.alertTriggers.find(t => t.id === triggerId);
    if (trigger && !trigger.resolved) {
      trigger.resolved = true;
      trigger.resolvedAt = new Date();

      debugLog.info('monitoring_alerts', 'alert_acknowledged', 'Alert acknowledged by user', {
        triggerId,
        ruleName: trigger.ruleName
      });

      toast.success('Alert acknowledged');
    }
  }

  // Public API methods
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  public getAlertRule(id: string): AlertRule | undefined {
    return this.alertRules.get(id);
  }

  public addAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: AlertRule = {
      ...rule,
      id,
      createdAt: new Date(),
      triggerCount: 0
    };

    this.alertRules.set(id, newRule);
    
    debugLog.info('monitoring_alerts', 'rule_added', 'New alert rule added', {
      ruleId: id,
      ruleName: rule.name
    });

    return id;
  }

  public updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    
    debugLog.info('monitoring_alerts', 'rule_updated', 'Alert rule updated', {
      ruleId: id,
      updates: Object.keys(updates)
    });

    return true;
  }

  public removeAlertRule(id: string): boolean {
    const success = this.alertRules.delete(id);
    
    if (success) {
      debugLog.info('monitoring_alerts', 'rule_removed', 'Alert rule removed', {
        ruleId: id
      });
    }

    return success;
  }

  public getAlertTriggers(filter?: {
    ruleId?: string;
    resolved?: boolean;
    since?: Date;
  }): AlertTrigger[] {
    let triggers = [...this.alertTriggers];

    if (filter) {
      if (filter.ruleId) {
        triggers = triggers.filter(t => t.ruleId === filter.ruleId);
      }
      if (filter.resolved !== undefined) {
        triggers = triggers.filter(t => t.resolved === filter.resolved);
      }
      if (filter.since) {
        triggers = triggers.filter(t => t.triggeredAt >= filter.since!);
      }
    }

    return triggers.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  public getAlertStatistics(): {
    totalRules: number;
    enabledRules: number;
    totalTriggers: number;
    unresolvedTriggers: number;
    triggersByPriority: Record<string, number>;
    mostTriggeredRules: Array<{ name: string; count: number }>;
  } {
    const rules = Array.from(this.alertRules.values());
    const triggers = this.alertTriggers;

    const triggersByPriority = triggers.reduce((acc, trigger) => {
      const priority = trigger.actions[0]?.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostTriggeredRules = rules
      .filter(rule => rule.triggerCount > 0)
      .sort((a, b) => b.triggerCount - a.triggerCount)
      .slice(0, 5)
      .map(rule => ({ name: rule.name, count: rule.triggerCount }));

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalTriggers: triggers.length,
      unresolvedTriggers: triggers.filter(t => !t.resolved).length,
      triggersByPriority,
      mostTriggeredRules
    };
  }

  public shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    debugLog.info('monitoring_alerts', 'shutdown', 'Monitoring alerts system shutdown');
  }
}

// Export singleton instance
export const monitoringAlerts = MonitoringAlertsSystem.getInstance();

export default monitoringAlerts;
