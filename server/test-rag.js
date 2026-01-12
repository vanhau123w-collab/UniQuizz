// Test RAG functionality
const RAGService = require('./services/ragService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testRAG() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test data
    const userId = new mongoose.Types.ObjectId();
    const testContent = `
JavaScript là một ngôn ngữ lập trình phổ biến được sử dụng để phát triển web.

Các khái niệm cơ bản trong JavaScript:
1. Variables (Biến): let, const, var
2. Functions (Hàm): function, arrow functions
3. Objects (Đối tượng): key-value pairs
4. Arrays (Mảng): danh sách các phần tử
5. Promises: xử lý bất đồng bộ
6. DOM Manipulation: thao tác với HTML elements

JavaScript có thể chạy trên browser và server (Node.js).
React là một thư viện JavaScript để xây dựng user interfaces.
Vue.js và Angular cũng là các framework JavaScript phổ biến.

Async/await giúp viết code bất đồng bộ dễ đọc hơn.
ES6+ đã thêm nhiều tính năng mới như destructuring, template literals, modules.
`;

    // 1. Store document
    console.log('\n🔄 Testing document storage...');
    const document = await RAGService.storeDocument(
      userId,
      'JavaScript Cơ Bản',
      testContent,
      {
        fileName: 'javascript-basics.txt',
        fileType: 'txt',
        tags: ['javascript', 'programming', 'web-development']
      }
    );
    console.log(`✅ Stored document: ${document._id}`);
    console.log(`📊 Chunks created: ${document.chunks.length}`);

    // 2. Search documents
    console.log('\n🔍 Testing document search...');
    const searchResults = await RAGService.searchDocuments(userId, 'JavaScript functions');
    console.log(`✅ Found ${searchResults.length} documents`);

    // 3. Get relevant context
    console.log('\n📚 Testing context retrieval...');
    const context = await RAGService.getRelevantContext(userId, 'JavaScript functions và promises', {
      maxChunks: 3,
      maxContextLength: 1000
    });
    console.log(`✅ Retrieved context (${context.context.length} chars):`);
    console.log('Context preview:', context.context.substring(0, 200) + '...');
    console.log(`📖 Sources: ${context.sources.length}`);
    console.log(`🧩 Chunks: ${context.totalChunks}`);

    // 4. Test search with different queries
    console.log('\n🔍 Testing different search queries...');
    const queries = [
      'React framework',
      'async await',
      'ES6 features',
      'DOM manipulation'
    ];

    for (const query of queries) {
      const result = await RAGService.getRelevantContext(userId, query, { maxChunks: 2 });
      console.log(`Query: "${query}" -> ${result.totalChunks} chunks, ${result.context.length} chars`);
    }

    // 5. Get user documents
    console.log('\n📋 Testing user documents listing...');
    const userDocs = await RAGService.getUserDocuments(userId, { limit: 5 });
    console.log(`✅ User has ${userDocs.documents.length} documents`);
    console.log(`📄 Total: ${userDocs.pagination.total}`);

    console.log('\n🎉 All RAG tests passed!');

  } catch (error) {
    console.error('❌ RAG test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test
testRAG();