// server/test-rag-integration.js - Test RAG Service Integration with SearchEngine
const mongoose = require('mongoose');
const RAGService = require('./services/ragService');
const Document = require('./models/Document');
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

async function testRAGIntegration() {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  🧪 RAG Service Integration Test${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    // Create a test user ID
    const testUserId = new mongoose.Types.ObjectId().toString();
    
    // Store a test document
    console.log(`${colors.blue}📄 Storing test document...${colors.reset}`);
    const testDoc = await RAGService.storeDocument(
      testUserId,
      'Enhanced Search Test Document',
      'This is a comprehensive test document for the enhanced search functionality. It contains JavaScript programming concepts, React framework information, and database design principles. The document includes various technical terms and should be searchable using both exact and fuzzy matching algorithms.',
      {
        fileName: 'enhanced-search-test.txt',
        fileType: 'txt',
        tags: ['test', 'search', 'javascript', 'react']
      }
    );
    console.log(`${colors.green}✅ Document stored with ID: ${testDoc._id}${colors.reset}`);

    // Test enhanced search with exact matching
    console.log(`\n${colors.blue}🔍 Testing enhanced search - exact matching...${colors.reset}`);
    const exactResults = await RAGService.searchDocuments(testUserId, 'JavaScript', {
      limit: 5,
      caseSensitive: false
    });
    console.log(`${colors.green}✅ Found ${exactResults.items?.length || 0} results for "JavaScript"${colors.reset}`);
    
    if (exactResults.items && exactResults.items.length > 0) {
      const firstResult = exactResults.items[0];
      console.log(`   - Title: ${firstResult.title}`);
      console.log(`   - Search Score: ${firstResult._searchScore || 'N/A'}`);
      console.log(`   - Strategy: ${firstResult._strategy || 'N/A'}`);
    }

    // Test enhanced search with short query
    console.log(`\n${colors.blue}🔍 Testing enhanced search - short query...${colors.reset}`);
    const shortResults = await RAGService.searchDocuments(testUserId, 'JS', {
      limit: 5,
      caseSensitive: false
    });
    console.log(`${colors.green}✅ Found ${shortResults.items?.length || 0} results for short query "JS"${colors.reset}`);

    // Test enhanced search with fuzzy matching
    console.log(`\n${colors.blue}🔍 Testing enhanced search - fuzzy matching...${colors.reset}`);
    const fuzzyResults = await RAGService.searchDocuments(testUserId, 'Javascrpt', {
      limit: 5,
      caseSensitive: false
    });
    console.log(`${colors.green}✅ Found ${fuzzyResults.items?.length || 0} results for fuzzy query "Javascrpt"${colors.reset}`);

    // Test context retrieval with enhanced search
    console.log(`\n${colors.blue}📚 Testing context retrieval...${colors.reset}`);
    const context = await RAGService.getRelevantContext(testUserId, 'React framework', {
      maxChunks: 3,
      maxContextLength: 1000
    });
    console.log(`${colors.green}✅ Retrieved context with ${context.totalChunks} chunks from ${context.sources.length} sources${colors.reset}`);
    console.log(`   Context length: ${context.context.length} characters`);

    // Clean up test document
    console.log(`\n${colors.yellow}🧹 Cleaning up test document...${colors.reset}`);
    await Document.findByIdAndDelete(testDoc._id);
    console.log(`${colors.green}✅ Test document cleaned up${colors.reset}`);

    console.log(`\n${colors.green}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}  ✅ RAG Service Integration Test PASSED${colors.reset}`);
    console.log(`${colors.green}${'='.repeat(60)}${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Integration test failed:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(`${colors.yellow}Disconnected from MongoDB${colors.reset}`);
  }
}

// Run test
if (require.main === module) {
  testRAGIntegration().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { testRAGIntegration };