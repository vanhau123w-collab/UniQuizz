// server/models/Document.js - RAG Document Store
const mongoose = require('mongoose');
const QueryNormalizer = require('../utils/queryNormalizer');

// Schema cho document chunks (phần nhỏ của tài liệu)
const DocumentChunkSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  // Enhanced search fields
  searchableContent: {
    type: String,
    required: true
  },
  searchTerms: [{
    type: String
  }], // Extracted keywords and terms
  chunkIndex: {
    type: Number,
    required: true
  },
  metadata: {
    startPage: Number,
    endPage: Number,
    section: String,
    wordCount: Number,
    termFrequency: {
      type: Map,
      of: Number,
      default: new Map()
    }, // Term frequency for ranking
    contentHash: String // For change detection
  }
}, { _id: false });

// Schema chính cho document
const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'pptx', 'txt', 'url', 'youtube'],
    required: true
  },
  sourceUrl: String, // Nếu là từ URL hoặc YouTube
  
  // Nội dung gốc
  fullContent: {
    type: String,
    required: true
  },
  
  // Enhanced search fields
  searchableContent: {
    type: String,
    required: true
  },
  searchTerms: [{
    type: String
  }], // Extracted keywords and terms
  
  // Chia nhỏ thành chunks để RAG
  chunks: [DocumentChunkSchema],
  
  // Metadata
  metadata: {
    totalWords: Number,
    totalChunks: Number,
    language: {
      type: String,
      default: 'vi'
    },
    extractedAt: {
      type: Date,
      default: Date.now
    },
    lastIndexed: Date, // For search optimization
    termFrequency: {
      type: Map,
      of: Number,
      default: new Map()
    }, // Term frequency for ranking
    contentHash: String // For change detection
  },
  
  // Thống kê sử dụng
  usageStats: {
    quizGenerated: {
      type: Number,
      default: 0
    },
    flashcardsGenerated: {
      type: Number,
      default: 0
    },
    mentorQuestions: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  
  // Tags để phân loại
  tags: [String],
  
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes để tìm kiếm nhanh
DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ fileType: 1 });

// Pre-save middleware to automatically update search indexes
DocumentSchema.pre('save', function(next) {
  // Only update search indexes if content has changed or if it's a new document
  if (this.isNew || this.isModified('fullContent') || this.isModified('chunks')) {
    try {
      // Update document-level searchable content
      this.searchableContent = QueryNormalizer.normalizeForSearch(this.fullContent);
      this.searchTerms = QueryNormalizer.extractSearchTerms(this.fullContent);
      
      // Update metadata
      this.metadata.lastIndexed = new Date();
      this.metadata.contentHash = QueryNormalizer.generateContentHash(this.fullContent);
      this.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(this.fullContent);
      
      // Update chunk-level searchable content
      this.chunks.forEach(chunk => {
        if (!chunk.searchableContent || this.isModified('chunks')) {
          chunk.searchableContent = QueryNormalizer.normalizeForSearch(chunk.content);
          chunk.searchTerms = QueryNormalizer.extractSearchTerms(chunk.content);
          chunk.metadata.contentHash = QueryNormalizer.generateContentHash(chunk.content);
          chunk.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(chunk.content);
        }
      });
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Method để tìm kiếm chunks liên quan với enhanced search
DocumentSchema.methods.searchRelevantChunks = function(query, limit = 5) {
  // Normalize query for better matching
  const normalizedQuery = QueryNormalizer.normalizeForSearch(query);
  const searchTerms = QueryNormalizer.extractSearchTerms(normalizedQuery);
  
  const scoredChunks = this.chunks.map(chunk => {
    const content = chunk.searchableContent || QueryNormalizer.normalizeForSearch(chunk.content);
    let score = 0;
    
    // Enhanced scoring algorithm
    searchTerms.forEach(term => {
      // Exact matches get higher score
      const exactMatches = (content.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += exactMatches * 2;
      
      // Partial matches get lower score
      const partialMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += partialMatches;
      
      // Use term frequency if available
      if (chunk.metadata && chunk.metadata.termFrequency) {
        const termFreq = chunk.metadata.termFrequency.get(term) || 0;
        score += termFreq * 0.5;
      }
    });
    
    return {
      ...chunk.toObject(),
      relevanceScore: score
    };
  });
  
  // Sắp xếp theo điểm và trả về top chunks
  return scoredChunks
    .filter(chunk => chunk.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
};

// Method để cập nhật thống kê sử dụng
DocumentSchema.methods.recordUsage = function(type) {
  this.usageStats[type] = (this.usageStats[type] || 0) + 1;
  this.usageStats.lastUsed = new Date();
  return this.save();
};

// Method để cập nhật search indexes
DocumentSchema.methods.updateSearchIndexes = function() {
  // Update document-level searchable content
  this.searchableContent = QueryNormalizer.normalizeForSearch(this.fullContent);
  this.searchTerms = QueryNormalizer.extractSearchTerms(this.fullContent);
  
  // Update metadata
  this.metadata.lastIndexed = new Date();
  this.metadata.contentHash = QueryNormalizer.generateContentHash(this.fullContent);
  this.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(this.fullContent);
  
  // Update chunk-level searchable content
  this.chunks.forEach(chunk => {
    chunk.searchableContent = QueryNormalizer.normalizeForSearch(chunk.content);
    chunk.searchTerms = QueryNormalizer.extractSearchTerms(chunk.content);
    chunk.metadata.contentHash = QueryNormalizer.generateContentHash(chunk.content);
    chunk.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(chunk.content);
  });
  
  return this.save();
};

// Method để kiểm tra xem content có thay đổi không
DocumentSchema.methods.hasContentChanged = function() {
  const currentHash = QueryNormalizer.generateContentHash(this.fullContent);
  return currentHash !== this.metadata.contentHash;
};

// Static method để tìm kiếm với enhanced algorithms and advanced filtering
DocumentSchema.statics.enhancedSearch = async function(userId, query, options = {}) {
  const {
    limit = 10,
    fileTypes = [],
    tags = [],
    dateRange = null,
    includePublic = false,
    caseSensitive = false,
    useSearchEngine = true,
    searchStrategies = ['exact', 'fuzzy'],
    minScore = 0.1,
    customFilters = {}
  } = options;
  
  // Use FilterManager for advanced filtering (Requirements 4.3, 4.4, 4.5)
  const FilterManager = require('../utils/filterManager');
  const filterManager = new FilterManager();
  
  // Build search filter using FilterManager
  const searchFilter = filterManager.buildFilterQuery(userId, {
    fileTypes,
    dateRange,
    tags,
    includePublic,
    customFilters
  });
  
  // Get candidate documents
  const candidateDocuments = await this.find(searchFilter)
    .select('title fileType tags metadata createdAt usageStats searchableContent searchTerms fullContent chunks')
    .lean();
  
  if (!useSearchEngine || candidateDocuments.length === 0) {
    // Fallback to original MongoDB text search with FilterManager
    const searchQuery = caseSensitive ? query : QueryNormalizer.normalizeForSearch(query);
    
    return this.find({
      ...searchFilter,
      $or: [
        { $text: { $search: query } },
        { $text: { $search: searchQuery } },
        { searchableContent: { $regex: searchQuery, $options: 'i' } },
        { searchTerms: { $in: QueryNormalizer.extractSearchTerms(searchQuery) } }
      ]
    })
    .select('title fileType tags metadata.totalWords createdAt usageStats searchableContent')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit);
  }
  
  // Use enhanced SearchEngine
  const { SearchEngine } = require('../utils/searchEngine');
  const searchEngine = new SearchEngine();
  
  try {
    const searchResults = await searchEngine.search(query, candidateDocuments, {
      strategies: searchStrategies,
      caseSensitive,
      maxResults: limit,
      minScore
    });
    
    // Convert search results back to document format
    return searchResults.map(result => ({
      ...result.document,
      _searchScore: result.finalScore,
      _matchDetails: result.matchDetails,
      _strategy: result.strategy
    }));
  } catch (error) {
    console.error('SearchEngine error, falling back to MongoDB search:', error);
    
    // Fallback to original search with FilterManager
    const searchQuery = caseSensitive ? query : QueryNormalizer.normalizeForSearch(query);
    
    return this.find({
      ...searchFilter,
      $or: [
        { $text: { $search: query } },
        { $text: { $search: searchQuery } },
        { searchableContent: { $regex: searchQuery, $options: 'i' } },
        { searchTerms: { $in: QueryNormalizer.extractSearchTerms(searchQuery) } }
      ]
    })
    .select('title fileType tags metadata.totalWords createdAt usageStats searchableContent')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit);
  }
};

module.exports = mongoose.model('Document', DocumentSchema);