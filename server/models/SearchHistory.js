// server/models/SearchHistory.js - Search History Model for RAG System
const mongoose = require('mongoose');

// Schema for individual search history entries
const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  normalizedQuery: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  resultCount: {
    type: Number,
    default: 0,
    min: 0
  },
  clickedResults: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    },
    position: Number // Position in search results when clicked
  }],
  searchFilters: {
    fileTypes: [String],
    tags: [String],
    dateRange: {
      start: Date,
      end: Date
    },
    includePublic: {
      type: Boolean,
      default: false
    }
  },
  searchMetadata: {
    searchStrategy: {
      type: String,
      enum: ['exact', 'fuzzy', 'advanced', 'hybrid'],
      default: 'exact'
    },
    responseTime: Number, // milliseconds
    userAgent: String,
    ipAddress: String
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
    default: null // null means no feedback provided
  },
  searchContext: {
    previousQuery: String,
    sessionId: String,
    searchSequence: Number // Position in search session
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, normalizedQuery: 1 });
SearchHistorySchema.index({ normalizedQuery: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, 'searchFilters.fileTypes': 1 });
SearchHistorySchema.index({ userId: 1, 'searchFilters.tags': 1 });

// Compound index for frequency-based suggestions
SearchHistorySchema.index({ 
  userId: 1, 
  normalizedQuery: 1, 
  createdAt: -1 
});

// TTL index to automatically clean old search history (optional - keep 1 year)
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for search frequency calculation
SearchHistorySchema.virtual('searchFrequency').get(function() {
  // This will be calculated dynamically in aggregation queries
  return this._searchFrequency || 1;
});

// Method to record a click on a search result
SearchHistorySchema.methods.recordClick = function(documentId, position) {
  this.clickedResults.push({
    documentId,
    position,
    clickedAt: new Date()
  });
  return this.save();
};

// Method to update satisfaction rating
SearchHistorySchema.methods.updateSatisfaction = function(rating) {
  if (rating >= 1 && rating <= 5) {
    this.satisfaction = rating;
    return this.save();
  }
  throw new Error('Satisfaction rating must be between 1 and 5');
};

// Static method to get user's recent searches
SearchHistorySchema.statics.getRecentSearches = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('query normalizedQuery createdAt resultCount satisfaction')
    .lean();
};

// Static method to get popular search terms for suggestions
SearchHistorySchema.statics.getPopularTerms = function(userId, limit = 10, timeWindow = null) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  // Add time window filter if provided
  if (timeWindow) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
    matchStage.createdAt = { $gte: cutoffDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$normalizedQuery',
        originalQuery: { $first: '$query' },
        frequency: { $sum: 1 },
        lastSearched: { $max: '$createdAt' },
        avgResultCount: { $avg: '$resultCount' },
        avgSatisfaction: { $avg: '$satisfaction' }
      }
    },
    {
      $match: {
        frequency: { $gte: 1 }, // At least searched once
        avgResultCount: { $gt: 0 } // Had results
      }
    },
    {
      $sort: {
        frequency: -1,
        lastSearched: -1
      }
    },
    { $limit: limit },
    {
      $project: {
        term: '$originalQuery',
        normalizedTerm: '$_id',
        frequency: 1,
        lastSearched: 1,
        avgResultCount: 1,
        avgSatisfaction: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to get search suggestions based on partial input
SearchHistorySchema.statics.getSuggestions = function(userId, partialQuery, limit = 10) {
  const QueryNormalizer = require('../utils/queryNormalizer');
  const normalizedPartial = QueryNormalizer.normalizeForSearch(partialQuery);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        normalizedQuery: { 
          $regex: `^${normalizedPartial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 
          $options: 'i' 
        },
        resultCount: { $gt: 0 } // Only suggest queries that had results
      }
    },
    {
      $group: {
        _id: '$normalizedQuery',
        originalQuery: { $first: '$query' },
        frequency: { $sum: 1 },
        lastSearched: { $max: '$createdAt' },
        avgResultCount: { $avg: '$resultCount' }
      }
    },
    {
      $sort: {
        frequency: -1,
        lastSearched: -1
      }
    },
    { $limit: limit },
    {
      $project: {
        suggestion: '$originalQuery',
        frequency: 1,
        lastSearched: 1,
        avgResultCount: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to clean up old or duplicate entries
SearchHistorySchema.statics.cleanup = function(userId, keepDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  
  return this.deleteMany({
    userId,
    createdAt: { $lt: cutoffDate }
  });
};

// Static method to get search analytics
SearchHistorySchema.statics.getSearchAnalytics = function(userId, timeWindow = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        uniqueQueries: { $addToSet: '$normalizedQuery' },
        avgResultCount: { $avg: '$resultCount' },
        avgSatisfaction: { $avg: '$satisfaction' },
        totalClicks: { $sum: { $size: '$clickedResults' } }
      }
    },
    {
      $project: {
        totalSearches: 1,
        uniqueQueryCount: { $size: '$uniqueQueries' },
        avgResultCount: 1,
        avgSatisfaction: 1,
        totalClicks: 1,
        clickThroughRate: {
          $cond: {
            if: { $gt: ['$totalSearches', 0] },
            then: { $divide: ['$totalClicks', '$totalSearches'] },
            else: 0
          }
        },
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);