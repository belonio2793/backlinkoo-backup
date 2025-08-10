/**
 * System Logger - Centralized logging for automation system
 */

export class SystemLogger {
  constructor(module = 'AutomationSystem') {
    this.module = module;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableFile = true;
    this.logHistory = [];
    this.maxHistorySize = 1000;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.module,
      message,
      data,
      id: this.generateLogId()
    };

    // Add to history
    this.addToHistory(logEntry);

    // Console output
    if (this.enableConsole && this.shouldLog(level)) {
      this.outputToConsole(logEntry);
    }

    // File output (would be implemented based on requirements)
    if (this.enableFile) {
      this.outputToFile(logEntry);
    }

    return logEntry;
  }

  info(message, data = null) {
    return this.log('info', message, data);
  }

  warn(message, data = null) {
    return this.log('warn', message, data);
  }

  error(message, data = null) {
    return this.log('error', message, data);
  }

  debug(message, data = null) {
    return this.log('debug', message, data);
  }

  success(message, data = null) {
    return this.log('success', message, data);
  }

  shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      success: 1
    };

    const currentLevel = levels[this.logLevel] || 1;
    const messageLevel = levels[level] || 1;

    return messageLevel >= currentLevel;
  }

  outputToConsole(logEntry) {
    const { timestamp, level, module, message, data } = logEntry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[35m',   // Magenta
      success: '\x1b[32m', // Green
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    const resetColor = colors.reset;

    console.log(`${color}${prefix} ${message}${resetColor}`);
    
    if (data) {
      console.log(`${color}Data:${resetColor}`, data);
    }
  }

  outputToFile(logEntry) {
    // File logging implementation would go here
    // For now, we'll just store in memory for later file writing
    this.pendingFileWrites = this.pendingFileWrites || [];
    this.pendingFileWrites.push(logEntry);
  }

  addToHistory(logEntry) {
    this.logHistory.push(logEntry);
    
    // Trim history if it gets too large
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  getHistory(filters = {}) {
    let history = [...this.logHistory];

    if (filters.level) {
      history = history.filter(entry => entry.level === filters.level);
    }

    if (filters.module) {
      history = history.filter(entry => entry.module === filters.module);
    }

    if (filters.since) {
      const sinceTime = new Date(filters.since);
      history = history.filter(entry => new Date(entry.timestamp) >= sinceTime);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  clearHistory() {
    this.logHistory = [];
  }

  getStats() {
    const stats = {
      total: this.logHistory.length,
      byLevel: {},
      byModule: {},
      recent: this.logHistory.slice(-10)
    };

    this.logHistory.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byModule[entry.module] = (stats.byModule[entry.module] || 0) + 1;
    });

    return stats;
  }

  createChildLogger(childModule) {
    return new SystemLogger(`${this.module}:${childModule}`);
  }
}
