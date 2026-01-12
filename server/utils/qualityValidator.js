/**
 * Quality Validator - Kiểm tra chất lượng câu trả lời từ AI
 */

const { QUALITY_RULES } = require('../config/aiPrompts');

class QuestionValidator {
  /**
   * Validate một câu hỏi quiz
   */
  static validate(question) {
    const issues = [];
    const warnings = [];

    // 1. Check question text
    if (!question.question || typeof question.question !== 'string') {
      issues.push('Thiếu nội dung câu hỏi');
    } else {
      const qLength = question.question.length;
      if (qLength < QUALITY_RULES.question.minLength) {
        issues.push(`Câu hỏi quá ngắn (${qLength} ký tự, tối thiểu ${QUALITY_RULES.question.minLength})`);
      }
      if (qLength > QUALITY_RULES.question.maxLength) {
        warnings.push(`Câu hỏi hơi dài (${qLength} ký tự, nên < ${QUALITY_RULES.question.maxLength})`);
      }

      // Check avoid words
      const lowerQuestion = question.question.toLowerCase();
      QUALITY_RULES.question.avoidWords.forEach(word => {
        if (lowerQuestion.includes(word.toLowerCase())) {
          warnings.push(`Câu hỏi chứa cụm từ nên tránh: "${word}"`);
        }
      });
    }

    // 2. Check options
    if (!Array.isArray(question.options)) {
      issues.push('Options không phải là mảng');
    } else {
      if (question.options.length !== QUALITY_RULES.options.count) {
        issues.push(`Số lượng options không đúng (${question.options.length}, cần ${QUALITY_RULES.options.count})`);
      }

      // Check unique options
      if (QUALITY_RULES.options.mustBeUnique) {
        const uniqueOptions = new Set(question.options);
        if (uniqueOptions.size !== question.options.length) {
          issues.push('Có đáp án trùng lặp');
        }
      }

      // Check option lengths
      question.options.forEach((opt, i) => {
        if (!opt || typeof opt !== 'string') {
          issues.push(`Option ${i + 1} không hợp lệ`);
        } else {
          const optLength = opt.length;
          if (optLength < QUALITY_RULES.options.minLength) {
            warnings.push(`Option ${i + 1} quá ngắn (${optLength} ký tự)`);
          }
          if (optLength > QUALITY_RULES.options.maxLength) {
            warnings.push(`Option ${i + 1} quá dài (${optLength} ký tự)`);
          }
        }
      });

      // Check similar length
      if (QUALITY_RULES.options.similarLength && question.options.length > 0) {
        const lengths = question.options.map(opt => opt.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const maxDiff = Math.max(...lengths) - Math.min(...lengths);
        
        if (maxDiff > avgLength * 0.5) {
          warnings.push('Độ dài các đáp án chênh lệch quá nhiều');
        }
      }
    }

    // 3. Check answer
    if (!question.answer) {
      issues.push('Thiếu đáp án đúng');
    } else {
      if (QUALITY_RULES.answer.mustBeInOptions) {
        if (!question.options || !question.options.includes(question.answer)) {
          issues.push(`Đáp án "${question.answer}" không có trong options`);
        }
      }
    }

    // 4. Check explanation
    if (!question.explanation) {
      warnings.push('Thiếu giải thích cho đáp án');
    } else {
      const expLength = question.explanation.length;
      if (expLength < QUALITY_RULES.explanation.minLength) {
        warnings.push(`Giải thích quá ngắn (${expLength} ký tự, nên > ${QUALITY_RULES.explanation.minLength})`);
      }
      if (expLength > QUALITY_RULES.explanation.maxLength) {
        warnings.push(`Giải thích quá dài (${expLength} ký tự, nên < ${QUALITY_RULES.explanation.maxLength})`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      score: this.calculateScore(issues, warnings)
    };
  }

  /**
   * Calculate quality score (0-100)
   */
  static calculateScore(issues, warnings) {
    let score = 100;
    score -= issues.length * 20; // Each issue: -20 points
    score -= warnings.length * 5; // Each warning: -5 points
    return Math.max(0, score);
  }

  /**
   * Validate toàn bộ quiz
   */
  static validateQuiz(quizData) {
    const results = {
      valid: true,
      summary: {
        totalQuestions: 0,
        validQuestions: 0,
        invalidQuestions: 0,
        averageScore: 0
      },
      questions: [],
      overallIssues: []
    };

    // Check summary
    if (!Array.isArray(quizData.summary) || quizData.summary.length === 0) {
      results.overallIssues.push('Thiếu hoặc sai format summary');
    }

    // Check questions
    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      results.overallIssues.push('Thiếu hoặc sai format questions');
      results.valid = false;
      return results;
    }

    results.summary.totalQuestions = quizData.questions.length;

    // Validate each question
    quizData.questions.forEach((q, index) => {
      const validation = this.validate(q);
      results.questions.push({
        index: index + 1,
        question: q.question,
        ...validation
      });

      if (validation.valid) {
        results.summary.validQuestions++;
      } else {
        results.summary.invalidQuestions++;
        results.valid = false;
      }
    });

    // Calculate average score
    const scores = results.questions.map(q => q.score);
    results.summary.averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    return results;
  }

  /**
   * Auto-fix common issues
   */
  static autoFix(question) {
    const fixed = { ...question };
    let changes = [];

    // Fix 1: Trim whitespace
    if (fixed.question) {
      const trimmed = fixed.question.trim();
      if (trimmed !== fixed.question) {
        fixed.question = trimmed;
        changes.push('Đã xóa khoảng trắng thừa trong câu hỏi');
      }
    }

    // Fix 2: Trim options
    if (Array.isArray(fixed.options)) {
      fixed.options = fixed.options.map(opt => opt.trim());
      changes.push('Đã xóa khoảng trắng thừa trong options');
    }

    // Fix 3: Fix answer if close match
    if (fixed.answer && Array.isArray(fixed.options)) {
      const trimmedAnswer = fixed.answer.trim();
      
      if (!fixed.options.includes(trimmedAnswer)) {
        // Try to find close match
        const closeMatch = fixed.options.find(opt => 
          opt.toLowerCase() === trimmedAnswer.toLowerCase()
        );
        
        if (closeMatch) {
          fixed.answer = closeMatch;
          changes.push(`Đã sửa answer từ "${trimmedAnswer}" thành "${closeMatch}"`);
        }
      }
    }

    // Fix 4: Remove duplicate options
    if (Array.isArray(fixed.options)) {
      const uniqueOptions = [...new Set(fixed.options)];
      if (uniqueOptions.length !== fixed.options.length) {
        fixed.options = uniqueOptions;
        changes.push('Đã xóa options trùng lặp');
      }
    }

    return {
      fixed,
      changes,
      wasFixed: changes.length > 0
    };
  }
}

class FlashcardValidator {
  /**
   * Validate một flashcard
   */
  static validate(flashcard) {
    const issues = [];
    const warnings = [];

    // Check front
    if (!flashcard.front || typeof flashcard.front !== 'string') {
      issues.push('Thiếu nội dung mặt trước');
    } else {
      if (flashcard.front.length < 3) {
        issues.push('Mặt trước quá ngắn');
      }
      if (flashcard.front.length > 100) {
        warnings.push('Mặt trước hơi dài');
      }
    }

    // Check back
    if (!flashcard.back || typeof flashcard.back !== 'string') {
      issues.push('Thiếu nội dung mặt sau');
    } else {
      if (flashcard.back.length < 5) {
        issues.push('Mặt sau quá ngắn');
      }
      if (flashcard.back.length > 200) {
        warnings.push('Mặt sau hơi dài');
      }
    }

    // Check hint (optional but recommended)
    if (!flashcard.hint) {
      warnings.push('Nên có hint để dễ nhớ hơn');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      score: QuestionValidator.calculateScore(issues, warnings)
    };
  }

  /**
   * Validate toàn bộ flashcard set
   */
  static validateSet(flashcards) {
    const results = {
      valid: true,
      summary: {
        total: flashcards.length,
        valid: 0,
        invalid: 0,
        averageScore: 0
      },
      flashcards: []
    };

    flashcards.forEach((fc, index) => {
      const validation = this.validate(fc);
      results.flashcards.push({
        index: index + 1,
        ...validation
      });

      if (validation.valid) {
        results.summary.valid++;
      } else {
        results.summary.invalid++;
        results.valid = false;
      }
    });

    const scores = results.flashcards.map(fc => fc.score);
    results.summary.averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    return results;
  }
}

module.exports = {
  QuestionValidator,
  FlashcardValidator
};
