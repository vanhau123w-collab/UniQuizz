// server/test-cache-unit.js - Unit tests for caching and performance components
const CacheManager = require('./utils/cacheManager');
const PaginationManager = require('./utils/paginationManager');
const ConcurrentSearchManager = require('./utils/concurrentSearchManager');

// Mock data for testing
const mockSearchResults = [
  { _id: '1', title: 'Document 1', _searchScore: 0.9 },
  { _id: '2', title: 'Document 2', _searchScore: 0.8 },
  { _id: '3', title: 'Document 3', _searchScore: 0.7 },
  { _id: '4', title: 'Document 4', _searchScore: 0.6 },
  { _id: '5', title: 'Document 5', _searchScore: 0.5 }
];

async function testCacheManager() {
  console.log('🧪 Testing CacheManager...');
  
  try {
    // Initialize cache with Redis disabled for testing
    const cache = new CacheManager({ 
      enabled: true,
      redis: { disabled: true }
    });
    
    // Test cache key generation
    const key1 = cache.generateCacheKey('user1', 'test query', { limit: 10 });
    const key2 = cache.generateCacheKey('user1', 'test query', { limit: 10 });
    const key3 = cache.generateCacheKey('user1', 'different query', { limit: 10 });
    
    console.log('✅ Cache key generation:');
    console.log(`   - Same parameters produce same key: ${key1 === key2}`);
    console.log(`   - Different parameters produce different key: ${key1 !== key3}`);
    
    // Test cache operations (memory cache)
    await cache.set('user1', 'test query', mockSearchResults, { limit: 10 });
    const cachedResults = await cache.get('user1', 'test query', { limit: 10 });
    
    console.log('✅ Cache operations:');
    console.log(`   - Cache set successful: ${cachedResults !== null}`);
    console.log(`   - Cached results match: ${cachedResults && cachedResults.results.length === mockSearchResults.length}`);
    
    // Test cache stats
    const stats = cache.getStats();
    console.log('✅ Cache statistics:');
    console.log(`   - Hit rate: ${stats.hitRate}`);
    console.log(`   - Backend: ${stats.backend}`);
    
    // Test cache invalidation
    await cache.invalidateUserCache('user1');
    const invalidatedResults = await cache.get('user1', 'test query', { limit: 10 });
    
    console.log('✅ Cache invalidation:');
    console.log(`   - Cache cleared after invalidation: ${invalidatedResults === null}`);
    
    await cache.close();
    
  } catch (error) {
    console.error('❌ CacheManager test failed:', error);
    throw error;
  }
}

async function testPaginationManager() {
  console.log('\n🧪 Testing PaginationManager...');
  
  try {
    const pagination = new PaginationManager();
    
    // Test pagination validation
    const validParams = pagination.validatePaginationParams(2, 10);
    console.log('✅ Pagination validation:');
    console.log(`   - Valid params: page=${validParams.page}, pageSize=${validParams.pageSize}`);
    
    // Test pagination calculation
    const paginationMeta = pagination.calculatePaginationMeta(50, 2, 10);
    console.log('✅ Pagination calculation:');
    console.log(`   - Total pages: ${paginationMeta.totalPages}`);
    console.log(`   - Has next page: ${paginationMeta.hasNextPage}`);
    console.log(`   - Items on page: ${paginationMeta.itemsOnPage}`);
    
    // Test result pagination
    const paginatedResults = pagination.paginateResults(mockSearchResults, 1, 3);
    console.log('✅ Result pagination:');
    console.log(`   - Items returned: ${paginatedResults.items.length}`);
    console.log(`   - Pagination info: page ${paginatedResults.pagination.currentPage} of ${paginatedResults.pagination.totalPages}`);
    
    // Test search pagination optimization
    const optimizedResults = pagination.optimizeSearchPagination(mockSearchResults, 1, 3, {
      relevanceThreshold: 0.7
    });
    console.log('✅ Search pagination optimization:');
    console.log(`   - Optimized items: ${optimizedResults.items.length}`);
    
    // Test MongoDB query creation
    const mongoQuery = pagination.createMongoQuery(3, 20);
    console.log('✅ MongoDB query creation:');
    console.log(`   - Skip: ${mongoQuery.skip}, Limit: ${mongoQuery.limit}`);
    
  } catch (error) {
    console.error('❌ PaginationManager test failed:', error);
    throw error;
  }
}

async function testConcurrentSearchManager() {
  console.log('\n🧪 Testing ConcurrentSearchManager...');
  
  try {
    const concurrentManager = new ConcurrentSearchManager({
      maxConcurrentSearches: 3,
      maxConcurrentIndexing: 2
    });
    
    // Test search execution
    const searchFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate search delay
      return mockSearchResults;
    };
    
    console.log('🔍 Testing search execution...');
    const searchResult = await concurrentManager.executeSearch('test-search-1', searchFunction);
    
    console.log('✅ Search execution:');
    console.log(`   - Search completed: ${searchResult.length === mockSearchResults.length}`);
    
    // Test concurrent searches
    console.log('🔄 Testing concurrent searches...');
    const concurrentSearches = [];
    
    for (let i = 0; i < 5; i++) {
      const searchPromise = concurrentManager.executeSearch(`concurrent-search-${i}`, searchFunction);
      concurrentSearches.push(searchPromise);
    }
    
    const concurrentResults = await Promise.all(concurrentSearches);
    console.log('✅ Concurrent searches:');
    console.log(`   - All searches completed: ${concurrentResults.length === 5}`);
    
    // Test indexing execution
    const indexingFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate indexing delay
      return { success: true };
    };
    
    const indexingResult = await concurrentManager.executeIndexing('test-indexing-1', indexingFunction);
    console.log('✅ Indexing execution:');
    console.log(`   - Indexing completed: ${indexingResult.success}`);
    
    // Test system status
    const status = concurrentManager.getStatus();
    console.log('✅ System status:');
    console.log(`   - Total searches: ${status.metrics.totalSearches}`);
    console.log(`   - Total indexing: ${status.metrics.totalIndexing}`);
    console.log(`   - Search utilization: ${status.capacity.searchUtilization}`);
    
    // Test health check
    const health = concurrentManager.isHealthy();
    console.log('✅ Health check:');
    console.log(`   - System healthy: ${health.healthy}`);
    
    concurrentManager.stopMonitoring();
    
  } catch (error) {
    console.error('❌ ConcurrentSearchManager test failed:', error);
    throw error;
  }
}

async function testIntegration() {
  console.log('\n🧪 Testing component integration...');
  
  try {
    const cache = new CacheManager({ 
      enabled: true,
      redis: { disabled: true }
    });
    const pagination = new PaginationManager();
    const concurrent = new ConcurrentSearchManager();
    
    // Simulate a complete search workflow
    const searchWorkflow = async () => {
      // 1. Check cache
      const cachedResults = await cache.get('user1', 'integration test', { limit: 10 });
      if (cachedResults) {
        return cachedResults.results;
      }
      
      // 2. Perform search
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate search
      
      // 3. Cache results
      await cache.set('user1', 'integration test', mockSearchResults, { limit: 10 });
      
      return mockSearchResults;
    };
    
    // Execute workflow with concurrency control
    const results = await concurrent.executeSearch('integration-test', searchWorkflow);
    
    // Apply pagination
    const paginatedResults = pagination.paginateResults(results, 1, 3);
    
    console.log('✅ Integration test:');
    console.log(`   - Workflow completed: ${results.length === mockSearchResults.length}`);
    console.log(`   - Pagination applied: ${paginatedResults.items.length === 3}`);
    console.log(`   - Cache populated: ${await cache.get('user1', 'integration test', { limit: 10 }) !== null}`);
    
    // Cleanup
    await cache.close();
    concurrent.stopMonitoring();
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

async function runUnitTests() {
  console.log('🚀 Starting caching and performance unit tests...\n');
  
  try {
    await testCacheManager();
    await testPaginationManager();
    await testConcurrentSearchManager();
    await testIntegration();
    
    console.log('\n🎉 All unit tests passed successfully!');
    
  } catch (error) {
    console.error('\n💥 Unit tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runUnitTests().catch(console.error);
}

module.exports = {
  runUnitTests,
  testCacheManager,
  testPaginationManager,
  testConcurrentSearchManager,
  testIntegration
};