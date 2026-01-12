// server/utils/searchLogger.js - Logging and Monitoring for Search Performance
// Implements Task 10: Add logging and monitoring for search performance

const fs = require('fs').promises;
const path = require('path');

/**
 * Search performance logger with structured logging
 */
class SearchLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.logDirectory = options.logDirectory || path.join(__dirname, '../logs');
    this.maxLogFileSize = options.maxLogFileSize || 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = options.maxLogFiles || 5;
    
    // Performance thresholds
    this.slowQueryThreshold = options.slowQueryThreshold || 2000; // 2 seconds
    this.verySlowQueryThreshold = options.verySlowQueryThreshold || 5000; // 5 seconds
    
    // Initialize log directory
    this.initializeLogDirectory();
    
    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
  }

  /**
   * Initialize log directory
   */
  async initializeLogDirectory() {
    if (this.logToFile) {
      try {
        await fs.mkdir(this.logDirectory, { recursive: true });
      } catch (error) {
        console.error('[SearchLogger] Failed to create log directory:', error);
        this.logToFile = false;
      }
    }
  }

  /**
   * Check if message should be logged based on level
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format log message
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Write log to file
   */
  async writeToFile(level, formattedMessage) {
    if (!this.logToFile) return;

    try {
      const logFileName = `search-${level}-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDirectory, logFileName);
      
      // Check file size and rotate if necessary
      await this.rotateLogIfNeeded(logFilePath);
      
      await fs.appendFile(logFilePath, formattedMessage + '\n');
    } catch (error) {
      console.error('[SearchLogger] Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file if it exceeds size limit
   */
  async rotateLogIfNeeded(logFilePath) {
    try {
      const stats = await fs.stat(logFilePath);
      if (stats.size > this.maxLogFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = logFilePath.replace('.log', `-${timestamp}.log`);
        await fs.rename(logFilePath, rotatedPath);
        
        // Clean up old log files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // File doesn't exist yet, no need to rotate
    }
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDirectory, file),
          stat: null
        }));

      // Get file stats
      for (const file of logFiles) {
        try {
          file.stat = await fs.stat(file.path);
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      // Sort by modification time (newest first)
      const sortedFiles = logFiles
        .filter(file => file.stat)
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      // Remove excess files
      if (sortedFiles.length > this.maxLogFiles) {
        const filesToDelete = sortedFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('[SearchLogger] Failed to cleanup old logs:', error);
    }
  }

  /**
   * Log message with specified level
   */
  async log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, metadata);

    // Log to console
    if (this.logToConsole) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[SearchLogger] ${formattedMessage}`);
    }

    // Log to file
    await this.writeToFile(level, formattedMessage);
  }

  /**
   * Log search operation start
   */
  async logSearchStart(searchId, query, options = {}) {
    await this.log('info', 'Search operation started', {
      searchId,
      query: query.substring(0, 100), // Truncate long queries
      userId: options.userId,
      searchType: options.searchType || 'basic',
      filters: {
        fileTypes: options.fileTypes || [],
        tags: options.tags || [],
        dateRange: options.dateRange ? 'applied' : 'none',
        includePublic: options.includePublic || false
      },
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10
      }
    });
  }

  /**
   * Log search operation completion
   */
  async logSearchComplete(searchId, query, results, duration, options = {}) {
    const level = duration > this.verySlowQueryThreshold ? 'warn' : 
                  duration > this.slowQueryThreshold ? 'info' : 'debug';

    await this.log(level, 'Search operation completed', {
      searchId,
      query: query.substring(0, 100),
      userId: options.userId,
      duration,
      resultCount: results.length || results.items?.length || 0,
      cacheHit: results.searchMetrics?.cacheHit || false,
      strategy: results.searchMetrics?.strategy || 'unknown',
      performance: {
        slow: duration > this.slowQueryThreshold,
        verySlow: duration > this.verySlowQueryThreshold
      }
    });
  }

  /**
   * Log search operation error
   */
  async logSearchError(searchId, query, error, duration = null, options = {}) {
    await this.log('error', 'Search operation failed', {
      searchId,
      query: query ? query.substring(0, 100) : 'unknown',
      userId: options.userId,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack
      },
      duration,
      fallbackUsed: options.fallbackUsed || false
    });
  }

  /**
   * Log cache operation
   */
  async logCacheOperation(operation, key, success, duration = null, metadata = {}) {
    await this.log('debug', `Cache ${operation}`, {
      operation,
      key: key ? key.substring(0, 50) : 'unknown',
      success,
      duration,
      ...metadata
    });
  }

  /**
   * Log indexing operation
   */
  async logIndexingOperation(operation, documentId, success, duration = null, metadata = {}) {
    const level = success ? 'info' : 'error';
    
    await this.log(level, `Document ${operation}`, {
      operation,
      documentId,
      success,
      duration,
      ...metadata
    });
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetrics(metrics) {
    await this.log('info', 'Performance metrics', {
      type: 'performance_summary',
      metrics: {
        totalSearches: metrics.totalSearches || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        slowQueries: metrics.slowQueries || 0,
        errorRate: metrics.errorRate || 0,
        cacheHitRate: metrics.cacheHitRate || 0
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log system health check
   */
  async logHealthCheck(healthStatus) {
    const level = healthStatus.isHealthy ? 'info' : 'warn';
    
    await this.log(level, 'System health check', {
      type: 'health_check',
      healthy: healthStatus.isHealthy,
      services: healthStatus.services,
      performance: healthStatus.performance,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log user activity
   */
  async logUserActivity(userId, activity, metadata = {}) {
    await this.log('info', `User activity: ${activity}`, {
      userId,
      activity,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event, severity = 'warn', metadata = {}) {
    await this.log(severity, `Security event: ${event}`, {
      type: 'security',
      event,
      severity,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get log statistics
   */
  async getLogStats(days = 7) {
    if (!this.logToFile) {
      return { error: 'File logging is disabled' };
    }

    try {
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      const stats = {
        totalLogFiles: logFiles.length,
        totalSize: 0,
        oldestLog: null,
        newestLog: null,
        logsByLevel: {
          error: 0,
          warn: 0,
          info: 0,
          debug: 0,
          trace: 0
        }
      };

      for (const file of logFiles) {
        const filePath = path.join(this.logDirectory, file);
        const fileStat = await fs.stat(filePath);
        stats.totalSize += fileStat.size;

        if (!stats.oldestLog || fileStat.mtime < stats.oldestLog) {
          stats.oldestLog = fileStat.mtime;
        }
        if (!stats.newestLog || fileStat.mtime > stats.newestLog) {
          stats.newestLog = fileStat.mtime;
        }

        // Count log levels (simplified - just check filename)
        if (file.includes('-error-')) stats.logsByLevel.error++;
        else if (file.includes('-warn-')) stats.logsByLevel.warn++;
        else if (file.includes('-info-')) stats.logsByLevel.info++;
        else if (file.includes('-debug-')) stats.logsByLevel.debug++;
        else if (file.includes('-trace-')) stats.logsByLevel.trace++;
      }

      stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      
      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Create search operation logger
   */
  createSearchLogger(searchId, query, options = {}) {
    const startTime = Date.now();
    
    // Log search start
    this.logSearchStart(searchId, query, options);

    return {
      logComplete: (results) => {
        const duration = Date.now() - startTime;
        this.logSearchComplete(searchId, query, results, duration, options);
      },
      
      logError: (error, fallbackUsed = false) => {
        const duration = Date.now() - startTime;
        this.logSearchError(searchId, query, error, duration, { ...options, fallbackUsed });
      },
      
      logStep: (step, metadata = {}) => {
        this.log('debug', `Search step: ${step}`, {
          searchId,
          step,
          elapsed: Date.now() - startTime,
          ...metadata
        });
      }
    };
  }

  /**
   * Convenience methods for different log levels
   */
  async error(message, metadata = {}) {
    await this.log('error', message, metadata);
  }

  async warn(message, metadata = {}) {
    await this.log('warn', message, metadata);
  }

  async info(message, metadata = {}) {
    await this.log('info', message, metadata);
  }

  async debug(message, metadata = {}) {
    await this.log('debug', message, metadata);
  }

  async trace(message, metadata = {}) {
    await this.log('trace', message, metadata);
  }
}

// Create singleton instance
const searchLogger = new SearchLogger();

module.exports = {
  SearchLogger,
  searchLogger
};