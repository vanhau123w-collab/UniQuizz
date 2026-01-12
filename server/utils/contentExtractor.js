/**
 * Multi-format Content Extractor
 * Trích xuất nội dung từ nhiều định dạng: PDF, URL, YouTube, Images, PPTX
 */

const { PDFParse } = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const mammoth = require('mammoth');

class ContentExtractor {
  /**
   * Extract từ file DOCX (đã có)
   */
  static async extractFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
        metadata: {
          format: 'docx',
          length: result.value.length
        }
      };
    } catch (error) {
      throw new Error('Không thể đọc file DOCX: ' + error.message);
    }
  }

  /**
   * Extract từ file PDF
   */
  static async extractFromPdf(buffer) {
    try {
      // pdf-parse v2 API
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      
      return {
        text: result.text,
        metadata: {
          format: 'pdf',
          pages: result.numpages || result.numPages || 0,
          length: result.text.length,
          info: result.info || {}
        }
      };
    } catch (error) {
      throw new Error('Không thể đọc file PDF: ' + error.message);
    }
  }

  /**
   * Extract từ URL (web scraping)
   */
  static async extractFromUrl(url) {
    try {
      // Validate URL
      const urlObj = new URL(url);
      
      // Fetch page
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Remove script, style, nav, footer
      $('script, style, nav, footer, header, .ad, .advertisement').remove();

      // Extract main content
      let text = '';
      
      // Try common content selectors
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.article-content',
        '#content',
        '.entry-content'
      ];

      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > text.length) {
          text = content;
        }
      }

      // Fallback to body
      if (!text || text.length < 100) {
        text = $('body').text();
      }

      // Clean up text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      if (text.length < 100) {
        throw new Error('Không thể trích xuất đủ nội dung từ URL');
      }

      return {
        text,
        metadata: {
          format: 'url',
          url: url,
          title: $('title').text() || 'Untitled',
          length: text.length
        }
      };
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new Error('URL không tồn tại hoặc không thể truy cập');
      }
      throw new Error('Không thể đọc nội dung từ URL: ' + error.message);
    }
  }

  /**
   * Extract từ YouTube video (transcript)
   */
  static async extractFromYouTube(url) {
    try {
      // Extract video ID
      const videoId = this.extractYouTubeId(url);
      if (!videoId) {
        throw new Error('URL YouTube không hợp lệ');
      }

      // Get transcript using YouTube API or scraping
      // Note: Cần YouTube Data API key hoặc dùng thư viện youtube-transcript
      
      // Fallback: Scrape video description and title
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('title').text();

      // Extract description
      const description = $('meta[property="og:description"]').attr('content') || 
                         $('meta[name="description"]').attr('content') || '';

      const text = `${title}\n\n${description}`;

      if (text.length < 50) {
        throw new Error('Không thể trích xuất transcript. Vui lòng thử URL khác hoặc paste nội dung trực tiếp.');
      }

      return {
        text,
        metadata: {
          format: 'youtube',
          videoId,
          url,
          title,
          length: text.length,
          note: 'Transcript tự động có thể không đầy đủ. Khuyến nghị paste nội dung trực tiếp.'
        }
      };
    } catch (error) {
      throw new Error('Không thể đọc YouTube video: ' + error.message);
    }
  }

  /**
   * Extract YouTube video ID từ URL
   */
  static extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract từ plain text
   */
  static async extractFromText(text) {
    return {
      text: text.trim(),
      metadata: {
        format: 'text',
        length: text.length
      }
    };
  }

  /**
   * Extract từ Image (OCR) - Placeholder
   * Note: Cần Google Cloud Vision API hoặc Tesseract.js
   */
  static async extractFromImage(buffer) {
    // TODO: Implement OCR
    // Có thể dùng:
    // - Google Cloud Vision API
    // - Tesseract.js
    // - Azure Computer Vision
    
    throw new Error('OCR chưa được implement. Vui lòng sử dụng định dạng khác.');
  }

  /**
   * Extract từ PPTX
   */
  static async extractFromPptx(buffer) {
    try {
      const JSZip = require('jszip');
      const xml2js = require('xml2js');
      
      const zip = await JSZip.loadAsync(buffer);
      let text = '';
      
      // Extract từ các slide
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      );
      
      for (const slideFile of slideFiles) {
        const slideXml = await zip.files[slideFile].async('string');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(slideXml);
        
        // Extract text từ slide
        const extractText = (obj) => {
          if (!obj) return '';
          if (typeof obj === 'string') return obj + ' ';
          if (Array.isArray(obj)) {
            return obj.map(extractText).join('');
          }
          if (typeof obj === 'object') {
            return Object.values(obj).map(extractText).join('');
          }
          return '';
        };
        
        text += extractText(result) + '\n\n';
      }
      
      // Clean up text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      if (text.length < 50) {
        throw new Error('Không thể trích xuất đủ nội dung từ PPTX');
      }
      
      return {
        text,
        metadata: {
          format: 'pptx',
          slides: slideFiles.length,
          length: text.length
        }
      };
    } catch (error) {
      throw new Error('Không thể đọc file PPTX: ' + error.message);
    }
  }

  /**
   * Auto-detect format và extract
   */
  static async extractContent(input, type = 'auto') {
    console.log(`[Content Extractor] Detecting format: ${type}`);

    try {
      // Auto-detect nếu type = 'auto'
      if (type === 'auto') {
        type = this.detectType(input);
      }

      let result;

      switch (type) {
        case 'docx':
          result = await this.extractFromDocx(input);
          break;
        
        case 'pdf':
          result = await this.extractFromPdf(input);
          break;
        
        case 'url':
          result = await this.extractFromUrl(input);
          break;
        
        case 'youtube':
          result = await this.extractFromYouTube(input);
          break;
        
        case 'text':
          result = await this.extractFromText(input);
          break;
        
        case 'image':
          result = await this.extractFromImage(input);
          break;
        
        case 'pptx':
          result = await this.extractFromPptx(input);
          break;
        
        default:
          throw new Error(`Định dạng không được hỗ trợ: ${type}`);
      }

      console.log(`[Content Extractor] ✅ Extracted ${result.text.length} characters from ${type}`);
      
      return result;
    } catch (error) {
      console.error(`[Content Extractor] ❌ Error:`, error.message);
      throw error;
    }
  }

  /**
   * Detect input type
   */
  static detectType(input) {
    // If string, check if URL
    if (typeof input === 'string') {
      if (input.startsWith('http://') || input.startsWith('https://')) {
        if (input.includes('youtube.com') || input.includes('youtu.be')) {
          return 'youtube';
        }
        return 'url';
      }
      return 'text';
    }

    // If buffer, check file signature
    if (Buffer.isBuffer(input)) {
      // PDF signature: %PDF
      if (input.toString('utf8', 0, 4) === '%PDF') {
        return 'pdf';
      }

      // DOCX/PPTX signature: PK (ZIP) - need to check content
      if (input[0] === 0x50 && input[1] === 0x4B) {
        // Check for PPTX vs DOCX by looking at file structure
        const str = input.toString('utf8', 0, 100);
        if (str.includes('ppt/')) {
          return 'pptx';
        }
        return 'docx';
      }

      // Image signatures
      if (input[0] === 0xFF && input[1] === 0xD8) {
        return 'image'; // JPEG
      }
      if (input[0] === 0x89 && input[1] === 0x50) {
        return 'image'; // PNG
      }
    }

    return 'unknown';
  }

  /**
   * Validate extracted content
   */
  static validateContent(content) {
    if (!content || !content.text) {
      return { valid: false, error: 'Không có nội dung' };
    }

    if (content.text.length < 50) {
      return { valid: false, error: 'Nội dung quá ngắn (< 50 ký tự)' };
    }

    if (content.text.length > 100000) {
      return { valid: false, error: 'Nội dung quá dài (> 100,000 ký tự)' };
    }

    return { valid: true };
  }
}

module.exports = ContentExtractor;
