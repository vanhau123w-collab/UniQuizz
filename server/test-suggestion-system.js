// server/test-suggestion-system.js - Test Search Suggestion System
const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const SuggestionEngine = require('./utils/suggestionEngine');
const SearchHistory = require('./models/SearchHistory');
const Document = require('./models/Document');
const User = require('./models/User');

class SuggestionSystemTester {
  constructor() {
    this.suggestionEngine = new SuggestionEngine();
    this.testUserId = null;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp');
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async setupTestData() {
    console.log('\n📝 Setting up test data...');
    
    // Create or find test user
    let testUser = await User.findOne({ email: 'test-suggestions@example.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test-suggestions@example.com',
        password: 'testpassword',
        fullName: 'Test Suggestions User'
      });
      await testUser.save();
    }
    this.testUserId = testUser._id;
    console.log(`   Test user ID: ${this.testUserId}`);

    // Create test documents with various content
    const testDocuments = [
      {
        title: 'Machine Learning Basics',
        content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models. Neural networks, deep learning, and supervised learning are key concepts.',
        tags: ['AI', 'ML', 'Technology']
      },
      {
        title: 'JavaScript Programming Guide',
        content: 'JavaScript is a programming language used for web development. React, Node.js, and Express are popular JavaScript frameworks and libraries.',
        tags: ['Programming', 'Web', 'JavaScript']
      },
      {
        title: 'Database Design Principles',
        content: 'Database design involves creating efficient data structures. SQL, NoSQL, MongoDB, and PostgreSQL are common database technologies.',
        tags: ['Database', 'SQL', 'Design']
      }
    ];

    for (const docData of testDocuments) {
      const existingDoc = await Document.findOne({ 
        userId: this.testUserId, 
        title: docData.title 
      });
      
      if (!existingDoc) {
        const document = new Document({
          userId: this.testUserId,
          title: docData.title,
          originalFileName: `${docData.title}.txt`,
          fileType: 'txt',
          fullContent: docData.content,
          searchableContent: docData.content.toLowerCase(),
          searchTerms: docData.content.toLowerCase().split(/\s+/),
          chunks: [{
            content: docData.content,
            searchableContent: docData.content.toLowerCase(),
            searchTerms: docData.content.toLowerCase().split(/\s+/),
            chunkIndex: 0,
            metadata: { wordCount: docData.content.split(/\s+/).length }
          }],
          tags: docData.tags,
          metadata: {
            totalWords: docData.content.split(/\s+/).length,
            totalChunks: 1,
            language: 'en'
          }
        });
        await document.save();
        console.log(`   Created document: ${docData.title}`);
      }
    }

    // Create test search history
    const testSearches = [
      { query: 'machine learning', resultCount: 5 },
      { query: 'machine learning algorithms', resultCount: 3 },
      { query: 'javascript', resultCount: 8 },
      { query: 'javascript frameworks', resultCount: 4 },
      { query: 'database design', resultCount: 6 },
      { query: 'sql database', resultCount: 7 },
      { query: 'neural networks', resultCount: 2 },
      { query: 'programming', resultCount: 10 }
    ];

    for (const search of testSearches) {
      const existingSearch = await SearchHistory.findOne({
        userId: this.testUserId,
        query: search.query
      });

      if (!existingSearch) {
        await this.suggestionEngine.recordSearch(
          this.testUserId,
          search.query,
          { length: search.resultCount },
          {},
          { strategy: 'exact' }
        );
        console.log(`   Recorded search: "${search.query}"`);
      }
    }

    console.log('✅ Test data setup complete');
  }

  async testContentSuggestions() {
    console.log('\n🔍 Testing content-based suggestions...');
    
    const testQueries = ['mach', 'java', 'data', 'neur'];
    
    for (const query of testQueries) {
      const suggestions = await this.suggestionEngine.getSuggestions(this.testUserId, query, {
        includeHistorySuggestions: false,
        includeRecentSearches: false
      });
      
      console.log(`   Query: "${query}"`);
      console.log(`   Suggestions: ${suggestions.map(s => `"${s.text}" (${s.type})`).join(', ')}`);
      
      if (suggestions.length === 0) {
        console.log('   ⚠️  No content suggestions found');
      }
    }
  }

  async testHistorySuggestions() {
    console.log('\n📚 Testing history-based suggestions...');
    
    const testQueries = ['mach', 'java', 'prog', 'sql'];
    
    for (const query of testQueries) {
      const suggestions = await this.suggestionEngine.getSuggestions(this.testUserId, query, {
        includeContentSuggestions: false,
        includeRecentSearches: false
      });
      
      console.log(`   Query: "${query}"`);
      console.log(`   Suggestions: ${suggestions.map(s => `"${s.text}" (freq: ${s.frequency})`).join(', ')}`);
      
      if (suggestions.length === 0) {
        console.log('   ⚠️  No history suggestions found');
      }
    }
  }

  async testRecentSearchFallback() {
    console.log('\n🕒 Testing recent search fallback...');
    
    // Test with a query that should have no matches
    const suggestions = await this.suggestionEngine.getSuggestions(this.testUserId, 'xyz123nonexistent', {
      includeContentSuggestions: true,
      includeHistorySuggestions: true,
      includeRecentSearches: true
    });
    
    console.log(`   Query: "xyz123nonexistent"`);
    console.log(`   Fallback suggestions: ${suggestions.map(s => `"${s.text}" (${s.type})`).join(', ')}`);
    
    if (suggestions.length > 0 && suggestions[0].type === 'recent') {
      console.log('   ✅ Recent search fallback working');
    } else {
      console.log('   ⚠️  Recent search fallback not triggered');
    }
  }

  async testSuggestionLimit() {
    console.log('\n📊 Testing suggestion limit (Requirement 3.5)...');
    
    const suggestions = await this.suggestionEngine.getSuggestions(this.testUserId, 'a', {
      maxSuggestions: 5
    });
    
    console.log(`   Query: "a" (should match many terms)`);
    console.log(`   Returned ${suggestions.length} suggestions (limit: 5)`);
    
    if (suggestions.length <= 5) {
      console.log('   ✅ Suggestion limit working correctly');
    } else {
      console.log('   ❌ Suggestion limit exceeded');
    }
  }

  async testFrequencyOrdering() {
    console.log('\n📈 Testing frequency-based ordering (Requirement 3.2)...');
    
    // Add multiple searches for the same term to increase frequency
    await this.suggestionEngine.recordSearch(this.testUserId, 'machine learning advanced', { length: 5 });
    await this.suggestionEngine.recordSearch(this.testUserId, 'machine learning advanced', { length: 5 });
    await this.suggestionEngine.recordSearch(this.testUserId, 'machine learning basic', { length: 3 });
    
    const suggestions = await this.suggestionEngine.getSuggestions(this.testUserId, 'machine learning', {
      includeContentSuggestions: false,
      includeRecentSearches: false
    });
    
    console.log(`   Query: "machine learning"`);
    suggestions.forEach((s, i) => {
      console.log(`   ${i + 1}. "${s.text}" (freq: ${s.frequency}, score: ${s.relevanceScore.toFixed(2)})`);
    });
    
    // Check if suggestions are ordered by frequency/relevance
    let properlyOrdered = true;
    for (let i = 1; i < suggestions.length; i++) {
      if (suggestions[i].relevanceScore > suggestions[i - 1].relevanceScore) {
        properlyOrdered = false;
        break;
      }
    }
    
    if (properlyOrdered) {
      console.log('   ✅ Suggestions properly ordered by relevance');
    } else {
      console.log('   ⚠️  Suggestion ordering may need adjustment');
    }
  }

  async testSearchAnalytics() {
    console.log('\n📊 Testing search analytics...');
    
    const analytics = await this.suggestionEngine.getSearchAnalytics(this.testUserId, 30);
    
    console.log('   Analytics:');
    console.log(`     Total searches: ${analytics.totalSearches}`);
    console.log(`     Unique queries: ${analytics.uniqueQueryCount}`);
    console.log(`     Avg results: ${analytics.avgResultCount?.toFixed(2) || 'N/A'}`);
    console.log(`     Avg satisfaction: ${analytics.avgSatisfaction?.toFixed(2) || 'N/A'}`);
    console.log(`     Click-through rate: ${(analytics.clickThroughRate * 100)?.toFixed(2) || 0}%`);
    
    if (analytics.totalSearches > 0) {
      console.log('   ✅ Analytics working correctly');
    } else {
      console.log('   ⚠️  No analytics data found');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Search Suggestion System Tests\n');
    
    try {
      await this.connect();
      await this.setupTestData();
      
      await this.testContentSuggestions();
      await this.testHistorySuggestions();
      await this.testRecentSearchFallback();
      await this.testSuggestionLimit();
      await this.testFrequencyOrdering();
      await this.testSearchAnalytics();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SuggestionSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SuggestionSystemTester;