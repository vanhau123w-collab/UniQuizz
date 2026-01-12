// server/test/queryNormalizer.pbt.js - Property-Based Tests for Query Normalization
const fc = require('fast-check');
const QueryNormalizer = require('../utils/queryNormalizer');

// Test configuration
const TEST_ITERATIONS = 100;

// Custom generators for realistic test data
const generators = {
  // Generate Vietnamese text with diacritics
  vietnameseText: () => fc.string({ minLength: 1, maxLength: 50 }).map(s => {
    const diacritics = ['à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ',
                       'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ', 'ì', 'í', 'ị', 'ỉ', 'ĩ',
                       'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ',
                       'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ', 'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ', 'đ'];
    return s.split('').map(c => Math.random() > 0.8 ? diacritics[Math.floor(Math.random() * diacritics.length)] : c).join('');
  }),
  
  // Generate text with mixed case
  mixedCaseText: () => fc.string({ minLength: 1, maxLength: 50 }).map(s => 
    s.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('')
  ),
  
  // Generate text with whitespace variations
  whitespaceText: () => fc.string({ minLength: 1, maxLength: 50 }).map(s => 
    s.replace(/\s/g, fc.sample(fc.constantFrom(' ', '  ', '\t', '\n'), 1)[0])
  ),
  
  // Generate alphanumeric sequences
  alphanumericSequence: () => fc.oneof(
    fc.integer({ min: 1, max: 999999 }).map(n => n.toString()),
    fc.tuple(fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z]+$/.test(s)), fc.integer({ min: 1, max: 999 }))
      .map(([str, num]) => `${str}${num}`),
    fc.tuple(fc.integer({ min: 1, max: 999 }), fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z]+$/.test(s)))
      .map(([num, str]) => `${num}${str}`)
  ),
  
  // Generate short queries (1-2 characters)
  shortQuery: () => fc.string({ minLength: 1, maxLength: 2 }).filter(s => s.trim().length > 0),
  
  // Generate document content with embedded terms
  documentContent: () => fc.array(
    fc.oneof(
      fc.string({ minLength: 3, maxLength: 20 }),
      generators.alphanumericSequence(),
      generators.vietnameseText()
    ),
    { minLength: 10, maxLength: 100 }
  ).map(words => words.join(' '))
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class PropertyTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  test(name, property, options = {}) {
    const iterations = options.iterations || TEST_ITERATIONS;
    
    try {
      console.log(`${colors.blue}Running: ${name}${colors.reset}`);
      
      fc.assert(property, { 
        numRuns: iterations,
        verbose: false,
        ...options
      });
      
      this.passed++;
      console.log(`${colors.green}✅ ${name} (${iterations} iterations)${colors.reset}`);
    } catch (error) {
      this.failed++;
      this.errors.push({ name, error: error.message });
      console.log(`${colors.red}❌ ${name}${colors.reset}`);
      console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }

  printSummary() {
    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(2) : 0;

    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}  📊 Property-Based Test Results${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`  Total Tests:    ${total}`);
    console.log(`  ${colors.green}Passed:         ${this.passed} ✅${colors.reset}`);
    console.log(`  ${colors.red}Failed:         ${this.failed} ❌${colors.reset}`);
    console.log(`  Success Rate:   ${successRate}%`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    if (this.failed > 0) {
      console.log(`${colors.red}⚠️  Some property tests failed:${colors.reset}`);
      this.errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
      });
      console.log();
    }

    return this.failed === 0;
  }
}

// Create test runner
const runner = new PropertyTestRunner();

console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.cyan}  🧪 Query Normalizer Property-Based Tests${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

// **Feature: improved-rag-search, Property 6: Case insensitive matching**
// **Validates: Requirements 2.1**
runner.test('Property 6: Case insensitive matching', 
  fc.property(generators.mixedCaseText(), (text) => {
    const lowercase = QueryNormalizer.normalizeCase(text);
    const uppercase = QueryNormalizer.normalizeCase(text.toUpperCase());
    const mixedCase = QueryNormalizer.normalizeCase(text.toLowerCase());
    
    // All variations should produce the same normalized result
    return lowercase === uppercase && lowercase === mixedCase;
  })
);

// **Feature: improved-rag-search, Property 7: Diacritic normalization**
// **Validates: Requirements 2.2**
runner.test('Property 7: Diacritic normalization', 
  fc.property(generators.vietnameseText(), (text) => {
    const normalized = QueryNormalizer.normalizeDiacritics(text);
    
    // Normalized text should not contain Vietnamese diacritics
    const vietnameseDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    return !vietnameseDiacritics.test(normalized);
  })
);

// **Feature: improved-rag-search, Property 8: Whitespace normalization**
// **Validates: Requirements 2.3**
runner.test('Property 8: Whitespace normalization', 
  fc.property(generators.whitespaceText(), (text) => {
    const normalized = QueryNormalizer.normalizeWhitespace(text);
    
    // Normalized text should not have multiple consecutive spaces
    const hasMultipleSpaces = /\s{2,}/.test(normalized);
    const startsOrEndsWithSpace = normalized.startsWith(' ') || normalized.endsWith(' ');
    
    return !hasMultipleSpaces && !startsOrEndsWithSpace;
  })
);

// **Feature: improved-rag-search, Property 9: Content preservation during indexing**
// **Validates: Requirements 2.4**
runner.test('Property 9: Content preservation during indexing', 
  fc.property(generators.documentContent(), (content) => {
    const originalHash = QueryNormalizer.generateContentHash(content);
    const normalizedContent = QueryNormalizer.normalizeForSearch(content);
    
    // Original content hash should remain consistent
    const secondHash = QueryNormalizer.generateContentHash(content);
    
    // Normalization should not affect original content hashing
    return originalHash === secondHash && normalizedContent.length > 0;
  })
);

// **Feature: improved-rag-search, Property 10: Numeric sequence exact matching**
// **Validates: Requirements 2.5**
runner.test('Property 10: Numeric sequence exact matching', 
  fc.property(generators.alphanumericSequence(), (sequence) => {
    const textWithSequence = `Some text ${sequence} more text`;
    const normalized = QueryNormalizer.normalizeForSearch(textWithSequence);
    
    // Numeric/alphanumeric sequences should be preserved in normalized text
    return normalized.includes(sequence.toLowerCase());
  })
);

// Additional property tests for enhanced functionality

// Test that short queries are handled properly
runner.test('Short query handling', 
  fc.property(generators.shortQuery(), (query) => {
    const normalized = QueryNormalizer.normalizeShortQuery(query);
    
    // Short queries should preserve their essential character
    return normalized.length > 0 && normalized.length <= query.length + 1; // Allow for trimming
  })
);

// Test relevance scoring consistency
runner.test('Relevance score consistency', 
  fc.property(
    fc.string({ minLength: 1, maxLength: 20 }),
    generators.documentContent(),
    (query, content) => {
      const score1 = QueryNormalizer.calculateRelevanceScore(query, content);
      const score2 = QueryNormalizer.calculateRelevanceScore(query, content);
      
      // Relevance scoring should be deterministic
      return score1 === score2 && score1 >= 0;
    }
  )
);

// Test term extraction consistency
runner.test('Term extraction consistency', 
  fc.property(generators.documentContent(), (content) => {
    const terms1 = QueryNormalizer.extractSearchTerms(content);
    const terms2 = QueryNormalizer.extractSearchTerms(content);
    
    // Term extraction should be deterministic and return arrays
    return Array.isArray(terms1) && 
           Array.isArray(terms2) && 
           terms1.length === terms2.length &&
           terms1.every((term, i) => term === terms2[i]);
  })
);

// Test hash generation consistency
runner.test('Hash generation consistency', 
  fc.property(generators.documentContent(), (content) => {
    const hash1 = QueryNormalizer.generateContentHash(content);
    const hash2 = QueryNormalizer.generateContentHash(content);
    
    // Hash generation should be deterministic
    return hash1 === hash2 && 
           typeof hash1 === 'string' && 
           hash1.length > 0;
  })
);

// Test fuzzy suggestions
runner.test('Fuzzy suggestions generation', 
  fc.property(
    fc.string({ minLength: 1, maxLength: 10 }),
    fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 0, maxLength: 20 }),
    (query, availableTerms) => {
      const suggestions = QueryNormalizer.generateFuzzySuggestions(query, availableTerms, 5);
      
      // Suggestions should be an array with max 5 items
      return Array.isArray(suggestions) && 
             suggestions.length <= 5 &&
             suggestions.every(s => typeof s === 'string');
    }
  )
);

// Run all tests and print summary
const success = runner.printSummary();

// Exit with appropriate code
process.exit(success ? 0 : 1);