/**
 * Comprehensive Test Runner for Content Extractor
 * Run: node server/test-runner.js
 */

const ContentExtractor = require('./utils/contentExtractor');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  // Add test
  test(name, fn) {
    this.tests.push({ name, fn });
  }

  // Run all tests
  async run() {
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}  🧪 Content Extractor Test Suite${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`${colors.green}✅ ${test.name}${colors.reset}`);
      } catch (error) {
        this.failed++;
        console.log(`${colors.red}❌ ${test.name}${colors.reset}`);
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
      }
    }

    this.printSummary();
  }

  // Print summary
  printSummary() {
    const total = this.passed + this.failed + this.skipped;
    const successRate = ((this.passed / total) * 100).toFixed(2);

    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}  📊 Test Results Summary${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`  Total Tests:    ${total}`);
    console.log(`  ${colors.green}Passed:         ${this.passed} ✅${colors.reset}`);
    console.log(`  ${colors.red}Failed:         ${this.failed} ❌${colors.reset}`);
    console.log(`  ${colors.yellow}Skipped:        ${this.skipped} ⏭️${colors.reset}`);
    console.log(`  Success Rate:   ${successRate}%`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    if (this.failed > 0) {
      console.log(`${colors.red}⚠️  Some tests failed. Please check the errors above.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
      process.exit(0);
    }
  }
}

// Create test runner
const runner = new TestRunner();

// ============================================
// TEST SUITE 1: BASIC FUNCTIONALITY
// ============================================

runner.test('Plain Text Extraction', async () => {
  const text = 'This is a test content. '.repeat(10);
  const result = await ContentExtractor.extractFromText(text);
  
  if (!result.text) throw new Error('No text extracted');
  if (result.metadata.format !== 'text') throw new Error('Wrong format');
  if (result.text.length < 100) throw new Error('Text too short');
});

runner.test('URL Detection', () => {
  const urlType = ContentExtractor.detectType('https://example.com');
  if (urlType !== 'url') throw new Error(`Expected 'url', got '${urlType}'`);
});

runner.test('YouTube URL Detection', () => {
  const ytType = ContentExtractor.detectType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if (ytType !== 'youtube') throw new Error(`Expected 'youtube', got '${ytType}'`);
});

runner.test('YouTube Video ID Extraction', () => {
  const videoId = ContentExtractor.extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if (videoId !== 'dQw4w9WgXcQ') throw new Error(`Expected 'dQw4w9WgXcQ', got '${videoId}'`);
  
  const videoId2 = ContentExtractor.extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');
  if (videoId2 !== 'dQw4w9WgXcQ') throw new Error('Short URL parsing failed');
});

runner.test('PDF Buffer Detection', () => {
  const pdfBuffer = Buffer.from('%PDF-1.4\n...');
  const type = ContentExtractor.detectType(pdfBuffer);
  if (type !== 'pdf') throw new Error(`Expected 'pdf', got '${type}'`);
});

runner.test('DOCX Buffer Detection', () => {
  const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
  const type = ContentExtractor.detectType(docxBuffer);
  if (type !== 'docx') throw new Error(`Expected 'docx', got '${type}'`);
});

// ============================================
// TEST SUITE 2: VALIDATION
// ============================================

runner.test('Valid Content (100 chars)', () => {
  const content = { text: 'A'.repeat(100) };
  const validation = ContentExtractor.validateContent(content);
  if (!validation.valid) throw new Error('Should be valid');
});

runner.test('Invalid Content (Too Short)', () => {
  const content = { text: 'Too short' };
  const validation = ContentExtractor.validateContent(content);
  if (validation.valid) throw new Error('Should be invalid');
  if (!validation.error.includes('quá ngắn')) throw new Error('Wrong error message');
});

runner.test('Invalid Content (Too Long)', () => {
  const content = { text: 'A'.repeat(200000) };
  const validation = ContentExtractor.validateContent(content);
  if (validation.valid) throw new Error('Should be invalid');
  if (!validation.error.includes('quá dài')) throw new Error('Wrong error message');
});

runner.test('Invalid Content (No Text)', () => {
  const content = {};
  const validation = ContentExtractor.validateContent(content);
  if (validation.valid) throw new Error('Should be invalid');
  if (!validation.error.includes('Không có nội dung')) throw new Error('Wrong error message');
});

// ============================================
// TEST SUITE 3: ERROR HANDLING
// ============================================

runner.test('Image OCR Placeholder Error', async () => {
  try {
    await ContentExtractor.extractFromImage(Buffer.from('fake'));
    throw new Error('Should throw error');
  } catch (error) {
    if (!error.message.includes('OCR chưa được implement')) {
      throw new Error('Wrong error message');
    }
  }
});

runner.test('PPTX Placeholder Error', async () => {
  try {
    await ContentExtractor.extractFromPptx(Buffer.from('fake'));
    throw new Error('Should throw error');
  } catch (error) {
    if (!error.message.includes('Không thể đọc file PPTX')) {
      throw new Error('Wrong error message');
    }
  }
});

// ============================================
// TEST SUITE 4: AUTO-DETECT
// ============================================

runner.test('Auto-detect Plain Text', () => {
  const type = ContentExtractor.detectType('Just plain text');
  if (type !== 'text') throw new Error(`Expected 'text', got '${type}'`);
});

runner.test('Auto-detect HTTP URL', () => {
  const type = ContentExtractor.detectType('http://example.com');
  if (type !== 'url') throw new Error(`Expected 'url', got '${type}'`);
});

runner.test('Auto-detect HTTPS URL', () => {
  const type = ContentExtractor.detectType('https://example.com');
  if (type !== 'url') throw new Error(`Expected 'url', got '${type}'`);
});

runner.test('Auto-detect YouTube (youtube.com)', () => {
  const type = ContentExtractor.detectType('https://www.youtube.com/watch?v=xxx');
  if (type !== 'youtube') throw new Error(`Expected 'youtube', got '${type}'`);
});

runner.test('Auto-detect YouTube (youtu.be)', () => {
  const type = ContentExtractor.detectType('https://youtu.be/xxx');
  if (type !== 'youtube') throw new Error(`Expected 'youtube', got '${type}'`);
});

// ============================================
// TEST SUITE 5: EDGE CASES
// ============================================

runner.test('Empty String Detection', () => {
  const type = ContentExtractor.detectType('');
  if (type !== 'text') throw new Error(`Expected 'text', got '${type}'`);
});

runner.test('Very Long Text', async () => {
  const text = 'A'.repeat(50000);
  const result = await ContentExtractor.extractFromText(text);
  if (result.text.length !== 50000) throw new Error('Length mismatch');
});

runner.test('Text with Special Characters', async () => {
  const text = 'Hello 世界 🌍 Привет مرحبا '.repeat(10);
  const result = await ContentExtractor.extractFromText(text);
  if (!result.text.includes('世界')) throw new Error('Special chars lost');
  if (!result.text.includes('🌍')) throw new Error('Emoji lost');
});

runner.test('Text with Newlines', async () => {
  const text = 'Line 1\nLine 2\nLine 3\n'.repeat(20);
  const result = await ContentExtractor.extractFromText(text);
  if (!result.text.includes('\n')) throw new Error('Newlines lost');
});

runner.test('YouTube URL Variations', () => {
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/v/dQw4w9WgXcQ'
  ];
  
  for (const url of urls) {
    const videoId = ContentExtractor.extractYouTubeId(url);
    if (videoId !== 'dQw4w9WgXcQ') {
      throw new Error(`Failed to extract from: ${url}`);
    }
  }
});

runner.test('Invalid YouTube URL', () => {
  const videoId = ContentExtractor.extractYouTubeId('https://example.com');
  if (videoId !== null) throw new Error('Should return null for invalid URL');
});

// ============================================
// TEST SUITE 6: METADATA
// ============================================

runner.test('Text Metadata', async () => {
  const text = 'Test content';
  const result = await ContentExtractor.extractFromText(text);
  
  if (!result.metadata) throw new Error('No metadata');
  if (result.metadata.format !== 'text') throw new Error('Wrong format in metadata');
  if (result.metadata.length !== text.length) throw new Error('Wrong length in metadata');
});

runner.test('Metadata Structure', async () => {
  const text = 'A'.repeat(100);
  const result = await ContentExtractor.extractFromText(text);
  
  if (typeof result.metadata !== 'object') throw new Error('Metadata should be object');
  if (!result.metadata.format) throw new Error('Missing format in metadata');
  if (!result.metadata.length) throw new Error('Missing length in metadata');
});

// ============================================
// RUN ALL TESTS
// ============================================

console.log(`${colors.blue}Starting test suite...${colors.reset}\n`);

runner.run().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
