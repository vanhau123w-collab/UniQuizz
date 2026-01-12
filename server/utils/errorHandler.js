// server/utils/errorHandler.js - Comprehensive Error Handling for RAG Search System
// Implements Task 10: Integration and error handling

/**
 * Custom error classes for different types of search errors
 */
class SearchError extends Error {
  constructor(message, code = 'SEARCH_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends SearchError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR', 400, { field, value });
    this.name = 'ValidationError';
  }
}

class ServiceUnavailableError extends SearchError {
  constructor(service, message = null) {
    super(
      message || `${service} service is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      { service }
    );
    this.name = 'ServiceUnavailableError';
  }
}

class TimeoutError extends SearchError {
  constructor(operation, timeout) {
    super(
      `${operation} timed out after ${timeout}ms`,
      'TIMEOUT_ERROR',
      408,
      { operation, timeout }
    );
    this.name = 'TimeoutError';
  }
}

class RateLimitError extends SearchError {
  constructor(limit, window) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}ms`,
      'RATE_LIMIT_ERROR',
      429,
      { limit, window }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Input validation utilities
 */
class InputValidator {
  /**
   * Validate search query input
   */
  static validateSearchQuery(query) {
    if (!query) {
      throw new ValidationError('Search query is required', 'query', query);
    }

    if (typeof query !== 'string') {
      throw new ValidationError('Search query must be a string', 'query', typeof query);
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      throw new ValidationError('Search query cannot be empty', 'query', query);
    }

    if (trimmedQuery.length > 1000) {
      throw new ValidationError('Search query is too long (max 1000 characters)', 'query', trimmedQuery.length);
    }

    // Check for potentially malicious patterns
    const maliciousPatterns = [
      /\$where/i,
      /\$regex.*\$options/i,
      /javascript:/i,
      /<script/i,
      /eval\(/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(trimmedQuery)) {
        throw new ValidationError('Search query contains potentially malicious content', 'query', 'blocked');
      }
    }

    return trimmedQuery;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const validatedPage = parseInt(page) || 1;
    const validatedLimit = parseInt(limit) || 10;

    if (validatedPage < 1) {
      throw new ValidationError('Page number must be greater than 0', 'page', page);
    }

    if (validatedPage > 1000) {
      throw new ValidationError('Page number is too large (max 1000)', 'page', page);
    }

    if (validatedLimit < 1) {
      throw new ValidationError('Limit must be greater than 0', 'limit', limit);
    }

    if (validatedLimit > 100) {
      throw new ValidationError('Limit is too large (max 100)', 'limit', limit);
    }

    return { page: validatedPage, limit: validatedLimit };
  }

  /**
   * Validate user ID
   */
  static validateUserId(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId', userId);
    }

    if (typeof userId !== 'string') {
      throw new ValidationError('User ID must be a string', 'userId', typeof userId);
    }

    // Basic MongoDB ObjectId validation
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId', 'invalid_format');
    }

    return userId;
  }

  /**
   * Validate search options
   */
  static validateSearchOptions(options = {}) {
    const validatedOptions = { ...options };

    // Validate file types
    if (options.fileTypes) {
      if (!Array.isArray(options.fileTypes)) {
        throw new ValidationError('File types must be an array', 'fileTypes', typeof options.fileTypes);
      }

      const supportedTypes = ['pdf', 'docx', 'pptx', 'txt', 'url', 'youtube'];
      const invalidTypes = options.fileTypes.filter(type => 
        !supportedTypes.includes(type.toLowerCase())
      );

      if (invalidTypes.length > 0) {
        throw new ValidationError(
          `Unsupported file types: ${invalidTypes.join(', ')}`,
          'fileTypes',
          invalidTypes
        );
      }

      validatedOptions.fileTypes = options.fileTypes.map(type => type.toLowerCase());
    }

    // Validate tags
    if (options.tags) {
      if (!Array.isArray(options.tags)) {
        throw new ValidationError('Tags must be an array', 'tags', typeof options.tags);
      }

      if (options.tags.length > 20) {
        throw new ValidationError('Too many tags (max 20)', 'tags', options.tags.length);
      }

      validatedOptions.tags = options.tags.filter(tag => 
        tag && typeof tag === 'string' && tag.trim().length > 0
      );
    }

    // Validate search strategies
    if (options.searchStrategies) {
      if (!Array.isArray(options.searchStrategies)) {
        throw new ValidationError('Search strategies must be an array', 'searchStrategies', typeof options.searchStrategies);
      }

      const supportedStrategies = ['exact', 'fuzzy', 'semantic'];
      const invalidStrategies = options.searchStrategies.filter(strategy => 
        !supportedStrategies.includes(strategy.toLowerCase())
      );

      if (invalidStrategies.length > 0) {
        throw new ValidationError(
          `Unsupported search strategies: ${invalidStrategies.join(', ')}`,
          'searchStrategies',
          invalidStrategies
        );
      }

      validatedOptions.searchStrategies = options.searchStrategies.map(strategy => strategy.toLowerCase());
    }

    // Validate boolean options
    ['caseSensitive', 'includePublic', 'highlightTerms'].forEach(field => {
      if (options[field] !== undefined) {
        validatedOptions[field] = Boolean(options[field]);
      }
    });

    return validatedOptions;
  }

  /**
   * Validate date range
   */
  static validateDateRange(dateRange) {
    if (!dateRange) return null;

    if (typeof dateRange !== 'object') {
      throw new ValidationError('Date range must be an object', 'dateRange', typeof dateRange);
    }

    const { start, end } = dateRange;
    const validatedRange = {};

    if (start) {
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) {
        throw new ValidationError('Invalid start date', 'dateRange.start', start);
      }
      validatedRange.start = startDate;
    }

    if (end) {
      const endDate = new Date(end);
      if (isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid end date', 'dateRange.end', end);
      }
      validatedRange.end = endDate;
    }

    if (validatedRange.start && validatedRange.end && validatedRange.start > validatedRange.end) {
      throw new ValidationError('Start date must be before end date', 'dateRange', 'invalid_range');
    }

    return validatedRange;
  }
}

/**
 * Fallback mechanisms for service unavailability
 */
class FallbackManager {
  constructor() {
    this.fallbackStrategies = new Map();
    this.serviceStatus = new Map();
    this.lastHealthCheck = new Map();
  }

  /**
   * Register a fallback strategy for a service
   */
  registerFallback(serviceName, fallbackFunction, options = {}) {
    this.fallbackStrategies.set(serviceName, {
      fallback: fallbackFunction,
      timeout: options.timeout || 5000,
      retries: options.retries || 2,
      healthCheckInterval: options.healthCheckInterval || 60000
    });
  }

  /**
   * Execute operation with fallback
   */
  async executeWithFallback(serviceName, primaryFunction, fallbackData = null) {
    const strategy = this.fallbackStrategies.get(serviceName);
    
    try {
      // Try primary function first
      const result = await this.executeWithTimeout(primaryFunction, strategy?.timeout || 10000);
      this.markServiceHealthy(serviceName);
      return result;
    } catch (error) {
      console.warn(`[FallbackManager] Primary service ${serviceName} failed:`, error.message);
      this.markServiceUnhealthy(serviceName, error);

      // Try fallback if available
      if (strategy && strategy.fallback) {
        try {
          console.log(`[FallbackManager] Executing fallback for ${serviceName}`);
          const fallbackResult = await strategy.fallback(fallbackData);
          return {
            ...fallbackResult,
            _fallbackUsed: true,
            _primaryError: error.message
          };
        } catch (fallbackError) {
          console.error(`[FallbackManager] Fallback for ${serviceName} also failed:`, fallbackError.message);
          throw new ServiceUnavailableError(serviceName, `Both primary and fallback services failed: ${error.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new TimeoutError('Operation', timeout)), timeout)
      )
    ]);
  }

  /**
   * Mark service as healthy
   */
  markServiceHealthy(serviceName) {
    this.serviceStatus.set(serviceName, {
      status: 'healthy',
      lastError: null,
      lastCheck: Date.now()
    });
  }

  /**
   * Mark service as unhealthy
   */
  markServiceUnhealthy(serviceName, error) {
    this.serviceStatus.set(serviceName, {
      status: 'unhealthy',
      lastError: error.message,
      lastCheck: Date.now()
    });
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName) {
    return this.serviceStatus.get(serviceName) || {
      status: 'unknown',
      lastError: null,
      lastCheck: null
    };
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth() {
    const health = {};
    for (const [serviceName, status] of this.serviceStatus.entries()) {
      health[serviceName] = status;
    }
    return health;
  }
}

/**
 * Performance monitoring and logging
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowOperationThreshold = 5000; // 5 seconds
    this.errorRateThreshold = 0.1; // 10%
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operationId, operationType, metadata = {}) {
    this.metrics.set(operationId, {
      type: operationType,
      startTime: Date.now(),
      metadata,
      status: 'running'
    });
  }

  /**
   * End monitoring an operation
   */
  endOperation(operationId, success = true, error = null) {
    const operation = this.metrics.get(operationId);
    if (!operation) return;

    const endTime = Date.now();
    const duration = endTime - operation.startTime;

    operation.endTime = endTime;
    operation.duration = duration;
    operation.success = success;
    operation.error = error?.message || null;
    operation.status = success ? 'completed' : 'failed';

    // Log slow operations
    if (duration > this.slowOperationThreshold) {
      console.warn(`[PerformanceMonitor] Slow operation detected: ${operation.type} took ${duration}ms`, {
        operationId,
        duration,
        metadata: operation.metadata
      });
    }

    // Log errors
    if (!success && error) {
      console.error(`[PerformanceMonitor] Operation failed: ${operation.type}`, {
        operationId,
        duration,
        error: error.message,
        metadata: operation.metadata
      });
    }

    return operation;
  }

  /**
   * Get performance statistics
   */
  getStats(operationType = null) {
    const operations = Array.from(this.metrics.values())
      .filter(op => !operationType || op.type === operationType)
      .filter(op => op.status !== 'running');

    if (operations.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageDuration: 0,
        slowOperations: 0,
        errorRate: 0
      };
    }

    const successful = operations.filter(op => op.success);
    const failed = operations.filter(op => !op.success);
    const slow = operations.filter(op => op.duration > this.slowOperationThreshold);

    const totalDuration = operations.reduce((sum, op) => sum + op.duration, 0);

    return {
      totalOperations: operations.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      successRate: (successful.length / operations.length * 100).toFixed(2) + '%',
      errorRate: (failed.length / operations.length * 100).toFixed(2) + '%',
      averageDuration: Math.round(totalDuration / operations.length),
      slowOperations: slow.length,
      slowOperationRate: (slow.length / operations.length * 100).toFixed(2) + '%'
    };
  }

  /**
   * Check if system is performing well
   */
  isPerformingWell(operationType = null) {
    const stats = this.getStats(operationType);
    
    if (stats.totalOperations === 0) return true;

    const errorRate = parseFloat(stats.errorRate) / 100;
    const slowRate = parseFloat(stats.slowOperationRate) / 100;

    return errorRate < this.errorRateThreshold && slowRate < 0.2; // 20% slow operation threshold
  }

  /**
   * Clean up old metrics
   */
  cleanup(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;
    let cleanedCount = 0;

    for (const [operationId, operation] of this.metrics.entries()) {
      if (operation.endTime && operation.endTime < cutoff) {
        this.metrics.delete(operationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[PerformanceMonitor] Cleaned up ${cleanedCount} old metrics`);
    }

    return cleanedCount;
  }
}

/**
 * Main error handler class
 */
class ErrorHandler {
  constructor() {
    this.fallbackManager = new FallbackManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.setupFallbacks();
  }

  /**
   * Setup default fallback strategies
   */
  setupFallbacks() {
    // Search fallback: use basic MongoDB text search
    this.fallbackManager.registerFallback('search', async (data) => {
      const { userId, query, options = {} } = data;
      const Document = require('../models/Document');
      
      console.log(`[ErrorHandler] Using fallback search for query: "${query}"`);
      
      const searchFilter = {
        $or: [
          { userId },
          ...(options.includePublic ? [{ isPublic: true }] : [])
        ],
        $text: { $search: query }
      };

      const documents = await Document.find(searchFilter)
        .select('title fileType tags metadata.totalWords createdAt')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(options.limit || 10);

      return {
        items: documents,
        searchMetrics: {
          totalResults: documents.length,
          strategy: 'fallback_text_search',
          cacheHit: false
        }
      };
    });

    // Cache fallback: return empty results with warning
    this.fallbackManager.registerFallback('cache', async () => {
      console.log('[ErrorHandler] Cache unavailable, proceeding without cache');
      return null;
    });

    // Suggestion fallback: return recent searches
    this.fallbackManager.registerFallback('suggestions', async (data) => {
      const { userId } = data;
      const SearchHistory = require('../models/SearchHistory');
      
      console.log('[ErrorHandler] Using fallback suggestions from search history');
      
      const recentSearches = await SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('query');

      return recentSearches.map(search => ({
        text: search.query,
        type: 'recent',
        source: 'history',
        frequency: 1,
        relevanceScore: 0.5
      }));
    });
  }

  /**
   * Handle API errors and return appropriate response
   */
  handleApiError(error, req, res) {
    // Log the error
    console.error('[ErrorHandler] API Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userId: req.userId,
      timestamp: new Date().toISOString()
    });

    // Determine response based on error type
    if (error instanceof ValidationError) {
      const response = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field,
          value: error.details.value
        }
      };
      return res.status ? res.status(error.statusCode).json(response) : response;
    }

    if (error instanceof ServiceUnavailableError) {
      const response = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          service: error.details.service,
          fallbackAvailable: true
        }
      };
      return res.status ? res.status(error.statusCode).json(response) : response;
    }

    if (error instanceof TimeoutError) {
      const response = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          operation: error.details.operation,
          timeout: error.details.timeout
        }
      };
      return res.status ? res.status(error.statusCode).json(response) : response;
    }

    if (error instanceof RateLimitError) {
      const response = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          limit: error.details.limit,
          window: error.details.window
        }
      };
      return res.status ? res.status(error.statusCode).json(response) : response;
    }

    // Generic error handling
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : error.message;

    const response = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: message
      }
    };

    return res.status ? res.status(statusCode).json(response) : response;
  }

  /**
   * Wrap async route handlers with error handling
   */
  wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(error => {
        this.handleApiError(error, req, res);
      });
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    return {
      services: this.fallbackManager.getAllServiceHealth(),
      performance: {
        search: this.performanceMonitor.getStats('search'),
        indexing: this.performanceMonitor.getStats('indexing'),
        overall: this.performanceMonitor.getStats()
      },
      isHealthy: this.performanceMonitor.isPerformingWell(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export classes and create singleton instance
const errorHandler = new ErrorHandler();

module.exports = {
  ErrorHandler,
  SearchError,
  ValidationError,
  ServiceUnavailableError,
  TimeoutError,
  RateLimitError,
  InputValidator,
  FallbackManager,
  PerformanceMonitor,
  errorHandler
};