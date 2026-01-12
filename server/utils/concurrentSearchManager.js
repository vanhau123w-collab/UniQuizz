// server/utils/concurrentSearchManager.js - Concurrent Search Availability Manager
// Implements Requirement 5.2: Concurrent search availability during indexing

class ConcurrentSearchManager {
  constructor(options = {}) {
    this.maxConcurrentSearches = options.maxConcurrentSearches || 50;
    this.maxConcurrentIndexing = options.maxConcurrentIndexing || 5;
    this.searchTimeout = options.searchTimeout || 30000; // 30 seconds
    this.indexingTimeout = options.indexingTimeout || 300000; // 5 minutes
    
    // Track active operations
    this.activeSearches = new Map();
    this.activeIndexing = new Map();
    this.searchQueue = [];
    this.indexingQueue = [];
    
    // Performance metrics
    this.metrics = {
      totalSearches: 0,
      totalIndexing: 0,
      searchTimeouts: 0,
      indexingTimeouts: 0,
      queuedSearches: 0,
      queuedIndexing: 0,
      averageSearchTime: 0,
      averageIndexingTime: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Execute search operation with concurrency control
   * Implements Requirement 5.2: Maintain search availability during indexing
   */
  async executeSearch(searchId, searchFunction, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || this.searchTimeout;
    
    try {
      // Check if we can execute immediately
      if (this.activeSearches.size < this.maxConcurrentSearches) {
        return await this.runSearch(searchId, searchFunction, timeout, startTime);
      }
      
      // Queue the search if at capacity
      return await this.queueSearch(searchId, searchFunction, timeout, startTime);
      
    } catch (error) {
      this.metrics.searchTimeouts++;
      console.error(`[ConcurrentSearchManager] Search ${searchId} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute indexing operation with concurrency control
   */
  async executeIndexing(indexingId, indexingFunction, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || this.indexingTimeout;
    
    try {
      // Check if we can execute immediately
      if (this.activeIndexing.size < this.maxConcurrentIndexing) {
        return await this.runIndexing(indexingId, indexingFunction, timeout, startTime);
      }
      
      // Queue the indexing if at capacity
      return await this.queueIndexing(indexingId, indexingFunction, timeout, startTime);
      
    } catch (error) {
      this.metrics.indexingTimeouts++;
      console.error(`[ConcurrentSearchManager] Indexing ${indexingId} failed:`, error);
      throw error;
    }
  }

  /**
   * Run search operation with timeout and tracking
   */
  async runSearch(searchId, searchFunction, timeout, startTime) {
    const operation = {
      id: searchId,
      startTime: startTime,
      type: 'search'
    };
    
    this.activeSearches.set(searchId, operation);
    this.metrics.totalSearches++;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Search ${searchId} timed out after ${timeout}ms`)), timeout);
      });
      
      // Race between search function and timeout
      const result = await Promise.race([
        searchFunction(),
        timeoutPromise
      ]);
      
      // Update metrics
      const duration = Date.now() - startTime;
      this.updateSearchMetrics(duration);
      
      console.log(`[ConcurrentSearchManager] ✅ Search ${searchId} completed in ${duration}ms`);
      return result;
      
    } finally {
      this.activeSearches.delete(searchId);
      this.processSearchQueue();
    }
  }

  /**
   * Run indexing operation with timeout and tracking
   */
  async runIndexing(indexingId, indexingFunction, timeout, startTime) {
    const operation = {
      id: indexingId,
      startTime: startTime,
      type: 'indexing'
    };
    
    this.activeIndexing.set(indexingId, operation);
    this.metrics.totalIndexing++;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Indexing ${indexingId} timed out after ${timeout}ms`)), timeout);
      });
      
      // Race between indexing function and timeout
      const result = await Promise.race([
        indexingFunction(),
        timeoutPromise
      ]);
      
      // Update metrics
      const duration = Date.now() - startTime;
      this.updateIndexingMetrics(duration);
      
      console.log(`[ConcurrentSearchManager] ✅ Indexing ${indexingId} completed in ${duration}ms`);
      return result;
      
    } finally {
      this.activeIndexing.delete(indexingId);
      this.processIndexingQueue();
    }
  }

  /**
   * Queue search operation when at capacity
   */
  async queueSearch(searchId, searchFunction, timeout, startTime) {
    return new Promise((resolve, reject) => {
      const queuedOperation = {
        id: searchId,
        searchFunction,
        timeout,
        startTime,
        resolve,
        reject,
        queuedAt: Date.now()
      };
      
      this.searchQueue.push(queuedOperation);
      this.metrics.queuedSearches++;
      
      console.log(`[ConcurrentSearchManager] 📋 Queued search ${searchId} (queue size: ${this.searchQueue.length})`);
      
      // Set timeout for queued operation
      setTimeout(() => {
        const index = this.searchQueue.findIndex(op => op.id === searchId);
        if (index !== -1) {
          this.searchQueue.splice(index, 1);
          reject(new Error(`Queued search ${searchId} timed out`));
        }
      }, timeout);
    });
  }

  /**
   * Queue indexing operation when at capacity
   */
  async queueIndexing(indexingId, indexingFunction, timeout, startTime) {
    return new Promise((resolve, reject) => {
      const queuedOperation = {
        id: indexingId,
        indexingFunction,
        timeout,
        startTime,
        resolve,
        reject,
        queuedAt: Date.now()
      };
      
      this.indexingQueue.push(queuedOperation);
      this.metrics.queuedIndexing++;
      
      console.log(`[ConcurrentSearchManager] 📋 Queued indexing ${indexingId} (queue size: ${this.indexingQueue.length})`);
      
      // Set timeout for queued operation
      setTimeout(() => {
        const index = this.indexingQueue.findIndex(op => op.id === indexingId);
        if (index !== -1) {
          this.indexingQueue.splice(index, 1);
          reject(new Error(`Queued indexing ${indexingId} timed out`));
        }
      }, timeout);
    });
  }

  /**
   * Process search queue when capacity becomes available
   */
  processSearchQueue() {
    while (this.searchQueue.length > 0 && this.activeSearches.size < this.maxConcurrentSearches) {
      const queuedOperation = this.searchQueue.shift();
      
      // Check if operation hasn't timed out
      const queueTime = Date.now() - queuedOperation.queuedAt;
      if (queueTime < queuedOperation.timeout) {
        // Execute the queued search
        this.runSearch(
          queuedOperation.id,
          queuedOperation.searchFunction,
          queuedOperation.timeout - queueTime,
          queuedOperation.startTime
        )
        .then(queuedOperation.resolve)
        .catch(queuedOperation.reject);
      } else {
        // Operation timed out while queued
        queuedOperation.reject(new Error(`Search ${queuedOperation.id} timed out while queued`));
      }
    }
  }

  /**
   * Process indexing queue when capacity becomes available
   */
  processIndexingQueue() {
    while (this.indexingQueue.length > 0 && this.activeIndexing.size < this.maxConcurrentIndexing) {
      const queuedOperation = this.indexingQueue.shift();
      
      // Check if operation hasn't timed out
      const queueTime = Date.now() - queuedOperation.queuedAt;
      if (queueTime < queuedOperation.timeout) {
        // Execute the queued indexing
        this.runIndexing(
          queuedOperation.id,
          queuedOperation.indexingFunction,
          queuedOperation.timeout - queueTime,
          queuedOperation.startTime
        )
        .then(queuedOperation.resolve)
        .catch(queuedOperation.reject);
      } else {
        // Operation timed out while queued
        queuedOperation.reject(new Error(`Indexing ${queuedOperation.id} timed out while queued`));
      }
    }
  }

  /**
   * Update search performance metrics
   */
  updateSearchMetrics(duration) {
    const currentAvg = this.metrics.averageSearchTime;
    const totalSearches = this.metrics.totalSearches;
    
    // Calculate running average
    this.metrics.averageSearchTime = ((currentAvg * (totalSearches - 1)) + duration) / totalSearches;
  }

  /**
   * Update indexing performance metrics
   */
  updateIndexingMetrics(duration) {
    const currentAvg = this.metrics.averageIndexingTime;
    const totalIndexing = this.metrics.totalIndexing;
    
    // Calculate running average
    this.metrics.averageIndexingTime = ((currentAvg * (totalIndexing - 1)) + duration) / totalIndexing;
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      activeOperations: {
        searches: this.activeSearches.size,
        indexing: this.activeIndexing.size
      },
      queuedOperations: {
        searches: this.searchQueue.length,
        indexing: this.indexingQueue.length
      },
      capacity: {
        maxSearches: this.maxConcurrentSearches,
        maxIndexing: this.maxConcurrentIndexing,
        searchUtilization: `${((this.activeSearches.size / this.maxConcurrentSearches) * 100).toFixed(1)}%`,
        indexingUtilization: `${((this.activeIndexing.size / this.maxConcurrentIndexing) * 100).toFixed(1)}%`
      },
      metrics: {
        ...this.metrics,
        averageSearchTime: Math.round(this.metrics.averageSearchTime),
        averageIndexingTime: Math.round(this.metrics.averageIndexingTime)
      }
    };
  }

  /**
   * Check if system is healthy and responsive
   */
  isHealthy() {
    const status = this.getStatus();
    
    // System is unhealthy if:
    // - Search queue is too long (indicates bottleneck)
    // - Average search time is too high
    // - Too many timeouts
    
    const searchQueueTooLong = status.queuedOperations.searches > this.maxConcurrentSearches * 2;
    const searchesTooSlow = status.metrics.averageSearchTime > this.searchTimeout * 0.5;
    const tooManyTimeouts = status.metrics.searchTimeouts > status.metrics.totalSearches * 0.1;
    
    return {
      healthy: !searchQueueTooLong && !searchesTooSlow && !tooManyTimeouts,
      issues: {
        searchQueueTooLong,
        searchesTooSlow,
        tooManyTimeouts
      },
      status
    };
  }

  /**
   * Prioritize search operations over indexing when system is under load
   */
  adjustPriorities() {
    const health = this.isHealthy();
    
    if (!health.healthy) {
      // Reduce indexing capacity to prioritize searches
      if (health.issues.searchQueueTooLong || health.issues.searchesTooSlow) {
        this.maxConcurrentIndexing = Math.max(1, Math.floor(this.maxConcurrentIndexing * 0.5));
        console.log(`[ConcurrentSearchManager] ⚠️ Reduced indexing capacity to ${this.maxConcurrentIndexing} to prioritize searches`);
      }
    } else {
      // Restore normal indexing capacity
      const originalIndexingCapacity = 5; // Default value
      if (this.maxConcurrentIndexing < originalIndexingCapacity) {
        this.maxConcurrentIndexing = Math.min(originalIndexingCapacity, this.maxConcurrentIndexing + 1);
        console.log(`[ConcurrentSearchManager] ✅ Restored indexing capacity to ${this.maxConcurrentIndexing}`);
      }
    }
  }

  /**
   * Start monitoring system health and adjusting priorities
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.adjustPriorities();
      
      // Log status periodically if there's activity
      const status = this.getStatus();
      if (status.activeOperations.searches > 0 || status.activeOperations.indexing > 0) {
        console.log(`[ConcurrentSearchManager] 📊 Active: ${status.activeOperations.searches} searches, ${status.activeOperations.indexing} indexing | Queued: ${status.queuedOperations.searches} searches, ${status.queuedOperations.indexing} indexing`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Cancel all queued operations
   */
  cancelAllQueued() {
    // Cancel queued searches
    while (this.searchQueue.length > 0) {
      const operation = this.searchQueue.shift();
      operation.reject(new Error('Operation cancelled'));
    }
    
    // Cancel queued indexing
    while (this.indexingQueue.length > 0) {
      const operation = this.indexingQueue.shift();
      operation.reject(new Error('Operation cancelled'));
    }
    
    console.log('[ConcurrentSearchManager] 🚫 Cancelled all queued operations');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[ConcurrentSearchManager] 🔄 Starting graceful shutdown...');
    
    this.stopMonitoring();
    this.cancelAllQueued();
    
    // Wait for active operations to complete (with timeout)
    const shutdownTimeout = 60000; // 1 minute
    const startTime = Date.now();
    
    while ((this.activeSearches.size > 0 || this.activeIndexing.size > 0) && 
           (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.activeSearches.size > 0 || this.activeIndexing.size > 0) {
      console.warn(`[ConcurrentSearchManager] ⚠️ Shutdown timeout reached with ${this.activeSearches.size} searches and ${this.activeIndexing.size} indexing operations still active`);
    } else {
      console.log('[ConcurrentSearchManager] ✅ Graceful shutdown completed');
    }
  }
}

module.exports = ConcurrentSearchManager;