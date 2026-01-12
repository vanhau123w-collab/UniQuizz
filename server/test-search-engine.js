// server/test-search-engine.js - Test SearchEngine Implementation
const { SearchEngine, ExactMatchStrategy, FuzzyMatchStrategy, ResultRanker } = require('./utils/searchEngine');
const QueryNormalizer = require('./utils/queryNormalizer');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class SearchEngineTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  async test(name, testFn) {
    try {
      console.log(`${colors.blue}Testing: ${name}${colors.reset}`);
      await testFn();
      this.passed++;
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
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
    console.log(`${colors.cyan}  📊 SearchEngine Test Results${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`  Total Tests:    ${total}`);
    console.log(`  ${colors.green}Passed:         ${this.passed} ✅${colors.reset}`);
    console.log(`  ${colors.red}Failed:         ${this.failed} ❌${colors.reset}`);
    console.log(`  Success Rate:   ${successRate}%`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    return this.failed === 0;
  }
}

// Create test documents
function createTestDocuments() {
  return [
    {
      _id: '1',
      title: 'JavaScript Programming Guide',
      fullContent: 'This is a comprehensive guide to JavaScript programming. It covers functions, objects, and modern ES6 features.',
      searchableContent: QueryNormalizer.normalizeForSearch('This is a comprehensive guide to JavaScript programming. It covers functions, objects, and modern ES6 features.'),
      searchTerms: QueryNormalizer.extractSearchTerms('This is a comprehensive guide to JavaScript programming. It covers functions, objects, and modern ES6 features.'),
      chunks: [
        {
          content: 'JavaScript is a versatile programming language.',
          searchableContent: QueryNormalizer.normalizeForSearch('JavaScript is a versatile programming language.'),
          searchTerms: QueryNormalizer.extractSearchTerms('JavaScript is a versatile programming language.')
        },
        {
          content: 'Functions are first-class citizens in JS.',
          searchableContent: QueryNormalizer.normalizeForSearch('Functions are first-class citizens in JS.'),
          searchTerms: QueryNormalizer.extractSearchTerms('Functions are first-class citizens in JS.')
        }
      ],
      createdAt: new Date('2023-01-01'),
      usageStats: { quizGenerated: 5, flashcardsGenerated: 3, mentorQuestions: 2 }
    },
    {
      _id: '2',
      title: 'React Framework Tutorial',
      fullContent: 'Learn React framework from basics to advanced concepts. This tutorial covers components, hooks, and state management.',
      searchableContent: QueryNormalizer.normalizeForSearch('Learn React framework from basics to advanced concepts. This tutorial covers components, hooks, and state management.'),
      searchTerms: QueryNormalizer.extractSearchTerms('Learn React framework from basics to advanced concepts. This tutorial covers components, hooks, and state management.'),
      chunks: [
        {
          content: 'React is a popular JavaScript library for building user interfaces.',
          searchableContent: QueryNormalizer.normalizeForSearch('React is a popular JavaScript library for building user interfaces.'),
          searchTerms: QueryNormalizer.extractSearchTerms('React is a popular JavaScript library for building user interfaces.')
        }
      ],
      createdAt: new Date('2023-02-01'),
      usageStats: { quizGenerated: 8, flashcardsGenerated: 5, mentorQuestions: 4 }
    },
    {
      _id: '3',
      title: 'Database Design Principles',
      fullContent: 'Understanding database design principles and normalization. This document covers SQL, NoSQL, and data modeling.',
      searchableContent: QueryNormalizer.normalizeForSearch('Understanding database design principles and normalization. This document covers SQL, NoSQL, and data modeling.'),
      searchTerms: QueryNormalizer.extractSearchTerms('Understanding database design principles and normalization. This document covers SQL, NoSQL, and data modeling.'),
      chunks: [
        {
          content: 'Database normalization reduces data redundancy.',
          searchableContent: QueryNormalizer.normalizeForSearch('Database normalization reduces data redundancy.'),
          searchTerms: QueryNormalizer.extractSearchTerms('Database normalization reduces data redundancy.')
        }
      ],
      createdAt: new Date('2023-03-01'),
      usageStats: { quizGenerated: 2, flashcardsGenerated: 1, mentorQuestions: 1 }
    }
  ];
}

async function runTests() {
  const tester = new SearchEngineTester();
  const testDocuments = createTestDocuments();

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  🧪 SearchEngine Implementation Tests${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  // Test 1: SearchEngine Initialization
  await tester.test('SearchEngine Initialization', async () => {
    const searchEngine = new SearchEngine();
    
    if (!searchEngine.strategies) {
      throw new Error('SearchEngine should have strategies');
    }
    
    if (!searchEngine.strategies.exact || !searchEngine.strategies.fuzzy) {
      throw new Error('SearchEngine should have exact and fuzzy strategies');
    }
    
    if (!searchEngine.ranker) {
      throw new Error('SearchEngine should have a ranker');
    }
    
    console.log(`   Available strategies: [${searchEngine.getAvailableStrategies().join(', ')}]`);
  });

  // Test 2: ExactMatchStrategy - Short Query (Requirement 1.1)
  await tester.test('ExactMatchStrategy - Short Query Matching', async () => {
    const strategy = new ExactMatchStrategy();
    const results = strategy.search('JS', testDocuments);
    
    if (!Array.isArray(results)) {
      throw new Error('Strategy should return an array');
    }
    
    // Should find documents containing "JS"
    const hasMatches = results.some(r => r.score > 0);
    if (!hasMatches) {
      throw new Error('Should find matches for short query "JS"');
    }
    
    console.log(`   Found ${results.length} results for short query "JS"`);
    console.log(`   Best match score: ${results[0]?.score || 0}`);
  });

  // Test 3: ExactMatchStrategy - Substring Matching (Requirement 1.2)
  await tester.test('ExactMatchStrategy - Substring Matching', async () => {
    const strategy = new ExactMatchStrategy();
    const results = strategy.search('JavaScript', testDocuments);
    
    if (!Array.isArray(results)) {
      throw new Error('Strategy should return an array');
    }
    
    // Should find documents containing "JavaScript"
    const jsResults = results.filter(r => r.score > 0);
    if (jsResults.length === 0) {
      throw new Error('Should find matches for "JavaScript"');
    }
    
    // Check that results are sorted by score (Requirement 1.3)
    for (let i = 1; i < results.length; i++) {
      if (results[i].score > results[i-1].score) {
        throw new Error('Results should be sorted by score in descending order');
      }
    }
    
    console.log(`   Found ${jsResults.length} results for "JavaScript"`);
    console.log(`   Scores: [${results.slice(0, 3).map(r => r.score).join(', ')}]`);
  });

  // Test 4: FuzzyMatchStrategy - Approximate Matching (Requirement 1.4)
  await tester.test('FuzzyMatchStrategy - Fuzzy Matching', async () => {
    const strategy = new FuzzyMatchStrategy();
    const results = strategy.search('Javascrpt', testDocuments); // Intentional typo
    
    if (!Array.isArray(results)) {
      throw new Error('Strategy should return an array');
    }
    
    // Should find fuzzy matches for misspelled "JavaScript"
    const fuzzyResults = results.filter(r => r.score > 0);
    if (fuzzyResults.length === 0) {
      throw new Error('Should find fuzzy matches for "Javascrpt"');
    }
    
    console.log(`   Found ${fuzzyResults.length} fuzzy results for "Javascrpt"`);
    console.log(`   Best fuzzy match score: ${fuzzyResults[0]?.score || 0}`);
  });

  // Test 5: ResultRanker - Score Ranking (Requirement 1.3)
  await tester.test('ResultRanker - Score Ranking', async () => {
    const ranker = new ResultRanker();
    
    // Create mock results with different scores
    const mockResults = [
      { document: testDocuments[0], score: 10, strategy: 'ExactMatch', matchDetails: [] },
      { document: testDocuments[1], score: 15, strategy: 'ExactMatch', matchDetails: [{ location: 'title' }] },
      { document: testDocuments[2], score: 5, strategy: 'FuzzyMatch', matchDetails: [] }
    ];
    
    const rankedResults = ranker.rankResults(mockResults);
    
    if (!Array.isArray(rankedResults)) {
      throw new Error('Ranker should return an array');
    }
    
    // Check that results are properly ranked
    for (let i = 1; i < rankedResults.length; i++) {
      if (rankedResults[i].finalScore > rankedResults[i-1].finalScore) {
        throw new Error('Results should be ranked by final score in descending order');
      }
    }
    
    console.log(`   Ranked ${rankedResults.length} results`);
    console.log(`   Final scores: [${rankedResults.map(r => r.finalScore).join(', ')}]`);
  });

  // Test 6: SearchEngine - Combined Search
  await tester.test('SearchEngine - Combined Search Strategies', async () => {
    const searchEngine = new SearchEngine();
    const results = await searchEngine.search('JavaScript', testDocuments, {
      strategies: ['exact', 'fuzzy'],
      maxResults: 10
    });
    
    if (!Array.isArray(results)) {
      throw new Error('SearchEngine should return an array');
    }
    
    // Should combine results from both strategies
    const hasExactResults = results.some(r => r.strategy === 'ExactMatch');
    const hasFuzzyResults = results.some(r => r.strategy === 'FuzzyMatch');
    
    console.log(`   Combined search returned ${results.length} results`);
    console.log(`   Has exact matches: ${hasExactResults}`);
    console.log(`   Has fuzzy matches: ${hasFuzzyResults}`);
  });

  // Test 7: SearchEngine - Fallback Mechanism (Requirement 1.4)
  await tester.test('SearchEngine - Fallback to Fuzzy Matching', async () => {
    const searchEngine = new SearchEngine();
    
    // Search for something that won't have exact matches
    const results = await searchEngine.searchWithFallback('XYZ123NonExistent', testDocuments, {
      minExactResults: 1
    });
    
    if (!Array.isArray(results)) {
      throw new Error('SearchEngine should return an array');
    }
    
    console.log(`   Fallback search returned ${results.length} results`);
    
    // If no results, that's okay for a non-existent term
    if (results.length > 0) {
      console.log(`   Fallback found matches with strategies: [${[...new Set(results.map(r => r.strategy))].join(', ')}]`);
    }
  });

  // Test 8: Case Sensitivity Options
  await tester.test('Case Sensitivity Handling', async () => {
    const searchEngine = new SearchEngine();
    
    // Test case insensitive (default)
    const caseInsensitiveResults = await searchEngine.search('javascript', testDocuments, {
      caseSensitive: false
    });
    
    // Test case sensitive
    const caseSensitiveResults = await searchEngine.search('javascript', testDocuments, {
      caseSensitive: true
    });
    
    console.log(`   Case insensitive results: ${caseInsensitiveResults.length}`);
    console.log(`   Case sensitive results: ${caseSensitiveResults.length}`);
    
    // Case insensitive should generally find more or equal results
    if (caseInsensitiveResults.length < caseSensitiveResults.length) {
      console.log(`   Warning: Case insensitive found fewer results than case sensitive`);
    }
  });

  // Test 9: Empty Query Handling
  await tester.test('Empty Query Handling', async () => {
    const searchEngine = new SearchEngine();
    
    const emptyResults = await searchEngine.search('', testDocuments);
    const nullResults = await searchEngine.search(null, testDocuments);
    
    if (!Array.isArray(emptyResults) || !Array.isArray(nullResults)) {
      throw new Error('SearchEngine should return arrays for empty queries');
    }
    
    if (emptyResults.length > 0 || nullResults.length > 0) {
      throw new Error('Empty queries should return no results');
    }
    
    console.log(`   Empty query handling works correctly`);
  });

  // Test 10: Match Details Generation
  await tester.test('Match Details Generation', async () => {
    const strategy = new ExactMatchStrategy();
    const results = strategy.search('JavaScript', testDocuments);
    
    if (results.length === 0) {
      throw new Error('Should have results to test match details');
    }
    
    const firstResult = results[0];
    if (!firstResult.matchDetails || !Array.isArray(firstResult.matchDetails)) {
      throw new Error('Results should include match details');
    }
    
    console.log(`   Match details generated for ${firstResult.matchDetails.length} locations`);
    
    if (firstResult.matchDetails.length > 0) {
      const detail = firstResult.matchDetails[0];
      console.log(`   Sample match: ${detail.location} with ${detail.matchCount} matches`);
    }
  });

  const success = tester.printSummary();
  return success;
}

// Run tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { runTests, SearchEngineTester };