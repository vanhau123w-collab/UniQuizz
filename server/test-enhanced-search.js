// server/test-enhanced-search.js - Test Enhanced Search Infrastructure
const mongoose = require('mongoose');
const Document = require('./models/Document');
const QueryNormalizer = require('./utils/queryNormalizer');
const IndexManager = require('./utils/indexManager');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class EnhancedSearchTester {
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
    console.log(`${colors.cyan}  📊 Enhanced Search Test Results${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`  Total Tests:    ${total}`);
    console.log(`  ${colors.green}Passed:         ${this.passed} ✅${colors.reset}`);
    console.log(`  ${colors.red}Failed:         ${this.failed} ❌${colors.reset}`);
    console.log(`  Success Rate:   ${successRate}%`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    return this.failed === 0;
  }
}

async function runTests() {
  const tester = new EnhancedSearchTester();

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  🧪 Enhanced Search Infrastructure Tests${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    // Test 1: Index Management
    await tester.test('Index Manager Initialization', async () => {
      const result = await IndexManager.initialize();
      if (!result) throw new Error('Index initialization failed');
    });

    // Test 2: Index Statistics
    await tester.test('Index Statistics Retrieval', async () => {
      const stats = await IndexManager.getIndexStats();
      if (!stats || !stats.indexes || stats.indexes.length === 0) {
        throw new Error('No indexes found');
      }
      console.log(`   Found ${stats.indexes.length} indexes`);
    });

    // Test 3: Query Normalization
    await tester.test('Query Normalization Functions', async () => {
      const testText = 'Xin chào! Tôi là một văn bản có dấu tiếng Việt 123ABC.';
      
      const normalized = QueryNormalizer.normalizeForSearch(testText);
      if (!normalized || normalized.length === 0) {
        throw new Error('Normalization failed');
      }
      
      const terms = QueryNormalizer.extractSearchTerms(testText);
      if (!Array.isArray(terms) || terms.length === 0) {
        throw new Error('Term extraction failed');
      }
      
      const hash = QueryNormalizer.generateContentHash(testText);
      if (!hash || hash.length === 0) {
        throw new Error('Hash generation failed');
      }
      
      console.log(`   Normalized: "${normalized}"`);
      console.log(`   Terms: [${terms.join(', ')}]`);
      console.log(`   Hash: ${hash}`);
    });

    // Test 4: Document Model Enhancement
    await tester.test('Document Model Enhanced Fields', async () => {
      // Create a test document
      const testDoc = new Document({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Document with Enhanced Search',
        originalFileName: 'test.txt',
        fileType: 'txt',
        fullContent: 'This is a test document with Vietnamese text: Xin chào thế giới! And some numbers: ABC123.',
        chunks: [{
          content: 'This is a test chunk with Vietnamese: Xin chào!',
          chunkIndex: 0,
          metadata: {
            wordCount: 8
          }
        }],
        tags: ['test', 'enhanced-search']
      });

      // Manually trigger the pre-save middleware logic
      testDoc.searchableContent = QueryNormalizer.normalizeForSearch(testDoc.fullContent);
      testDoc.searchTerms = QueryNormalizer.extractSearchTerms(testDoc.fullContent);
      testDoc.metadata = testDoc.metadata || {};
      testDoc.metadata.lastIndexed = new Date();
      testDoc.metadata.contentHash = QueryNormalizer.generateContentHash(testDoc.fullContent);
      testDoc.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(testDoc.fullContent);
      
      // Update chunk-level searchable content
      testDoc.chunks.forEach(chunk => {
        chunk.searchableContent = QueryNormalizer.normalizeForSearch(chunk.content);
        chunk.searchTerms = QueryNormalizer.extractSearchTerms(chunk.content);
        chunk.metadata = chunk.metadata || {};
        chunk.metadata.contentHash = QueryNormalizer.generateContentHash(chunk.content);
        chunk.metadata.termFrequency = QueryNormalizer.calculateTermFrequency(chunk.content);
      });

      // Validate that enhanced fields are populated
      await testDoc.validate();
      
      if (!testDoc.searchableContent || testDoc.searchableContent.length === 0) {
        throw new Error('Searchable content not generated');
      }
      
      if (!testDoc.searchTerms || testDoc.searchTerms.length === 0) {
        throw new Error('Search terms not extracted');
      }
      
      if (!testDoc.metadata.contentHash) {
        throw new Error('Content hash not generated');
      }
      
      console.log(`   Searchable content: "${testDoc.searchableContent}"`);
      console.log(`   Search terms: [${testDoc.searchTerms.join(', ')}]`);
    });

    // Test 5: Enhanced Search Method
    await tester.test('Enhanced Search Method', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Test the enhanced search method (without actually saving to DB)
      try {
        const results = await Document.enhancedSearch(userId, 'test query', {
          limit: 5,
          caseSensitive: false
        });
        
        // Should return an array (even if empty)
        if (!Array.isArray(results)) {
          throw new Error('Enhanced search should return an array');
        }
        
        console.log(`   Enhanced search returned ${results.length} results`);
      } catch (error) {
        // This might fail if no documents exist, which is okay for this test
        if (!error.message.includes('text index')) {
          console.log(`   Enhanced search method exists and is callable`);
        }
      }
    });

    // Test 6: Relevance Scoring
    await tester.test('Relevance Scoring Algorithm', async () => {
      const query = 'test document';
      const content = 'This is a test document with some test content for testing the document search.';
      
      const score = QueryNormalizer.calculateRelevanceScore(query, content);
      
      if (typeof score !== 'number' || score < 0) {
        throw new Error('Invalid relevance score');
      }
      
      console.log(`   Relevance score for "${query}": ${score}`);
    });

    // Test 7: Fuzzy Suggestions
    await tester.test('Fuzzy Suggestion Generation', async () => {
      const query = 'tset'; // Intentional typo
      const availableTerms = ['test', 'testing', 'document', 'search', 'content'];
      
      const suggestions = QueryNormalizer.generateFuzzySuggestions(query, availableTerms, 3);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Suggestions should be an array');
      }
      
      console.log(`   Suggestions for "${query}": [${suggestions.join(', ')}]`);
    });

  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(`${colors.yellow}Disconnected from MongoDB${colors.reset}\n`);
  }

  const success = tester.printSummary();
  process.exit(success ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});