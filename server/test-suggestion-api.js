// server/test-suggestion-api.js - Test Suggestion API Endpoints
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes and models
const apiRoutes = require('./apiRoutes');
const User = require('./models/User');
const Document = require('./models/Document');
const SearchHistory = require('./models/SearchHistory');

class SuggestionAPITester {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.use('/api', apiRoutes);
    this.testUser = null;
    this.authToken = null;
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

  async setupTestUser() {
    console.log('\n👤 Setting up test user...');
    
    // Create or find test user
    let testUser = await User.findOne({ email: 'test-api@example.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test-api@example.com',
        password: 'testpassword',
        fullName: 'Test API User'
      });
      await testUser.save();
    }
    this.testUser = testUser;

    // Generate JWT token
    this.authToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    console.log(`   Test user ID: ${testUser._id}`);
    console.log('   Auth token generated');
  }

  async testSuggestionsEndpoint() {
    console.log('\n🔍 Testing /api/rag/search/suggestions endpoint...');
    
    // Test with partial query
    const response = await request(this.app)
      .get('/api/rag/search/suggestions')
      .set('Authorization', `Bearer ${this.authToken}`)
      .query({ q: 'mach', limit: 5 });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Suggestions endpoint working');
      return true;
    } else {
      console.log('   ❌ Suggestions endpoint failed');
      return false;
    }
  }

  async testSearchHistoryEndpoint() {
    console.log('\n📚 Testing /api/rag/search/history endpoint...');
    
    const response = await request(this.app)
      .get('/api/rag/search/history')
      .set('Authorization', `Bearer ${this.authToken}`)
      .query({ limit: 10 });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Search history endpoint working');
      return true;
    } else {
      console.log('   ❌ Search history endpoint failed');
      return false;
    }
  }

  async testRecordSearchEndpoint() {
    console.log('\n📝 Testing /api/rag/search/record endpoint...');
    
    const response = await request(this.app)
      .post('/api/rag/search/record')
      .set('Authorization', `Bearer ${this.authToken}`)
      .send({
        query: 'test api search',
        resultCount: 5,
        searchFilters: { fileTypes: ['pdf'] },
        searchMetadata: { strategy: 'exact' }
      });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Record search endpoint working');
      return true;
    } else {
      console.log('   ❌ Record search endpoint failed');
      return false;
    }
  }

  async testClickRecordEndpoint() {
    console.log('\n👆 Testing /api/rag/search/click endpoint...');
    
    const response = await request(this.app)
      .post('/api/rag/search/click')
      .set('Authorization', `Bearer ${this.authToken}`)
      .send({
        query: 'test api search',
        documentId: new mongoose.Types.ObjectId(),
        position: 1
      });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Click record endpoint working');
      return true;
    } else {
      console.log('   ❌ Click record endpoint failed');
      return false;
    }
  }

  async testFeedbackEndpoint() {
    console.log('\n⭐ Testing /api/rag/search/feedback endpoint...');
    
    const response = await request(this.app)
      .post('/api/rag/search/feedback')
      .set('Authorization', `Bearer ${this.authToken}`)
      .send({
        query: 'test api search',
        rating: 4
      });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Feedback endpoint working');
      return true;
    } else {
      console.log('   ❌ Feedback endpoint failed');
      return false;
    }
  }

  async testAnalyticsEndpoint() {
    console.log('\n📊 Testing /api/rag/search/analytics endpoint...');
    
    const response = await request(this.app)
      .get('/api/rag/search/analytics')
      .set('Authorization', `Bearer ${this.authToken}`)
      .query({ timeWindow: 30 });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);

    if (response.status === 200) {
      console.log('   ✅ Analytics endpoint working');
      return true;
    } else {
      console.log('   ❌ Analytics endpoint failed');
      return false;
    }
  }

  async testAuthenticationRequired() {
    console.log('\n🔒 Testing authentication requirement...');
    
    const response = await request(this.app)
      .get('/api/rag/search/suggestions')
      .query({ q: 'test' });

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Authentication properly required');
      return true;
    } else {
      console.log('   ❌ Authentication not properly enforced');
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Suggestion API Tests\n');
    
    const results = [];
    
    try {
      await this.connect();
      await this.setupTestUser();
      
      results.push(await this.testAuthenticationRequired());
      results.push(await this.testSuggestionsEndpoint());
      results.push(await this.testSearchHistoryEndpoint());
      results.push(await this.testRecordSearchEndpoint());
      results.push(await this.testClickRecordEndpoint());
      results.push(await this.testFeedbackEndpoint());
      results.push(await this.testAnalyticsEndpoint());
      
      const passed = results.filter(r => r).length;
      const total = results.length;
      
      console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
      
      if (passed === total) {
        console.log('✅ All API tests completed successfully!');
      } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
      }
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Check if supertest is available
try {
  require('supertest');
} catch (error) {
  console.log('⚠️  supertest not installed. Install with: npm install --save-dev supertest');
  console.log('   Skipping API tests...');
  process.exit(0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SuggestionAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = SuggestionAPITester;