// server/utils/cacheManager.js - Search Result Caching System
// Implements Requirements 5.2, 5.4, 5.5

class CacheManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes default
    this.maxCacheSize = options.maxCacheSize || 1000; // Maximum number of cached items
    this.keyPrefix = options.keyPrefix || 'rag_search:';
    
    // In-memory cache as fallback when Redis is not available
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    // Initialize Redis client if available (async, but don't wait)
    this.redisClient = null;
    this.redisInitialized = false;
    
    // Initialize Redis in background if options provided
    if (options.redis && !options.redis.disabled) {
      this.initializeRedis(options.redis).then(() => {
        this.redisInitialized = true;
      }).catch(() => {
        this.redisInitialized = true; // Mark as initialized even if failed
      });
    } else {
      this.redisInitialized = true; // Skip Redis initialization
    }
  }

  /**
   * Initialize Redis client with fallback to memory cache
   */
  async initializeRedis(redisOptions = {}) {
    // Skip Redis initialization if explicitly disabled or in test environment
    if (redisOptions.disabled || process.env.NODE_ENV === 'test' || !redisOptions.host) {
      console.log('[CacheManager] Redis disabled or not configured, using memory cache');
      return;
    }

    try {
      // Try to use Redis if available
      const redis = require('redis');
      
      const redisConfig = {
        host: redisOptions.host || process.env.REDIS_HOST,
        port: redisOptions.port || process.env.REDIS_PORT || 6379,
        password: redisOptions.password || process.env.REDIS_PASSWORD,
        db: redisOptions.db || process.env.REDIS_DB || 0,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('[CacheManager] Max Redis reconnection attempts reached, falling back to memory cache');
              return false; // Stop reconnecting
            }
            return Math.min(retries * 50, 500);
          }
        }
      };

      this.redisClient = redis.createClient(redisConfig);
      
      this.redisClient.on('error', (err) => {
        console.warn('[CacheManager] Redis connection error, falling back to memory cache:', err.message);
        this.redisClient = null;
        this.cacheStats.errors++;
      });

      this.redisClient.on('connect', () => {
        console.log('[CacheManager] ✅ Connected to Redis cache');
      });

      // Test connection with timeout
      const connectPromise = this.redisClient.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      await this.redisClient.ping();
      
    } catch (error) {
      console.warn('[CacheManager] Redis not available, using memory cache:', error.message);
      if (this.redisClient) {
        try {
          await this.redisClient.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
      this.redisClient = null;
    }
  }

  /**
   * Generate cache key for search query
   */
  generateCacheKey(userId, query, options = {}) {
    const {
      fileTypes = [],
      tags = [],
      dateRange = null,
      includePublic = false,
      searchStrategies = ['exact'],
      limit = 10
    } = options;

    // Create a deterministic key based on search parameters
    const keyComponents = [
      userId,
      query.toLowerCase().trim(),
      fileTypes.sort().join(','),
      tags.sort().join(','),
      dateRange ? JSON.stringify(dateRange) : '',
      includePublic.toString(),
      searchStrategies.sort().join(','),
      limit.toString()
    ];

    const keyString = keyComponents.join('|');
    const hash = this.hashString(keyString);
    
    return `${this.keyPrefix}${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached search results
   * Implements Requirement 5.2: Fast search result retrieval
   */
  async get(userId, query, options = {}) {
    if (!this.enabled) return null;

    const cacheKey = this.generateCacheKey(userId, query, options);

    try {
      let cachedData = null;

      if (this.redisClient) {
        // Try Redis first
        const redisData = await this.redisClient.get(cacheKey);
        if (redisData) {
          cachedData = JSON.parse(redisData);
        }
      } else {
        // Fallback to memory cache
        const memoryData = this.memoryCache.get(cacheKey);
        if (memoryData && memoryData.expiresAt > Date.now()) {
          cachedData = memoryData.data;
        } else if (memoryData) {
          // Expired entry
          this.memoryCache.delete(cacheKey);
        }
      }

      if (cachedData) {
        this.cacheStats.hits++;
        console.log(`[CacheManager] 🎯 Cache hit for query: "${query}"`);
        return cachedData;
      } else {
        this.cacheStats.misses++;
        return null;
      }
    } catch (error) {
      console.error('[CacheManager] ❌ Error getting cached data:', error);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * Cache search results
   * Implements Requirement 5.2: Search result caching
   */
  async set(userId, query, results, options = {}) {
    if (!this.enabled || !results) return false;

    const cacheKey = this.generateCacheKey(userId, query, options);
    const ttl = options.ttl || this.defaultTTL;

    try {
      const cacheData = {
        results,
        timestamp: Date.now(),
        query,
        userId,
        resultCount: results.length
      };

      if (this.redisClient) {
        // Store in Redis with TTL
        await this.redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData));
      } else {
        // Store in memory cache with size limit
        if (this.memoryCache.size >= this.maxCacheSize) {
          // Remove oldest entries
          const oldestKeys = Array.from(this.memoryCache.keys()).slice(0, 10);
          oldestKeys.forEach(key => this.memoryCache.delete(key));
        }

        this.memoryCache.set(cacheKey, {
          data: cacheData,
          expiresAt: Date.now() + (ttl * 1000)
        });
      }

      this.cacheStats.sets++;
      console.log(`[CacheManager] 💾 Cached ${results.length} results for query: "${query}"`);
      return true;
    } catch (error) {
      console.error('[CacheManager] ❌ Error caching data:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache entries when documents are modified
   * Implements Requirement 5.5: Cache invalidation on document modifications
   */
  async invalidateDocumentCache(documentId, userId = null) {
    if (!this.enabled) return false;

    try {
      let deletedCount = 0;

      if (this.redisClient) {
        // Get all cache keys matching our prefix
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);

        // For each key, check if it might contain the modified document
        // Since we can't easily determine which cached results contain a specific document,
        // we'll invalidate all cache entries for the user (if provided) or all entries
        const keysToDelete = [];

        for (const key of keys) {
          if (userId) {
            // Try to get the cached data to check userId
            try {
              const cachedData = await this.redisClient.get(key);
              if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (parsed.userId === userId) {
                  keysToDelete.push(key);
                }
              }
            } catch (parseError) {
              // If we can't parse, delete the key anyway
              keysToDelete.push(key);
            }
          } else {
            // No specific user, invalidate all
            keysToDelete.push(key);
          }
        }

        if (keysToDelete.length > 0) {
          deletedCount = await this.redisClient.del(keysToDelete);
        }
      } else {
        // Memory cache invalidation
        const keysToDelete = [];

        for (const [key, value] of this.memoryCache.entries()) {
          if (userId) {
            if (value.data && value.data.userId === userId) {
              keysToDelete.push(key);
            }
          } else {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach(key => this.memoryCache.delete(key));
        deletedCount = keysToDelete.length;
      }

      this.cacheStats.deletes += deletedCount;
      console.log(`[CacheManager] 🗑️ Invalidated ${deletedCount} cache entries for document: ${documentId}`);
      return deletedCount > 0;
    } catch (error) {
      console.error('[CacheManager] ❌ Error invalidating cache:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * Invalidate all cache entries for a specific user
   */
  async invalidateUserCache(userId) {
    return this.invalidateDocumentCache(null, userId);
  }

  /**
   * Clear all cache entries
   */
  async clearAll() {
    if (!this.enabled) return false;

    try {
      let deletedCount = 0;

      if (this.redisClient) {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          deletedCount = await this.redisClient.del(keys);
        }
      } else {
        deletedCount = this.memoryCache.size;
        this.memoryCache.clear();
      }

      this.cacheStats.deletes += deletedCount;
      console.log(`[CacheManager] 🧹 Cleared all cache entries (${deletedCount} items)`);
      return true;
    } catch (error) {
      console.error('[CacheManager] ❌ Error clearing cache:', error);
      this.cacheStats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests * 100).toFixed(2) : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      totalRequests,
      cacheSize: this.redisClient ? 'Redis' : this.memoryCache.size,
      enabled: this.enabled,
      backend: this.redisClient ? 'Redis' : 'Memory'
    };
  }

  /**
   * Health check for cache system
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      backend: this.redisClient ? 'Redis' : 'Memory',
      enabled: this.enabled,
      stats: this.getStats()
    };

    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        health.redisConnected = true;
      } catch (error) {
        health.status = 'degraded';
        health.redisConnected = false;
        health.error = error.message;
      }
    }

    return health;
  }

  /**
   * Cleanup expired entries in memory cache
   */
  cleanupExpired() {
    if (this.redisClient) return; // Redis handles expiration automatically

    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt <= now) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CacheManager] 🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }

    return cleanedCount;
  }

  /**
   * Start periodic cleanup for memory cache
   */
  startPeriodicCleanup(intervalMs = 60000) { // 1 minute default
    if (this.redisClient) return; // Not needed for Redis

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);

    console.log('[CacheManager] 🔄 Started periodic cache cleanup');
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[CacheManager] ⏹️ Stopped periodic cache cleanup');
    }
  }

  /**
   * Close cache connections
   */
  async close() {
    this.stopPeriodicCleanup();

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('[CacheManager] 👋 Closed Redis connection');
      } catch (error) {
        console.error('[CacheManager] Error closing Redis connection:', error);
      }
    }

    this.memoryCache.clear();
  }
}

module.exports = CacheManager;