// Test RAG with Gemini AI
const { generateQuizFromText, generateMentorResponse } = require('./geminiService');
const RAGService = require('./services/ragService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testRAGWithAI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create test user
    const userId = new mongoose.Types.ObjectId();
    
    // Store some documents first
    console.log('\n📚 Storing test documents...');
    
    const jsDoc = await RAGService.storeDocument(
      userId,
      'JavaScript Advanced',
      `
JavaScript Closures và Scope:
- Closure là khi một function có thể truy cập variables từ outer scope
- Lexical scoping: variables được resolve dựa trên nơi chúng được khai báo
- IIFE (Immediately Invoked Function Expression) tạo private scope

JavaScript Promises và Async/Await:
- Promise có 3 states: pending, fulfilled, rejected
- .then() và .catch() để handle promises
- async/await là syntactic sugar cho promises
- Promise.all() chạy nhiều promises song song

JavaScript Modules:
- ES6 modules: import/export
- CommonJS: require/module.exports
- Dynamic imports: import()
      `,
      {
        fileName: 'js-advanced.txt',
        fileType: 'txt',
        tags: ['javascript', 'advanced', 'closures', 'promises']
      }
    );

    const reactDoc = await RAGService.storeDocument(
      userId,
      'React Hooks Guide',
      `
React Hooks cơ bản:
- useState: quản lý state trong functional components
- useEffect: side effects và lifecycle
- useContext: consume React context
- useReducer: complex state management

React Hooks nâng cao:
- useMemo: memoize expensive calculations
- useCallback: memoize functions
- useRef: access DOM elements và persist values
- Custom hooks: tái sử dụng stateful logic

React Performance:
- React.memo: prevent unnecessary re-renders
- Lazy loading với React.lazy và Suspense
- Code splitting để giảm bundle size
      `,
      {
        fileName: 'react-hooks.txt',
        fileType: 'txt',
        tags: ['react', 'hooks', 'performance']
      }
    );

    console.log(`✅ Stored ${jsDoc.chunks.length} JS chunks, ${reactDoc.chunks.length} React chunks`);

    // Test 1: Generate quiz WITHOUT RAG
    console.log('\n🎯 Test 1: Generate quiz WITHOUT RAG...');
    const quizWithoutRAG = await generateQuizFromText(
      'Tạo quiz về JavaScript closures và React hooks',
      5,
      {
        userId,
        useRAG: false,
        template: 'universityExam'
      }
    );
    console.log('✅ Quiz without RAG created');
    console.log('Questions preview:', quizWithoutRAG.questions.slice(0, 2).map(q => q.question));

    // Test 2: Generate quiz WITH RAG
    console.log('\n🚀 Test 2: Generate quiz WITH RAG...');
    const quizWithRAG = await generateQuizFromText(
      'Tạo quiz về JavaScript closures và React hooks',
      5,
      {
        userId,
        useRAG: true,
        template: 'universityExam'
      }
    );
    console.log('✅ Quiz with RAG created');
    console.log('Questions preview:', quizWithRAG.questions.slice(0, 2).map(q => q.question));
    
    if (quizWithRAG.ragMetadata) {
      console.log('📊 RAG Metadata:');
      console.log(`- Sources used: ${quizWithRAG.ragMetadata.sourcesUsed}`);
      console.log('- Documents:', quizWithRAG.ragMetadata.sources.map(s => s.title));
    }

    // Test 3: Mentor response WITHOUT RAG
    console.log('\n💬 Test 3: Mentor response WITHOUT RAG...');
    const mentorWithoutRAG = await generateMentorResponse(
      'Giải thích về JavaScript closures và cách sử dụng trong React hooks',
      '',
      {
        userId,
        useRAG: false
      }
    );
    console.log('✅ Mentor response without RAG:');
    console.log(mentorWithoutRAG.answer ? mentorWithoutRAG.answer.substring(0, 200) + '...' : mentorWithoutRAG.substring(0, 200) + '...');

    // Test 4: Mentor response WITH RAG
    console.log('\n🤖 Test 4: Mentor response WITH RAG...');
    const mentorWithRAG = await generateMentorResponse(
      'Giải thích về JavaScript closures và cách sử dụng trong React hooks',
      '',
      {
        userId,
        useRAG: true
      }
    );
    console.log('✅ Mentor response with RAG:');
    const response = mentorWithRAG.answer || mentorWithRAG;
    console.log(response.substring(0, 200) + '...');
    
    if (mentorWithRAG.ragMetadata) {
      console.log('📊 RAG Metadata:');
      console.log(`- Sources used: ${mentorWithRAG.ragMetadata.sourcesUsed}`);
      console.log('- Documents:', mentorWithRAG.ragMetadata.sources.map(s => s.title));
    }

    console.log('\n🎉 All RAG + AI tests completed successfully!');
    console.log('\n📈 Comparison:');
    console.log('- Without RAG: Uses general AI knowledge');
    console.log('- With RAG: Uses specific document context + AI knowledge');
    console.log('- RAG provides more accurate, contextual responses');

  } catch (error) {
    console.error('❌ RAG + AI test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test
testRAGWithAI();