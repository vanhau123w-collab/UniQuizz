/**
 * Prompt Builder - Xây dựng prompts động và tối ưu
 */

const { SYSTEM_PROMPTS, FEW_SHOT_EXAMPLES, PROMPT_TEMPLATES } = require('../config/aiPrompts');

class PromptBuilder {
  constructor(type = 'quizGeneration') {
    this.type = type;
    this.systemPrompt = SYSTEM_PROMPTS[type] || {};
    this.context = '';
    this.userInput = '';
    this.constraints = [];
    this.examples = [];
    this.template = null;
    this.customInstructions = '';
  }

  /**
   * Set loại prompt (quiz, flashcard, mentor, vocabulary)
   */
  setType(type) {
    this.type = type;
    this.systemPrompt = SYSTEM_PROMPTS[type] || {};
    return this;
  }

  /**
   * Thêm ngữ cảnh (tài liệu, văn bản nguồn)
   */
  addContext(context) {
    this.context = context;
    return this;
  }

  /**
   * Thêm input từ user
   */
  addUserInput(input) {
    this.userInput = input;
    return this;
  }

  /**
   * Thêm ràng buộc (số câu hỏi, độ khó, etc.)
   */
  addConstraints(constraints) {
    if (Array.isArray(constraints)) {
      this.constraints = [...this.constraints, ...constraints];
    } else {
      this.constraints.push(constraints);
    }
    return this;
  }

  /**
   * Thêm few-shot examples
   */
  addFewShotExamples(count = 2) {
    const examples = FEW_SHOT_EXAMPLES[this.type.replace('Generation', '')] || [];
    this.examples = examples.slice(0, count);
    return this;
  }

  /**
   * Áp dụng template có sẵn
   */
  applyTemplate(templateName) {
    this.template = PROMPT_TEMPLATES[templateName];
    if (this.template) {
      if (this.template.focus) {
        this.addConstraints(`Tập trung vào: ${this.template.focus.join(', ')}`);
      }
      if (this.template.instructions) {
        this.customInstructions = this.template.instructions;
      }
    }
    return this;
  }

  /**
   * Thêm custom instructions
   */
  addCustomInstructions(instructions) {
    this.customInstructions = instructions;
    return this;
  }

  /**
   * Build prompt cuối cùng
   */
  build() {
    let prompt = '';

    // 1. System Role
    if (this.systemPrompt.role) {
      prompt += `${this.systemPrompt.role}\n\n`;
    }

    // 2. Rules
    if (this.systemPrompt.rules && this.systemPrompt.rules.length > 0) {
      prompt += `QUY TẮC BẮT BUỘC:\n`;
      this.systemPrompt.rules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
      prompt += '\n';
    }

    // 3. Guidelines
    if (this.systemPrompt.guidelines && this.systemPrompt.guidelines.length > 0) {
      prompt += `HƯỚNG DẪN:\n`;
      this.systemPrompt.guidelines.forEach((guide, i) => {
        prompt += `- ${guide}\n`;
      });
      prompt += '\n';
    }

    // 4. Custom Instructions
    if (this.customInstructions) {
      prompt += `CHỈ DẪN ĐẶC BIỆT:\n${this.customInstructions}\n\n`;
    }

    // 5. Constraints
    if (this.constraints.length > 0) {
      prompt += `RÀNG BUỘC:\n`;
      this.constraints.forEach((constraint, i) => {
        prompt += `- ${constraint}\n`;
      });
      prompt += '\n';
    }

    // 6. Few-Shot Examples
    if (this.examples.length > 0) {
      prompt += `VÍ DỤ MONG MUỐN:\n\n`;
      this.examples.forEach((example, i) => {
        prompt += `Ví dụ ${i + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${JSON.stringify(example.output, null, 2)}\n\n`;
      });
    }

    // 7. Format Specification
    if (this.systemPrompt.format) {
      prompt += `ĐỊNH DẠNG OUTPUT:\n`;
      prompt += `${JSON.stringify(this.systemPrompt.format, null, 2)}\n\n`;
    }

    // 8. Context (nếu có)
    if (this.context) {
      prompt += `NGỮ CẢNH/TÀI LIỆU:\n---\n${this.context}\n---\n\n`;
    }

    // 9. User Input/Request
    if (this.userInput) {
      prompt += `YÊU CẦU:\n${this.userInput}\n`;
    }

    return prompt.trim();
  }

  /**
   * Build prompt cho quiz generation
   */
  static buildQuizPrompt(text, numQuestions = 10, options = {}) {
    const builder = new PromptBuilder('quizGeneration');
    
    builder
      .addContext(text)
      .addConstraints([
        `Tạo chính xác ${numQuestions} câu hỏi`,
        `Mỗi câu hỏi có 4 đáp án (1 đúng, 3 sai)`,
        `QUAN TRỌNG: Trường "answer" PHẢI là NỘI DUNG CHÍNH XÁC của 1 trong 4 options`,
        `KHÔNG dùng chữ cái A/B/C/D, KHÔNG dùng số 0/1/2/3`,
        `Ví dụ: Nếu options là ["Glucose", "Protein", "Lipid", "DNA"], answer phải là "Glucose" (không phải "A" hay "0")`,
        `BẮT BUỘC: Đáp án đúng phải PHÂN BỐ ĐỀU giữa các vị trí (option 1, 2, 3, 4)`,
        `KHÔNG được để đáp án đúng toàn ở vị trí đầu tiên hoặc cùng 1 vị trí`,
        `Xáo trộn vị trí đáp án đúng để tạo sự đa dạng`,
        `Trả về JSON với cấu trúc: { "summary": [...], "questions": [...] }`
      ])
      .addUserInput(`Tạo ${numQuestions} câu hỏi trắc nghiệm từ tài liệu trên.`);

    // Apply template nếu có
    if (options.template) {
      builder.applyTemplate(options.template);
    }

    // Add few-shot examples
    if (options.includeFewShot !== false) {
      builder.addFewShotExamples(2);
    }

    // Custom instructions
    if (options.customInstructions) {
      builder.addCustomInstructions(options.customInstructions);
    }

    // Difficulty level
    if (options.difficulty) {
      const difficultyMap = {
        1: 'Rất dễ - Câu hỏi cơ bản, định nghĩa đơn giản',
        2: 'Dễ - Câu hỏi về khái niệm chính',
        3: 'Trung bình - Yêu cầu hiểu và áp dụng',
        4: 'Khó - Phân tích, so sánh, đánh giá',
        5: 'Rất khó - Tổng hợp, sáng tạo, giải quyết vấn đề'
      };
      builder.addConstraints(`Độ khó: ${difficultyMap[options.difficulty] || difficultyMap[3]}`);
    }

    return builder.build();
  }

  /**
   * Build prompt cho flashcard generation
   */
  static buildFlashcardPrompt(text, count = 20, options = {}) {
    const builder = new PromptBuilder('flashcardGeneration');
    
    builder
      .addContext(text)
      .addConstraints([
        `Tạo chính xác ${count} flashcards`,
        `Mỗi flashcard tập trung vào 1 khái niệm`,
        `Trả về JSON với cấu trúc: { "flashcards": [...] }`
      ])
      .addUserInput(`Tạo ${count} flashcards từ tài liệu trên.`);

    if (options.includeFewShot !== false) {
      builder.addFewShotExamples(2);
    }

    if (options.customInstructions) {
      builder.addCustomInstructions(options.customInstructions);
    }

    return builder.build();
  }

  /**
   * Build prompt cho mentor chat
   */
  static buildMentorPrompt(question, lectureContext = '', options = {}) {
    const builder = new PromptBuilder('mentorChat');
    
    if (lectureContext) {
      builder.addContext(lectureContext);
    }

    builder.addUserInput(`Câu hỏi của học sinh: ${question}`);

    if (options.customInstructions) {
      builder.addCustomInstructions(options.customInstructions);
    }

    return builder.build();
  }

  /**
   * Build prompt cho vocabulary generation
   */
  static buildVocabularyPrompt(topic, count = 10, options = {}) {
    const builder = new PromptBuilder('vocabularyGeneration');
    
    builder
      .addConstraints([
        `Tạo ${count} từ vựng về chủ đề: ${topic}`,
        `Trả về JSON với cấu trúc: { "words": [...] }`
      ])
      .addUserInput(`Tạo ${count} từ vựng tiếng Anh quan trọng về chủ đề "${topic}".`);

    if (options.includeFewShot !== false) {
      builder.addFewShotExamples(1);
    }

    return builder.build();
  }
}

/**
 * Context Manager - Quản lý context window
 */
class ContextManager {
  constructor(maxTokens = 4000) {
    this.maxTokens = maxTokens;
  }

  /**
   * Ước tính số tokens (rough: 1 token ≈ 4 characters)
   */
  countTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Optimize context để fit vào token limit
   */
  optimize(document, systemPrompt) {
    const systemTokens = this.countTokens(systemPrompt);
    const availableTokens = this.maxTokens - systemTokens - 500; // Reserve 500 for response

    if (this.countTokens(document) <= availableTokens) {
      return document;
    }

    // Truncate document if too long
    const maxChars = availableTokens * 4;
    return document.substring(0, maxChars) + '\n\n[... Tài liệu đã được rút gọn do quá dài ...]';
  }

  /**
   * Chunk document thành các phần nhỏ
   */
  chunkDocument(document, chunkSize = 2000) {
    const chunks = [];
    const words = document.split(' ');
    let currentChunk = '';

    for (const word of words) {
      if (this.countTokens(currentChunk + ' ' + word) > chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += ' ' + word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

module.exports = {
  PromptBuilder,
  ContextManager
};
