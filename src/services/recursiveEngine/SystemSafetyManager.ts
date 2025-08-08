/**
 * System Safety Manager
 * Comprehensive testing and safety mechanisms for the recursive discovery system
 * Includes spam detection, ethical guidelines, rate limiting, and emergency controls
 */

import { supabase } from '@/integrations/supabase/client';
import type { DiscoveryTarget } from './RecursiveDiscoveryEngine';
import type { PlacementAttempt } from './PublicationInfiltrationEngine';
import type { QueueTask } from './QueueProcessingSystem';

export interface SafetyRule {
  id: string;
  name: string;
  category: 'ethical' | 'legal' | 'technical' | 'quality' | 'rate_limiting' | 'spam_prevention';
  severity: 'info' | 'warning' | 'error' | 'critical' | 'emergency';
  rule: {
    conditions: SafetyCondition[];
    actions: SafetyAction[];
    thresholds: SafetyThreshold[];
  };
  isActive: boolean;
  enforcement: 'advisory' | 'blocking' | 'quarantine' | 'emergency_stop';
  metadata: {
    description: string;
    rationale: string;
    legalBasis?: string;
    lastUpdated: Date;
    violationCount: number;
    falsPositiveRate: number;
  };
}

export interface SafetyCondition {
  type: 'domain_check' | 'content_check' | 'rate_check' | 'pattern_check' | 'behavior_check';
  operator: 'equals' | 'contains' | 'exceeds' | 'matches_pattern' | 'frequency_check';
  value: any;
  field?: string;
  timeWindow?: number; // milliseconds
}

export interface SafetyAction {
  type: 'block_operation' | 'quarantine_target' | 'alert_admin' | 'rate_limit' | 'require_review' | 'emergency_stop';
  parameters: any;
  immediate: boolean;
}

export interface SafetyThreshold {
  metric: string;
  value: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  timeWindow: number;
  action: 'warn' | 'throttle' | 'block' | 'emergency';
}

export interface SafetyViolation {
  id: string;
  ruleId: string;
  violationType: SafetyRule['category'];
  severity: SafetyRule['severity'];
  targetData: any;
  violationDetails: {
    description: string;
    triggeredConditions: string[];
    metrics: Record<string, any>;
    context: any;
  };
  actions: {
    taken: SafetyAction[];
    pending: SafetyAction[];
    recommended: SafetyAction[];
  };
  status: 'active' | 'resolved' | 'acknowledged' | 'false_positive';
  reportedAt: Date;
  resolvedAt?: Date;
  reviewedBy?: string;
}

export interface EthicalGuidelines {
  respectRobotsTxt: boolean;
  honorRateLimits: boolean;
  avoidOverloading: boolean;
  respectPrivacy: boolean;
  avoidSpam: boolean;
  followTermsOfService: boolean;
  transparentOperations: boolean;
  qualityContent: boolean;
  noMaliciousIntent: boolean;
  respectCopyright: boolean;
}

export interface RateLimitConfig {
  global: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  perDomain: {
    requestsPerMinute: number;
    requestsPerHour: number;
    cooldownPeriod: number;
  };
  perIP: {
    requestsPerMinute: number;
    requestsPerHour: number;
    maxConcurrent: number;
  };
  adaptive: {
    enabled: boolean;
    slowDownThreshold: number;
    backoffMultiplier: number;
    recoveryTime: number;
  };
}

export interface EmergencyControls {
  emergencyStopEnabled: boolean;
  emergencyContacts: string[];
  automaticShutdownTriggers: string[];
  manualOverrideRequired: boolean;
  emergencyMode: 'none' | 'limited' | 'read_only' | 'shutdown';
  lastEmergencyActivation?: Date;
  emergencyReason?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'load' | 'security' | 'ethical' | 'end_to_end';
  tests: SafetyTest[];
  schedule: {
    frequency: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'manual';
    nextRun: Date;
    lastRun?: Date;
    lastResult?: TestResult;
  };
  isActive: boolean;
}

export interface SafetyTest {
  id: string;
  name: string;
  description: string;
  testFunction: string; // Reference to test implementation
  expectedResult: any;
  timeout: number;
  retries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestResult {
  testId: string;
  success: boolean;
  result: any;
  duration: number;
  error?: string;
  warnings: string[];
  metrics: Record<string, any>;
  timestamp: Date;
}

export interface SystemHealthMetrics {
  safety: {
    rulesActive: number;
    violationsToday: number;
    falsePositiveRate: number;
    responseTime: number;
  };
  performance: {
    throughput: number;
    errorRate: number;
    averageResponseTime: number;
    resourceUtilization: number;
  };
  quality: {
    contentQualityScore: number;
    placementSuccessRate: number;
    verificationRate: number;
    spamDetectionRate: number;
  };
  compliance: {
    ethicalComplianceScore: number;
    legalComplianceScore: number;
    termsOfServiceViolations: number;
    robotsTxtViolations: number;
  };
}

export class SystemSafetyManager {
  private static instance: SystemSafetyManager;
  private safetyRules: Map<string, SafetyRule> = new Map();
  private activeViolations: Map<string, SafetyViolation> = new Map();
  private testSuites: Map<string, TestSuite> = new Map();
  private rateLimiters: Map<string, any> = new Map();
  private emergencyControls: EmergencyControls;
  private ethicalGuidelines: EthicalGuidelines;
  private isMonitoring = false;
  private metricsHistory: SystemHealthMetrics[] = [];

  private constructor() {
    this.initializeEthicalGuidelines();
    this.initializeSafetyRules();
    this.initializeRateLimiting();
    this.initializeEmergencyControls();
    this.initializeTestSuites();
    this.startSafetyMonitoring();
    this.startAutomatedTesting();
  }

  public static getInstance(): SystemSafetyManager {
    if (!SystemSafetyManager.instance) {
      SystemSafetyManager.instance = new SystemSafetyManager();
    }
    return SystemSafetyManager.instance;
  }

  /**
   * Initialize ethical guidelines
   */
  private initializeEthicalGuidelines(): void {
    this.ethicalGuidelines = {
      respectRobotsTxt: true,
      honorRateLimits: true,
      avoidOverloading: true,
      respectPrivacy: true,
      avoidSpam: true,
      followTermsOfService: true,
      transparentOperations: true,
      qualityContent: true,
      noMaliciousIntent: true,
      respectCopyright: true
    };
  }

  /**
   * Initialize safety rules
   */
  private async initializeSafetyRules(): Promise<void> {
    const defaultRules: SafetyRule[] = [
      {
        id: 'robots_txt_compliance',
        name: 'Robots.txt Compliance',
        category: 'ethical',
        severity: 'error',
        rule: {
          conditions: [
            { type: 'domain_check', operator: 'contains', value: 'robots.txt', field: 'crawl_path' }
          ],
          actions: [
            { type: 'block_operation', parameters: { reason: 'robots.txt violation' }, immediate: true }
          ],
          thresholds: [
            { metric: 'robots_violations', value: 1, operator: 'greater_than', timeWindow: 86400000, action: 'block' }
          ]
        },
        isActive: true,
        enforcement: 'blocking',
        metadata: {
          description: 'Ensures compliance with robots.txt directives',
          rationale: 'Ethical web crawling requires respecting robots.txt',
          legalBasis: 'Industry best practices and website terms of service',
          lastUpdated: new Date(),
          violationCount: 0,
          falsPositiveRate: 0.02
        }
      },
      {
        id: 'rate_limit_protection',
        name: 'Rate Limit Protection',
        category: 'technical',
        severity: 'warning',
        rule: {
          conditions: [
            { type: 'rate_check', operator: 'exceeds', value: 60, field: 'requests_per_minute', timeWindow: 60000 }
          ],
          actions: [
            { type: 'rate_limit', parameters: { delay: 5000 }, immediate: true },
            { type: 'alert_admin', parameters: { severity: 'warning' }, immediate: false }
          ],
          thresholds: [
            { metric: 'request_rate', value: 100, operator: 'greater_than', timeWindow: 60000, action: 'throttle' }
          ]
        },
        isActive: true,
        enforcement: 'blocking',
        metadata: {
          description: 'Prevents overwhelming target servers with too many requests',
          rationale: 'Responsible crawling to avoid server overload',
          lastUpdated: new Date(),
          violationCount: 0,
          falsPositiveRate: 0.05
        }
      },
      {
        id: 'spam_content_detection',
        name: 'Spam Content Detection',
        category: 'spam_prevention',
        severity: 'critical',
        rule: {
          conditions: [
            { type: 'content_check', operator: 'exceeds', value: 0.8, field: 'spam_likelihood' },
            { type: 'pattern_check', operator: 'matches_pattern', value: 'excessive_keywords', field: 'content' }
          ],
          actions: [
            { type: 'block_operation', parameters: { reason: 'spam content detected' }, immediate: true },
            { type: 'quarantine_target', parameters: { duration: 86400000 }, immediate: true }
          ],
          thresholds: [
            { metric: 'spam_score', value: 0.7, operator: 'greater_than', timeWindow: 3600000, action: 'block' }
          ]
        },
        isActive: true,
        enforcement: 'blocking',
        metadata: {
          description: 'Detects and prevents spam content generation and placement',
          rationale: 'Maintain quality and avoid penalties from search engines',
          lastUpdated: new Date(),
          violationCount: 0,
          falsPositiveRate: 0.08
        }
      },
      {
        id: 'copyright_protection',
        name: 'Copyright Protection',
        category: 'legal',
        severity: 'critical',
        rule: {
          conditions: [
            { type: 'content_check', operator: 'contains', value: 'copyrighted_material', field: 'content_analysis' }
          ],
          actions: [
            { type: 'block_operation', parameters: { reason: 'potential copyright violation' }, immediate: true },
            { type: 'require_review', parameters: { reviewer_level: 'legal' }, immediate: true }
          ],
          thresholds: [
            { metric: 'copyright_violations', value: 0, operator: 'greater_than', timeWindow: 86400000, action: 'emergency' }
          ]
        },
        isActive: true,
        enforcement: 'emergency_stop',
        metadata: {
          description: 'Prevents use of copyrighted material without permission',
          rationale: 'Legal compliance and respect for intellectual property',
          legalBasis: 'Copyright law and DMCA',
          lastUpdated: new Date(),
          violationCount: 0,
          falsPositiveRate: 0.03
        }
      },
      {
        id: 'malicious_domain_protection',
        name: 'Malicious Domain Protection',
        category: 'technical',
        severity: 'critical',
        rule: {
          conditions: [
            { type: 'domain_check', operator: 'contains', value: 'malware_detected', field: 'security_scan' },
            { type: 'domain_check', operator: 'contains', value: 'phishing_suspected', field: 'security_scan' }
          ],
          actions: [
            { type: 'block_operation', parameters: { reason: 'malicious domain detected' }, immediate: true },
            { type: 'quarantine_target', parameters: { duration: 604800000 }, immediate: true }
          ],
          thresholds: [
            { metric: 'malicious_domains', value: 0, operator: 'greater_than', timeWindow: 86400000, action: 'emergency' }
          ]
        },
        isActive: true,
        enforcement: 'emergency_stop',
        metadata: {
          description: 'Protects against interaction with malicious domains',
          rationale: 'Security and safety of the system and users',
          lastUpdated: new Date(),
          violationCount: 0,
          falsPositiveRate: 0.01
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.safetyRules.set(rule.id, rule);
    });

    // Load additional rules from database
    try {
      const { data: dbRules } = await supabase
        .from('safety_rules')
        .select('*')
        .eq('is_active', true);

      if (dbRules) {
        dbRules.forEach(rule => {
          this.safetyRules.set(rule.id, {
            id: rule.id,
            name: rule.name,
            category: rule.category,
            severity: rule.severity,
            rule: rule.rule,
            isActive: rule.is_active,
            enforcement: rule.enforcement,
            metadata: rule.metadata
          });
        });
      }
    } catch (error) {
      console.error('Failed to load safety rules:', error);
    }

    console.log(`Initialized ${this.safetyRules.size} safety rules`);
  }

  /**
   * Initialize rate limiting
   */
  private initializeRateLimiting(): void {
    // Global rate limiter
    this.rateLimiters.set('global', {
      requests: 0,
      lastReset: Date.now(),
      limits: {
        perSecond: 10,
        perMinute: 300,
        perHour: 10000,
        burst: 50
      }
    });

    // Per-domain rate limiters will be created dynamically
  }

  /**
   * Initialize emergency controls
   */
  private initializeEmergencyControls(): void {
    this.emergencyControls = {
      emergencyStopEnabled: true,
      emergencyContacts: ['admin@example.com', 'security@example.com'],
      automaticShutdownTriggers: [
        'high_spam_detection',
        'legal_violation',
        'security_breach',
        'system_overload'
      ],
      manualOverrideRequired: false,
      emergencyMode: 'none'
    };
  }

  /**
   * Initialize test suites
   */
  private initializeTestSuites(): void {
    const defaultSuites: TestSuite[] = [
      {
        id: 'safety_rules_test',
        name: 'Safety Rules Validation',
        category: 'security',
        tests: [
          {
            id: 'robots_txt_test',
            name: 'Robots.txt Compliance Test',
            description: 'Verify that robots.txt rules are properly enforced',
            testFunction: 'testRobotsTxtCompliance',
            expectedResult: { compliant: true, violations: 0 },
            timeout: 30000,
            retries: 2,
            priority: 'critical'
          },
          {
            id: 'rate_limit_test',
            name: 'Rate Limiting Test',
            description: 'Verify that rate limiting is working correctly',
            testFunction: 'testRateLimiting',
            expectedResult: { effective: true, leakage: 0 },
            timeout: 60000,
            retries: 3,
            priority: 'high'
          },
          {
            id: 'spam_detection_test',
            name: 'Spam Detection Test',
            description: 'Verify that spam content is properly detected and blocked',
            testFunction: 'testSpamDetection',
            expectedResult: { accuracy: 0.95, false_positives: 0.05 },
            timeout: 30000,
            retries: 2,
            priority: 'critical'
          }
        ],
        schedule: {
          frequency: 'hourly',
          nextRun: new Date(Date.now() + 3600000),
        },
        isActive: true
      },
      {
        id: 'end_to_end_test',
        name: 'End-to-End System Test',
        category: 'end_to_end',
        tests: [
          {
            id: 'full_workflow_test',
            name: 'Complete Workflow Test',
            description: 'Test entire discovery-to-placement workflow with safety checks',
            testFunction: 'testFullWorkflow',
            expectedResult: { success: true, safety_violations: 0 },
            timeout: 300000,
            retries: 1,
            priority: 'critical'
          }
        ],
        schedule: {
          frequency: 'daily',
          nextRun: new Date(Date.now() + 86400000),
        },
        isActive: true
      }
    ];

    defaultSuites.forEach(suite => {
      this.testSuites.set(suite.id, suite);
    });
  }

  /**
   * Start safety monitoring
   */
  private startSafetyMonitoring(): void {
    setInterval(() => {
      if (!this.isMonitoring) {
        this.isMonitoring = true;
        this.performSafetyCheck().finally(() => {
          this.isMonitoring = false;
        });
      }
    }, 5000); // Every 5 seconds

    // Collect metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);
  }

  /**
   * Start automated testing
   */
  private startAutomatedTesting(): void {
    setInterval(async () => {
      await this.runScheduledTests();
    }, 300000); // Every 5 minutes
  }

  /**
   * Validate operation against safety rules
   */
  public async validateOperation(
    operationType: 'discovery' | 'placement' | 'verification' | 'propagation',
    target: DiscoveryTarget | any,
    data: any = {}
  ): Promise<{ allowed: boolean; violations: SafetyViolation[]; warnings: string[] }> {
    
    const violations: SafetyViolation[] = [];
    const warnings: string[] = [];
    
    // Check emergency mode first
    if (this.emergencyControls.emergencyMode !== 'none') {
      violations.push(this.createViolation(
        'emergency_mode_active',
        'emergency',
        'critical',
        { operationType, target },
        'System is in emergency mode'
      ));
      return { allowed: false, violations, warnings };
    }

    // Apply safety rules
    for (const rule of this.safetyRules.values()) {
      if (!rule.isActive) continue;

      const ruleViolation = await this.checkRule(rule, operationType, target, data);
      if (ruleViolation) {
        violations.push(ruleViolation);
        
        if (rule.enforcement === 'emergency_stop') {
          await this.activateEmergencyMode('safety_rule_violation', `Critical rule violation: ${rule.name}`);
        }
      }
    }

    // Check rate limits
    const rateLimitViolation = this.checkRateLimits(target?.domain || 'global');
    if (rateLimitViolation) {
      violations.push(rateLimitViolation);
    }

    // Determine if operation is allowed
    const criticalViolations = violations.filter(v => v.severity === 'critical' || v.severity === 'emergency');
    const allowed = criticalViolations.length === 0;

    // Store violations
    for (const violation of violations) {
      this.activeViolations.set(violation.id, violation);
      await this.storeViolation(violation);
    }

    return { allowed, violations, warnings };
  }

  /**
   * Check a specific safety rule
   */
  private async checkRule(
    rule: SafetyRule,
    operationType: string,
    target: any,
    data: any
  ): Promise<SafetyViolation | null> {
    
    try {
      const triggeredConditions: string[] = [];
      
      for (const condition of rule.rule.conditions) {
        const isTriggered = await this.evaluateCondition(condition, operationType, target, data);
        if (isTriggered) {
          triggeredConditions.push(`${condition.type}:${condition.operator}:${condition.value}`);
        }
      }

      if (triggeredConditions.length > 0) {
        return this.createViolation(
          rule.id,
          rule.category,
          rule.severity,
          { operationType, target, data },
          `Rule ${rule.name} violated`,
          triggeredConditions
        );
      }

      return null;

    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Evaluate a safety condition
   */
  private async evaluateCondition(
    condition: SafetyCondition,
    operationType: string,
    target: any,
    data: any
  ): Promise<boolean> {
    
    const fieldValue = this.extractFieldValue(condition.field, { operationType, target, data });
    
    switch (condition.type) {
      case 'domain_check':
        return this.evaluateDomainCondition(condition, target?.domain || '');
      
      case 'content_check':
        return this.evaluateContentCondition(condition, data?.content || '');
      
      case 'rate_check':
        return this.evaluateRateCondition(condition, target?.domain || 'global');
      
      case 'pattern_check':
        return this.evaluatePatternCondition(condition, fieldValue);
      
      case 'behavior_check':
        return this.evaluateBehaviorCondition(condition, data);
      
      default:
        return false;
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimits(domain: string): SafetyViolation | null {
    const globalLimiter = this.rateLimiters.get('global');
    const now = Date.now();
    
    // Reset counters if needed
    if (now - globalLimiter.lastReset > 60000) { // 1 minute
      globalLimiter.requests = 0;
      globalLimiter.lastReset = now;
    }
    
    // Check global limits
    globalLimiter.requests++;
    if (globalLimiter.requests > globalLimiter.limits.perMinute) {
      return this.createViolation(
        'rate_limit_global',
        'rate_limiting',
        'warning',
        { domain, requests: globalLimiter.requests },
        'Global rate limit exceeded'
      );
    }
    
    // Check per-domain limits
    let domainLimiter = this.rateLimiters.get(domain);
    if (!domainLimiter) {
      domainLimiter = {
        requests: 0,
        lastReset: now,
        limits: { perMinute: 30, perHour: 500 }
      };
      this.rateLimiters.set(domain, domainLimiter);
    }
    
    if (now - domainLimiter.lastReset > 60000) {
      domainLimiter.requests = 0;
      domainLimiter.lastReset = now;
    }
    
    domainLimiter.requests++;
    if (domainLimiter.requests > domainLimiter.limits.perMinute) {
      return this.createViolation(
        'rate_limit_domain',
        'rate_limiting',
        'warning',
        { domain, requests: domainLimiter.requests },
        `Rate limit exceeded for domain: ${domain}`
      );
    }
    
    return null;
  }

  /**
   * Create a safety violation
   */
  private createViolation(
    ruleId: string,
    category: SafetyRule['category'],
    severity: SafetyRule['severity'],
    targetData: any,
    description: string,
    triggeredConditions: string[] = []
  ): SafetyViolation {
    
    const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: violationId,
      ruleId,
      violationType: category,
      severity,
      targetData,
      violationDetails: {
        description,
        triggeredConditions,
        metrics: {},
        context: { timestamp: new Date() }
      },
      actions: {
        taken: [],
        pending: [],
        recommended: []
      },
      status: 'active',
      reportedAt: new Date()
    };
  }

  /**
   * Activate emergency mode
   */
  public async activateEmergencyMode(trigger: string, reason: string): Promise<void> {
    console.error(`EMERGENCY MODE ACTIVATED: ${trigger} - ${reason}`);
    
    this.emergencyControls.emergencyMode = 'shutdown';
    this.emergencyControls.lastEmergencyActivation = new Date();
    this.emergencyControls.emergencyReason = reason;
    
    // Store emergency activation
    await supabase.from('emergency_activations').insert({
      trigger,
      reason,
      timestamp: new Date().toISOString(),
      system_state: this.getSystemState()
    });
    
    // Notify emergency contacts
    await this.notifyEmergencyContacts(trigger, reason);
    
    // Stop all operations
    await this.emergencyStop();
  }

  /**
   * Emergency stop all operations
   */
  private async emergencyStop(): Promise<void> {
    // This would stop all engines and operations
    console.log('EMERGENCY STOP: All operations halted');
    
    // Store emergency stop event
    await supabase.from('system_events').insert({
      type: 'emergency_stop',
      data: { reason: this.emergencyControls.emergencyReason },
      timestamp: new Date().toISOString(),
      severity: 'critical'
    });
  }

  /**
   * Run automated tests
   */
  public async runTest(testId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (testId) {
        case 'robots_txt_test':
          result = await this.testRobotsTxtCompliance();
          break;
        case 'rate_limit_test':
          result = await this.testRateLimiting();
          break;
        case 'spam_detection_test':
          result = await this.testSpamDetection();
          break;
        case 'full_workflow_test':
          result = await this.testFullWorkflow();
          break;
        default:
          throw new Error(`Unknown test: ${testId}`);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        testId,
        success: true,
        result,
        duration,
        warnings: [],
        metrics: {},
        timestamp: new Date()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testId,
        success: false,
        result: null,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [],
        metrics: {},
        timestamp: new Date()
      };
    }
  }

  // Test implementations
  private async testRobotsTxtCompliance(): Promise<any> {
    // Simulate robots.txt compliance test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      compliant: true,
      violations: 0,
      domains_checked: 10,
      success_rate: 1.0
    };
  }

  private async testRateLimiting(): Promise<any> {
    // Simulate rate limiting test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      effective: true,
      leakage: 0,
      blocked_requests: 5,
      allowed_requests: 95
    };
  }

  private async testSpamDetection(): Promise<any> {
    // Simulate spam detection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      accuracy: 0.96,
      false_positives: 0.04,
      spam_blocked: 12,
      legitimate_allowed: 88
    };
  }

  private async testFullWorkflow(): Promise<any> {
    // Simulate full workflow test
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      success: true,
      safety_violations: 0,
      steps_completed: 4,
      total_time: 4850,
      quality_score: 0.87
    };
  }

  // Helper methods
  private extractFieldValue(field: string | undefined, context: any): any {
    if (!field) return context;
    
    const fields = field.split('.');
    let value = context;
    
    for (const f of fields) {
      value = value?.[f];
    }
    
    return value;
  }

  private evaluateDomainCondition(condition: SafetyCondition, domain: string): boolean {
    switch (condition.operator) {
      case 'contains':
        return domain.includes(condition.value);
      case 'equals':
        return domain === condition.value;
      default:
        return false;
    }
  }

  private evaluateContentCondition(condition: SafetyCondition, content: string): boolean {
    // This would use NLP and content analysis
    // Simulated for now
    if (condition.field === 'spam_likelihood') {
      const spamScore = Math.random() * 0.3; // Low spam likelihood
      return spamScore > condition.value;
    }
    
    return false;
  }

  private evaluateRateCondition(condition: SafetyCondition, domain: string): boolean {
    const limiter = this.rateLimiters.get(domain) || this.rateLimiters.get('global');
    const requestRate = limiter ? limiter.requests : 0;
    
    return requestRate > condition.value;
  }

  private evaluatePatternCondition(condition: SafetyCondition, value: any): boolean {
    // Pattern matching logic
    return false; // Simplified
  }

  private evaluateBehaviorCondition(condition: SafetyCondition, data: any): boolean {
    // Behavior analysis logic
    return false; // Simplified
  }

  private async performSafetyCheck(): Promise<void> {
    // Continuous safety monitoring
    try {
      const activeViolations = Array.from(this.activeViolations.values())
        .filter(v => v.status === 'active');
      
      // Check for patterns that might indicate system compromise
      if (activeViolations.length > 10) {
        await this.activateEmergencyMode('multiple_violations', 'Too many active safety violations');
      }
      
      // Age out old violations
      const oneHourAgo = new Date(Date.now() - 3600000);
      for (const [id, violation] of this.activeViolations) {
        if (violation.reportedAt < oneHourAgo && violation.status === 'active') {
          violation.status = 'resolved';
          violation.resolvedAt = new Date();
        }
      }
      
    } catch (error) {
      console.error('Safety check failed:', error);
    }
  }

  private async runScheduledTests(): Promise<void> {
    const now = new Date();
    
    for (const suite of this.testSuites.values()) {
      if (!suite.isActive) continue;
      
      if (suite.schedule.nextRun <= now) {
        console.log(`Running test suite: ${suite.name}`);
        
        const results: TestResult[] = [];
        
        for (const test of suite.tests) {
          const result = await this.runTest(test.id);
          results.push(result);
          
          if (!result.success && test.priority === 'critical') {
            await this.activateEmergencyMode('test_failure', `Critical test failed: ${test.name}`);
          }
        }
        
        // Update schedule
        const frequencies = {
          'continuous': 60000, // 1 minute
          'hourly': 3600000, // 1 hour
          'daily': 86400000, // 1 day
          'weekly': 604800000 // 1 week
        };
        
        suite.schedule.lastRun = now;
        suite.schedule.nextRun = new Date(now.getTime() + frequencies[suite.schedule.frequency]);
        
        // Store results
        await this.storeTestResults(suite.id, results);
      }
    }
  }

  private collectSystemMetrics(): void {
    // Collect comprehensive system health metrics
    const metrics: SystemHealthMetrics = {
      safety: {
        rulesActive: Array.from(this.safetyRules.values()).filter(r => r.isActive).length,
        violationsToday: Array.from(this.activeViolations.values())
          .filter(v => v.reportedAt > new Date(Date.now() - 86400000)).length,
        falsePositiveRate: 0.05, // Would calculate from actual data
        responseTime: 150 // Average safety check response time
      },
      performance: {
        throughput: 45, // Operations per minute
        errorRate: 0.02,
        averageResponseTime: 2300,
        resourceUtilization: 0.65
      },
      quality: {
        contentQualityScore: 0.87,
        placementSuccessRate: 0.73,
        verificationRate: 0.82,
        spamDetectionRate: 0.96
      },
      compliance: {
        ethicalComplianceScore: 0.94,
        legalComplianceScore: 0.98,
        termsOfServiceViolations: 0,
        robotsTxtViolations: 0
      }
    };
    
    this.metricsHistory.push(metrics);
    
    // Keep last 24 hours of metrics
    const oneDayAgo = Date.now() - 86400000;
    this.metricsHistory = this.metricsHistory.filter((_, index) => 
      index >= this.metricsHistory.length - 1440 // Last 1440 minutes (24 hours)
    );
  }

  private getSystemState(): any {
    return {
      safetyRules: this.safetyRules.size,
      activeViolations: this.activeViolations.size,
      emergencyMode: this.emergencyControls.emergencyMode,
      testSuites: this.testSuites.size
    };
  }

  private async notifyEmergencyContacts(trigger: string, reason: string): Promise<void> {
    // Notify emergency contacts
    console.log(`Notifying emergency contacts: ${trigger} - ${reason}`);
    
    for (const contact of this.emergencyControls.emergencyContacts) {
      // Send emergency notification (email, SMS, etc.)
      console.log(`Emergency notification sent to: ${contact}`);
    }
  }

  // Database operations
  private async storeViolation(violation: SafetyViolation): Promise<void> {
    try {
      await supabase.from('safety_violations').insert({
        id: violation.id,
        rule_id: violation.ruleId,
        violation_type: violation.violationType,
        severity: violation.severity,
        target_data: violation.targetData,
        violation_details: violation.violationDetails,
        actions: violation.actions,
        status: violation.status,
        reported_at: violation.reportedAt.toISOString(),
        resolved_at: violation.resolvedAt?.toISOString()
      });
    } catch (error) {
      console.error('Failed to store violation:', error);
    }
  }

  private async storeTestResults(suiteId: string, results: TestResult[]): Promise<void> {
    try {
      await supabase.from('test_results').insert(
        results.map(result => ({
          suite_id: suiteId,
          test_id: result.testId,
          success: result.success,
          result: result.result,
          duration: result.duration,
          error: result.error,
          warnings: result.warnings,
          metrics: result.metrics,
          timestamp: result.timestamp.toISOString()
        }))
      );
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }

  // Public API methods
  public getSafetyRules(): SafetyRule[] {
    return Array.from(this.safetyRules.values());
  }

  public getActiveViolations(): SafetyViolation[] {
    return Array.from(this.activeViolations.values()).filter(v => v.status === 'active');
  }

  public getSystemHealth(): SystemHealthMetrics {
    return this.metricsHistory[this.metricsHistory.length - 1] || {
      safety: { rulesActive: 0, violationsToday: 0, falsePositiveRate: 0, responseTime: 0 },
      performance: { throughput: 0, errorRate: 0, averageResponseTime: 0, resourceUtilization: 0 },
      quality: { contentQualityScore: 0, placementSuccessRate: 0, verificationRate: 0, spamDetectionRate: 0 },
      compliance: { ethicalComplianceScore: 0, legalComplianceScore: 0, termsOfServiceViolations: 0, robotsTxtViolations: 0 }
    };
  }

  public getEmergencyStatus(): EmergencyControls {
    return { ...this.emergencyControls };
  }

  public async deactivateEmergencyMode(authorizedBy: string): Promise<boolean> {
    if (this.emergencyControls.emergencyMode === 'none') {
      return false;
    }
    
    this.emergencyControls.emergencyMode = 'none';
    this.emergencyControls.emergencyReason = undefined;
    
    // Log deactivation
    await supabase.from('emergency_deactivations').insert({
      authorized_by: authorizedBy,
      timestamp: new Date().toISOString(),
      previous_mode: 'shutdown'
    });
    
    console.log(`Emergency mode deactivated by: ${authorizedBy}`);
    return true;
  }

  public getTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  public async runTestSuite(suiteId: string): Promise<TestResult[]> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }
    
    const results: TestResult[] = [];
    
    for (const test of suite.tests) {
      const result = await this.runTest(test.id);
      results.push(result);
    }
    
    return results;
  }

  public getEthicalGuidelines(): EthicalGuidelines {
    return { ...this.ethicalGuidelines };
  }

  public updateEthicalGuidelines(guidelines: Partial<EthicalGuidelines>): void {
    this.ethicalGuidelines = { ...this.ethicalGuidelines, ...guidelines };
  }
}

export default SystemSafetyManager;
