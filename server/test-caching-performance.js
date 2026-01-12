// server/test-caching-performance.js - Test caching and performance optimizations
const mongoose = require('mongoose');
const RAGService = require('./services/ragService');
const Document = require('./models/Document');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test_rag_cache',
  testUserId: new mongoose.Types.ObjectId(),
  testDocuments: [
    {
      title: 'Test Document 1',
      content: 'This is a test document about artificial intelligence and machine learning. It contains various technical terms and concepts.',
      fileType: 'txt'
    },
    {
      title: 'Test Document 2', 
      content: 'Another test document discussing natural language processing, neural networks, and deep learning algorithms.',
      fileType: 'txt'
    },
    {
      title: 'Test Document 3',
      content: 'A third document covering computer vision, image recognition, and convolutional neural networks.',
      fileType: 'txt'
    }
  ]
};

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Connect to test database
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✅ Connected to test database');
    
    // Clear existing test data
    await Document.deleteMany({ userId: TEST_CONFIG.testUserId });
    console.log('✅ Cleared existing test data');
    
    // Create test documents
    const createdDocs = [];
    for (const docData of TEST_CONFIG.testDocuments) {
      const doc = await RAGService.storeDocument(
        TEST_CONFIG.testUserId,
        docData.title,
        docData.content,
        { fileType: docData.fileType }
      );
      createdDocs.push(doc);
    }
    
    console.log(`✅ Created ${createdDocs.length} test documents`);
    return createdDocs;
  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    throw error;
  }
}

async function testCachePerformance() {
  console.log('\n🧪 Testing cache performance...');
  
  const testQuery = 'artificial intelligence';
  const searchOptions = {
    limit: 10,
    page: 1,
    useCache: true
  };
  
  try {
    // First search (should miss cache)
    console.log('🔍 Performing first search (cache miss expected)...');
    const startTime1 = Date.now();
    const result1 = await RAGService.searchDocuments(TEST_CONFIG.testUserId, testQuery, searchOptions);
    const duration1 = Date.now() - startTime1;
    
    console.log(`⏱️ First search took ${duration1}ms`);
    console.log(`📊 Found ${result1.items?.length || result1.length} results`);
    console.log(`🎯 Cache hit: ${result1.searchMetrics?.cacheHit || false}`);
    
    // Second search (should hit cache)
    console.log('\n🔍 Performing second search (cache hit expected)...');
    const startTime2 = Date.now();
    const result2 = await RAGService.searchDocuments(TEST_CONFIG.testUserId, testQuery, searchOptions);
    const duration2 = Date.now() - startTime2;
    
    console.log(`⏱️ Second search took ${duration2}ms`);
    console.log(`📊 Found ${result2.items?.length || result2.length} results`);
    console.log(`🎯 Cache hit: ${result2.searchMetrics?.cacheHit || false}`);
    
    // Performance improvement
    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
    console.log(`🚀 Performance improvement: ${improvement}%`);
    
    return { duration1, duration2, improvement };
  } catch (error) {
    console.error('❌ Error testing cache performance:', error);
    throw error;
  }
}

async function testPagination() {
  console.log('\n🧪 Testing pagination...');
  
  try {
    // Test pagination with different page sizes
    const testCases = [
      { page: 1, limit: 2 },
      { page: 2, limit: 2 },
      { page: 1, limit: 5 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📄 Testing pagination: page ${testCase.page}, limit ${testCase.limit}`);
      
      const result = await RAGService.searchDocuments(
        TEST_CONFIG.testUserId, 
        'test document', 
        {
          page: testCase.page,
          limit: testCase.limit,
          useCache: false // Disable cache for pagination testing
        }
      );
      
      console.log(`📊 Items on page: ${result.items?.length || 0}`);
      console.log(`📈 Pagination info:`, result.pagination);
    }
    
    // Test user documents pagination
    console.log('\n📄 Testing user documents pagination...');
    const userDocsResult = await RAGService.getUserDocuments(TEST_CONFIG.testUserId, {
      page: 1,
      limit: 2
    });
    
    console.log(`📊 User documents: ${userDocsResult.items?.length || 0}`);
    console.log(`📈 Pagination info:`, userDocsResult.pagination);
    
  } catch (error) {
    console.error('❌ Error testing pagination:', error);
    throw error;
  }
}

async function testCacheInvalidation(testDocuments) {
  console.log('\n🧪 Testing cache invalidation...');
  
  try {
    const testQuery = 'machine learning';
    
    // Perform search to populate cache
    console.log('🔍 Performing search to populate cache...');
    await RAGService.searchDocuments(TEST_CONFIG.testUserId, testQuery, { useCache: true });
    
    // Update a document (should invalidate cache)
    console.log('📝 Updating document to trigger cache invalidation...');
    const docToUpdate = testDocuments[0];
    await RAGService.updateDocument(
      docToUpdate._id,
      { 
        fullContent: docToUpdate.fullContent + ' Updated content with new machine learning concepts.',
        title: docToUpdate.title + ' (Updated)'
      },
      TEST_CONFIG.testUserId
    );
    
    // Search again (should miss cache due to invalidation)
    console.log('🔍 Searching again after document update...');
    const result = await RAGService.searchDocuments(TEST_CONFIG.testUserId, testQuery, { useCache: true });
    
    console.log(`🎯 Cache hit after invalidation: ${result.searchMetrics?.cacheHit || false}`);
    console.log('✅ Cache invalidation test completed');
    
  } catch (error) {
    console.error('❌ Error testing cache invalidation:', error);
    throw error;
  }
}

async function testConcurrentOperations() {
  console.log('\n🧪 Testing concurrent operations...');
  
  try {
    // Create multiple concurrent search operations
    const concurrentSearches = [];
    const queries = ['artificial', 'machine', 'neural', 'deep', 'computer'];
    
    console.log('🔄 Starting concurrent searches...');
    const startTime = Date.now();
    
    for (let i = 0; i < queries.length; i++) {
      const searchPromise = RAGService.searchDocuments(
        TEST_CONFIG.testUserId,
        queries[i],
        { useCache: false, limit: 5 }
      );
      concurrentSearches.push(searchPromise);
    }
    
    // Wait for all searches to complete
    const results = await Promise.all(concurrentSearches);
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️ ${queries.length} concurrent searches completed in ${totalTime}ms`);
    console.log(`📊 Average time per search: ${(totalTime / queries.length).toFixed(1)}ms`);
    
    // Test concurrent indexing
    console.log('\n🔄 Testing concurrent indexing...');
    const indexingPromises = [];
    
    for (let i = 0; i < 3; i++) {
      const indexingPromise = RAGService.storeDocument(
        TEST_CONFIG.testUserId,
        `Concurrent Test Doc ${i}`,
        `This is concurrent test document number ${i} with various content about technology and innovation.`,
        { fileType: 'txt' }
      );
      indexingPromises.push(indexingPromise);
    }
    
    const indexingResults = await Promise.all(indexingPromises);
    console.log(`✅ ${indexingResults.length} concurrent indexing operations completed`);
    
  } catch (error) {
    console.error('❌ Error testing concurrent operations:', error);
    throw error;
  }
}

async function testPerformanceStats() {
  console.log('\n🧪 Testing performance statistics...');
  
  try {
    const stats = await RAGService.getPerformanceStats();
    
    console.log('📊 Cache Statistics:');
    console.log(`   - Hit Rate: ${stats.cache.hitRate}`);
    console.log(`   - Total Requests: ${stats.cache.totalRequests}`);
    console.log(`   - Cache Size: ${stats.cache.cacheSize}`);
    console.log(`   - Backend: ${stats.cache.backend}`);
    
    console.log('\n🔄 Concurrent Operations:');
    console.log(`   - Active Searches: ${stats.concurrent.activeOperations.searches}`);
    console.log(`   - Active Indexing: ${stats.concurrent.activeOperations.indexing}`);
    console.log(`   - Search Utilization: ${stats.concurrent.capacity.searchUtilization}`);
    
    console.log('\n💚 Health Status:');
    console.log(`   - Cache Status: ${stats.health.cache.status}`);
    console.log(`   - System Healthy: ${stats.health.system.healthy}`);
    
  } catch (error) {
    console.error('❌ Error getting performance stats:', error);
    throw error;
  }
}

async function cleanupTestEnvironment() {
  console.log('\n🧹 Cleaning up test environment...');
  
  try {
    // Clear test data
    await Document.deleteMany({ userId: TEST_CONFIG.testUserId });
    
    // Clear caches
    await RAGService.clearAllCaches();
    
    // Close database connection
    await mongoose.connection.close();
    
    console.log('✅ Test environment cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test environment:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting caching and performance optimization tests...\n');
  
  let testDocuments;
  
  try {
    // Setup
    testDocuments = await setupTestEnvironment();
    
    // Run tests
    await testCachePerformance();
    await testPagination();
    await testCacheInvalidation(testDocuments);
    await testConcurrentOperations();
    await testPerformanceStats();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await cleanupTestEnvironment();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testCachePerformance,
  testPagination,
  testCacheInvalidation,
  testConcurrentOperations,
  testPerformanceStats
};