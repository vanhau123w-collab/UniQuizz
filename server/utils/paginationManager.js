// server/utils/paginationManager.js - Pagination Support for Large Result Sets
// Implements Requirement 5.4: Large result set pagination

class PaginationManager {
  constructor(options = {}) {
    this.defaultPageSize = options.defaultPageSize || 20;
    this.maxPageSize = options.maxPageSize || 100;
    this.minPageSize = options.minPageSize || 1;
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(page, pageSize) {
    const errors = [];

    // Validate page number
    if (page !== undefined && page !== null) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('Page number must be a positive integer starting from 1');
      }
    }

    // Validate page size
    if (pageSize !== undefined && pageSize !== null) {
      const pageSizeNum = parseInt(pageSize);
      if (isNaN(pageSizeNum) || pageSizeNum < this.minPageSize || pageSizeNum > this.maxPageSize) {
        errors.push(`Page size must be between ${this.minPageSize} and ${this.maxPageSize}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Pagination validation failed: ${errors.join('; ')}`);
    }

    return {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : this.defaultPageSize
    };
  }

  /**
   * Calculate pagination metadata
   */
  calculatePaginationMeta(totalItems, page, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      startIndex: startIndex,
      endIndex: endIndex,
      itemsOnPage: endIndex - startIndex,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    };
  }

  /**
   * Paginate array of results
   * Implements Requirement 5.4: Pagination for large result sets
   */
  paginateResults(results, page = 1, pageSize = null) {
    const validatedParams = this.validatePaginationParams(page, pageSize);
    const actualPageSize = validatedParams.pageSize;
    const actualPage = validatedParams.page;

    const totalItems = results.length;
    const paginationMeta = this.calculatePaginationMeta(totalItems, actualPage, actualPageSize);

    // Extract the items for current page
    const paginatedItems = results.slice(paginationMeta.startIndex, paginationMeta.endIndex);

    return {
      items: paginatedItems,
      pagination: paginationMeta
    };
  }

  /**
   * Create MongoDB pagination query
   * For use with database queries to avoid loading all results into memory
   */
  createMongoQuery(page = 1, pageSize = null) {
    const validatedParams = this.validatePaginationParams(page, pageSize);
    const skip = (validatedParams.page - 1) * validatedParams.pageSize;

    return {
      skip: skip,
      limit: validatedParams.pageSize,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize
    };
  }

  /**
   * Paginate MongoDB query results
   * Implements efficient database-level pagination
   */
  async paginateMongoQuery(model, filter = {}, options = {}) {
    const {
      page = 1,
      pageSize = null,
      sort = { createdAt: -1 },
      select = null,
      populate = null
    } = options;

    const validatedParams = this.validatePaginationParams(page, pageSize);
    const mongoQuery = this.createMongoQuery(validatedParams.page, validatedParams.pageSize);

    // Count total documents matching the filter
    const totalItems = await model.countDocuments(filter);

    // Build the query
    let query = model.find(filter)
      .sort(sort)
      .skip(mongoQuery.skip)
      .limit(mongoQuery.limit);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    // Execute the query
    const items = await query.exec();

    // Calculate pagination metadata
    const paginationMeta = this.calculatePaginationMeta(
      totalItems, 
      validatedParams.page, 
      validatedParams.pageSize
    );

    return {
      items: items,
      pagination: paginationMeta
    };
  }

  /**
   * Create pagination links for API responses
   */
  createPaginationLinks(baseUrl, pagination, queryParams = {}) {
    const links = {};
    const params = new URLSearchParams(queryParams);

    // First page link
    if (pagination.currentPage > 1) {
      params.set('page', '1');
      params.set('pageSize', pagination.pageSize.toString());
      links.first = `${baseUrl}?${params.toString()}`;
    }

    // Previous page link
    if (pagination.hasPreviousPage) {
      params.set('page', pagination.previousPage.toString());
      params.set('pageSize', pagination.pageSize.toString());
      links.previous = `${baseUrl}?${params.toString()}`;
    }

    // Current page link
    params.set('page', pagination.currentPage.toString());
    params.set('pageSize', pagination.pageSize.toString());
    links.self = `${baseUrl}?${params.toString()}`;

    // Next page link
    if (pagination.hasNextPage) {
      params.set('page', pagination.nextPage.toString());
      params.set('pageSize', pagination.pageSize.toString());
      links.next = `${baseUrl}?${params.toString()}`;
    }

    // Last page link
    if (pagination.currentPage < pagination.totalPages) {
      params.set('page', pagination.totalPages.toString());
      params.set('pageSize', pagination.pageSize.toString());
      links.last = `${baseUrl}?${params.toString()}`;
    }

    return links;
  }

  /**
   * Create cursor-based pagination for very large datasets
   * Alternative to offset-based pagination for better performance
   */
  createCursorPagination(results, cursorField = '_id', pageSize = null) {
    const actualPageSize = pageSize || this.defaultPageSize;
    
    if (results.length === 0) {
      return {
        items: [],
        pagination: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
          pageSize: actualPageSize
        }
      };
    }

    const items = results.slice(0, actualPageSize);
    const hasNextPage = results.length > actualPageSize;
    
    const startCursor = items.length > 0 ? items[0][cursorField] : null;
    const endCursor = items.length > 0 ? items[items.length - 1][cursorField] : null;

    return {
      items: items,
      pagination: {
        hasNextPage: hasNextPage,
        hasPreviousPage: false, // Would need additional logic to determine
        startCursor: startCursor,
        endCursor: endCursor,
        pageSize: actualPageSize
      }
    };
  }

  /**
   * Create MongoDB cursor query for cursor-based pagination
   */
  createCursorQuery(cursor, cursorField = '_id', direction = 'forward') {
    if (!cursor) {
      return {};
    }

    if (direction === 'forward') {
      return { [cursorField]: { $gt: cursor } };
    } else {
      return { [cursorField]: { $lt: cursor } };
    }
  }

  /**
   * Get pagination summary for logging and debugging
   */
  getPaginationSummary(pagination) {
    return {
      summary: `Page ${pagination.currentPage} of ${pagination.totalPages}`,
      range: `Items ${pagination.startIndex + 1}-${pagination.endIndex} of ${pagination.totalItems}`,
      pageSize: pagination.pageSize,
      hasMore: pagination.hasNextPage
    };
  }

  /**
   * Optimize pagination for search results
   * Implements smart pagination that adjusts based on result relevance
   */
  optimizeSearchPagination(results, page, pageSize, options = {}) {
    const {
      relevanceThreshold = 0.1,
      maxLowRelevanceItems = 5,
      boostHighRelevance = true
    } = options;

    // Separate high and low relevance results
    const highRelevanceResults = [];
    const lowRelevanceResults = [];

    results.forEach(result => {
      const score = result._searchScore || result.finalScore || 0;
      if (score >= relevanceThreshold) {
        highRelevanceResults.push(result);
      } else {
        lowRelevanceResults.push(result);
      }
    });

    // For first page, prioritize high relevance results
    if (page === 1 && boostHighRelevance) {
      const optimizedResults = [
        ...highRelevanceResults,
        ...lowRelevanceResults.slice(0, maxLowRelevanceItems)
      ];
      
      return this.paginateResults(optimizedResults, page, pageSize);
    }

    // For other pages, use normal pagination
    return this.paginateResults(results, page, pageSize);
  }

  /**
   * Create search result pagination with performance metrics
   */
  createSearchPagination(results, page, pageSize, searchMetrics = {}) {
    const paginatedResults = this.paginateResults(results, page, pageSize);
    
    // Add search-specific metadata
    paginatedResults.searchMetrics = {
      totalResults: results.length,
      searchTime: searchMetrics.searchTime || 0,
      cacheHit: searchMetrics.cacheHit || false,
      strategy: searchMetrics.strategy || 'unknown',
      ...searchMetrics
    };

    // Add performance warnings
    if (results.length > 1000) {
      paginatedResults.warnings = paginatedResults.warnings || [];
      paginatedResults.warnings.push('Large result set detected. Consider refining your search query.');
    }

    if (searchMetrics.searchTime > 1000) {
      paginatedResults.warnings = paginatedResults.warnings || [];
      paginatedResults.warnings.push('Slow search detected. Results may be cached for better performance.');
    }

    return paginatedResults;
  }
}

module.exports = PaginationManager;