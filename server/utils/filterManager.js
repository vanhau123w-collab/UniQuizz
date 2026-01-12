// server/utils/filterManager.js - Advanced Filtering System
// Implements Requirements 4.3, 4.4, 4.5

class FilterManager {
  constructor() {
    this.supportedFileTypes = ['pdf', 'docx', 'pptx', 'txt', 'url', 'youtube'];
    this.supportedDateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/ // MM-DD-YYYY or M-D-YYYY
    ];
  }

  /**
   * Validate file type filter
   * Implements Requirement 4.3: File type filtering with validation
   */
  validateFileTypes(fileTypes) {
    if (!Array.isArray(fileTypes)) {
      throw new Error('File types must be provided as an array');
    }

    const invalidTypes = fileTypes.filter(type => 
      !this.supportedFileTypes.includes(type.toLowerCase())
    );

    if (invalidTypes.length > 0) {
      throw new Error(`Unsupported file types: ${invalidTypes.join(', ')}. Supported types: ${this.supportedFileTypes.join(', ')}`);
    }

    return fileTypes.map(type => type.toLowerCase());
  }

  /**
   * Validate and parse date range filter
   * Implements Requirement 4.4: Date range filtering with proper date handling
   */
  validateDateRange(dateRange) {
    if (!dateRange || typeof dateRange !== 'object') {
      throw new Error('Date range must be an object with start and end properties');
    }

    const { start, end } = dateRange;

    if (!start && !end) {
      throw new Error('Date range must have at least start or end date');
    }

    const parsedRange = {};

    if (start) {
      parsedRange.start = this.parseDate(start, 'start');
    }

    if (end) {
      parsedRange.end = this.parseDate(end, 'end');
    }

    // Validate date range logic
    if (parsedRange.start && parsedRange.end && parsedRange.start > parsedRange.end) {
      throw new Error('Start date must be before or equal to end date');
    }

    return parsedRange;
  }

  /**
   * Parse date string into Date object with proper validation
   */
  parseDate(dateInput, type = 'date') {
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        throw new Error(`Invalid ${type} date: Date object is invalid`);
      }
      return dateInput;
    }

    if (typeof dateInput === 'string') {
      // Check if the date string matches supported formats
      const isValidFormat = this.supportedDateFormats.some(format => format.test(dateInput));
      
      if (!isValidFormat) {
        throw new Error(`Invalid ${type} date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, ISO format`);
      }

      const parsedDate = new Date(dateInput);
      
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid ${type} date: "${dateInput}" cannot be parsed as a valid date`);
      }

      return parsedDate;
    }

    if (typeof dateInput === 'number') {
      const parsedDate = new Date(dateInput);
      
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid ${type} date: timestamp ${dateInput} is invalid`);
      }

      return parsedDate;
    }

    throw new Error(`Invalid ${type} date type. Expected Date object, string, or number timestamp`);
  }

  /**
   * Build MongoDB filter query from multiple filter criteria
   * Implements Requirement 4.5: Support for combining multiple filters
   */
  buildFilterQuery(userId, filters = {}) {
    const {
      fileTypes = [],
      dateRange = null,
      tags = [],
      includePublic = false,
      customFilters = {}
    } = filters;

    // Base filter for user access
    const baseFilter = {
      $or: [
        { userId },
        ...(includePublic ? [{ isPublic: true }] : [])
      ]
    };

    const combinedFilters = [baseFilter];

    // Add file type filter (Requirement 4.3)
    if (fileTypes.length > 0) {
      const validatedFileTypes = this.validateFileTypes(fileTypes);
      combinedFilters.push({
        fileType: { $in: validatedFileTypes }
      });
    }

    // Add date range filter (Requirement 4.4)
    if (dateRange) {
      const validatedDateRange = this.validateDateRange(dateRange);
      const dateFilter = {};

      if (validatedDateRange.start) {
        dateFilter.$gte = validatedDateRange.start;
      }

      if (validatedDateRange.end) {
        // Set end date to end of day if only date is provided (no time)
        const endDate = new Date(validatedDateRange.end);
        if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {
          endDate.setHours(23, 59, 59, 999);
        }
        dateFilter.$lte = endDate;
      }

      combinedFilters.push({
        createdAt: dateFilter
      });
    }

    // Add tags filter
    if (tags.length > 0) {
      combinedFilters.push({
        tags: { $in: tags }
      });
    }

    // Add custom filters
    Object.entries(customFilters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        combinedFilters.push({
          [field]: value
        });
      }
    });

    // Combine all filters using AND logic (Requirement 4.5)
    if (combinedFilters.length === 1) {
      return combinedFilters[0];
    }

    return {
      $and: combinedFilters
    };
  }

  /**
   * Apply filters to a document array (for in-memory filtering)
   * Implements Requirements 4.3, 4.4, 4.5
   */
  applyFiltersToDocuments(documents, filters = {}) {
    const {
      fileTypes = [],
      dateRange = null,
      tags = [],
      customFilters = {}
    } = filters;

    let filteredDocuments = [...documents];

    // Apply file type filter (Requirement 4.3)
    if (fileTypes.length > 0) {
      const validatedFileTypes = this.validateFileTypes(fileTypes);
      filteredDocuments = filteredDocuments.filter(doc => 
        validatedFileTypes.includes(doc.fileType?.toLowerCase())
      );
    }

    // Apply date range filter (Requirement 4.4)
    if (dateRange) {
      const validatedDateRange = this.validateDateRange(dateRange);
      
      filteredDocuments = filteredDocuments.filter(doc => {
        const docDate = new Date(doc.createdAt);
        
        if (validatedDateRange.start && docDate < validatedDateRange.start) {
          return false;
        }
        
        if (validatedDateRange.end) {
          const endDate = new Date(validatedDateRange.end);
          if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {
            endDate.setHours(23, 59, 59, 999);
          }
          if (docDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Apply tags filter
    if (tags.length > 0) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.tags && doc.tags.some(tag => tags.includes(tag))
      );
    }

    // Apply custom filters (Requirement 4.5)
    Object.entries(customFilters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        filteredDocuments = filteredDocuments.filter(doc => {
          const docValue = this.getNestedProperty(doc, field);
          
          if (Array.isArray(value)) {
            return Array.isArray(docValue) 
              ? docValue.some(v => value.includes(v))
              : value.includes(docValue);
          }
          
          return docValue === value;
        });
      }
    });

    return filteredDocuments;
  }

  /**
   * Get nested property value from object using dot notation
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Validate filter combination for logical consistency
   * Implements Requirement 4.5: Multiple filter combination validation
   */
  validateFilterCombination(filters = {}) {
    const {
      fileTypes = [],
      dateRange = null,
      tags = [],
      customFilters = {}
    } = filters;

    const validationErrors = [];

    // Validate file types
    try {
      if (fileTypes.length > 0) {
        this.validateFileTypes(fileTypes);
      }
    } catch (error) {
      validationErrors.push(`File type filter error: ${error.message}`);
    }

    // Validate date range
    try {
      if (dateRange) {
        this.validateDateRange(dateRange);
      }
    } catch (error) {
      validationErrors.push(`Date range filter error: ${error.message}`);
    }

    // Validate tags
    if (tags.length > 0 && !Array.isArray(tags)) {
      validationErrors.push('Tags filter must be an array');
    }

    // Validate custom filters
    if (customFilters && typeof customFilters !== 'object') {
      validationErrors.push('Custom filters must be an object');
    }

    if (validationErrors.length > 0) {
      throw new Error(`Filter validation failed: ${validationErrors.join('; ')}`);
    }

    return true;
  }

  /**
   * Get filter summary for logging and debugging
   */
  getFilterSummary(filters = {}) {
    const {
      fileTypes = [],
      dateRange = null,
      tags = [],
      customFilters = {}
    } = filters;

    const summary = {
      totalFilters: 0,
      activeFilters: []
    };

    if (fileTypes.length > 0) {
      summary.totalFilters++;
      summary.activeFilters.push(`File types: ${fileTypes.join(', ')}`);
    }

    if (dateRange) {
      summary.totalFilters++;
      const dateStr = [];
      if (dateRange.start) dateStr.push(`from ${dateRange.start}`);
      if (dateRange.end) dateStr.push(`to ${dateRange.end}`);
      summary.activeFilters.push(`Date range: ${dateStr.join(' ')}`);
    }

    if (tags.length > 0) {
      summary.totalFilters++;
      summary.activeFilters.push(`Tags: ${tags.join(', ')}`);
    }

    const customFilterCount = Object.keys(customFilters).length;
    if (customFilterCount > 0) {
      summary.totalFilters += customFilterCount;
      summary.activeFilters.push(`Custom filters: ${customFilterCount}`);
    }

    return summary;
  }

  /**
   * Create filter preset for common filter combinations
   */
  createFilterPreset(presetName, filters) {
    // Validate the filter combination first
    this.validateFilterCombination(filters);
    
    return {
      name: presetName,
      filters,
      createdAt: new Date(),
      summary: this.getFilterSummary(filters)
    };
  }
}

module.exports = FilterManager;