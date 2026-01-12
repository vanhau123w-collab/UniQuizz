// server/utils/searchEngine.js - Enhanced search algorithms
const QueryNormalizer = require('./queryNormalizer');

/**
 * Base class for search strategies
 */
class SearchStrategy {
  constructor(name) {
    this.name = name;
  }
  
  /**
   * Execute search strategy
   * @param {string} query - Search query
   * @param {Array} documents - Documents to search
   * @param {Object} options - Search options
   * @returns {Array} Scored search results
   */
  search(query, documents, options = {}) {
    throw new Error('Search method must be implemented by subclass');
  }
}

/**
 * Exact matching strategy for substring and phrase matching
 * Implements Requirements 1.1, 1.2
 */
class ExactMatchStrategy extends SearchStrategy {
  constructor() {
    super('ExactMatch');
  }
  
  search(query, documents, options = {}) {
    const { caseSensitive = false, minScore = 0 } = options;
    const results = [];
    
    // Handle short queries (1-2 characters) - Requirement 1.1
    const normalizedQuery = query.length <= 2 ? 
      (caseSensitive ? query : query.toLowerCase()) :
      QueryNormalizer.normalizeForSearch(query);
    
    for (const doc of documents) {
      const score = this.calculateExactMatchScore(normalizedQuery, doc, options);
      
      if (score > minScore) {
        results.push({
          document: doc,
          score: score,
          strategy: this.name,
          matchDetails: this.getMatchDetails(normalizedQuery, doc, options)
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  calculateExactMatchScore(query, document, options = {}) {
    const { caseSensitive = false } = options;
    let totalScore = 0;
    
    // Search in document title (higher weight)
    const titleContent = caseSensitive ? document.title : 
      QueryNormalizer.normalizeForSearch(document.title);
    totalScore += this.scoreContent(query, titleContent, 3.0);
    
    // Search in searchable content
    const searchableContent = caseSensitive ? document.fullContent :
      (document.searchableContent || QueryNormalizer.normalizeForSearch(document.fullContent));
    totalScore += this.scoreContent(query, searchableContent, 1.0);
    
    // Search in individual chunks with position weighting
    if (document.chunks && document.chunks.length > 0) {
      document.chunks.forEach((chunk, index) => {
        const chunkContent = caseSensitive ? chunk.content :
          (chunk.searchableContent || QueryNormalizer.normalizeForSearch(chunk.content));
        
        // Earlier chunks get slightly higher weight
        const positionWeight = Math.max(0.5, 1.0 - (index * 0.1));
        totalScore += this.scoreContent(query, chunkContent, positionWeight);
      });
    }
    
    return Math.round(totalScore * 100) / 100;
  }
  
  scoreContent(query, content, weight = 1.0) {
    if (!query || !content) return 0;
    
    let score = 0;
    
    // Exact phrase match (highest score) - Requirement 1.2
    if (content.includes(query)) {
      const phraseMatches = (content.match(new RegExp(this.escapeRegex(query), 'g')) || []).length;
      score += phraseMatches * 20 * weight;
    }
    
    // Word boundary matches for individual terms
    const queryTerms = QueryNormalizer.extractSearchTerms(query);
    queryTerms.forEach(term => {
      // Exact word matches
      const wordMatches = (content.match(new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'g')) || []).length;
      score += wordMatches * 10 * weight;
      
      // Substring matches (lower score)
      const substringMatches = (content.match(new RegExp(this.escapeRegex(term), 'g')) || []).length;
      score += substringMatches * 5 * weight;
    });
    
    // Position bonus (matches near beginning get higher score)
    const firstIndex = content.indexOf(query);
    if (firstIndex !== -1) {
      const positionBonus = Math.max(0, 10 - (firstIndex / 100)) * weight;
      score += positionBonus;
    }
    
    // Length normalization (shorter content with matches gets bonus)
    if (score > 0) {
      const lengthBonus = Math.min(2.0, 1000 / content.length) * weight;
      score += lengthBonus;
    }
    
    return score;
  }
  
  getMatchDetails(query, document, options = {}) {
    const { caseSensitive = false } = options;
    const matches = [];
    
    // Find matches in title
    const titleContent = caseSensitive ? document.title : 
      QueryNormalizer.normalizeForSearch(document.title);
    if (titleContent.includes(query)) {
      matches.push({
        location: 'title',
        content: document.title,
        matchCount: (titleContent.match(new RegExp(this.escapeRegex(query), 'g')) || []).length
      });
    }
    
    // Find matches in chunks
    if (document.chunks) {
      document.chunks.forEach((chunk, index) => {
        const chunkContent = caseSensitive ? chunk.content :
          (chunk.searchableContent || QueryNormalizer.normalizeForSearch(chunk.content));
        
        if (chunkContent.includes(query)) {
          matches.push({
            location: 'chunk',
            chunkIndex: index,
            content: this.getMatchSnippet(chunk.content, query, 100),
            matchCount: (chunkContent.match(new RegExp(this.escapeRegex(query), 'g')) || []).length
          });
        }
      });
    }
    
    return matches;
  }
  
  getMatchSnippet(content, query, maxLength = 100) {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.substring(0, maxLength);
    
    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Fuzzy matching strategy for approximate matching
 * Implements Requirement 1.4
 */
class FuzzyMatchStrategy extends SearchStrategy {
  constructor() {
    super('FuzzyMatch');
  }
  
  search(query, documents, options = {}) {
    const { 
      maxEditDistance = 2, 
      minSimilarity = 0.6,
      minScore = 0 
    } = options;
    const results = [];
    
    const normalizedQuery = QueryNormalizer.normalizeForSearch(query);
    const queryTerms = QueryNormalizer.extractSearchTerms(normalizedQuery);
    
    for (const doc of documents) {
      const score = this.calculateFuzzyScore(queryTerms, doc, options);
      
      if (score > minScore) {
        results.push({
          document: doc,
          score: score,
          strategy: this.name,
          matchDetails: this.getFuzzyMatchDetails(queryTerms, doc, options)
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  calculateFuzzyScore(queryTerms, document, options = {}) {
    const { maxEditDistance = 2, minSimilarity = 0.5 } = options; // Lower threshold
    let totalScore = 0;
    
    // Extract all terms from document for fuzzy matching
    const documentTerms = new Set();
    
    // Add terms from title
    QueryNormalizer.extractSearchTerms(document.title).forEach(term => 
      documentTerms.add(term));
    
    // Add terms from searchable content
    if (document.searchTerms) {
      document.searchTerms.forEach(term => documentTerms.add(term));
    } else if (document.searchableContent) {
      QueryNormalizer.extractSearchTerms(document.searchableContent).forEach(term => 
        documentTerms.add(term));
    } else if (document.fullContent) {
      QueryNormalizer.extractSearchTerms(document.fullContent).forEach(term => 
        documentTerms.add(term));
    }
    
    // Add terms from chunks
    if (document.chunks) {
      document.chunks.forEach(chunk => {
        if (chunk.searchTerms) {
          chunk.searchTerms.forEach(term => documentTerms.add(term));
        } else {
          QueryNormalizer.extractSearchTerms(chunk.content).forEach(term => 
            documentTerms.add(term));
        }
      });
    }
    
    // Calculate fuzzy matches for each query term
    queryTerms.forEach(queryTerm => {
      let bestMatch = { similarity: 0, term: null };
      
      for (const docTerm of documentTerms) {
        const similarity = this.calculateSimilarity(queryTerm, docTerm);
        
        if (similarity >= minSimilarity && similarity > bestMatch.similarity) {
          bestMatch = { similarity, term: docTerm };
        }
      }
      
      if (bestMatch.similarity > 0) {
        // Score based on similarity and term frequency
        const termFreq = this.getTermFrequency(bestMatch.term, document);
        totalScore += bestMatch.similarity * 10 * Math.log(1 + termFreq);
      }
    });
    
    return Math.round(totalScore * 100) / 100;
  }
  
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const editDistance = this.calculateEditDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1.0;
    
    return 1 - (editDistance / maxLength);
  }
  
  calculateEditDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  getTermFrequency(term, document) {
    let frequency = 0;
    
    // Check document-level term frequency
    if (document.metadata && document.metadata.termFrequency) {
      const termFreq = document.metadata.termFrequency;
      if (termFreq instanceof Map) {
        frequency += termFreq.get(term) || 0;
      } else if (typeof termFreq === 'object') {
        // Handle plain object from database
        frequency += termFreq[term] || 0;
      }
    }
    
    // Check chunk-level term frequency
    if (document.chunks) {
      document.chunks.forEach(chunk => {
        if (chunk.metadata && chunk.metadata.termFrequency) {
          const chunkTermFreq = chunk.metadata.termFrequency;
          if (chunkTermFreq instanceof Map) {
            frequency += chunkTermFreq.get(term) || 0;
          } else if (typeof chunkTermFreq === 'object') {
            // Handle plain object from database
            frequency += chunkTermFreq[term] || 0;
          }
        }
      });
    }
    
    // Fallback: count occurrences manually if no frequency data
    if (frequency === 0) {
      // Count in full content
      const fullContentTerms = QueryNormalizer.extractSearchTerms(document.fullContent || '');
      frequency += fullContentTerms.filter(t => t === term).length;
      
      // Count in searchable content if different
      if (document.searchableContent && document.searchableContent !== document.fullContent) {
        const searchableTerms = QueryNormalizer.extractSearchTerms(document.searchableContent);
        frequency += searchableTerms.filter(t => t === term).length;
      }
      
      // Count in search terms array
      if (document.searchTerms) {
        frequency += document.searchTerms.filter(t => t === term).length;
      }
    }
    
    return Math.max(1, frequency); // Return at least 1 if term exists
  }
  
  getFuzzyMatchDetails(queryTerms, document, options = {}) {
    const { minSimilarity = 0.5 } = options; // Lower threshold
    const matches = [];
    
    queryTerms.forEach(queryTerm => {
      const documentTerms = new Set();
      
      // Collect all document terms
      if (document.searchTerms) {
        document.searchTerms.forEach(term => documentTerms.add(term));
      } else if (document.searchableContent) {
        QueryNormalizer.extractSearchTerms(document.searchableContent).forEach(term => 
          documentTerms.add(term));
      } else if (document.fullContent) {
        QueryNormalizer.extractSearchTerms(document.fullContent).forEach(term => 
          documentTerms.add(term));
      }
      
      // Find best fuzzy matches
      for (const docTerm of documentTerms) {
        const similarity = this.calculateSimilarity(queryTerm, docTerm);
        
        if (similarity >= minSimilarity) {
          matches.push({
            queryTerm: queryTerm,
            matchedTerm: docTerm,
            similarity: similarity,
            frequency: this.getTermFrequency(docTerm, document)
          });
        }
      }
    });
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }
}

/**
 * Result ranking and scoring system
 * Implements Requirement 1.3
 */
class ResultRanker {
  constructor() {
    this.defaultWeights = {
      exactMatch: 1.0,
      fuzzyMatch: 0.7,
      titleBoost: 2.0,
      recencyBoost: 0.3,
      usageBoost: 0.2
    };
  }
  
  /**
   * Rank and score search results from multiple strategies
   */
  rankResults(results, options = {}) {
    const { 
      weights = this.defaultWeights,
      maxResults = 50,
      diversityFactor = 0.1 
    } = options;
    
    // Apply strategy weights and additional scoring factors
    const scoredResults = results.map(result => ({
      ...result,
      finalScore: this.calculateFinalScore(result, weights)
    }));
    
    // Sort by final score
    scoredResults.sort((a, b) => b.finalScore - a.finalScore);
    
    // Apply diversity filtering to avoid too many results from same document
    const diverseResults = this.applyDiversityFilter(scoredResults, diversityFactor);
    
    return diverseResults.slice(0, maxResults);
  }
  
  calculateFinalScore(result, weights) {
    let score = result.score;
    
    // Apply strategy weight
    if (result.strategy === 'ExactMatch') {
      score *= weights.exactMatch;
    } else if (result.strategy === 'FuzzyMatch') {
      score *= weights.fuzzyMatch;
    }
    
    // Title boost if matches found in title
    if (result.matchDetails && result.matchDetails.some(m => m.location === 'title')) {
      score *= weights.titleBoost;
    }
    
    // Recency boost (newer documents get slight preference)
    if (result.document.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(result.document.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyMultiplier = Math.max(0.5, 1 - (daysSinceCreation / 365) * weights.recencyBoost);
      score *= recencyMultiplier;
    }
    
    // Usage boost (frequently used documents get preference)
    if (result.document.usageStats) {
      const totalUsage = (result.document.usageStats.quizGenerated || 0) +
                        (result.document.usageStats.flashcardsGenerated || 0) +
                        (result.document.usageStats.mentorQuestions || 0);
      const usageMultiplier = 1 + (Math.log(1 + totalUsage) * weights.usageBoost);
      score *= usageMultiplier;
    }
    
    return Math.round(score * 100) / 100;
  }
  
  applyDiversityFilter(results, diversityFactor) {
    if (diversityFactor <= 0) return results;
    
    const documentCounts = new Map();
    const filteredResults = [];
    
    for (const result of results) {
      const docId = result.document._id ? result.document._id.toString() : result.document.id;
      const currentCount = documentCounts.get(docId) || 0;
      
      // Apply diversity penalty for repeated documents
      if (currentCount > 0) {
        result.finalScore *= Math.pow(1 - diversityFactor, currentCount);
      }
      
      filteredResults.push(result);
      documentCounts.set(docId, currentCount + 1);
    }
    
    // Re-sort after diversity adjustment
    return filteredResults.sort((a, b) => b.finalScore - a.finalScore);
  }
}

/**
 * Main SearchEngine class with multiple matching strategies
 * Implements Requirements 1.1, 1.2, 1.3, 1.4
 */
class SearchEngine {
  constructor() {
    this.strategies = {
      exact: new ExactMatchStrategy(),
      fuzzy: new FuzzyMatchStrategy()
    };
    this.ranker = new ResultRanker();
  }
  
  /**
   * Execute search using multiple strategies
   */
  async search(query, documents, options = {}) {
    const {
      strategies = ['exact', 'fuzzy'],
      caseSensitive = false,
      maxResults = 20,
      minScore = 0.1,
      combineStrategies = true
    } = options;
    
    if (!query || !documents || documents.length === 0) {
      return [];
    }
    
    const allResults = [];
    
    // Execute each requested strategy
    for (const strategyName of strategies) {
      const strategy = this.strategies[strategyName];
      if (!strategy) {
        console.warn(`Unknown search strategy: ${strategyName}`);
        continue;
      }
      
      try {
        const strategyResults = strategy.search(query, documents, {
          caseSensitive,
          minScore
        });
        
        allResults.push(...strategyResults);
      } catch (error) {
        console.error(`Error in ${strategyName} strategy:`, error);
      }
    }
    
    if (combineStrategies) {
      // Combine and rank results from all strategies
      return this.ranker.rankResults(allResults, { maxResults });
    } else {
      // Return results grouped by strategy
      const groupedResults = {};
      strategies.forEach(strategyName => {
        groupedResults[strategyName] = allResults
          .filter(r => r.strategy === strategyName)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults);
      });
      return groupedResults;
    }
  }
  
  /**
   * Search with fallback to fuzzy matching when exact matching fails
   * Implements Requirement 1.4
   */
  async searchWithFallback(query, documents, options = {}) {
    const { minExactResults = 1 } = options;
    
    // Try exact matching first
    const exactResults = await this.search(query, documents, {
      ...options,
      strategies: ['exact']
    });
    
    // If exact matching produces sufficient results, return them
    if (exactResults.length >= minExactResults) {
      return exactResults;
    }
    
    // Otherwise, combine with fuzzy matching
    return await this.search(query, documents, {
      ...options,
      strategies: ['exact', 'fuzzy']
    });
  }
  
  /**
   * Get available search strategies
   */
  getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
  
  /**
   * Add custom search strategy
   */
  addStrategy(name, strategy) {
    if (!(strategy instanceof SearchStrategy)) {
      throw new Error('Strategy must extend SearchStrategy class');
    }
    this.strategies[name] = strategy;
  }
}

module.exports = {
  SearchEngine,
  SearchStrategy,
  ExactMatchStrategy,
  FuzzyMatchStrategy,
  ResultRanker
};