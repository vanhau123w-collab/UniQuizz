// server/utils/queryNormalizer.js - Query normalization utilities
const crypto = require('crypto');

class QueryNormalizer {
  
  /**
   * Normalize text for case-insensitive matching (Requirement 2.1)
   * Converts text to lowercase while preserving original structure
   */
  static normalizeCase(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase();
  }
  
  /**
   * Normalize diacritics and special characters (Requirement 2.2)
   * Removes accents and converts special characters to base forms
   */
  static normalizeDiacritics(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Vietnamese diacritic mapping
    const diacriticMap = {
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd'
    };
    
    // Apply diacritic normalization
    let normalized = text.toLowerCase();
    for (const [accented, base] of Object.entries(diacriticMap)) {
      normalized = normalized.replace(new RegExp(accented, 'g'), base);
    }
    
    // Use built-in normalization for other languages
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return normalized;
  }
  
  /**
   * Normalize whitespace and punctuation (Requirement 2.3)
   * Standardizes spacing and removes unnecessary punctuation
   */
  static normalizeWhitespace(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s\d]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Clean up multiple spaces again
      .trim();
  }
  
  /**
   * Preserve numeric sequences during normalization (Requirement 2.5)
   * Ensures numbers and alphanumeric codes remain intact
   */
  static preserveNumericSequences(text) {
    if (!text || typeof text !== 'string') return { text: '', preservedSequences: [] };
    
    // Find and preserve numeric sequences
    const numericPattern = /\b\d+(?:\.\d+)?\b|\b[a-zA-Z]+\d+\b|\b\d+[a-zA-Z]+\b/g;
    const preservedSequences = [];
    let preservedText = text;
    
    // Replace numeric sequences with placeholders
    let match;
    let index = 0;
    const regex = new RegExp(numericPattern.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      const placeholder = `__NUMERIC_${index}__`;
      preservedSequences.push({ placeholder, value: match[0] });
      preservedText = preservedText.replace(match[0], placeholder);
      index++;
    }
    
    return { text: preservedText, preservedSequences };
  }
  
  /**
   * Restore preserved numeric sequences
   */
  static restoreNumericSequences(text, preservedSequences) {
    if (!preservedSequences || preservedSequences.length === 0) return text;
    
    let restoredText = text;
    for (const { placeholder, value } of preservedSequences) {
      // Make placeholder case-insensitive for restoration
      const placeholderLower = placeholder.toLowerCase();
      restoredText = restoredText.replace(new RegExp(placeholderLower, 'g'), value.toLowerCase());
    }
    
    return restoredText;
  }
  
  /**
   * Complete normalization pipeline (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
   * Creates normalized searchable content while preserving original formatting
   */
  static normalizeForSearch(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Step 1: Apply case normalization
    let normalized = this.normalizeCase(text);
    
    // Step 2: Apply diacritic normalization
    normalized = this.normalizeDiacritics(normalized);
    
    // Step 3: Apply whitespace normalization but preserve alphanumeric sequences
    // First preserve alphanumeric sequences
    const alphanumericPattern = /\b[a-zA-Z]+\d+\b|\b\d+[a-zA-Z]+\b|\b\d+(?:\.\d+)?\b/g;
    const preservedSequences = [];
    let index = 0;
    
    normalized = normalized.replace(alphanumericPattern, (match) => {
      const placeholder = `__PRESERVE_${index}__`;
      preservedSequences.push({ placeholder, value: match });
      index++;
      return placeholder;
    });
    
    // Apply whitespace normalization
    normalized = this.normalizeWhitespace(normalized);
    
    // Restore preserved sequences
    for (const { placeholder, value } of preservedSequences) {
      normalized = normalized.replace(placeholder, value);
    }
    
    return normalized;
  }
  
  /**
   * Extract search terms from text for indexing
   */
  static extractSearchTerms(text) {
    if (!text || typeof text !== 'string') return [];
    
    const normalized = this.normalizeForSearch(text);
    const terms = normalized
      .split(/\s+/)
      .filter(term => term.length >= 1) // Include single character terms (Requirement 1.1)
      .filter(term => term.trim() !== '');
    
    // Remove duplicates and return
    return [...new Set(terms)];
  }
  
  /**
   * Calculate term frequency for ranking
   */
  static calculateTermFrequency(text) {
    if (!text || typeof text !== 'string') return new Map();
    
    const normalized = this.normalizeForSearch(text);
    const terms = normalized.split(/\s+/).filter(term => term.length >= 1 && term.trim() !== '');
    const frequency = new Map();
    
    for (const term of terms) {
      frequency.set(term, (frequency.get(term) || 0) + 1);
    }
    
    return frequency;
  }
  
  /**
   * Generate content hash for change detection (Requirement 2.4)
   */
  static generateContentHash(content) {
    if (!content || typeof content !== 'string') return '';
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  /**
   * Check if content has changed by comparing hashes
   */
  static hasContentChanged(content, existingHash) {
    const newHash = this.generateContentHash(content);
    return newHash !== existingHash;
  }
  
  /**
   * Normalize query for short keyword searches (Requirement 1.1)
   * Handles 1-2 character queries effectively
   */
  static normalizeShortQuery(query) {
    if (!query || typeof query !== 'string') return '';
    
    // For very short queries (1-2 chars), preserve exact case and characters
    if (query.length <= 2) {
      return query.trim();
    }
    
    // For longer queries, apply full normalization
    return this.normalizeForSearch(query);
  }
  
  /**
   * Extract exact substrings for matching (Requirement 1.2)
   * Returns all possible substrings for comprehensive matching
   */
  static extractSubstrings(text, minLength = 1) {
    if (!text || typeof text !== 'string') return [];
    
    const substrings = new Set();
    const normalized = this.normalizeForSearch(text);
    
    // Extract all substrings of minimum length or greater
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + minLength; j <= normalized.length; j++) {
        const substring = normalized.substring(i, j);
        if (substring.trim().length >= minLength) {
          substrings.add(substring.trim());
        }
      }
    }
    
    return Array.from(substrings);
  }
  
  /**
   * Calculate relevance score for ranking (Requirement 1.3)
   * Combines multiple factors for accurate ranking
   */
  static calculateRelevanceScore(query, content, options = {}) {
    if (!query || !content) return 0;
    
    const {
      exactMatchWeight = 10,
      partialMatchWeight = 5,
      frequencyWeight = 2,
      positionWeight = 1
    } = options;
    
    const normalizedQuery = this.normalizeForSearch(query);
    const normalizedContent = this.normalizeForSearch(content);
    const queryTerms = this.extractSearchTerms(normalizedQuery);
    
    let score = 0;
    
    // Exact phrase match gets highest score
    if (normalizedContent.includes(normalizedQuery)) {
      score += exactMatchWeight * 10;
    }
    
    // Individual term matches
    queryTerms.forEach(term => {
      // Exact word boundary matches
      const exactMatches = (normalizedContent.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += exactMatches * exactMatchWeight;
      
      // Partial matches (substring)
      const partialMatches = (normalizedContent.match(new RegExp(term, 'g')) || []).length;
      score += partialMatches * partialMatchWeight;
      
      // Position bonus (earlier matches get higher score)
      const firstIndex = normalizedContent.indexOf(term);
      if (firstIndex !== -1) {
        const positionBonus = Math.max(0, 100 - firstIndex) * positionWeight;
        score += positionBonus;
      }
    });
    
    // Length normalization (shorter content with matches gets higher score)
    if (score > 0) {
      const lengthFactor = Math.min(1, 1000 / normalizedContent.length);
      score *= lengthFactor;
    }
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Generate fuzzy matching suggestions (Requirement 1.4)
   * Creates alternative search terms for when exact matches fail
   */
  static generateFuzzySuggestions(query, availableTerms = [], maxSuggestions = 5) {
    if (!query || typeof query !== 'string') return [];
    
    const normalizedQuery = this.normalizeForSearch(query);
    const suggestions = [];
    
    // Simple edit distance calculation
    const editDistance = (str1, str2) => {
      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
      
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
    };
    
    // Find similar terms
    for (const term of availableTerms) {
      const normalizedTerm = this.normalizeForSearch(term);
      const distance = editDistance(normalizedQuery, normalizedTerm);
      const maxLength = Math.max(normalizedQuery.length, normalizedTerm.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.6) { // 60% similarity threshold
        suggestions.push({
          term: term,
          similarity: similarity,
          distance: distance
        });
      }
    }
    
    // Sort by similarity and return top suggestions
    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxSuggestions)
      .map(s => s.term);
  }
}

module.exports = QueryNormalizer;