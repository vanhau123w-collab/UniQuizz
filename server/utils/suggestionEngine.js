// server/utils/suggestionEngine.js - Search Suggestion Engine for RAG System
const SearchHistory = require('../models/SearchHistory');
const Document = require('../models/Document');
const QueryNormalizer = require('./queryNormalizer');

/**
 * SuggestionEngine - Provides real-time search suggestions and autocomplete
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
class SuggestionEngine {
  constructor(options = {}) {
    this.maxSuggestions = options.maxSuggestions || 10;
    this.minQueryLength = options.minQueryLength || 1;
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
    this.suggestionCache = new Map();
  }

  /**
   * Get real-time search suggestions based on partial input
   * Implements Requirements 3.1, 3.2, 3.5
   */
  async getSuggestions(userId, partialQuery, options = {}) {
    const {
      maxSuggestions = this.maxSuggestions,
      includeContentSuggestions = true,
      includeHistorySuggestions = true,
      includeRecentSearches = true,
      timeWindow = 30 // days
    } = options;

    // Validate input
    if (!partialQuery || partialQuery.trim().length < this.minQueryLength) {
      return this.getRecentSearches(userId, maxSuggestions);
    }

    const normalizedQuery = QueryNormalizer.normalizeForSearch(partialQuery.trim());
    const cacheKey = `${userId}:${normalizedQuery}:${maxSuggestions}`;

    // Check cache first
    if (this.suggestionCache.has(cacheKey)) {
      const cached = this.suggestionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.suggestions;
      }
      this.suggestionCache.delete(cacheKey);
    }

    try {
      const suggestions = [];

      // 1. Get content-based suggestions from document terms (Requirement 3.1)
      if (includeContentSuggestions) {
        const contentSuggestions = await this.getContentBasedSuggestions(
          userId, 
          normalizedQuery, 
          Math.ceil(maxSuggestions * 0.6)
        );
        suggestions.push(...contentSuggestions);
      }

      // 2. Get history-based suggestions (Requirement 3.2)
      if (includeHistorySuggestions) {
        const historySuggestions = await this.getHistoryBasedSuggestions(
          userId, 
          normalizedQuery, 
          Math.ceil(maxSuggestions * 0.4),
          timeWindow
        );
        suggestions.push(...historySuggestions);
      }

      // 3. Merge and rank suggestions
      const rankedSuggestions = this.rankSuggestions(suggestions, normalizedQuery);

      // 4. Limit to max suggestions (Requirement 3.5)
      const finalSuggestions = rankedSuggestions.slice(0, maxSuggestions);

      // 5. Fallback to recent searches if no suggestions (Requirement 3.4)
      if (finalSuggestions.length === 0 && includeRecentSearches) {
        const recentSearches = await this.getRecentSearches(userId, maxSuggestions);
        finalSuggestions.push(...recentSearches);
      }

      // Cache the results
      this.suggestionCache.set(cacheKey, {
        suggestions: finalSuggestions,
        timestamp: Date.now()
      });

      return finalSuggestions;
    } catch (error) {
      console.error('[SuggestionEngine] Error getting suggestions:', error);
      
      // Fallback to recent searches on error (Requirement 3.4)
      if (includeRecentSearches) {
        return this.getRecentSearches(userId, maxSuggestions);
      }
      
      return [];
    }
  }

  /**
   * Get content-based suggestions from document search terms
   * Implements Requirement 3.1 - suggestions based on document content
   */
  async getContentBasedSuggestions(userId, partialQuery, limit = 6) {
    try {
      // Search in user's documents for matching terms
      const documents = await Document.find({
        userId,
        $or: [
          { searchTerms: { $regex: `^${partialQuery}`, $options: 'i' } },
          { searchableContent: { $regex: partialQuery, $options: 'i' } }
        ]
      })
      .select('searchTerms title')
      .limit(50) // Get more documents to extract terms from
      .lean();

      const termFrequency = new Map();
      const suggestions = [];

      // Extract matching terms from documents
      documents.forEach(doc => {
        // Check search terms
        if (doc.searchTerms) {
          doc.searchTerms.forEach(term => {
            const normalizedTerm = QueryNormalizer.normalizeForSearch(term);
            if (normalizedTerm.startsWith(partialQuery) && normalizedTerm.length > partialQuery.length) {
              const count = termFrequency.get(term) || 0;
              termFrequency.set(term, count + 1);
            }
          });
        }

        // Extract terms from title
        if (doc.title) {
          const titleTerms = QueryNormalizer.extractSearchTerms(doc.title);
          titleTerms.forEach(term => {
            const normalizedTerm = QueryNormalizer.normalizeForSearch(term);
            if (normalizedTerm.startsWith(partialQuery) && normalizedTerm.length > partialQuery.length) {
              const count = termFrequency.get(term) || 0;
              termFrequency.set(term, count + 0.5); // Title terms get lower weight
            }
          });
        }
      });

      // Convert to suggestions array and sort by frequency
      for (const [term, frequency] of termFrequency.entries()) {
        suggestions.push({
          text: term,
          type: 'content',
          frequency,
          source: 'document_terms',
          relevanceScore: this.calculateContentRelevance(term, partialQuery, frequency)
        });
      }

      // Sort by relevance score and return top suggestions
      return suggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    } catch (error) {
      console.error('[SuggestionEngine] Error getting content suggestions:', error);
      return [];
    }
  }

  /**
   * Get history-based suggestions from user's search history
   * Implements Requirement 3.2 - frequency-based suggestion ranking
   */
  async getHistoryBasedSuggestions(userId, partialQuery, limit = 4, timeWindow = 30) {
    try {
      const historySuggestions = await SearchHistory.getSuggestions(userId, partialQuery, limit * 2);
      
      return historySuggestions.map(suggestion => ({
        text: suggestion.suggestion,
        type: 'history',
        frequency: suggestion.frequency,
        source: 'search_history',
        lastSearched: suggestion.lastSearched,
        avgResultCount: suggestion.avgResultCount,
        relevanceScore: this.calculateHistoryRelevance(
          suggestion.suggestion, 
          partialQuery, 
          suggestion.frequency,
          suggestion.lastSearched,
          suggestion.avgResultCount
        )
      })).slice(0, limit);

    } catch (error) {
      console.error('[SuggestionEngine] Error getting history suggestions:', error);
      return [];
    }
  }

  /**
   * Get recent searches as fallback when no suggestions available
   * Implements Requirement 3.4 - recent search fallback
   */
  async getRecentSearches(userId, limit = 10) {
    try {
      const recentSearches = await SearchHistory.getRecentSearches(userId, limit);
      
      return recentSearches.map(search => ({
        text: search.query,
        type: 'recent',
        frequency: 1,
        source: 'recent_searches',
        searchedAt: search.createdAt,
        resultCount: search.resultCount,
        relevanceScore: this.calculateRecentRelevance(search.createdAt, search.resultCount)
      }));

    } catch (error) {
      console.error('[SuggestionEngine] Error getting recent searches:', error);
      return [];
    }
  }

  /**
   * Rank and merge suggestions from different sources
   * Implements Requirements 3.2, 3.5 - frequency ordering and limit
   */
  rankSuggestions(suggestions, partialQuery) {
    // Remove duplicates while preserving the best source for each term
    const uniqueSuggestions = new Map();
    
    suggestions.forEach(suggestion => {
      const key = QueryNormalizer.normalizeForSearch(suggestion.text);
      const existing = uniqueSuggestions.get(key);
      
      if (!existing || suggestion.relevanceScore > existing.relevanceScore) {
        uniqueSuggestions.set(key, suggestion);
      }
    });

    // Convert back to array and sort by relevance score
    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => {
        // Primary sort: relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Secondary sort: frequency
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        
        // Tertiary sort: prefer content suggestions over history
        const typeOrder = { content: 3, history: 2, recent: 1 };
        return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
      });
  }

  /**
   * Calculate relevance score for content-based suggestions
   */
  calculateContentRelevance(term, partialQuery, frequency) {
    const normalizedTerm = QueryNormalizer.normalizeForSearch(term);
    const normalizedPartial = QueryNormalizer.normalizeForSearch(partialQuery);
    
    let score = 0;
    
    // Exact prefix match gets highest score
    if (normalizedTerm.startsWith(normalizedPartial)) {
      score += 10;
      
      // Shorter completions get higher scores
      const completionLength = normalizedTerm.length - normalizedPartial.length;
      score += Math.max(0, 5 - completionLength * 0.1);
    }
    
    // Frequency contributes to score
    score += Math.log(frequency + 1) * 2;
    
    // Word boundary matches get bonus
    if (normalizedTerm.includes(' ' + normalizedPartial) || normalizedTerm.startsWith(normalizedPartial + ' ')) {
      score += 3;
    }
    
    return score;
  }

  /**
   * Calculate relevance score for history-based suggestions
   */
  calculateHistoryRelevance(term, partialQuery, frequency, lastSearched, avgResultCount) {
    const normalizedTerm = QueryNormalizer.normalizeForSearch(term);
    const normalizedPartial = QueryNormalizer.normalizeForSearch(partialQuery);
    
    let score = 0;
    
    // Exact prefix match
    if (normalizedTerm.startsWith(normalizedPartial)) {
      score += 8;
    } else if (normalizedTerm.includes(normalizedPartial)) {
      score += 4;
    }
    
    // Frequency score (logarithmic to prevent dominance)
    score += Math.log(frequency + 1) * 3;
    
    // Recency score (more recent searches get higher scores)
    const daysSinceLastSearch = (Date.now() - new Date(lastSearched).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 5 - daysSinceLastSearch * 0.1);
    
    // Result quality score (searches that returned results get bonus)
    if (avgResultCount > 0) {
      score += Math.min(3, Math.log(avgResultCount + 1));
    }
    
    return score;
  }

  /**
   * Calculate relevance score for recent searches
   */
  calculateRecentRelevance(searchedAt, resultCount) {
    let score = 0;
    
    // Recency score
    const hoursAgo = (Date.now() - new Date(searchedAt).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 5 - hoursAgo * 0.1);
    
    // Result quality
    if (resultCount > 0) {
      score += Math.min(2, Math.log(resultCount + 1));
    }
    
    return score;
  }

  /**
   * Record a search query for future suggestions
   */
  async recordSearch(userId, query, searchResults, searchFilters = {}, searchMetadata = {}) {
    try {
      const normalizedQuery = QueryNormalizer.normalizeForSearch(query);
      
      const searchHistory = new SearchHistory({
        userId,
        query: query.trim(),
        normalizedQuery,
        resultCount: searchResults.length,
        searchFilters,
        searchMetadata: {
          searchStrategy: searchMetadata.strategy || 'exact',
          responseTime: searchMetadata.responseTime,
          userAgent: searchMetadata.userAgent,
          ipAddress: searchMetadata.ipAddress
        }
      });

      await searchHistory.save();
      
      // Clear related cache entries
      this.clearCacheForUser(userId);
      
      return searchHistory;
    } catch (error) {
      console.error('[SuggestionEngine] Error recording search:', error);
      throw error;
    }
  }

  /**
   * Record a click on a search result for improving suggestions
   */
  async recordClick(userId, query, documentId, position) {
    try {
      const normalizedQuery = QueryNormalizer.normalizeForSearch(query);
      
      // Find the most recent search history entry for this query
      const searchHistory = await SearchHistory.findOne({
        userId,
        normalizedQuery,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
      }).sort({ createdAt: -1 });

      if (searchHistory) {
        await searchHistory.recordClick(documentId, position);
      }
    } catch (error) {
      console.error('[SuggestionEngine] Error recording click:', error);
    }
  }

  /**
   * Update satisfaction rating for a search
   */
  async updateSatisfaction(userId, query, rating) {
    try {
      const normalizedQuery = QueryNormalizer.normalizeForSearch(query);
      
      const searchHistory = await SearchHistory.findOne({
        userId,
        normalizedQuery,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      }).sort({ createdAt: -1 });

      if (searchHistory) {
        await searchHistory.updateSatisfaction(rating);
      }
    } catch (error) {
      console.error('[SuggestionEngine] Error updating satisfaction:', error);
    }
  }

  /**
   * Get search analytics for a user
   */
  async getSearchAnalytics(userId, timeWindow = 30) {
    try {
      const analytics = await SearchHistory.getSearchAnalytics(userId, timeWindow);
      return analytics[0] || {
        totalSearches: 0,
        uniqueQueryCount: 0,
        avgResultCount: 0,
        avgSatisfaction: null,
        totalClicks: 0,
        clickThroughRate: 0
      };
    } catch (error) {
      console.error('[SuggestionEngine] Error getting analytics:', error);
      return null;
    }
  }

  /**
   * Clear suggestion cache for a user
   */
  clearCacheForUser(userId) {
    const keysToDelete = [];
    for (const key of this.suggestionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.suggestionCache.delete(key));
  }

  /**
   * Clear all suggestion cache
   */
  clearCache() {
    this.suggestionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.suggestionCache.size,
      maxSize: 1000, // Arbitrary limit
      timeout: this.cacheTimeout
    };
  }
}

module.exports = SuggestionEngine;