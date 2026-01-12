/**
 * Test script cho Content Extractor
 * Chạy: node server/test-content-extractor.js
 */

const ContentExtractor = require('./utils/contentExtractor');

async function testContentExtractor() {
  console.log('🧪 Testing Content Extractor...\n');

  // Test 1: Plain Text
  console.log('Test 1: Plain Text');
  try {
    const text = 'This is a test content. '.repeat(10);
    const result = await ContentExtractor.extractFromText(text);
    console.log('✅ Plain Text:', {
      length: result.text.length,
      format: result.metadata.format
    });
  } catch (error) {
    console.error('❌ Plain Text failed:', error.message);
  }

  // Test 2: URL Detection
  console.log('\nTest 2: URL Detection');
  try {
    const urlType = ContentExtractor.detectType('https://example.com');
    console.log('✅ URL detected as:', urlType);
  } catch (error) {
    console.error('❌ URL detection failed:', error.message);
  }

  // Test 3: YouTube URL Detection
  console.log('\nTest 3: YouTube URL Detection');
  try {
    const ytType = ContentExtractor.detectType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ YouTube detected as:', ytType);
    
    const videoId = ContentExtractor.extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ Video ID extracted:', videoId);
  } catch (error) {
    console.error('❌ YouTube detection failed:', error.message);
  }

  // Test 4: Content Validation
  console.log('\nTest 4: Content Validation');
  try {
    const validContent = { text: 'A'.repeat(100) };
    const validation1 = ContentExtractor.validateContent(validContent);
    console.log('✅ Valid content (100 chars):', validation1);

    const shortContent = { text: 'Too short' };
    const validation2 = ContentExtractor.validateContent(shortContent);
    console.log('✅ Short content (< 50 chars):', validation2);

    const longContent = { text: 'A'.repeat(200000) };
    const validation3 = ContentExtractor.validateContent(longContent);
    console.log('✅ Long content (> 100k chars):', validation3);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }

  // Test 5: Buffer Detection (PDF signature)
  console.log('\nTest 5: Buffer Detection');
  try {
    const pdfBuffer = Buffer.from('%PDF-1.4\n...');
    const pdfType = ContentExtractor.detectType(pdfBuffer);
    console.log('✅ PDF buffer detected as:', pdfType);

    const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK signature
    const docxType = ContentExtractor.detectType(docxBuffer);
    console.log('✅ DOCX buffer detected as:', docxType);
  } catch (error) {
    console.error('❌ Buffer detection failed:', error.message);
  }

  // Test 6: Image/PPTX Placeholders
  console.log('\nTest 6: Placeholder Functions');
  try {
    await ContentExtractor.extractFromImage(Buffer.from('fake'));
  } catch (error) {
    console.log('✅ Image OCR placeholder:', error.message);
  }

  try {
    await ContentExtractor.extractFromPptx(Buffer.from('fake'));
  } catch (error) {
    console.log('✅ PPTX placeholder:', error.message);
  }

  console.log('\n✅ All tests completed!');
}

// Run tests
testContentExtractor().catch(console.error);
