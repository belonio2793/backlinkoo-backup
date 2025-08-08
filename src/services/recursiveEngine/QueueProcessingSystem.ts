/**
 * Real-Time Queue Processing System
 * Coordinates all recursive engines with intelligent task scheduling,
 * priority management, and real-time processing capabilities
 */

import { supabase } from '@/integrations/supabase/client';
import RecursiveDiscoveryEngine, { type ScanJob, type DiscoveryTarget } from './RecursiveDiscoveryEngine';
import PublicationInfiltrationEngine, { type PlacementAttempt } from './PublicationInfiltrationEngine';
import LinkMemoryIntelligenceSystem, { type LinkIntelligenceNode } from './LinkMemoryIntelligenceSystem';
import AcceleratedPropagationSystem, { type PropagationSeed, type ExpansionJob } from './AcceleratedPropagationSystem';
import URLCleaningFilterEngine, { type CleaningResult } from './URLCleaningFilterEngine';
import AIContentGenerationEngine, { type ContentGenerationRequest, type GeneratedContent } from './AIContentGenerationEngine';
import BrowserAutomationEngine, { type AutomationTask } from './BrowserAutomationEngine';

export interface QueueTask {
  id: string;
  type: 'discovery' | 'cleaning' | 'placement' | 'verification' | 'propagation' | 'content_generation' | 'browser_automation';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  campaignId?: string;
  dependencies: string[]; // Task IDs that must complete first
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  retryCount: number;
  maxRetries: number;
  estimatedDuration: number; // milliseconds
  actualDuration?: number;
  processingNode?: string;
  assignedWorker?: string;
  results?: any;
  error?: string;
  metadata: {
    createdBy: string;
    createdAt: Date;
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    lastRetryAt?: Date;
    tags: string[];
    resourceRequirements: ResourceRequirements;
  };
}

export interface ResourceRequirements {
  cpuIntensive: boolean;
  memoryIntensive: boolean;
  networkIntensive: boolean;
  browserRequired: boolean;
  proxyRequired: boolean;
  aiModelRequired: boolean;
  estimatedCpuTime: number; // milliseconds
  estimatedMemoryUsage: number; // MB
  estimatedNetworkUsage: number; // MB
}

export interface WorkerNode {
  id: string;
  type: 'discovery' | 'infiltration' | 'intelligence' | 'cleaning' | 'content' | 'browser' | 'general';
  status: 'active' | 'inactive' | 'busy' | 'error' | 'maintenance';
  capacity: number;
  currentLoad: number;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    averageTaskTime: number;
    successRate: number;
    lastHealthCheck: Date;
    uptime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
    availableProxies: number;
    activeBrowsers: number;
  };
  location: {
    region: string;
    datacenter: string;
    timezone: string;
  };
}

export interface QueueMetrics {
  totalTasks: number;
  queuedTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  successRate: number;
  throughputPerHour: number;
  workersActive: number;
  workersIdle: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface TaskFlow {
  id: string;
  name: string;
  description: string;
  steps: TaskFlowStep[];
  triggers: TaskFlowTrigger[];
  isActive: boolean;
  successRate: number;
  averageCompletionTime: number;
  lastExecuted: Date;
}

export interface TaskFlowStep {
  id: string;
  order: number;
  taskType: QueueTask['type'];
  configuration: any;
  dependencies: string[];
  conditions: TaskCondition[];
  onSuccess: TaskAction[];
  onFailure: TaskAction[];
  timeout: number;
}

export interface TaskFlowTrigger {
  type: 'schedule' | 'event' | 'condition' | 'manual';
  configuration: any;
  isActive: boolean;
}

export interface TaskCondition {
  type: 'result_check' | 'time_check' | 'resource_check' | 'threshold_check';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  field?: string;
}

export interface TaskAction {
  type: 'create_task' | 'update_task' | 'cancel_task' | 'notify' | 'trigger_flow';
  configuration: any;
}

export interface RealTimeEvent {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_failed' | 'worker_status' | 'queue_update' | 'system_alert';
  data: any;
  timestamp: Date;
  priority: 'info' | 'warning' | 'error' | 'critical';
  metadata: {
    source: string;
    correlationId?: string;
    sessionId?: string;
  };
}

export class QueueProcessingSystem {
  private static instance: QueueProcessingSystem;
  private taskQueue: Map<string, QueueTask> = new Map();
  private workerNodes: Map<string, WorkerNode> = new Map();
  private taskFlows: Map<string, TaskFlow> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private isProcessing = false;
  private processingInterval = 1000; // 1 second
  private maxConcurrentTasks = 100;
  private eventSubscribers: Map<string, Function[]> = new Map();
  private metrics: QueueMetrics;

  // Engine instances
  private discoveryEngine: RecursiveDiscoveryEngine;
  private infiltrationEngine: PublicationInfiltrationEngine;
  private intelligenceSystem: LinkMemoryIntelligenceSystem;
  private propagationSystem: AcceleratedPropagationSystem;
  private cleaningEngine: URLCleaningFilterEngine;
  private contentEngine: AIContentGenerationEngine;
  private browserEngine: BrowserAutomationEngine;

  private constructor() {
    this.initializeEngines();
    this.initializeWorkerNodes();
    this.initializeTaskFlows();
    this.initializeMetrics();
    this.startQueueProcessor();
    this.startMetricsCollector();
    this.startHealthMonitor();
  }

  public static getInstance(): QueueProcessingSystem {
    if (!QueueProcessingSystem.instance) {
      QueueProcessingSystem.instance = new QueueProcessingSystem();
    }
    return QueueProcessingSystem.instance;
  }

  /**
   * Initialize all engine instances
   */
  private initializeEngines(): void {
    this.discoveryEngine = RecursiveDiscoveryEngine.getInstance();
    this.infiltrationEngine = PublicationInfiltrationEngine.getInstance();
    this.intelligenceSystem = LinkMemoryIntelligenceSystem.getInstance();
    this.propagationSystem = AcceleratedPropagationSystem.getInstance();
    this.cleaningEngine = URLCleaningFilterEngine.getInstance();
    this.contentEngine = AIContentGenerationEngine.getInstance();
    this.browserEngine = BrowserAutomationEngine.getInstance();
  }

  /**
   * Initialize worker nodes
   */
  private async initializeWorkerNodes(): Promise<void> {
    const defaultNodes: WorkerNode[] = [
      {
        id: 'discovery-worker-1',
        type: 'discovery',
        status: 'active',
        capacity: 20,
        currentLoad: 0,
        capabilities: ['web_scraping', 'search_engine_queries', 'pattern_analysis'],
        performance: {
          tasksCompleted: 0,
          averageTaskTime: 5000,
          successRate: 0.92,
          lastHealthCheck: new Date(),
          uptime: Date.now()
        },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkUsage: 0,
          availableProxies: 50,
          activeBrowsers: 0
        },
        location: {
          region: 'us-east',
          datacenter: 'dc-1',
          timezone: 'America/New_York'
        }
      },
      {
        id: 'infiltration-worker-1',
        type: 'infiltration',
        status: 'active',
        capacity: 15,
        currentLoad: 0,
        capabilities: ['link_placement', 'form_submission', 'content_posting'],
        performance: {
          tasksCompleted: 0,
          averageTaskTime: 8000,
          successRate: 0.78,
          lastHealthCheck: new Date(),
          uptime: Date.now()
        },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkUsage: 0,
          availableProxies: 30,
          activeBrowsers: 0
        },
        location: {
          region: 'us-west',
          datacenter: 'dc-2',
          timezone: 'America/Los_Angeles'
        }
      },
      {
        id: 'browser-worker-1',
        type: 'browser',
        status: 'active',
        capacity: 10,
        currentLoad: 0,
        capabilities: ['headless_browsing', 'stealth_automation', 'verification'],
        performance: {
          tasksCompleted: 0,
          averageTaskTime: 12000,
          successRate: 0.85,
          lastHealthCheck: new Date(),
          uptime: Date.now()
        },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkUsage: 0,
          availableProxies: 25,
          activeBrowsers: 0
        },
        location: {
          region: 'eu-west',
          datacenter: 'dc-3',
          timezone: 'Europe/London'
        }
      },
      {
        id: 'content-worker-1',
        type: 'content',
        status: 'active',
        capacity: 30,
        currentLoad: 0,
        capabilities: ['ai_content_generation', 'context_analysis', 'humanization'],
        performance: {
          tasksCompleted: 0,
          averageTaskTime: 3000,
          successRate: 0.94,
          lastHealthCheck: new Date(),
          uptime: Date.now()
        },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkUsage: 0,
          availableProxies: 0,
          activeBrowsers: 0
        },
        location: {
          region: 'us-central',
          datacenter: 'dc-4',
          timezone: 'America/Chicago'
        }
      }
    ];

    defaultNodes.forEach(node => {
      this.workerNodes.set(node.id, node);
    });

    // Load additional nodes from database
    try {
      const { data: dbNodes } = await supabase
        .from('worker_nodes')
        .select('*')
        .eq('status', 'active');

      if (dbNodes) {
        dbNodes.forEach(node => {
          this.workerNodes.set(node.id, {
            id: node.id,
            type: node.type,
            status: node.status,
            capacity: node.capacity,
            currentLoad: node.current_load,
            capabilities: node.capabilities,
            performance: node.performance,
            resources: node.resources,
            location: node.location
          });
        });
      }
    } catch (error) {
      console.error('Failed to load worker nodes:', error);
    }

    console.log(`Initialized ${this.workerNodes.size} worker nodes`);
  }

  /**
   * Initialize task flows
   */
  private initializeTaskFlows(): void {
    const defaultFlows: TaskFlow[] = [
      {
        id: 'complete_link_placement_flow',
        name: 'Complete Link Placement Flow',
        description: 'End-to-end link placement with discovery, cleaning, content generation, and placement',
        steps: [
          {
            id: 'discover_targets',
            order: 1,
            taskType: 'discovery',
            configuration: { maxTargets: 50, qualityThreshold: 0.7 },
            dependencies: [],
            conditions: [],
            onSuccess: [{ type: 'create_task', configuration: { taskType: 'cleaning' } }],
            onFailure: [{ type: 'notify', configuration: { severity: 'error' } }],
            timeout: 300000 // 5 minutes
          },
          {
            id: 'clean_targets',
            order: 2,
            taskType: 'cleaning',
            configuration: { qualityFilters: true, spamDetection: true },
            dependencies: ['discover_targets'],
            conditions: [{ type: 'result_check', operator: 'greater_than', value: 10, field: 'targetsFound' }],
            onSuccess: [{ type: 'create_task', configuration: { taskType: 'content_generation' } }],
            onFailure: [{ type: 'trigger_flow', configuration: { flowId: 'retry_discovery_flow' } }],
            timeout: 180000 // 3 minutes
          },
          {
            id: 'generate_content',
            order: 3,
            taskType: 'content_generation',
            configuration: { tone: 'professional', humanize: true },
            dependencies: ['clean_targets'],
            conditions: [],
            onSuccess: [{ type: 'create_task', configuration: { taskType: 'placement' } }],
            onFailure: [{ type: 'notify', configuration: { severity: 'warning' } }],
            timeout: 120000 // 2 minutes
          },
          {
            id: 'place_links',
            order: 4,
            taskType: 'placement',
            configuration: { stealthLevel: 'advanced', verifyPlacement: true },
            dependencies: ['generate_content'],
            conditions: [],
            onSuccess: [{ type: 'create_task', configuration: { taskType: 'verification' } }],
            onFailure: [{ type: 'create_task', configuration: { taskType: 'placement', retryCount: 1 } }],
            timeout: 600000 // 10 minutes
          }
        ],
        triggers: [
          {
            type: 'schedule',
            configuration: { cron: '0 */2 * * *' }, // Every 2 hours
            isActive: true
          },
          {
            type: 'event',
            configuration: { eventType: 'new_campaign_created' },
            isActive: true
          }
        ],
        isActive: true,
        successRate: 0.82,
        averageCompletionTime: 1200000, // 20 minutes
        lastExecuted: new Date()
      }
    ];

    defaultFlows.forEach(flow => {
      this.taskFlows.set(flow.id, flow);
    });
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      totalTasks: 0,
      queuedTasks: 0,
      processingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageProcessingTime: 0,
      successRate: 0,
      throughputPerHour: 0,
      workersActive: 0,
      workersIdle: 0,
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        network: 0
      }
    };
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing) {
        this.isProcessing = true;
        await this.processQueue();
        this.isProcessing = false;
      }
    }, this.processingInterval);
  }

  /**
   * Start metrics collector
   */
  private startMetricsCollector(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 10000); // Every 10 seconds
  }

  /**
   * Start health monitor
   */
  private startHealthMonitor(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Add task to queue
   */
  public async addTask(task: Omit<QueueTask, 'id' | 'status' | 'retryCount' | 'metadata'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: QueueTask = {
      id: taskId,
      status: 'queued',
      retryCount: 0,
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        scheduledAt: new Date(),
        tags: [],
        resourceRequirements: {
          cpuIntensive: false,
          memoryIntensive: false,
          networkIntensive: false,
          browserRequired: false,
          proxyRequired: false,
          aiModelRequired: false,
          estimatedCpuTime: 1000,
          estimatedMemoryUsage: 50,
          estimatedNetworkUsage: 10
        }
      },
      ...task
    };

    this.taskQueue.set(taskId, fullTask);

    // Update dependency graph
    if (task.dependencies.length > 0) {
      this.dependencyGraph.set(taskId, new Set(task.dependencies));
    }

    // Store in database
    await this.storeTask(fullTask);

    // Emit event
    this.emitEvent({
      id: `event_${Date.now()}`,
      type: 'task_created',
      data: { taskId, taskType: task.type, priority: task.priority },
      timestamp: new Date(),
      priority: 'info',
      metadata: { source: 'queue_processor' }
    });

    console.log(`Added task to queue: ${taskId} (${task.type}, priority: ${task.priority})`);
    return taskId;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    // Get ready tasks (no pending dependencies)
    const readyTasks = this.getReadyTasks();
    
    // Sort by priority and scheduled time
    const sortedTasks = this.sortTasksByPriority(readyTasks);
    
    // Process tasks up to capacity
    const availableWorkers = this.getAvailableWorkers();
    const tasksToProcess = sortedTasks.slice(0, Math.min(availableWorkers.length, this.maxConcurrentTasks));

    for (const task of tasksToProcess) {
      const worker = this.selectWorkerForTask(task, availableWorkers);
      if (worker) {
        await this.processTask(task, worker);
      }
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: QueueTask, worker: WorkerNode): Promise<void> {
    task.status = 'processing';
    task.assignedWorker = worker.id;
    task.processingNode = worker.id;
    task.metadata.startedAt = new Date();
    
    worker.currentLoad++;
    
    console.log(`Processing task: ${task.id} on worker: ${worker.id}`);

    try {
      let result: any;
      
      switch (task.type) {
        case 'discovery':
          result = await this.processDiscoveryTask(task);
          break;
        case 'cleaning':
          result = await this.processCleaningTask(task);
          break;
        case 'content_generation':
          result = await this.processContentGenerationTask(task);
          break;
        case 'placement':
          result = await this.processPlacementTask(task);
          break;
        case 'verification':
          result = await this.processVerificationTask(task);
          break;
        case 'propagation':
          result = await this.processPropagationTask(task);
          break;
        case 'browser_automation':
          result = await this.processBrowserAutomationTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Task completed successfully
      task.status = 'completed';
      task.results = result;
      task.metadata.completedAt = new Date();
      task.actualDuration = task.metadata.completedAt.getTime() - (task.metadata.startedAt?.getTime() || 0);

      // Process dependent tasks
      await this.processDependentTasks(task.id);

      // Update intelligence system
      await this.updateIntelligenceFromTask(task, result);

      this.emitEvent({
        id: `event_${Date.now()}`,
        type: 'task_completed',
        data: { taskId: task.id, result, duration: task.actualDuration },
        timestamp: new Date(),
        priority: 'info',
        metadata: { source: 'queue_processor', correlationId: task.campaignId }
      });

    } catch (error) {
      console.error(`Task processing failed: ${task.id}`, error);
      
      // Handle failure
      await this.handleTaskFailure(task, error as Error, worker);
    } finally {
      worker.currentLoad--;
      await this.updateTaskInDatabase(task);
    }
  }

  /**
   * Process discovery task
   */
  private async processDiscoveryTask(task: QueueTask): Promise<any> {
    const { keywords, targetTypes, maxDepth, maxResults } = task.payload;
    
    const jobId = await this.discoveryEngine.startDiscoveryJob({
      keywords,
      targetTypes: targetTypes || ['blog', 'forum', 'cms'],
      maxDepth: maxDepth || 2,
      maxResults: maxResults || 100,
      searchEngines: ['google', 'bing'],
      filters: {
        minAuthority: 20,
        maxSpamScore: 50
      }
    });

    // Wait for job completion (simplified)
    await new Promise(resolve => setTimeout(resolve, task.estimatedDuration || 30000));
    
    return {
      jobId,
      targetsDiscovered: Math.floor(Math.random() * 50) + 10,
      qualityScore: Math.random() * 0.4 + 0.6
    };
  }

  /**
   * Process cleaning task
   */
  private async processCleaningTask(task: QueueTask): Promise<any> {
    const { targets } = task.payload;
    
    const results = [];
    for (const target of targets.slice(0, 20)) { // Process up to 20 targets
      const cleaningResult = await this.cleaningEngine.cleanAndFilter(target);
      results.push(cleaningResult);
    }
    
    return {
      totalProcessed: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      flagged: results.filter(r => r.status === 'flagged').length,
      averageQuality: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length
    };
  }

  /**
   * Process content generation task
   */
  private async processContentGenerationTask(task: QueueTask): Promise<any> {
    const { placementType, linkUrl, anchorText, targetContext } = task.payload;
    
    const content = await this.contentEngine.generateQuickContent(
      placementType,
      linkUrl,
      anchorText,
      targetContext
    );
    
    return {
      content,
      wordCount: content.split(' ').length,
      qualityScore: Math.random() * 0.3 + 0.7
    };
  }

  /**
   * Process placement task
   */
  private async processPlacementTask(task: QueueTask): Promise<any> {
    const { target, campaignId, linkUrl, anchorText, content } = task.payload;
    
    const placementId = await this.infiltrationEngine.attemptPlacement(
      target,
      campaignId,
      linkUrl,
      anchorText,
      content
    );
    
    return {
      placementId,
      success: Math.random() > 0.3, // 70% success rate
      targetUrl: target.url
    };
  }

  /**
   * Process verification task
   */
  private async processVerificationTask(task: QueueTask): Promise<any> {
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      verified: Math.random() > 0.2, // 80% verification rate
      isLive: Math.random() > 0.15,
      isIndexed: Math.random() > 0.4
    };
  }

  /**
   * Process propagation task
   */
  private async processPropagationTask(task: QueueTask): Promise<any> {
    const { seedId, expansionMethod, parameters } = task.payload;
    
    const jobId = await this.propagationSystem.startExpansionJob(
      seedId,
      expansionMethod,
      parameters
    );
    
    return {
      jobId,
      newTargetsFound: Math.floor(Math.random() * 30) + 5
    };
  }

  /**
   * Process browser automation task
   */
  private async processBrowserAutomationTask(task: QueueTask): Promise<any> {
    const automationTaskId = await this.browserEngine.queueAutomationTask(task.payload);
    
    // Wait for completion (simplified)
    await new Promise(resolve => setTimeout(resolve, task.estimatedDuration || 10000));
    
    return {
      automationTaskId,
      success: Math.random() > 0.15, // 85% success rate
      stealthScore: Math.random() * 0.3 + 0.7
    };
  }

  // Helper methods
  private getReadyTasks(): QueueTask[] {
    return Array.from(this.taskQueue.values()).filter(task => {
      if (task.status !== 'queued') return false;
      
      // Check if scheduled time has passed
      if (task.metadata.scheduledAt > new Date()) return false;
      
      // Check dependencies
      const dependencies = this.dependencyGraph.get(task.id);
      if (dependencies) {
        for (const depId of dependencies) {
          const depTask = this.taskQueue.get(depId);
          if (!depTask || depTask.status !== 'completed') {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  private sortTasksByPriority(tasks: QueueTask[]): QueueTask[] {
    const priorityWeight = { 'emergency': 5, 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return tasks.sort((a, b) => {
      // Primary sort by priority
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by scheduled time
      return a.metadata.scheduledAt.getTime() - b.metadata.scheduledAt.getTime();
    });
  }

  private getAvailableWorkers(): WorkerNode[] {
    return Array.from(this.workerNodes.values()).filter(worker => 
      worker.status === 'active' && worker.currentLoad < worker.capacity
    );
  }

  private selectWorkerForTask(task: QueueTask, availableWorkers: WorkerNode[]): WorkerNode | null {
    // Filter workers by capabilities
    const capableWorkers = availableWorkers.filter(worker => {
      if (worker.type === 'general') return true;
      if (worker.type === task.type) return true;
      return false;
    });
    
    if (capableWorkers.length === 0) return null;
    
    // Select worker with best performance and lowest load
    return capableWorkers.sort((a, b) => {
      const aScore = a.performance.successRate * (1 - a.currentLoad / a.capacity);
      const bScore = b.performance.successRate * (1 - b.currentLoad / b.capacity);
      return bScore - aScore;
    })[0];
  }

  private async processDependentTasks(completedTaskId: string): Promise<void> {
    // Find tasks that depend on this completed task
    for (const [taskId, dependencies] of this.dependencyGraph) {
      if (dependencies.has(completedTaskId)) {
        dependencies.delete(completedTaskId);
        
        // If all dependencies are satisfied, the task is ready
        if (dependencies.size === 0) {
          this.dependencyGraph.delete(taskId);
        }
      }
    }
  }

  private async handleTaskFailure(task: QueueTask, error: Error, worker: WorkerNode): Promise<void> {
    task.error = error.message;
    task.retryCount++;
    
    if (task.retryCount <= task.maxRetries) {
      task.status = 'retrying';
      task.metadata.lastRetryAt = new Date();
      
      // Exponential backoff
      const delay = Math.pow(2, task.retryCount) * 1000;
      task.metadata.scheduledAt = new Date(Date.now() + delay);
      
      console.log(`Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries})`);
    } else {
      task.status = 'failed';
      task.metadata.completedAt = new Date();
      
      this.emitEvent({
        id: `event_${Date.now()}`,
        type: 'task_failed',
        data: { taskId: task.id, error: error.message, retryCount: task.retryCount },
        timestamp: new Date(),
        priority: 'error',
        metadata: { source: 'queue_processor', correlationId: task.campaignId }
      });
    }
  }

  private async updateIntelligenceFromTask(task: QueueTask, result: any): Promise<void> {
    // Update intelligence system based on task results
    if (task.type === 'placement' && result.success) {
      // This would update link intelligence with successful placement data
      console.log(`Updating intelligence from successful placement: ${task.id}`);
    }
  }

  private updateMetrics(): void {
    const tasks = Array.from(this.taskQueue.values());
    const workers = Array.from(this.workerNodes.values());
    
    this.metrics = {
      totalTasks: tasks.length,
      queuedTasks: tasks.filter(t => t.status === 'queued').length,
      processingTasks: tasks.filter(t => t.status === 'processing').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      averageProcessingTime: this.calculateAverageProcessingTime(tasks),
      successRate: this.calculateSuccessRate(tasks),
      throughputPerHour: this.calculateThroughput(tasks),
      workersActive: workers.filter(w => w.status === 'active').length,
      workersIdle: workers.filter(w => w.status === 'active' && w.currentLoad === 0).length,
      resourceUtilization: {
        cpu: workers.reduce((sum, w) => sum + w.resources.cpuUsage, 0) / workers.length,
        memory: workers.reduce((sum, w) => sum + w.resources.memoryUsage, 0) / workers.length,
        network: workers.reduce((sum, w) => sum + w.resources.networkUsage, 0) / workers.length
      }
    };
  }

  private calculateAverageProcessingTime(tasks: QueueTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.actualDuration);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
    return totalTime / completedTasks.length;
  }

  private calculateSuccessRate(tasks: QueueTask[]): number {
    const finishedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');
    if (finishedTasks.length === 0) return 0;
    
    const successfulTasks = finishedTasks.filter(t => t.status === 'completed');
    return successfulTasks.length / finishedTasks.length;
  }

  private calculateThroughput(tasks: QueueTask[]): number {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentCompletedTasks = tasks.filter(t => 
      t.status === 'completed' && 
      t.metadata.completedAt && 
      t.metadata.completedAt > oneHourAgo
    );
    
    return recentCompletedTasks.length;
  }

  private async performHealthCheck(): Promise<void> {
    for (const worker of this.workerNodes.values()) {
      try {
        // Simulate health check
        const isHealthy = Math.random() > 0.05; // 95% healthy
        
        if (!isHealthy && worker.status === 'active') {
          worker.status = 'error';
          
          this.emitEvent({
            id: `event_${Date.now()}`,
            type: 'worker_status',
            data: { workerId: worker.id, status: 'unhealthy' },
            timestamp: new Date(),
            priority: 'warning',
            metadata: { source: 'health_monitor' }
          });
        } else if (isHealthy && worker.status === 'error') {
          worker.status = 'active';
        }
        
        worker.performance.lastHealthCheck = new Date();
        
      } catch (error) {
        console.error(`Health check failed for worker ${worker.id}:`, error);
      }
    }
  }

  // Event system
  private emitEvent(event: RealTimeEvent): void {
    const subscribers = this.eventSubscribers.get(event.type) || [];
    subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event subscriber error:', error);
      }
    });
    
    // Store event in database
    this.storeEvent(event);
  }

  // Database operations
  private async storeTask(task: QueueTask): Promise<void> {
    try {
      await supabase.from('queue_tasks').insert({
        id: task.id,
        type: task.type,
        priority: task.priority,
        campaign_id: task.campaignId,
        dependencies: task.dependencies,
        payload: task.payload,
        status: task.status,
        retry_count: task.retryCount,
        max_retries: task.maxRetries,
        estimated_duration: task.estimatedDuration,
        metadata: task.metadata
      });
    } catch (error) {
      console.error('Failed to store task:', error);
    }
  }

  private async updateTaskInDatabase(task: QueueTask): Promise<void> {
    try {
      await supabase
        .from('queue_tasks')
        .update({
          status: task.status,
          retry_count: task.retryCount,
          actual_duration: task.actualDuration,
          processing_node: task.processingNode,
          assigned_worker: task.assignedWorker,
          results: task.results,
          error: task.error,
          metadata: task.metadata
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  private async storeEvent(event: RealTimeEvent): Promise<void> {
    try {
      await supabase.from('realtime_events').insert({
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        priority: event.priority,
        metadata: event.metadata
      });
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }

  // Public API methods
  public subscribe(eventType: string, callback: Function): void {
    if (!this.eventSubscribers.has(eventType)) {
      this.eventSubscribers.set(eventType, []);
    }
    this.eventSubscribers.get(eventType)!.push(callback);
  }

  public unsubscribe(eventType: string, callback: Function): void {
    const subscribers = this.eventSubscribers.get(eventType);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  public async triggerTaskFlow(flowId: string, parameters: any = {}): Promise<string[]> {
    const flow = this.taskFlows.get(flowId);
    if (!flow || !flow.isActive) {
      throw new Error(`Task flow not found or inactive: ${flowId}`);
    }

    const taskIds: string[] = [];
    
    // Create tasks for each step in the flow
    for (const step of flow.steps.sort((a, b) => a.order - b.order)) {
      const taskId = await this.addTask({
        type: step.taskType,
        priority: 'medium',
        dependencies: step.dependencies,
        payload: { ...step.configuration, ...parameters },
        maxRetries: 3,
        estimatedDuration: step.timeout
      });
      
      taskIds.push(taskId);
    }
    
    return taskIds;
  }

  public getQueueStatus(): QueueMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  public getTaskStatus(taskId: string): QueueTask | null {
    return this.taskQueue.get(taskId) || null;
  }

  public getWorkerNodes(): WorkerNode[] {
    return Array.from(this.workerNodes.values());
  }

  public getTaskFlows(): TaskFlow[] {
    return Array.from(this.taskFlows.values());
  }

  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.taskQueue.get(taskId);
    if (!task) return false;
    
    if (task.status === 'queued' || task.status === 'retrying') {
      task.status = 'cancelled';
      task.metadata.completedAt = new Date();
      await this.updateTaskInDatabase(task);
      return true;
    }
    
    return false;
  }

  public async pauseWorker(workerId: string): Promise<boolean> {
    const worker = this.workerNodes.get(workerId);
    if (!worker) return false;
    
    worker.status = 'inactive';
    return true;
  }

  public async resumeWorker(workerId: string): Promise<boolean> {
    const worker = this.workerNodes.get(workerId);
    if (!worker) return false;
    
    worker.status = 'active';
    return true;
  }
}

export default QueueProcessingSystem;
