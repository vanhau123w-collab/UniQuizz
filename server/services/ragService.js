// server/services/ragService.js - RAG Implementation
const Document = require('../models/Document');
const QueryNormalizer = require('../utils/queryNormalizer');
const CacheManager = require('../utils/cacheManager');
const PaginationManager = require('../utils/paginationManager');
const ConcurrentSearchManager = require('../utils/concurrentSearchManager');
const { 
  errorHandler, 
  ValidationError, 
  ServiceUnavailableError, 
  TimeoutError,
  InputValidator 
} = require('../utils/errorHandler');
const { searchLogger } = require('../utils/searchLogger');

class RAGService {
  static cacheManager = new CacheManager({
    enabled: process.env.CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.CACHE_TTL) || 300,
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    }
  });
  
  static paginationManager = new PaginationManager({
    defaultPageSize: 20,
    maxPageSize: 100
  });
  
  static concurrentSearchManager = new ConcurrentSearchManager({
    maxConcurrentSearches: 50,
    maxConcurrentIndexing: 5
  });
  
  /**
   * Chia văn bản thành chunks nhỏ để xử lý với enhanced search support
   */
  static chunkText(text, chunkSize = 1000, overlap = 200) {
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 50) { // Bỏ qua chunks quá ngắn
        const chunkContent = chunk.trim();
        chunks.push({
          content: chunkContent,
          searchableContent: QueryNormalizer.normalizeForSearch(chunkContent),
          searchTerms: QueryNormalizer.extractSearchTerms(chunkContent),
          chunkIndex: chunks.length,
          metadata: {
            wordCount: chunkContent.split(/\s+/).length,
            startWord: i,
            endWord: Math.min(i + chunkSize, words.length),
            termFrequency: QueryNormalizer.calculateTermFrequency(chunkContent),
            contentHash: QueryNormalizer.generateContentHash(chunkContent)
          }
        });
      }
    }
    
    return chunks;
  }
  
  /**
   * Lưu document vào database với chunking và enhanced search indexing
   * Implements Requirement 5.5: Cache invalidation on document modifications
   */
  static async storeDocument(userId, title, content, metadata = {}) {
    const indexingId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Execute document storage with concurrency control
      const indexingFunction = async () => {
        // Chia nhỏ nội dung với enhanced search support
        const chunks = this.chunkText(content);
        
        // Tạo document mới với enhanced search fields
        const document = new Document({
          userId,
          title,
          originalFileName: metadata.fileName || title,
          fileType: metadata.fileType || 'txt',
          sourceUrl: metadata.sourceUrl,
          fullContent: content,
          searchableContent: QueryNormalizer.normalizeForSearch(content),
          searchTerms: QueryNormalizer.extractSearchTerms(content),
          chunks,
          metadata: {
            totalWords: content.split(/\s+/).length,
            totalChunks: chunks.length,
            language: metadata.language || 'vi',
            lastIndexed: new Date(),
            termFrequency: QueryNormalizer.calculateTermFrequency(content),
            contentHash: QueryNormalizer.generateContentHash(content)
          },
          tags: metadata.tags || []
        });
        
        const savedDocument = await document.save();
        
        // Invalidate user's search cache (Requirement 5.5)
        await this.cacheManager.invalidateUserCache(userId);
        
        console.log(`[RAG] ✅ Đã lưu document: ${title} (${chunks.length} chunks)`);
        
        return savedDocument;
      };
      
      return await this.concurrentSearchManager.executeIndexing(indexingId, indexingFunction);
    } catch (error) {
      console.error('[RAG] ❌ Lỗi lưu document:', error);
      throw error;
    }
  }

  /**
   * Update document and invalidate related cache entries
   * Implements Requirement 5.5: Cache invalidation on document modifications
   */
  static async updateDocument(documentId, updates, userId) {
    const indexingId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const indexingFunction = async () => {
        const document = await Document.findById(documentId);
        if (!document) {
          throw new Error('Document not found');
        }
        
        // Check if user has permission to update
        if (document.userId.toString() !== userId) {
          throw new Error('Unauthorized to update this document');
        }
        
        // Apply updates
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            document[key] = updates[key];
          }
        });
        
        // If content changed, update search indexes
        if (updates.fullContent && document.hasContentChanged()) {
          await document.updateSearchIndexes();
        }
        
        const updatedDocument = await document.save();
        
        // Invalidate related cache entries (Requirement 5.5)
        await this.cacheManager.invalidateDocumentCache(documentId, userId);
        
        console.log(`[RAG] ✅ Updated document: ${documentId}`);
        
        return updatedDocument;
      };
      
      return await this.concurrentSearchManager.executeIndexing(indexingId, indexingFunction);
    } catch (error) {
      console.error('[RAG] ❌ Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document and invalidate related cache entries
   * Implements Requirement 5.5: Cache invalidation on document modifications
   */
  static async deleteDocument(documentId, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Check if user has permission to delete
      if (document.userId.toString() !== userId) {
        throw new Error('Unauthorized to delete this document');
      }
      
      await Document.findByIdAndDelete(documentId);
      
      // Invalidate related cache entries (Requirement 5.5)
      await this.cacheManager.invalidateDocumentCache(documentId, userId);
      
      console.log(`[RAG] ✅ Deleted document: ${documentId}`);
      
      return { success: true, documentId };
    } catch (error) {
      console.error('[RAG] ❌ Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Bulk update search indexes for multiple documents
   * Implements Requirement 5.2: Concurrent search availability during indexing
   */
  static async bulkUpdateSearchIndexes(documentIds, userId) {
    const indexingId = `bulk_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const indexingFunction = async () => {
        const documents = await Document.find({
          _id: { $in: documentIds },
          userId: userId
        });
        
        const updatePromises = documents.map(async (doc) => {
          if (doc.hasContentChanged()) {
            await doc.updateSearchIndexes();
            console.log(`[RAG] 🔄 Updated search indexes for document: ${doc._id}`);
          }
        });
        
        await Promise.all(updatePromises);
        
        // Invalidate user's search cache
        await this.cacheManager.invalidateUserCache(userId);
        
        console.log(`[RAG] ✅ Bulk updated search indexes for ${documents.length} documents`);
        
        return { updated: documents.length };
      };
      
      return await this.concurrentSearchManager.executeIndexing(indexingId, indexingFunction);
    } catch (error) {
      console.error('[RAG] ❌ Error bulk updating search indexes:', error);
      throw error;
    }
  }

  /**
   * Get cache and performance statistics
   */
  static async getPerformanceStats() {
    const cacheStats = this.cacheManager.getStats();
    const concurrentStats = this.concurrentSearchManager.getStatus();
    const cacheHealth = await this.cacheManager.healthCheck();
    const systemHealth = this.concurrentSearchManager.isHealthy();
    
    return {
      cache: cacheStats,
      concurrent: concurrentStats,
      health: {
        cache: cacheHealth,
        system: systemHealth
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all caches (admin function)
   */
  static async clearAllCaches() {
    try {
      await this.cacheManager.clearAll();
      console.log('[RAG] 🧹 Cleared all search caches');
      return { success: true };
    } catch (error) {
      console.error('[RAG] ❌ Error clearing caches:', error);
      throw error;
    }
  }
  
  /**
   * Tìm kiếm documents liên quan đến query với enhanced search algorithms
   * Implements Requirements 4.1, 4.2, 1.5, 4.3, 4.4, 4.5, 5.2, 5.4, 5.5
   * Enhanced with comprehensive error handling and validation
   */
  static async searchDocuments(userId, query, options = {}) {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logger = searchLogger.createSearchLogger(searchId, query, { userId, ...options });
    
    try {
      // Input validation
      const validatedUserId = InputValidator.validateUserId(userId);
      const validatedQuery = InputValidator.validateSearchQuery(query);
      const validatedOptions = InputValidator.validateSearchOptions(options);
      
      logger.logStep('validation_complete', { validatedOptions });

      const {
        limit = 10,
        page = 1,
        fileTypes = [],
        tags = [],
        dateRange = null,
        includePublic = false,
        caseSensitive = false,
        searchStrategies = ['exact', 'fuzzy'],
        minScore = 0.1,
        highlightTerms = true,
        customFilters = {},
        useCache = true,
        cacheTTL = 300
      } = validatedOptions;

      // Validate pagination
      const { page: validatedPage, limit: validatedLimit } = InputValidator.validatePagination(page, limit);
      
      logger.logStep('input_validated', { 
        query: validatedQuery, 
        page: validatedPage, 
        limit: validatedLimit 
      });

      // Execute search with fallback mechanism
      return await errorHandler.fallbackManager.executeWithFallback(
        'search',
        async () => {
          // Check cache first (Requirement 5.2)
          if (useCache) {
            logger.logStep('cache_check_start');
            
            const cachedResults = await this.cacheManager.get(validatedUserId, validatedQuery, {
              fileTypes, tags, dateRange, includePublic, searchStrategies, limit: validatedLimit, page: validatedPage
            });
            
            if (cachedResults) {
              logger.logStep('cache_hit');
              const result = this.paginationManager.createSearchPagination(
                cachedResults.results, 
                validatedPage, 
                validatedLimit,
                { ...cachedResults, cacheHit: true }
              );
              logger.logComplete(result);
              return result;
            }
            
            logger.logStep('cache_miss');
          }

          // Execute search with concurrency control (Requirement 5.2)
          const searchFunction = async () => {
            logger.logStep('search_execution_start');
            
            // Initialize FilterManager for filtering (Requirements 4.3, 4.4, 4.5)
            const FilterManager = require('../utils/filterManager');
            const filterManager = new FilterManager();
            
            // Validate filter combination
            const filters = {
              fileTypes,
              dateRange,
              tags,
              customFilters
            };
            
            try {
              filterManager.validateFilterCombination(filters);
              logger.logStep('filters_validated', { filterSummary: filterManager.getFilterSummary(filters) });
            } catch (filterError) {
              throw new ValidationError(`Filter validation failed: ${filterError.message}`, 'filters', filters);
            }
            
            // Use enhanced search method from Document model with new algorithms and filtering
            logger.logStep('document_search_start');
            
            const documents = await Document.enhancedSearch(validatedUserId, validatedQuery, {
              limit: validatedLimit * 2, // Get more results for better pagination
              fileTypes,
              tags,
              dateRange,
              includePublic,
              caseSensitive,
              useSearchEngine: true,
              searchStrategies,
              minScore,
              customFilters
            });
            
            logger.logStep('document_search_complete', { resultCount: documents.length });

            // Add term highlighting if requested (Requirement 1.5)
            let processedDocuments = documents;
            if (highlightTerms && documents.length > 0) {
              logger.logStep('highlighting_start');
              processedDocuments = this.addTermHighlighting(documents, validatedQuery, { caseSensitive });
              logger.logStep('highlighting_complete');
            }

            return processedDocuments;
          };

          const searchStartTime = Date.now();
          const searchResults = await this.concurrentSearchManager.executeSearch(
            searchId, 
            searchFunction,
            { timeout: 30000 }
          );
          const searchTime = Date.now() - searchStartTime;
          
          logger.logStep('search_complete', { searchTime, resultCount: searchResults.length });

          // Cache results for future use (Requirement 5.2)
          if (useCache && searchResults.length > 0) {
            logger.logStep('cache_store_start');
            
            try {
              await this.cacheManager.set(validatedUserId, validatedQuery, searchResults, {
                fileTypes, tags, dateRange, includePublic, searchStrategies, limit: validatedLimit, page: validatedPage
              }, { ttl: cacheTTL });
              
              logger.logStep('cache_store_complete');
            } catch (cacheError) {
              // Log cache error but don't fail the search
              searchLogger.warn('Cache storage failed', { 
                searchId, 
                error: cacheError.message 
              });
            }
          }

          // Apply pagination (Requirement 5.4)
          const paginatedResults = this.paginationManager.createSearchPagination(
            searchResults, 
            validatedPage, 
            validatedLimit,
            { 
              searchTime, 
              cacheHit: false, 
              strategy: searchStrategies.join(','),
              totalResults: searchResults.length
            }
          );
          
          logger.logComplete(paginatedResults);
          return paginatedResults;
        },
        // Fallback data for error handler
        { 
          userId: validatedUserId, 
          query: validatedQuery, 
          options: validatedOptions 
        }
      );
      
    } catch (error) {
      logger.logError(error, false);
      
      // Enhanced error handling with specific error types
      if (error instanceof ValidationError) {
        throw error; // Re-throw validation errors as-is
      }
      
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableError('search', 'Search operation timed out. Please try again with a simpler query.');
      }
      
      // Try fallback search for other errors
      try {
        searchLogger.warn('Primary search failed, attempting fallback', { 
          searchId, 
          error: error.message 
        });
        
        const fallbackResult = await this.fallbackSearch(userId, query, options);
        logger.logComplete(fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        logger.logError(fallbackError, true);
        throw new ServiceUnavailableError('search', 'Search service is temporarily unavailable. Please try again later.');
      }
    }
  }

  /**
   * Fallback search method using basic MongoDB text search
   * Used when enhanced search fails
   */
  static async fallbackSearch(userId, query, options = {}) {
    const {
      limit = 10,
      page = 1,
      fileTypes = [],
      tags = [],
      includePublic = false
    } = options;

    try {
      // Validate inputs for fallback
      const validatedUserId = InputValidator.validateUserId(userId);
      const validatedQuery = InputValidator.validateSearchQuery(query);
      const { page: validatedPage, limit: validatedLimit } = InputValidator.validatePagination(page, limit);

      const searchFilter = {
        $or: [
          { userId: validatedUserId },
          ...(includePublic ? [{ isPublic: true }] : [])
        ]
      };
      
      if (fileTypes.length > 0) {
        const FilterManager = require('../utils/filterManager');
        const filterManager = new FilterManager();
        const validatedFileTypes = filterManager.validateFileTypes(fileTypes);
        searchFilter.fileType = { $in: validatedFileTypes };
      }
      
      if (tags.length > 0) {
        searchFilter.tags = { $in: tags };
      }
      
      // Fallback text search with pagination
      const paginatedQuery = this.paginationManager.createMongoQuery(validatedPage, validatedLimit);
      
      const documents = await Document.find({
        ...searchFilter,
        $text: { $search: validatedQuery }
      })
      .select('title fileType tags metadata.totalWords createdAt usageStats')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(paginatedQuery.skip)
      .limit(paginatedQuery.limit);
      
      const totalCount = await Document.countDocuments({
        ...searchFilter,
        $text: { $search: validatedQuery }
      });
      
      const paginationMeta = this.paginationManager.calculatePaginationMeta(
        totalCount, 
        validatedPage, 
        validatedLimit
      );
      
      searchLogger.info('Fallback search completed', {
        query: validatedQuery,
        resultCount: documents.length,
        totalCount,
        userId: validatedUserId
      });
      
      return {
        items: documents,
        pagination: paginationMeta,
        searchMetrics: {
          totalResults: totalCount,
          cacheHit: false,
          strategy: 'fallback_text_search',
          fallbackUsed: true
        }
      };
    } catch (error) {
      searchLogger.error('Fallback search failed', {
        query,
        userId,
        error: error.message
      });
      throw new ServiceUnavailableError('search', 'All search methods failed. Please try again later.');
    }
  }

  /**
   * Advanced search with boolean operators and quoted phrase matching
   * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.4
   * Enhanced with comprehensive error handling
   */
  static async advancedSearch(userId, query, options = {}) {
    const searchId = `advanced_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logger = searchLogger.createSearchLogger(searchId, query, { userId, searchType: 'advanced', ...options });

    try {
      // Input validation
      const validatedUserId = InputValidator.validateUserId(userId);
      const validatedQuery = InputValidator.validateSearchQuery(query);
      const validatedOptions = InputValidator.validateSearchOptions(options);
      
      const {
        limit = 10,
        page = 1,
        fileTypes = [],
        tags = [],
        dateRange = null,
        includePublic = false,
        caseSensitive = false,
        sortBy = 'relevance', // 'relevance', 'date', 'title', 'usage'
        sortOrder = 'desc',
        customFilters = {},
        useCache = true,
        cacheTTL = 300
      } = validatedOptions;

      // Validate pagination and sort parameters
      const { page: validatedPage, limit: validatedLimit } = InputValidator.validatePagination(page, limit);
      
      const validSortFields = ['relevance', 'date', 'title', 'usage'];
      if (!validSortFields.includes(sortBy)) {
        throw new ValidationError(`Invalid sortBy field. Allowed: ${validSortFields.join(', ')}`, 'sortBy', sortBy);
      }
      
      const validSortOrders = ['asc', 'desc'];
      if (!validSortOrders.includes(sortOrder)) {
        throw new ValidationError(`Invalid sortOrder. Allowed: ${validSortOrders.join(', ')}`, 'sortOrder', sortOrder);
      }

      logger.logStep('validation_complete', { sortBy, sortOrder });

      // Execute with fallback mechanism
      return await errorHandler.fallbackManager.executeWithFallback(
        'advanced_search',
        async () => {
          // Check cache first (Requirement 5.2)
          if (useCache) {
            logger.logStep('cache_check_start');
            
            const cachedResults = await this.cacheManager.get(validatedUserId, `advanced:${validatedQuery}`, {
              fileTypes, tags, dateRange, includePublic, sortBy, sortOrder, limit: validatedLimit, page: validatedPage
            });
            
            if (cachedResults) {
              logger.logStep('cache_hit');
              const result = this.paginationManager.createSearchPagination(
                cachedResults.results, 
                validatedPage, 
                validatedLimit,
                { ...cachedResults, cacheHit: true }
              );
              logger.logComplete(result);
              return result;
            }
            
            logger.logStep('cache_miss');
          }

          // Execute search with concurrency control (Requirement 5.2)
          const searchFunction = async () => {
            logger.logStep('advanced_search_start');
            
            // Initialize FilterManager for advanced filtering (Requirements 4.3, 4.4, 4.5)
            const FilterManager = require('../utils/filterManager');
            const filterManager = new FilterManager();
            
            // Validate filter combination before proceeding
            const filters = {
              fileTypes,
              dateRange,
              tags,
              customFilters
            };
            
            try {
              filterManager.validateFilterCombination(filters);
              logger.logStep('filters_validated', { filterSummary: filterManager.getFilterSummary(filters) });
            } catch (filterError) {
              throw new ValidationError(`Advanced search filter validation failed: ${filterError.message}`, 'filters', filters);
            }
            
            // Parse advanced query for boolean operators and quoted phrases
            const parsedQuery = this.parseAdvancedQuery(validatedQuery);
            logger.logStep('query_parsed', { parsedQuery });
            
            // Build search filter using FilterManager (Requirements 4.3, 4.4, 4.5)
            const searchFilter = filterManager.buildFilterQuery(validatedUserId, {
              fileTypes,
              dateRange,
              tags,
              includePublic,
              customFilters
            });
            
            // Get candidate documents using the enhanced filter
            const candidateDocuments = await Document.find(searchFilter)
              .select('title fileType tags metadata createdAt usageStats searchableContent searchTerms fullContent chunks')
              .lean();
            
            if (candidateDocuments.length === 0) {
              logger.logStep('no_candidates_found');
              return [];
            }
            
            logger.logStep('candidates_found', { count: candidateDocuments.length });
            
            // Execute advanced search with parsed query
            const searchResults = await this.executeAdvancedSearch(parsedQuery, candidateDocuments, {
              caseSensitive,
              limit: validatedLimit * 2 // Get more results for better pagination
            });
            
            logger.logStep('advanced_search_complete', { resultCount: searchResults.length });
            
            // Apply sorting
            const sortedResults = this.applySorting(searchResults, sortBy, sortOrder);
            logger.logStep('sorting_complete');
            
            // Add term highlighting
            const highlightedResults = this.addTermHighlighting(sortedResults, validatedQuery, { caseSensitive });
            logger.logStep('highlighting_complete');
            
            return highlightedResults;
          };

          const searchStartTime = Date.now();
          const searchResults = await this.concurrentSearchManager.executeSearch(
            searchId, 
            searchFunction,
            { timeout: 45000 } // Longer timeout for advanced search
          );
          const searchTime = Date.now() - searchStartTime;
          
          logger.logStep('search_execution_complete', { searchTime });

          // Cache results for future use (Requirement 5.2)
          if (useCache && searchResults.length > 0) {
            logger.logStep('cache_store_start');
            
            try {
              await this.cacheManager.set(validatedUserId, `advanced:${validatedQuery}`, searchResults, {
                fileTypes, tags, dateRange, includePublic, sortBy, sortOrder, limit: validatedLimit, page: validatedPage
              }, { ttl: cacheTTL });
              
              logger.logStep('cache_store_complete');
            } catch (cacheError) {
              searchLogger.warn('Advanced search cache storage failed', { 
                searchId, 
                error: cacheError.message 
              });
            }
          }

          // Apply pagination (Requirement 5.4)
          const paginatedResults = this.paginationManager.createSearchPagination(
            searchResults, 
            validatedPage, 
            validatedLimit,
            { 
              searchTime, 
              cacheHit: false, 
              strategy: 'advanced',
              totalResults: searchResults.length
            }
          );
          
          logger.logComplete(paginatedResults);
          return paginatedResults;
        },
        // Fallback data
        { 
          userId: validatedUserId, 
          query: validatedQuery, 
          options: validatedOptions 
        }
      );
    } catch (error) {
      logger.logError(error, false);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableError('advanced_search', 'Advanced search timed out. Please try a simpler query.');
      }
      
      // Fallback to regular search
      try {
        searchLogger.warn('Advanced search failed, falling back to regular search', { 
          searchId, 
          error: error.message 
        });
        
        const fallbackResult = await this.searchDocuments(userId, query, { ...options, useCache: false });
        logger.logComplete(fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        logger.logError(fallbackError, true);
        throw new ServiceUnavailableError('search', 'All search methods failed. Please try again later.');
      }
    }
  }

  /**
   * Parse advanced query for boolean operators and quoted phrases
   * Implements Requirements 4.1, 4.2
   */
  static parseAdvancedQuery(query) {
    const parsed = {
      phrases: [], // Quoted phrases (Requirement 4.1)
      andTerms: [], // Terms that must be present
      orTerms: [], // Terms where at least one must be present
      notTerms: [], // Terms that must not be present
      originalQuery: query
    };
    
    let remainingQuery = query;
    
    // Extract quoted phrases first (Requirement 4.1)
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      parsed.phrases.push(match[1]);
      remainingQuery = remainingQuery.replace(match[0], '');
    }
    
    // Parse boolean operators (Requirement 4.2)
    const tokens = remainingQuery.split(/\s+/).filter(token => token.length > 0);
    let currentOperator = 'AND'; // Default operator
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toUpperCase();
      
      if (token === 'AND') {
        currentOperator = 'AND';
      } else if (token === 'OR') {
        currentOperator = 'OR';
      } else if (token === 'NOT') {
        currentOperator = 'NOT';
      } else {
        // Regular term
        const cleanToken = tokens[i].replace(/[^\w\s]/g, '').trim();
        if (cleanToken.length > 0) {
          if (currentOperator === 'AND') {
            parsed.andTerms.push(cleanToken);
          } else if (currentOperator === 'OR') {
            parsed.orTerms.push(cleanToken);
          } else if (currentOperator === 'NOT') {
            parsed.notTerms.push(cleanToken);
            currentOperator = 'AND'; // Reset to default after NOT
          }
        }
      }
    }
    
    // If no explicit operators, treat all terms as AND terms
    if (parsed.andTerms.length === 0 && parsed.orTerms.length === 0 && parsed.phrases.length === 0) {
      parsed.andTerms = tokens.map(token => token.replace(/[^\w\s]/g, '').trim()).filter(t => t.length > 0);
    }
    
    return parsed;
  }

  /**
   * Execute advanced search with parsed query
   */
  static async executeAdvancedSearch(parsedQuery, documents, options = {}) {
    const { caseSensitive = false, limit = 10 } = options;
    const { SearchEngine } = require('../utils/searchEngine');
    const searchEngine = new SearchEngine();
    
    const results = [];
    
    for (const document of documents) {
      let score = 0;
      let matchDetails = [];
      
      // Check quoted phrases (must match exactly)
      let phraseMatches = true;
      for (const phrase of parsedQuery.phrases) {
        const phraseResult = await searchEngine.search(phrase, [document], {
          strategies: ['exact'],
          caseSensitive,
          maxResults: 1
        });
        
        if (phraseResult.length === 0) {
          phraseMatches = false;
          break;
        } else {
          score += phraseResult[0].finalScore * 2; // Phrase matches get higher weight
          matchDetails.push(...phraseResult[0].matchDetails);
        }
      }
      
      if (!phraseMatches) continue;
      
      // Check AND terms (all must be present)
      let andMatches = true;
      for (const term of parsedQuery.andTerms) {
        const termResult = await searchEngine.search(term, [document], {
          strategies: ['exact', 'fuzzy'],
          caseSensitive,
          maxResults: 1
        });
        
        if (termResult.length === 0) {
          andMatches = false;
          break;
        } else {
          score += termResult[0].finalScore;
          matchDetails.push(...termResult[0].matchDetails);
        }
      }
      
      if (!andMatches) continue;
      
      // Check OR terms (at least one must be present)
      if (parsedQuery.orTerms.length > 0) {
        let orMatches = false;
        for (const term of parsedQuery.orTerms) {
          const termResult = await searchEngine.search(term, [document], {
            strategies: ['exact', 'fuzzy'],
            caseSensitive,
            maxResults: 1
          });
          
          if (termResult.length > 0) {
            orMatches = true;
            score += termResult[0].finalScore * 0.8; // OR matches get slightly lower weight
            matchDetails.push(...termResult[0].matchDetails);
          }
        }
        
        if (!orMatches) continue;
      }
      
      // Check NOT terms (none must be present)
      let notMatches = false;
      for (const term of parsedQuery.notTerms) {
        const termResult = await searchEngine.search(term, [document], {
          strategies: ['exact'],
          caseSensitive,
          maxResults: 1
        });
        
        if (termResult.length > 0) {
          notMatches = true;
          break;
        }
      }
      
      if (notMatches) continue;
      
      // Document passed all criteria
      if (score > 0) {
        results.push({
          ...document,
          _searchScore: score,
          _matchDetails: matchDetails,
          _strategy: 'advanced'
        });
      }
    }
    
    // Sort by score and limit results
    return results
      .sort((a, b) => b._searchScore - a._searchScore)
      .slice(0, limit);
  }

  /**
   * Add term highlighting to search results
   * Implements Requirement 1.5
   */
  static addTermHighlighting(documents, query, options = {}) {
    const { caseSensitive = false, maxSnippetLength = 200 } = options;
    const QueryNormalizer = require('../utils/queryNormalizer');
    
    // Extract terms to highlight
    const parsedQuery = this.parseAdvancedQuery(query);
    const allTerms = [
      ...parsedQuery.phrases,
      ...parsedQuery.andTerms,
      ...parsedQuery.orTerms
    ];
    
    return documents.map(doc => {
      const highlightedDoc = { ...doc };
      
      // Highlight terms in title
      if (doc.title) {
        highlightedDoc.highlightedTitle = this.highlightTermsInText(doc.title, allTerms, caseSensitive);
      }
      
      // Create highlighted snippet from content
      if (doc.fullContent || doc.searchableContent) {
        const content = doc.fullContent || doc.searchableContent;
        highlightedDoc.highlightedSnippet = this.createHighlightedSnippet(
          content, 
          allTerms, 
          maxSnippetLength, 
          caseSensitive
        );
      }
      
      // Highlight terms in match details if available
      if (doc._matchDetails) {
        highlightedDoc._matchDetails = doc._matchDetails.map(match => ({
          ...match,
          highlightedContent: match.content ? 
            this.highlightTermsInText(match.content, allTerms, caseSensitive) : 
            match.content
        }));
      }
      
      return highlightedDoc;
    });
  }

  /**
   * Highlight terms in text
   */
  static highlightTermsInText(text, terms, caseSensitive = false) {
    if (!text || !terms || terms.length === 0) return text;
    
    let highlightedText = text;
    
    terms.forEach(term => {
      if (!term || term.length === 0) return;
      
      const flags = caseSensitive ? 'g' : 'gi';
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, flags);
      
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  /**
   * Create highlighted snippet from content
   */
  static createHighlightedSnippet(content, terms, maxLength = 200, caseSensitive = false) {
    if (!content || !terms || terms.length === 0) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    // Find the first occurrence of any term
    let firstMatchIndex = -1;
    let matchedTerm = '';
    
    for (const term of terms) {
      const searchContent = caseSensitive ? content : content.toLowerCase();
      const searchTerm = caseSensitive ? term : term.toLowerCase();
      const index = searchContent.indexOf(searchTerm);
      
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index;
        matchedTerm = term;
      }
    }
    
    if (firstMatchIndex === -1) {
      // No matches found, return beginning of content
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    // Create snippet centered around the first match
    const start = Math.max(0, firstMatchIndex - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    
    let snippet = content.substring(start, end);
    
    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    // Highlight all terms in the snippet
    return this.highlightTermsInText(snippet, terms, caseSensitive);
  }

  /**
   * Apply sorting to search results
   */
  static applySorting(results, sortBy = 'relevance', sortOrder = 'desc') {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = (a._searchScore || 0) - (b._searchScore || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'usage':
          const aUsage = (a.usageStats?.quizGenerated || 0) + 
                        (a.usageStats?.flashcardsGenerated || 0) + 
                        (a.usageStats?.mentorQuestions || 0);
          const bUsage = (b.usageStats?.quizGenerated || 0) + 
                        (b.usageStats?.flashcardsGenerated || 0) + 
                        (b.usageStats?.mentorQuestions || 0);
          comparison = aUsage - bUsage;
          break;
        default:
          comparison = (a._searchScore || 0) - (b._searchScore || 0);
      }
      
      return comparison * multiplier;
    });
  }
  
  /**
   * Lấy context liên quan cho RAG generation
   */
  static async getRelevantContext(userId, query, options = {}) {
    const {
      maxChunks = 5,
      maxContextLength = 3000,
      includePublic = false
    } = options;
    
    try {
      // Tìm documents liên quan
      const searchResults = await this.searchDocuments(userId, query, {
        limit: 10,
        includePublic
      });
      
      const documents = searchResults.items || [];
      
      if (documents.length === 0) {
        console.log('[RAG] ⚠️ Không tìm thấy documents liên quan');
        return {
          context: '',
          sources: [],
          totalChunks: 0
        };
      }
      
      // Lấy full documents để search chunks
      const fullDocuments = await Document.find({
        _id: { $in: documents.map(d => d._id) }
      });
      
      // Tìm chunks liên quan từ mỗi document
      let allRelevantChunks = [];
      
      for (const doc of fullDocuments) {
        const relevantChunks = doc.searchRelevantChunks(query, 3);
        
        relevantChunks.forEach(chunk => {
          allRelevantChunks.push({
            ...chunk,
            documentTitle: doc.title,
            documentId: doc._id,
            fileType: doc.fileType
          });
        });
      }
      
      // Sắp xếp theo relevance score và giới hạn
      allRelevantChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
      allRelevantChunks = allRelevantChunks.slice(0, maxChunks);
      
      // Tạo context string
      let context = '';
      let currentLength = 0;
      const sources = [];
      
      for (const chunk of allRelevantChunks) {
        const chunkText = `[Từ: ${chunk.documentTitle}]\n${chunk.content}\n\n`;
        
        if (currentLength + chunkText.length > maxContextLength) {
          break;
        }
        
        context += chunkText;
        currentLength += chunkText.length;
        
        // Track sources
        if (!sources.find(s => s.documentId.equals(chunk.documentId))) {
          sources.push({
            documentId: chunk.documentId,
            title: chunk.documentTitle,
            fileType: chunk.fileType
          });
        }
      }
      
      console.log(`[RAG] 📚 Tạo context từ ${allRelevantChunks.length} chunks, ${sources.length} documents`);
      
      return {
        context: context.trim(),
        sources,
        totalChunks: allRelevantChunks.length,
        relevantChunks: allRelevantChunks
      };
      
    } catch (error) {
      console.error('[RAG] ❌ Lỗi lấy context:', error);
      throw error;
    }
  }
  
  /**
   * Cập nhật thống kê sử dụng cho documents
   */
  static async recordDocumentUsage(documentIds, usageType) {
    try {
      await Document.updateMany(
        { _id: { $in: documentIds } },
        { 
          $inc: { [`usageStats.${usageType}`]: 1 },
          $set: { 'usageStats.lastUsed': new Date() }
        }
      );
      
      console.log(`[RAG] 📊 Cập nhật usage stats cho ${documentIds.length} documents`);
    } catch (error) {
      console.error('[RAG] ❌ Lỗi cập nhật usage stats:', error);
    }
  }
  
  /**
   * Lấy danh sách documents của user với pagination
   * Implements Requirement 5.4: Pagination support
   */
  static async getUserDocuments(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = -1,
      fileType = null,
      search = null
    } = options;
    
    try {
      const filter = { userId };
      
      if (fileType) {
        filter.fileType = fileType;
      }
      
      if (search) {
        filter.$text = { $search: search };
      }
      
      // Use PaginationManager for efficient pagination
      const result = await this.paginationManager.paginateMongoQuery(Document, filter, {
        page,
        pageSize: limit,
        sort: { [sortBy]: sortOrder },
        select: 'title fileType tags metadata usageStats createdAt'
      });
      
      return result;
    } catch (error) {
      console.error('[RAG] ❌ Lỗi lấy user documents:', error);
      throw error;
    }
  }
}

module.exports = RAGService;