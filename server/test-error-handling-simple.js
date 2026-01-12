// server/test-error-handling-simple.js - Simple Error Handling Test (No DB Required)
// Tests for Task 10: Integration and error handling

const { 
  ErrorHandler,
  SearchError,
  ValidationError,
  ServiceUnavailableError,
  TimeoutError,
  InputValidator,
  FallbackManager,
  PerformanceMonitor,
  errorHandler
} = require('./utils/errorHandler');
const { searchLogger } = require('./utils/searchLogger');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class SimpleErrorHandlingTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Run a test and track results
   */
  async runTest(testName, testFunction) {
    try {
      console.log(`${colors.blue}🧪 Testing: ${testName}${colors.reset}`);
      await testFunction();
      this.testResults.passed++;
      console.log(`${colors.green}✅ ${testName} - PASSED${colors.reset}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ testName, error: error.message });
      console.log(`${colors.red}❌ ${testName} - FAILED: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Test input validation
   */
  async testInputValidation() {
    await this.runTest('Search Query Validation - Valid Input', async () => {
      const validQuery = 'test search query';
      const result = InputValidator.validateSearchQuery(validQuery);
      if (result !== validQuery) {
        throw new Error('Valid query should be returned as-is');
      }
    });

    await this.runTest('Search Query Validation - Empty Query', async () => {
      try {
        InputValidator.validateSearchQuery('');
        throw new Error('Should have thrown ValidationError for empty query');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for empty query');
        }
      }
    });

    await this.runTest('Search Query Validation - Null Query', async () => {
      try {
        InputValidator.validateSearchQuery(null);
        throw new Error('Should have thrown ValidationError for null query');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for null query');
        }
      }
    });

    await this.runTest('Search Query Validation - Long Query', async () => {
      try {
        const longQuery = 'a'.repeat(1001);
        InputValidator.validateSearchQuery(longQuery);
        throw new Error('Should have thrown ValidationError for long query');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for long query');
        }
      }
    });

    await this.runTest('Search Query Validation - Malicious Content', async () => {
      try {
        InputValidator.validateSearchQuery('$where: function() { return true; }');
        throw new Error('Should have thrown ValidationError for malicious content');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for malicious content');
        }
      }
    });

    await this.runTest('Pagination Validation - Valid Input', async () => {
      const result = InputValidator.validatePagination(2, 20);
      if (result.page !== 2 || result.limit !== 20) {
        throw new Error('Valid pagination should be returned correctly');
      }
    });

    await this.runTest('Pagination Validation - Invalid Page', async () => {
      try {
        InputValidator.validatePagination(-1, 10);
        throw new Error('Should have thrown ValidationError for negative page');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for negative page');
        }
      }
    });

    await this.runTest('Pagination Validation - Large Page', async () => {
      try {
        InputValidator.validatePagination(1001, 10);
        throw new Error('Should have thrown ValidationError for large page');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for large page');
        }
      }
    });

    await this.runTest('User ID Validation - Valid ObjectId', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const result = InputValidator.validateUserId(validId);
      if (result !== validId) {
        throw new Error('Valid user ID should be returned as-is');
      }
    });

    await this.runTest('User ID Validation - Invalid Format', async () => {
      try {
        InputValidator.validateUserId('invalid-id');
        throw new Error('Should have thrown ValidationError for invalid ID format');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for invalid ID format');
        }
      }
    });

    await this.runTest('Search Options Validation - Valid Options', async () => {
      const options = {
        fileTypes: ['pdf', 'docx'],
        tags: ['test', 'document'],
        searchStrategies: ['exact', 'fuzzy'],
        caseSensitive: true
      };
      
      const result = InputValidator.validateSearchOptions(options);
      if (!result.fileTypes || result.fileTypes.length !== 2) {
        throw new Error('Valid options should be processed correctly');
      }
    });

    await this.runTest('Search Options Validation - Invalid File Types', async () => {
      try {
        InputValidator.validateSearchOptions({
          fileTypes: ['invalid-type']
        });
        throw new Error('Should have thrown ValidationError for invalid file types');
      } catch (error) {
        if (!(error instanceof ValidationError)) {
          throw new Error('Should throw ValidationError for invalid file types');
        }
      }
    });
  }

  /**
   * Test fallback mechanisms
   */
  async testFallbackMechanisms() {
    const fallbackManager = new FallbackManager();

    await this.runTest('Fallback Registration', async () => {
      fallbackManager.registerFallback('test-service', async (data) => {
        return { fallback: true, data };
      });

      const strategies = fallbackManager.fallbackStrategies;
      if (!strategies.has('test-service')) {
        throw new Error('Fallback strategy should be registered');
      }
    });

    await this.runTest('Fallback Execution - Primary Success', async () => {
      const result = await fallbackManager.executeWithFallback(
        'test-service',
        async () => ({ primary: true }),
        { test: 'data' }
      );

      if (!result.primary) {
        throw new Error('Primary function should execute successfully');
      }
    });

    await this.runTest('Fallback Execution - Primary Failure', async () => {
      const result = await fallbackManager.executeWithFallback(
        'test-service',
        async () => {
          throw new Error('Primary service failed');
        },
        { test: 'data' }
      );

      if (!result.fallback || !result._fallbackUsed) {
        throw new Error('Fallback should execute when primary fails');
      }
    });

    await this.runTest('Service Health Tracking', async () => {
      // Mark service as unhealthy
      fallbackManager.markServiceUnhealthy('test-service', new Error('Test error'));
      
      const health = fallbackManager.getServiceHealth('test-service');
      if (health.status !== 'unhealthy') {
        throw new Error('Service should be marked as unhealthy');
      }

      // Mark service as healthy
      fallbackManager.markServiceHealthy('test-service');
      
      const healthyStatus = fallbackManager.getServiceHealth('test-service');
      if (healthyStatus.status !== 'healthy') {
        throw new Error('Service should be marked as healthy');
      }
    });

    await this.runTest('Timeout Handling', async () => {
      try {
        await fallbackManager.executeWithTimeout(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'success';
        }, 100); // 100ms timeout
        throw new Error('Should have timed out');
      } catch (error) {
        if (!(error instanceof TimeoutError)) {
          throw new Error('Should throw TimeoutError for timeout');
        }
      }
    });
  }

  /**
   * Test performance monitoring
   */
  async testPerformanceMonitoring() {
    const monitor = new PerformanceMonitor();

    await this.runTest('Performance Monitoring - Operation Tracking', async () => {
      const operationId = 'test-op-1';
      
      monitor.startOperation(operationId, 'search', { query: 'test' });
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const operation = monitor.endOperation(operationId, true);
      
      if (!operation || operation.duration < 40) {
        throw new Error('Operation should be tracked with correct duration');
      }
    });

    await this.runTest('Performance Monitoring - Failed Operation', async () => {
      const operationId = 'test-op-2';
      
      monitor.startOperation(operationId, 'search', { query: 'test' });
      
      const operation = monitor.endOperation(operationId, false, new Error('Test error'));
      
      if (operation.success !== false || !operation.error) {
        throw new Error('Failed operation should be tracked correctly');
      }
    });

    await this.runTest('Performance Monitoring - Statistics', async () => {
      // Add a few more operations for statistics
      for (let i = 0; i < 3; i++) {
        const opId = `stats-op-${i}`;
        monitor.startOperation(opId, 'test', {});
        monitor.endOperation(opId, i % 2 === 0); // Alternate success/failure
      }
      
      const stats = monitor.getStats('test');
      
      if (stats.totalOperations < 3) {
        throw new Error('Statistics should include all operations');
      }
    });

    await this.runTest('Performance Monitoring - Health Check', async () => {
      const isHealthy = monitor.isPerformingWell('test');
      
      if (typeof isHealthy !== 'boolean') {
        throw new Error('Health check should return boolean');
      }
    });

    await this.runTest('Performance Monitoring - Cleanup', async () => {
      const cleanedCount = monitor.cleanup(0); // Clean all metrics
      
      if (typeof cleanedCount !== 'number') {
        throw new Error('Cleanup should return number of cleaned metrics');
      }
    });
  }

  /**
   * Test error classes
   */
  async testErrorClasses() {
    await this.runTest('SearchError Creation', async () => {
      const error = new SearchError('Test error', 'TEST_CODE', 400, { field: 'test' });
      
      if (error.name !== 'SearchError' || error.code !== 'TEST_CODE' || error.statusCode !== 400) {
        throw new Error('SearchError should be created with correct properties');
      }
    });

    await this.runTest('ValidationError Creation', async () => {
      const error = new ValidationError('Invalid input', 'testField', 'testValue');
      
      if (error.name !== 'ValidationError' || error.details.field !== 'testField') {
        throw new Error('ValidationError should be created with correct properties');
      }
    });

    await this.runTest('ServiceUnavailableError Creation', async () => {
      const error = new ServiceUnavailableError('test-service', 'Service is down');
      
      if (error.name !== 'ServiceUnavailableError' || error.details.service !== 'test-service') {
        throw new Error('ServiceUnavailableError should be created with correct properties');
      }
    });

    await this.runTest('TimeoutError Creation', async () => {
      const error = new TimeoutError('search', 5000);
      
      if (error.name !== 'TimeoutError' || error.details.timeout !== 5000) {
        throw new Error('TimeoutError should be created with correct properties');
      }
    });
  }

  /**
   * Test logging functionality
   */
  async testLogging() {
    await this.runTest('Search Logger - Basic Logging', async () => {
      await searchLogger.info('Test log message', { test: 'data' });
      // If no error is thrown, logging is working
    });

    await this.runTest('Search Logger - Search Operation Logging', async () => {
      const logger = searchLogger.createSearchLogger('test-search-1', 'test query', { userId: '507f1f77bcf86cd799439011' });
      
      logger.logStep('test-step', { step: 'validation' });
      logger.logComplete({ items: [], count: 0 });
      
      // If no error is thrown, search logging is working
    });

    await this.runTest('Search Logger - Error Logging', async () => {
      const logger = searchLogger.createSearchLogger('test-search-2', 'test query', { userId: '507f1f77bcf86cd799439011' });
      
      logger.logError(new Error('Test error'), false);
      
      // If no error is thrown, error logging is working
    });

    await this.runTest('Search Logger - Performance Logging', async () => {
      await searchLogger.logPerformanceMetrics({
        totalSearches: 100,
        averageResponseTime: 250,
        slowQueries: 5,
        errorRate: 0.02,
        cacheHitRate: 0.75
      });
      
      // If no error is thrown, performance logging is working
    });

    await this.runTest('Search Logger - Log Stats', async () => {
      const stats = await searchLogger.getLogStats(7);
      
      if (typeof stats !== 'object') {
        throw new Error('Log stats should return an object');
      }
    });
  }

  /**
   * Test system health monitoring
   */
  async testSystemHealth() {
    await this.runTest('System Health Check', async () => {
      const health = errorHandler.getSystemHealth();
      
      if (!health.services || !health.performance || typeof health.isHealthy !== 'boolean') {
        throw new Error('System health should include services, performance, and health status');
      }
    });

    await this.runTest('Error Handler Wrapper', async () => {
      const mockReq = { userId: '507f1f77bcf86cd799439011' };
      let responseData = null;
      let statusCode = null;
      
      const mockRes = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseData = data;
              return { statusCode: code, data };
            }
          };
        },
        json: (data) => {
          responseData = data;
          return data;
        }
      };

      const wrappedFunction = errorHandler.wrapAsync(async (req, res) => {
        throw new ValidationError('Test validation error', 'testField', 'testValue');
      });

      // The wrapper should handle the error and call res.status().json()
      await wrappedFunction(mockReq, mockRes);
      
      // Check if the error was handled correctly
      if (statusCode !== 400 || !responseData || responseData.success !== false) {
        throw new Error(`Expected 400 status and error response, got status: ${statusCode}, data: ${JSON.stringify(responseData)}`);
      }
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}🧪 RAG Search Error Handling Test Suite (Simple)${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    try {
      // Run test suites
      console.log(`${colors.magenta}📋 Testing Input Validation...${colors.reset}`);
      await this.testInputValidation();

      console.log(`\n${colors.magenta}🔄 Testing Fallback Mechanisms...${colors.reset}`);
      await this.testFallbackMechanisms();

      console.log(`\n${colors.magenta}📊 Testing Performance Monitoring...${colors.reset}`);
      await this.testPerformanceMonitoring();

      console.log(`\n${colors.magenta}🚨 Testing Error Classes...${colors.reset}`);
      await this.testErrorClasses();

      console.log(`\n${colors.magenta}📝 Testing Logging...${colors.reset}`);
      await this.testLogging();

      console.log(`\n${colors.magenta}🏥 Testing System Health...${colors.reset}`);
      await this.testSystemHealth();

    } catch (error) {
      console.error(`${colors.red}❌ Test setup failed: ${error.message}${colors.reset}`);
      this.testResults.failed++;
      this.testResults.errors.push({ testName: 'Test Setup', error: error.message });
    }

    // Print results
    this.printResults();
  }

  /**
   * Print test results
   */
  printResults() {
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}📊 Test Results${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);

    const total = this.testResults.passed + this.testResults.failed;
    const passRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;

    console.log(`${colors.green}✅ Passed: ${this.testResults.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.testResults.failed}${colors.reset}`);
    console.log(`${colors.blue}📈 Pass Rate: ${passRate}%${colors.reset}`);

    if (this.testResults.errors.length > 0) {
      console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
      this.testResults.errors.forEach(({ testName, error }) => {
        console.log(`${colors.red}  • ${testName}: ${error}${colors.reset}`);
      });
    }

    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    
    if (this.testResults.failed === 0) {
      console.log(`${colors.green}🎉 All tests passed! Error handling implementation is working correctly.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Some tests failed. Please review the error handling implementation.${colors.reset}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SimpleErrorHandlingTester();
  tester.runAllTests().catch(error => {
    console.error(`${colors.red}❌ Test runner failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = SimpleErrorHandlingTester;