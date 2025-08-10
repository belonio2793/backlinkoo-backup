/**
 * Queue Manager - Handles task queuing and scheduling for automation system
 */

import { SystemLogger } from './SystemLogger.js';

export class QueueManager {
  constructor() {
    this.logger = new SystemLogger('QueueManager');
    this.queues = new Map();
    this.processing = new Map();
    this.completed = new Map();
    this.failed = new Map();
    this.stats = new Map();
    this.initialized = false;
  }

  async initialize() {
    this.logger.info('Initializing Queue Manager...');
    
    try {
      // Initialize queue types
      const queueTypes = [
        'blog-commenting',
        'blog-posting', 
        'forum-profiles',
        'social-media',
        'web2',
        'guest-posting'
      ];

      for (const queueType of queueTypes) {
        this.queues.set(queueType, []);
        this.processing.set(queueType, new Map());
        this.completed.set(queueType, []);
        this.failed.set(queueType, []);
        this.stats.set(queueType, {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          avgProcessingTime: 0
        });
      }

      this.initialized = true;
      this.logger.success('Queue Manager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Queue Manager:', error);
      throw error;
    }
  }

  async addTask(queueType, task) {
    if (!this.initialized) {
      throw new Error('Queue Manager not initialized');
    }

    if (!this.queues.has(queueType)) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }

    // Add task metadata
    const enrichedTask = {
      ...task,
      id: task.id || this.generateTaskId(queueType),
      queueType,
      createdAt: new Date(),
      priority: task.priority || 5,
      retryCount: 0,
      maxRetries: task.maxRetries || 3,
      status: 'pending'
    };

    // Add to queue with priority ordering
    const queue = this.queues.get(queueType);
    const insertIndex = this.findInsertIndex(queue, enrichedTask.priority);
    queue.splice(insertIndex, 0, enrichedTask);

    // Update stats
    const stats = this.stats.get(queueType);
    stats.total++;
    stats.pending++;

    this.logger.debug(`Task added to ${queueType} queue:`, enrichedTask.id);
    return enrichedTask.id;
  }

  async addTasks(queueType, tasks) {
    const taskIds = [];
    for (const task of tasks) {
      const taskId = await this.addTask(queueType, task);
      taskIds.push(taskId);
    }
    this.logger.info(`Added ${tasks.length} tasks to ${queueType} queue`);
    return taskIds;
  }

  async getTasks(queueType, limit = 10) {
    if (!this.queues.has(queueType)) {
      return [];
    }

    const queue = this.queues.get(queueType);
    const tasks = queue.splice(0, Math.min(limit, queue.length));

    // Move tasks to processing
    const processing = this.processing.get(queueType);
    const stats = this.stats.get(queueType);

    for (const task of tasks) {
      task.status = 'processing';
      task.startedAt = new Date();
      processing.set(task.id, task);
      
      stats.pending--;
      stats.processing++;
    }

    return tasks;
  }

  async markTaskCompleted(taskId, result = {}) {
    const task = this.findTask(taskId);
    if (!task) {
      this.logger.warn(`Task not found for completion: ${taskId}`);
      return false;
    }

    const { queueType } = task;
    const processing = this.processing.get(queueType);
    const completed = this.completed.get(queueType);
    const stats = this.stats.get(queueType);

    // Update task
    task.status = 'completed';
    task.completedAt = new Date();
    task.processingTime = task.completedAt - task.startedAt;
    task.result = result;

    // Move from processing to completed
    processing.delete(taskId);
    completed.push(task);

    // Update stats
    stats.processing--;
    stats.completed++;
    this.updateAvgProcessingTime(queueType, task.processingTime);

    this.logger.debug(`Task completed: ${taskId}`);
    return true;
  }

  async markTaskFailed(taskId, error) {
    const task = this.findTask(taskId);
    if (!task) {
      this.logger.warn(`Task not found for failure: ${taskId}`);
      return false;
    }

    const { queueType } = task;
    const processing = this.processing.get(queueType);
    const failed = this.failed.get(queueType);
    const queue = this.queues.get(queueType);
    const stats = this.stats.get(queueType);

    task.retryCount++;
    task.lastError = error;
    task.lastAttemptAt = new Date();

    // Check if we should retry
    if (task.retryCount < task.maxRetries) {
      task.status = 'pending';
      task.nextRetryAt = new Date(Date.now() + this.calculateRetryDelay(task.retryCount));
      
      // Move back to queue
      processing.delete(taskId);
      const insertIndex = this.findInsertIndex(queue, task.priority);
      queue.splice(insertIndex, 0, task);
      
      stats.processing--;
      stats.pending++;
      
      this.logger.debug(`Task ${taskId} scheduled for retry ${task.retryCount}/${task.maxRetries}`);
    } else {
      // Mark as permanently failed
      task.status = 'failed';
      task.failedAt = new Date();
      
      processing.delete(taskId);
      failed.push(task);
      
      stats.processing--;
      stats.failed++;
      
      this.logger.warn(`Task permanently failed: ${taskId}`, error);
    }

    return true;
  }

  findTask(taskId) {
    for (const [queueType, processing] of this.processing) {
      if (processing.has(taskId)) {
        return processing.get(taskId);
      }
    }
    return null;
  }

  findInsertIndex(queue, priority) {
    // Higher priority (lower number) goes first
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].priority > priority) {
        return i;
      }
    }
    return queue.length;
  }

  calculateRetryDelay(retryCount) {
    // Exponential backoff: 2^retryCount * 1000ms
    return Math.min(Math.pow(2, retryCount) * 1000, 60000); // Max 1 minute
  }

  updateAvgProcessingTime(queueType, processingTime) {
    const stats = this.stats.get(queueType);
    const totalCompleted = stats.completed;
    
    if (totalCompleted === 1) {
      stats.avgProcessingTime = processingTime;
    } else {
      stats.avgProcessingTime = (
        (stats.avgProcessingTime * (totalCompleted - 1)) + processingTime
      ) / totalCompleted;
    }
  }

  generateTaskId(queueType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `${queueType}_${timestamp}_${random}`;
  }

  getQueueStats(queueType) {
    if (!this.stats.has(queueType)) {
      return null;
    }
    
    const stats = this.stats.get(queueType);
    const queue = this.queues.get(queueType);
    const processing = this.processing.get(queueType);
    
    return {
      ...stats,
      pending: queue.length,
      processing: processing.size,
      queueDepth: queue.length + processing.size
    };
  }

  getAllStats() {
    const allStats = {};
    
    for (const [queueType, stats] of this.stats) {
      allStats[queueType] = this.getQueueStats(queueType);
    }
    
    // Calculate totals
    allStats.totals = {
      total: Object.values(allStats).reduce((sum, stats) => sum + stats.total, 0),
      pending: Object.values(allStats).reduce((sum, stats) => sum + stats.pending, 0),
      processing: Object.values(allStats).reduce((sum, stats) => sum + stats.processing, 0),
      completed: Object.values(allStats).reduce((sum, stats) => sum + stats.completed, 0),
      failed: Object.values(allStats).reduce((sum, stats) => sum + stats.failed, 0)
    };
    
    return allStats;
  }

  getQueueContents(queueType, includeProcessing = false) {
    const result = {
      pending: [...(this.queues.get(queueType) || [])],
      completed: [...(this.completed.get(queueType) || [])],
      failed: [...(this.failed.get(queueType) || [])]
    };

    if (includeProcessing) {
      result.processing = Array.from(this.processing.get(queueType)?.values() || []);
    }

    return result;
  }

  clearQueue(queueType) {
    if (!this.queues.has(queueType)) {
      return false;
    }

    this.queues.get(queueType).length = 0;
    this.processing.get(queueType).clear();
    this.completed.get(queueType).length = 0;
    this.failed.get(queueType).length = 0;
    
    // Reset stats
    const stats = this.stats.get(queueType);
    Object.keys(stats).forEach(key => {
      if (key !== 'avgProcessingTime') {
        stats[key] = 0;
      }
    });

    this.logger.info(`Queue ${queueType} cleared`);
    return true;
  }

  clearAllQueues() {
    for (const queueType of this.queues.keys()) {
      this.clearQueue(queueType);
    }
    this.logger.info('All queues cleared');
  }
}
