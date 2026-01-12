// server/middleware/searchValidation.js - Input Validation Middleware for Search Operations
// Implements Task 10: Add input validation for search queries and filters

const { InputValidator, ValidationError } = require('../utils/errorHandler');

/**
 * Middleware to validate search query parameters
 */
const validateSearchQuery = (req, res, next) => {
  try {
    const { q: query } = req.query;
    
    // Validate and sanitize query
    req.validatedQuery = InputValidator.validateSearchQuery(query);
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    // Validate pagination
    const validated = InputValidator.validatePagination(page, limit);
    req.validatedPagination = validated;
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate search options
 */
const validateSearchOptions = (req, res, next) => {
  try {
    const { 
      fileTypes, 
      tags, 
      dateRange,
      caseSensitive,
      includePublic,
      highlightTerms,
      searchStrategies
    } = req.query;

    // Parse and validate options
    const options = {};

    if (fileTypes) {
      options.fileTypes = fileTypes.split(',').map(type => type.trim());
    }

    if (tags) {
      options.tags = tags.split(',').map(tag => tag.trim());
    }

    if (dateRange) {
      try {
        options.dateRange = JSON.parse(dateRange);
      } catch (parseError) {
        throw new ValidationError('Invalid dateRange format. Expected JSON object.', 'dateRange', dateRange);
      }
    }

    if (caseSensitive !== undefined) {
      options.caseSensitive = caseSensitive === 'true';
    }

    if (includePublic !== undefined) {
      options.includePublic = includePublic === 'true';
    }

    if (highlightTerms !== undefined) {
      options.highlightTerms = highlightTerms === 'true';
    }

    if (searchStrategies) {
      options.searchStrategies = searchStrategies.split(',').map(strategy => strategy.trim());
    }

    // Validate the options
    req.validatedOptions = InputValidator.validateSearchOptions(options);
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate advanced search request body
 */
const validateAdvancedSearch = (req, res, next) => {
  try {
    const { 
      query,
      limit,
      fileTypes,
      tags,
      dateRange,
      includePublic,
      caseSensitive,
      sortBy,
      sortOrder,
      customFilters
    } = req.body;

    // Validate query
    req.validatedQuery = InputValidator.validateSearchQuery(query);

    // Validate pagination
    const pagination = InputValidator.validatePagination(1, limit);
    req.validatedLimit = pagination.limit;

    // Validate options
    const options = {
      fileTypes: fileTypes || [],
      tags: tags || [],
      dateRange: dateRange || null,
      includePublic: includePublic || false,
      caseSensitive: caseSensitive || false,
      customFilters: customFilters || {}
    };

    req.validatedOptions = InputValidator.validateSearchOptions(options);

    // Validate sort parameters
    if (sortBy) {
      const validSortFields = ['relevance', 'date', 'title', 'usage'];
      if (!validSortFields.includes(sortBy)) {
        throw new ValidationError(
          `Invalid sortBy field. Allowed values: ${validSortFields.join(', ')}`,
          'sortBy',
          sortBy
        );
      }
      req.validatedSortBy = sortBy;
    }

    if (sortOrder) {
      const validSortOrders = ['asc', 'desc'];
      if (!validSortOrders.includes(sortOrder.toLowerCase())) {
        throw new ValidationError(
          `Invalid sortOrder. Allowed values: ${validSortOrders.join(', ')}`,
          'sortOrder',
          sortOrder
        );
      }
      req.validatedSortOrder = sortOrder.toLowerCase();
    }

    // Validate date range if provided
    if (dateRange) {
      req.validatedDateRange = InputValidator.validateDateRange(dateRange);
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate user ID from token
 */
const validateUserId = (req, res, next) => {
  try {
    if (!req.userId) {
      throw new ValidationError('User ID not found in request', 'userId', null);
    }

    req.validatedUserId = InputValidator.validateUserId(req.userId);
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate suggestion request parameters
 */
const validateSuggestionRequest = (req, res, next) => {
  try {
    const { 
      q: partialQuery, 
      limit,
      includeContent,
      includeHistory,
      includeRecent,
      timeWindow
    } = req.query;

    // Validate partial query
    if (!partialQuery) {
      throw new ValidationError('Partial query parameter "q" is required', 'q', partialQuery);
    }

    if (typeof partialQuery !== 'string') {
      throw new ValidationError('Partial query must be a string', 'q', typeof partialQuery);
    }

    if (partialQuery.trim().length === 0) {
      throw new ValidationError('Partial query cannot be empty', 'q', partialQuery);
    }

    if (partialQuery.length > 100) {
      throw new ValidationError('Partial query is too long (max 100 characters)', 'q', partialQuery.length);
    }

    req.validatedPartialQuery = partialQuery.trim();

    // Validate limit
    const validatedLimit = parseInt(limit) || 10;
    if (validatedLimit < 1 || validatedLimit > 20) {
      throw new ValidationError('Limit must be between 1 and 20', 'limit', limit);
    }
    req.validatedLimit = validatedLimit;

    // Validate boolean options
    req.validatedIncludeContent = includeContent !== 'false';
    req.validatedIncludeHistory = includeHistory !== 'false';
    req.validatedIncludeRecent = includeRecent !== 'false';

    // Validate time window
    const validatedTimeWindow = parseInt(timeWindow) || 30;
    if (validatedTimeWindow < 1 || validatedTimeWindow > 365) {
      throw new ValidationError('Time window must be between 1 and 365 days', 'timeWindow', timeWindow);
    }
    req.validatedTimeWindow = validatedTimeWindow;

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate feedback request
 */
const validateFeedbackRequest = (req, res, next) => {
  try {
    const { query, rating } = req.body;

    // Validate query
    req.validatedQuery = InputValidator.validateSearchQuery(query);

    // Validate rating
    if (!rating) {
      throw new ValidationError('Rating is required', 'rating', rating);
    }

    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5', 'rating', rating);
    }

    req.validatedRating = numericRating;

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate click tracking request
 */
const validateClickRequest = (req, res, next) => {
  try {
    const { query, documentId, position } = req.body;

    // Validate query
    req.validatedQuery = InputValidator.validateSearchQuery(query);

    // Validate document ID
    if (!documentId) {
      throw new ValidationError('Document ID is required', 'documentId', documentId);
    }

    if (typeof documentId !== 'string') {
      throw new ValidationError('Document ID must be a string', 'documentId', typeof documentId);
    }

    // Basic MongoDB ObjectId validation
    if (!/^[0-9a-fA-F]{24}$/.test(documentId)) {
      throw new ValidationError('Invalid document ID format', 'documentId', 'invalid_format');
    }

    req.validatedDocumentId = documentId;

    // Validate position (optional)
    if (position !== undefined) {
      const numericPosition = parseInt(position);
      if (isNaN(numericPosition) || numericPosition < 0) {
        throw new ValidationError('Position must be a non-negative number', 'position', position);
      }
      req.validatedPosition = numericPosition;
    } else {
      req.validatedPosition = 0;
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          field: error.details.field
        }
      });
    }
    next(error);
  }
};

/**
 * Rate limiting middleware for search operations
 */
const createRateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(timestamp => timestamp > windowStart);
      requests.set(userId, userRequests);
    }

    // Check rate limit
    const userRequests = requests.get(userId) || [];
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: `Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`,
          limit: maxRequests,
          window: windowMs,
          retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
        }
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

module.exports = {
  validateSearchQuery,
  validatePagination,
  validateSearchOptions,
  validateAdvancedSearch,
  validateUserId,
  validateSuggestionRequest,
  validateFeedbackRequest,
  validateClickRequest,
  createRateLimiter
};