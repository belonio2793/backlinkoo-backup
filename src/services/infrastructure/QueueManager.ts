import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import type { EngineTask, EngineType, TaskPriority, LinkPlacementResult } from '../engines/BaseEngine';
import { BlogCommentsEngine } from '../engines/BlogCommentsEngine';
import { Web2PlatformsEngine } from '../engines/Web2PlatformsEngine';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  queues: {
    [key in EngineType]: {
      maxConcurrency: number;
      priority: number;
      retryAttempts: number;
      retryDelay: number; // milliseconds
    };
  };
  monitoring: {
    metricsInterval: number; // milliseconds
    alertThresholds: {
      queueLength: number;
      processingTime: number;
      errorRate: number;
    };
  };
}

export interface QueueMetrics {
  queueLength: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  successRate: number;
  lastActivity: Date;
}

export interface WorkerStatus {
  id: string;
  engineType: EngineType;
  status: 'idle' | 'busy' | 'error' | 'stopped';
  currentTask?: string;
  tasksCompleted: number;
  uptime: number;
  lastHeartbeat: Date;
}

export class QueueManager extends EventEmitter {
  private redis: Redis;
  private workers: Map<string, Worker> = new Map();
  private engines: Map<EngineType, any> = new Map();
  private config: QueueConfig;
  private isRunning = false;
  private metrics: Map<EngineType, QueueMetrics> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: QueueConfig) {
    super();
    this.config = config;
    this.redis = new Redis(config.redis);
    this.initializeEngines();
    this.setupMonitoring();
  }

  // Initialize all link building engines
  private initializeEngines(): void {
    this.engines.set('blog_comments', new BlogCommentsEngine());
    // TODO: Add other engines
    // this.engines.set('web2_platforms', new Web2PlatformsEngine());
    // this.engines.set('forum_profiles', new ForumProfilesEngine());
    // this.engines.set('social_media', new SocialMediaEngine());
  }

  // Start the queue manager and workers
  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🚀 Starting Queue Manager...');
    this.isRunning = true;

    // Start workers for each engine type
    for (const [engineType, engineConfig] of Object.entries(this.config.queues)) {
      await this.startWorkersForEngine(engineType as EngineType, engineConfig.maxConcurrency);
    }

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Queue Manager started successfully');
    this.emit('started');
  }

  // Stop the queue manager and all workers
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Queue Manager...');
    this.isRunning = false;

    // Stop all workers
    const stopPromises = Array.from(this.workers.values()).map(worker => worker.stop());
    await Promise.all(stopPromises);

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    await this.redis.disconnect();

    console.log('✅ Queue Manager stopped');
    this.emit('stopped');
  }

  // Add a task to the appropriate queue
  async addTask(task: EngineTask): Promise<string> {
    const queueName = this.getQueueName(task.engineType, task.priority);
    const taskData = {
      ...task,
      addedAt: new Date().toISOString(),
      attempts: 0
    };

    await this.redis.lpush(queueName, JSON.stringify(taskData));
    
    console.log(`📋 Added task ${task.id} to queue ${queueName}`);
    this.emit('taskAdded', { task, queueName });

    return task.id;
  }

  // Get queue statistics
  async getQueueStats(): Promise<Map<string, QueueMetrics>> {
    const stats = new Map<string, QueueMetrics>();

    for (const engineType of Object.keys(this.config.queues) as EngineType[]) {
      for (const priority of ['high', 'normal', 'low'] as TaskPriority[]) {
        const queueName = this.getQueueName(engineType, priority);
        const length = await this.redis.llen(queueName);
        
        const metrics: QueueMetrics = {
          queueLength: length,
          activeJobs: this.getActiveJobsCount(engineType),
          completedJobs: await this.getCompletedJobsCount(queueName),
          failedJobs: await this.getFailedJobsCount(queueName),
          avgProcessingTime: await this.getAvgProcessingTime(queueName),
          successRate: await this.getSuccessRate(queueName),
          lastActivity: new Date()
        };

        stats.set(queueName, metrics);
      }
    }

    return stats;
  }

  // Get worker status
  getWorkerStatus(): WorkerStatus[] {
    return Array.from(this.workers.values()).map(worker => worker.getStatus());
  }

  // Scale workers up or down based on queue length
  async autoScale(): Promise<void> {
    for (const [engineType, config] of Object.entries(this.config.queues)) {
      const queueLengths = await this.getTotalQueueLength(engineType as EngineType);
      const currentWorkers = this.getWorkerCount(engineType as EngineType);
      
      // Scale up if queue is backing up
      if (queueLengths > currentWorkers * 10 && currentWorkers < config.maxConcurrency) {
        const newWorkers = Math.min(
          Math.ceil(queueLengths / 10) - currentWorkers,
          config.maxConcurrency - currentWorkers
        );
        
        if (newWorkers > 0) {
          await this.addWorkers(engineType as EngineType, newWorkers);
          console.log(`📈 Scaled up ${engineType}: +${newWorkers} workers`);
        }
      }
      
      // Scale down if too many idle workers
      else if (queueLengths < currentWorkers * 2 && currentWorkers > 1) {
        const workersToRemove = Math.floor((currentWorkers - queueLengths / 2) / 2);
        
        if (workersToRemove > 0) {
          await this.removeWorkers(engineType as EngineType, workersToRemove);
          console.log(`📉 Scaled down ${engineType}: -${workersToRemove} workers`);
        }
      }
    }
  }

  // Private methods
  private async startWorkersForEngine(engineType: EngineType, count: number): Promise<void> {
    const engine = this.engines.get(engineType);
    if (!engine) {
      throw new Error(`Engine ${engineType} not found`);
    }

    for (let i = 0; i < count; i++) {
      const worker = new Worker({
        id: `${engineType}_worker_${i}`,
        engineType,
        engine,
        redis: this.redis,
        config: this.config.queues[engineType]
      });

      await worker.start();
      this.workers.set(worker.id, worker);
      
      worker.on('taskCompleted', (result) => this.handleTaskCompleted(result));
      worker.on('taskFailed', (error) => this.handleTaskFailed(error));
      worker.on('error', (error) => this.handleWorkerError(error));
    }
  }

  private async addWorkers(engineType: EngineType, count: number): Promise<void> {
    const existingCount = this.getWorkerCount(engineType);
    
    for (let i = 0; i < count; i++) {
      const worker = new Worker({
        id: `${engineType}_worker_${existingCount + i}`,
        engineType,
        engine: this.engines.get(engineType)!,
        redis: this.redis,
        config: this.config.queues[engineType]
      });

      await worker.start();
      this.workers.set(worker.id, worker);
    }
  }

  private async removeWorkers(engineType: EngineType, count: number): Promise<void> {
    const workers = Array.from(this.workers.values())
      .filter(w => w.engineType === engineType && w.getStatus().status === 'idle')
      .slice(0, count);

    for (const worker of workers) {
      await worker.stop();
      this.workers.delete(worker.id);
    }
  }

  private getQueueName(engineType: EngineType, priority: TaskPriority): string {
    return `queue:${engineType}:${priority}`;
  }

  private getWorkerCount(engineType: EngineType): number {
    return Array.from(this.workers.values())
      .filter(w => w.engineType === engineType).length;
  }

  private getActiveJobsCount(engineType: EngineType): number {
    return Array.from(this.workers.values())
      .filter(w => w.engineType === engineType && w.getStatus().status === 'busy').length;
  }

  private async getTotalQueueLength(engineType: EngineType): Promise<number> {
    let total = 0;
    for (const priority of ['urgent', 'high', 'normal', 'low'] as TaskPriority[]) {
      const queueName = this.getQueueName(engineType, priority);
      total += await this.redis.llen(queueName);
    }
    return total;
  }

  private async getCompletedJobsCount(queueName: string): Promise<number> {
    return parseInt(await this.redis.get(`${queueName}:completed`) || '0');
  }

  private async getFailedJobsCount(queueName: string): Promise<number> {
    return parseInt(await this.redis.get(`${queueName}:failed`) || '0');
  }

  private async getAvgProcessingTime(queueName: string): Promise<number> {
    return parseFloat(await this.redis.get(`${queueName}:avg_time`) || '0');
  }

  private async getSuccessRate(queueName: string): Promise<number> {
    const completed = await this.getCompletedJobsCount(queueName);
    const failed = await this.getFailedJobsCount(queueName);
    const total = completed + failed;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  private setupMonitoring(): void {
    // Event handlers for metrics collection
    this.on('taskCompleted', async (data) => {
      const queueName = this.getQueueName(data.task.engineType, data.task.priority);
      await this.redis.incr(`${queueName}:completed`);
      await this.updateAvgProcessingTime(queueName, data.processingTime);
    });

    this.on('taskFailed', async (data) => {
      const queueName = this.getQueueName(data.task.engineType, data.task.priority);
      await this.redis.incr(`${queueName}:failed`);
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        // Update metrics
        await this.updateMetrics();
        
        // Auto-scale workers
        await this.autoScale();
        
        // Check alert thresholds
        await this.checkAlerts();
        
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, this.config.monitoring.metricsInterval);
  }

  private async updateMetrics(): Promise<void> {
    const stats = await this.getQueueStats();
    this.metrics = stats;
    this.emit('metricsUpdated', stats);
  }

  private async checkAlerts(): Promise<void> {
    const thresholds = this.config.monitoring.alertThresholds;
    
    for (const [queueName, metrics] of this.metrics) {
      if (metrics.queueLength > thresholds.queueLength) {
        this.emit('alert', {
          type: 'HIGH_QUEUE_LENGTH',
          queue: queueName,
          value: metrics.queueLength,
          threshold: thresholds.queueLength
        });
      }
      
      if (metrics.avgProcessingTime > thresholds.processingTime) {
        this.emit('alert', {
          type: 'SLOW_PROCESSING',
          queue: queueName,
          value: metrics.avgProcessingTime,
          threshold: thresholds.processingTime
        });
      }
      
      if (100 - metrics.successRate > thresholds.errorRate) {
        this.emit('alert', {
          type: 'HIGH_ERROR_RATE',
          queue: queueName,
          value: 100 - metrics.successRate,
          threshold: thresholds.errorRate
        });
      }
    }
  }

  private async updateAvgProcessingTime(queueName: string, processingTime: number): Promise<void> {
    const currentAvg = await this.getAvgProcessingTime(queueName);
    const completed = await this.getCompletedJobsCount(queueName);
    const newAvg = (currentAvg * (completed - 1) + processingTime) / completed;
    await this.redis.set(`${queueName}:avg_time`, newAvg.toString());
  }

  private handleTaskCompleted(result: any): void {
    this.emit('taskCompleted', result);
  }

  private handleTaskFailed(error: any): void {
    this.emit('taskFailed', error);
  }

  private handleWorkerError(error: any): void {
    console.error('Worker error:', error);
    this.emit('workerError', error);
  }
}

// Individual worker class
class Worker extends EventEmitter {
  public readonly id: string;
  public readonly engineType: EngineType;
  private engine: any;
  private redis: Redis;
  private config: any;
  private isRunning = false;
  private currentTask?: EngineTask;
  private tasksCompleted = 0;
  private startTime = Date.now();

  constructor(params: {
    id: string;
    engineType: EngineType;
    engine: any;
    redis: Redis;
    config: any;
  }) {
    super();
    this.id = params.id;
    this.engineType = params.engineType;
    this.engine = params.engine;
    this.redis = params.redis;
    this.config = params.config;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.processLoop();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  getStatus(): WorkerStatus {
    return {
      id: this.id,
      engineType: this.engineType,
      status: this.isRunning ? (this.currentTask ? 'busy' : 'idle') : 'stopped',
      currentTask: this.currentTask?.id,
      tasksCompleted: this.tasksCompleted,
      uptime: Date.now() - this.startTime,
      lastHeartbeat: new Date()
    };
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const task = await this.getNextTask();
        
        if (task) {
          await this.processTask(task);
        } else {
          // No tasks available, wait before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Worker ${this.id} error:`, error);
        this.emit('error', { workerId: this.id, error });
        
        // Brief pause before continuing
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async getNextTask(): Promise<EngineTask | null> {
    // Check queues in priority order
    const priorities: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queueName = `queue:${this.engineType}:${priority}`;
      const taskData = await this.redis.rpop(queueName);
      
      if (taskData) {
        return JSON.parse(taskData) as EngineTask;
      }
    }
    
    return null;
  }

  private async processTask(task: EngineTask): Promise<void> {
    this.currentTask = task;
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Worker ${this.id} processing task ${task.id}`);
      
      const result = await this.engine.execute(task);
      const processingTime = Date.now() - startTime;
      
      if (result.success) {
        this.tasksCompleted++;
        this.emit('taskCompleted', {
          workerId: this.id,
          task,
          result,
          processingTime
        });
        
        console.log(`✅ Worker ${this.id} completed task ${task.id} in ${processingTime}ms`);
      } else {
        await this.handleTaskFailure(task, result, processingTime);
      }
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      await this.handleTaskError(task, error, processingTime);
    } finally {
      this.currentTask = undefined;
    }
  }

  private async handleTaskFailure(task: EngineTask, result: LinkPlacementResult, processingTime: number): Promise<void> {
    const attempts = (task as any).attempts || 0;
    
    if (result.error?.retryable && attempts < this.config.retryAttempts) {
      // Retry the task
      const retryTask = {
        ...task,
        attempts: attempts + 1,
        scheduledFor: result.error.retryAfter || new Date(Date.now() + this.config.retryDelay)
      };
      
      await this.redis.lpush(`queue:${this.engineType}:${task.priority}`, JSON.stringify(retryTask));
      console.log(`🔄 Worker ${this.id} retrying task ${task.id} (attempt ${attempts + 1})`);
    } else {
      // Task failed permanently
      this.emit('taskFailed', {
        workerId: this.id,
        task,
        result,
        processingTime
      });
      
      console.log(`❌ Worker ${this.id} failed task ${task.id} permanently`);
    }
  }

  private async handleTaskError(task: EngineTask, error: any, processingTime: number): Promise<void> {
    this.emit('taskFailed', {
      workerId: this.id,
      task,
      error: error.message,
      processingTime
    });
    
    console.error(`💥 Worker ${this.id} error processing task ${task.id}:`, error);
  }
}
