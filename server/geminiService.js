require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PromptBuilder, ContextManager } = require('./utils/promptBuilder');
const { QuestionValidator, FlashcardValidator } = require('./utils/qualityValidator');
const RAGService = require('./services/ragService');

// --- Cấu hình Ban Đầu ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Sử dụng model có tốc độ tốt và khả năng theo format JSON
const PREFERRED_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

// Nếu không có key, KHÔNG ném lỗi tại startup — chỉ tắt tính năng AI
const AI_ENABLED = Boolean(GEMINI_API_KEY);
if (!AI_ENABLED) {
  console.warn('⚠️ GEMINI_API_KEY không được cấu hình — các endpoint AI sẽ trả về lỗi. Server vẫn sẽ chạy.');
}

let genAI = null;
if (AI_ENABLED) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Danh sách model ưu tiên (có fallback)
const FALLBACK_MODELS = [
    PREFERRED_MODEL,
    'gemini-1.5-flash',
    'gemini-1.5-pro'
].filter(Boolean);

console.log(`[Khởi tạo AI] Đang cố gắng sử dụng model: ${PREFERRED_MODEL}`);
console.log(`[Prompt Engineering] ✅ Đã kích hoạt`);

// Context Manager instance
const contextManager = new ContextManager(4000);

// --- Helpers ---

/**
 * Helper: Rate limiting và retry logic
 */
const RATE_LIMIT = {
    minDelay: 1000, // 1 giây giữa các request
    maxRetries: 3,
    retryDelay: 5000 // 5 giây khi gặp lỗi 429
};

let lastRequestTime = 0;

async function waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT.minDelay) {
        const waitTime = RATE_LIMIT.minDelay - timeSinceLastRequest;
        console.log(`[Rate Limit] Chờ ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
}

async function retryWithBackoff(fn, retries = RATE_LIMIT.maxRetries) {
    for (let i = 0; i < retries; i++) {
        try {
            await waitForRateLimit();
            return await fn();
        } catch (error) {
            const errMsg = error?.message || String(error);
            
            // Nếu là lỗi 429, retry với delay lâu hơn
            if (/429|Too Many Requests|quota/i.test(errMsg)) {
                if (i < retries - 1) {
                    const delay = RATE_LIMIT.retryDelay * (i + 1);
                    console.log(`[Rate Limit] ⚠️ Lỗi 429, retry sau ${delay}ms... (${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            throw error;
        }
    }
}

/**
 * Helper: Cấu hình bắt buộc để model trả về JSON
 */
const jsonGenerationConfig = {
    responseMimeType: "application/json",
};

/**
 * Tạo client model với logic fallback.
 */
async function getModelClient() {
  if (!AI_ENABLED) {
    throw new Error('Gemini API không được cấu hình. Vui lòng đặt GEMINI_API_KEY trong .env để bật tính năng AI.');
  }
    for (const name of FALLBACK_MODELS) {
        try {
            const client = genAI.getGenerativeModel({ model: name });
            // Thêm log để biết model nào đang được dùng
            // console.log(`Using Gemini model: ${name}`);
            return { client, name };
        } catch (e) {
            // console.warn(`Model ${name} không khả dụng, thử model tiếp theo...`);
        }
    }
    throw new Error('Không tạo được model client. Thử đặt GEMINI_MODEL=gemini-1.5-flash trong .env');
}

/**
 * Helper: Trích xuất JSON an toàn từ phản hồi của AI
 */
async function extractJsonFromResponse(response) {
    let textResp = await response.text();
    textResp = textResp.replace(/```json|```/g, '').trim();

    try {
        return JSON.parse(textResp);
    } catch (e) {
        // Thử tìm JSON lồng bên trong
        const match = textResp.match(/\{[\s\S]*\}$/);
        if (match && match[0]) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                console.error('Không thể parse JSON từ text (lần 2):', textResp);
                throw new Error('AI trả về định dạng không parse được JSON (lần 2)');
            }
        }
        console.error('AI trả về không phải JSON:', textResp);
        throw new Error('AI trả về định dạng không parse được JSON');
    }
}

/**
 * helper: gọi list models (debug/log)
 */
async function listAvailableModels() {
    try {
    // Nếu AI chưa bật, trả về mảng rỗng (không lỗi) — dùng để debug nhẹ
    if (!AI_ENABLED) {
      return [];
    }

    // Dùng REST API để lấy danh sách models
    const fetch = global.fetch || (await import('node-fetch')).default;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const r = await fetch(url);

    if (!r.ok) {
      const errorText = await r.text();
      throw new Error(`API call failed with status ${r.status}: ${errorText}`);
    }

    const data = await r.json();
    return data.models || [];
    } catch (err) {
        console.warn('Không thể lấy model list:', err.message);
        return [];
    }
}

// --- Hàm Chính ---

/**
 * Hàm 1: generate quiz với RAG + Prompt Engineering
 * @param {string} text - Văn bản nguồn.
 * @param {number} numQuestions - Số lượng câu hỏi cần tạo (mặc định 10).
 * @param {object} options - Tùy chọn: template, difficulty, customInstructions, userId, useRAG
 */
async function generateQuizFromText(text, numQuestions = 10, options = {}) {
    numQuestions = Math.max(1, Math.min(20, parseInt(numQuestions, 10) || 10));

    console.log(`[Quiz Generation] Tạo ${numQuestions} câu hỏi với ${options.useRAG ? 'RAG +' : ''} Prompt Engineering...`);

    let enhancedText = text;
    let ragSources = [];

    // 1. RAG Enhancement - Tìm kiếm context liên quan
    if (options.useRAG && options.userId) {
        try {
            console.log('[RAG] 🔍 Tìm kiếm context liên quan...');
            
            // Tạo search query từ text input
            const searchQuery = text.substring(0, 200); // Lấy 200 ký tự đầu làm query
            
            const ragResult = await RAGService.getRelevantContext(options.userId, searchQuery, {
                maxChunks: 3,
                maxContextLength: 2000,
                includePublic: true
            });
            
            if (ragResult.context) {
                enhancedText = `NGỮ CẢNH LIÊN QUAN:\n${ragResult.context}\n\nNỘI DUNG CHÍNH:\n${text}`;
                ragSources = ragResult.sources;
                
                console.log(`[RAG] ✅ Đã bổ sung context từ ${ragResult.totalChunks} chunks, ${ragSources.length} tài liệu`);
                
                // Cập nhật usage stats
                const documentIds = ragSources.map(s => s.documentId);
                await RAGService.recordDocumentUsage(documentIds, 'quizGenerated');
            } else {
                console.log('[RAG] ⚠️ Không tìm thấy context liên quan, sử dụng text gốc');
            }
        } catch (error) {
            console.error('[RAG] ❌ Lỗi RAG, fallback về text gốc:', error.message);
        }
    }

    // 2. Build prompt với enhanced text
    const prompt = PromptBuilder.buildQuizPrompt(enhancedText, numQuestions, {
        template: options.template || 'universityExam',
        difficulty: options.difficulty || 3,
        includeFewShot: true,
        customInstructions: options.customInstructions
    });

    // 2. Optimize context nếu quá dài
    const optimizedPrompt = contextManager.optimize(prompt, '');

    let modelName = PREFERRED_MODEL;

    try {
        const picked = await getModelClient();
        const modelClient = picked.client;
        modelName = picked.name;

        console.log(`[Quiz Generation] Sử dụng model: ${modelName}`);

        const generation = await retryWithBackoff(async () => {
            return await modelClient.generateContent({
                contents: [{ role: "user", parts: [{ text: optimizedPrompt }] }],
                generationConfig: jsonGenerationConfig
            });
        });

        const jsonData = await extractJsonFromResponse(generation.response);

        if (!jsonData || !Array.isArray(jsonData.summary) || !Array.isArray(jsonData.questions)) {
            throw new Error('Định dạng AI trả về không hợp lệ');
        }

        // 3. Validate response quality
        const validation = QuestionValidator.validateQuiz(jsonData);
        
        console.log(`[Quiz Validation] Score: ${validation.summary.averageScore}/100`);
        console.log(`[Quiz Validation] Valid: ${validation.summary.validQuestions}/${validation.summary.totalQuestions}`);

        if (!validation.valid) {
            console.warn('[Quiz Validation] Issues found:', validation.overallIssues);
            
            // 4. Auto-fix common issues
            let fixedCount = 0;
            jsonData.questions = jsonData.questions.map((q, index) => {
                const { fixed, changes, wasFixed } = QuestionValidator.autoFix(q);
                if (wasFixed) {
                    fixedCount++;
                    console.log(`[Auto-Fix] Question ${index + 1}:`, changes);
                }
                return fixed;
            });

            if (fixedCount > 0) {
                console.log(`[Auto-Fix] ✅ Đã sửa ${fixedCount} câu hỏi`);
            }
        } else {
            console.log('[Quiz Validation] ✅ Tất cả câu hỏi hợp lệ');
        }

        // 5. Thêm RAG metadata vào response
        if (options.useRAG && ragSources.length > 0) {
            jsonData.ragMetadata = {
                sourcesUsed: ragSources.length,
                sources: ragSources.map(s => ({
                    title: s.title,
                    fileType: s.fileType
                }))
            };
        }

        return jsonData;
    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error(`[Quiz Generation] ❌ Lỗi (model: ${modelName}):`, errMsg);

        if (/not found|404|invalid api key/i.test(errMsg)) {
            await listAvailableModels();
            throw new Error(`Model "${modelName}" không khả dụng.`);
        }

        throw new Error('Không thể tạo quiz từ AI: ' + errMsg);
    }
}

async function generateWordsFromTopic(topic) {
  if (!AI_ENABLED) {
    throw new Error('Gemini API key không được cấu hình — không thể tạo từ vựng.');
  }
  const prompt = `
Tạo 10 từ vựng tiếng Anh quan trọng về chủ đề "${topic}".
YÊU CẦU:
- Trả về MỘT đối tượng JSON duy nhất (không dùng markdown).
- Định nghĩa (definition) phải BẰNG TIẾNG VIỆT.
- Câu ví dụ (example) phải BẰNG TIẾNG ANH.
- Cấu trúc:
{ "words": [ { "word": "...", "definition": "...", "example": "..." } ] }
`.trim();

  let modelName = PREFERRED_MODEL;
  let modelClient;
  try {
    modelClient = genAI.getGenerativeModel({ model: modelName });
  } catch (err) {
    console.warn('Lỗi khi tạo model client với', modelName, err);
  }

  try {
    // ... (Copy-paste code try...catch y hệt hàm trên) ...
    if (!modelClient) throw new Error('Không tạo được model client');
    const generation = await retryWithBackoff(async () => {
        return await modelClient.generateContent(prompt);
    });
    const response = await generation.response;
    let textResp = await response.text();
    textResp = textResp.replace(/```json|```/g, '').trim();
    let jsonData;
    try { jsonData = JSON.parse(textResp); } catch (e) {
      const match = textResp.match(/\{[\s\S]*\}$/);
      if (!match) throw new Error('AI (Vocab) trả về định dạng không parse được JSON');
      jsonData = JSON.parse(match[0]);
    }
    if (!Array.isArray(jsonData.words)) {
      throw new Error('Định dạng AI (Vocab) trả về không hợp lệ');
    }
    return jsonData;

  } catch (error) {
    // ... (Copy-paste code xử lý lỗi y hệt hàm trên) ...
    const errMsg = error?.message || String(error);
    console.error('Lỗi khi gọi Gemini API (Vocab):', errMsg);
    if (/not found|404|invalid/i.test(errMsg)) {
      const models = await listAvailableModels();
      console.error('CÓ LỖI MODEL:', `Model "${modelName}" không khả dụng.`);
      console.error(models.slice(0, 30).map(m => m.name).join('\n'));
      throw new Error(`Model "${modelName}" không khả dụng.`);
    }
    throw new Error('Không thể tạo bộ từ vựng từ AI: ' + errMsg);
  }
}

// Tạo 1 từ mới
async function generateSingleWordFromTopic(topic) {
  if (!AI_ENABLED) {
    throw new Error('Gemini API key không được cấu hình — không thể tạo từ vựng.');
  }
  const prompt = `
Tạo 1 từ vựng tiếng Anh DUY NHẤT về chủ đề "${topic}".
YÊU CẦU:
- Tuyệt đối KHÔNG tạo danh sách.
- Tuyệt đối KHÔNG trả về nhiều từ.
- Chỉ trả về MỘT đối tượng JSON DUY NHẤT (không dùng markdown).
- Định nghĩa (definition) phải BẰNG TIẾNG VIỆT.
- Câu ví dụ (example) phải BẰNG TIẾNG ANH.
- Cấu trúc trả về:
{
  "word": "...",
  "definition": "...",
  "example": "..."
}
  `.trim();

  let modelName = PREFERRED_MODEL;
  let modelClient;

  try {
    modelClient = genAI.getGenerativeModel({ model: modelName });
  } catch (err) {
    console.warn("Lỗi tạo model client:", err);
  }

  try {
    if (!modelClient) throw new Error("Không tạo được model client");

    const generation = await retryWithBackoff(async () => {
        return await modelClient.generateContent(prompt);
    });
    const response = generation.response;
    let textResp = await response.text();

    // Xóa markdown nếu có
    textResp = textResp.replace(/```json|```/g, "").trim();

    let jsonData;

    try {
      jsonData = JSON.parse(textResp);
    } catch (e) {
      // fallback tìm đoạn JSON đầu tiên
      const match = textResp.match(/\{[\s\S]*\}$/);
      if (!match) throw new Error("AI trả về sai format JSON");
      jsonData = JSON.parse(match[0]);
    }

    // Kiểm tra đúng cấu trúc (1 từ)
    if (!jsonData.word || !jsonData.definition || !jsonData.example) {
      throw new Error("AI trả về sai cấu trúc cho SINGLE WORD");
    }

    return jsonData; // chỉ 1 từ duy nhất

  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error("Lỗi gọi Gemini API (Single Word):", errMsg);

    if (/404|not found|invalid/i.test(errMsg)) {
      const models = await listAvailableModels();
      console.error("MODEL KHÔNG HỢP LỆ:", modelName);
      console.error(models.slice(0, 30).map(m => m.name).join("\n"));
      throw new Error(`Model "${modelName}" không khả dụng.`);
    }

    throw new Error("Không thể tạo từ vựng từ AI: " + errMsg);
  }
}
/**
 * Hàm 4: generate lecture từ file
 * @param {string} text - Nội dung file nguồn.
 */
async function generateLectureFromFile(text) {
    const prompt = `
Chuyển đổi nội dung sau đây thành một bài giảng dễ hiểu, tự nhiên như một giảng viên thật đang giảng bài.

YÊU CẦU:
- Trả về MỘT đối tượng JSON duy nhất (không dùng markdown).
- Bài giảng phải được chia thành các phần (sections) logic, dễ theo dõi.
- Ngôn ngữ tự nhiên, thân thiện, như một giáo viên đang nói chuyện với học sinh.
- Cấu trúc:
{
  "title": "Tiêu đề bài giảng",
  "sections": [
    {
      "title": "Tiêu đề phần",
      "content": "Nội dung phần này, viết như đang nói chuyện, tự nhiên"
    }
  ]
}

Nội dung:
---
${text}
---
`.trim();

    let modelName = PREFERRED_MODEL;

    try {
        const picked = await getModelClient();
        const modelClient = picked.client;
        modelName = picked.name;
        
        const generation = await retryWithBackoff(async () => {
            return await modelClient.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: jsonGenerationConfig
            });
        });
        
        const jsonData = await extractJsonFromResponse(generation.response);

        if (!jsonData.title || !Array.isArray(jsonData.sections)) {
            throw new Error('Định dạng AI (Lecture) trả về không hợp lệ');
        }
        return jsonData;
    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error('Lỗi khi gọi Gemini API (Lecture):', errMsg);
        if (/not found|404|invalid api key/i.test(errMsg)) {
            await listAvailableModels();
            throw new Error(`Model "${modelName}" không khả dụng.`);
        }
        throw new Error('Không thể tạo bài giảng từ AI: ' + errMsg);
    }
}

/**
 * Hàm 5: generate mentor response với RAG + Prompt Engineering
 * @param {string} question - Câu hỏi của học sinh.
 * @param {string} lectureContext - Ngữ cảnh bài giảng (tùy chọn).
 * @param {object} options - Tùy chọn: customInstructions, userId, useRAG
 */
async function generateMentorResponse(question, lectureContext = '', options = {}) {
    console.log(`[Mentor Chat] Trả lời câu hỏi với ${options.useRAG ? 'RAG +' : ''} Prompt Engineering...`);

    let enhancedContext = lectureContext;
    let ragSources = [];

    // 1. RAG Enhancement - Tìm kiếm context liên quan
    if (options.useRAG && options.userId) {
        try {
            console.log('[RAG] 🔍 Tìm kiếm tài liệu liên quan cho câu hỏi...');
            
            const ragResult = await RAGService.getRelevantContext(options.userId, question, {
                maxChunks: 4,
                maxContextLength: 2500,
                includePublic: true
            });
            
            if (ragResult.context) {
                enhancedContext = lectureContext 
                    ? `${lectureContext}\n\nTÀI LIỆU THAM KHẢO:\n${ragResult.context}`
                    : ragResult.context;
                ragSources = ragResult.sources;
                
                console.log(`[RAG] ✅ Đã bổ sung context từ ${ragResult.totalChunks} chunks, ${ragSources.length} tài liệu`);
                
                // Cập nhật usage stats
                const documentIds = ragSources.map(s => s.documentId);
                await RAGService.recordDocumentUsage(documentIds, 'mentorQuestions');
            } else {
                console.log('[RAG] ⚠️ Không tìm thấy tài liệu liên quan');
            }
        } catch (error) {
            console.error('[RAG] ❌ Lỗi RAG, sử dụng context gốc:', error.message);
        }
    }

    // 2. Build prompt với enhanced context
    const prompt = PromptBuilder.buildMentorPrompt(question, enhancedContext, {
        customInstructions: options.customInstructions
    });

    // 2. Optimize context
    const optimizedPrompt = contextManager.optimize(prompt, '');

    let modelName = PREFERRED_MODEL;

    try {
        const picked = await getModelClient();
        const modelClient = picked.client;
        modelName = picked.name;
        
        console.log(`[Mentor Chat] Sử dụng model: ${modelName}`);
        
        const generation = await retryWithBackoff(async () => {
            return await modelClient.generateContent(optimizedPrompt);
        });
        const aiResponse = await generation.response;
        const answer = aiResponse.text().trim();
        
        console.log(`[Mentor Chat] ✅ Đã tạo câu trả lời (${answer.length} ký tự)`);
        
        // 3. Thêm RAG metadata nếu có
        const response = { answer };
        if (options.useRAG && ragSources.length > 0) {
            response.ragMetadata = {
                sourcesUsed: ragSources.length,
                sources: ragSources.map(s => ({
                    title: s.title,
                    fileType: s.fileType
                }))
            };
        }
        
        return response;
    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error('[Mentor Chat] ❌ Lỗi:', errMsg);
        if (/not found|404|invalid api key/i.test(errMsg)) {
            throw new Error(`Model "${modelName}" không khả dụng.`);
        }
        throw new Error('Không thể tạo phản hồi từ mentor: ' + errMsg);
    }
}

/**
 * Sinh flashcards từ văn bản với Prompt Engineering
 */
async function generateFlashcardsFromText(text, options = {}) {
  const count = Math.max(8, Math.min(50, parseInt(options.count || 20, 10) || 20));

  console.log(`[Flashcard Generation] Tạo ${count} flashcards với Prompt Engineering...`);

  try {
    // 1. Build prompt với Prompt Engineering
    const prompt = PromptBuilder.buildFlashcardPrompt(text, count, {
      includeFewShot: true,
      customInstructions: options.customInstructions
    });

    // 2. Optimize context
    const optimizedPrompt = contextManager.optimize(prompt, '');

    const { client: modelClient, name: modelName } = await getModelClient();
    console.log(`[Flashcard Generation] Sử dụng model: ${modelName}`);

    const result = await retryWithBackoff(async () => {
        return await modelClient.generateContent({
            contents: [{ role: "user", parts: [{ text: optimizedPrompt }] }],
            generationConfig: jsonGenerationConfig
        });
    });

    const response = await result.response;
    const data = await extractJsonFromResponse(response);

    if (!data || !Array.isArray(data.flashcards)) {
      throw new Error('Định dạng AI trả về không hợp lệ (thiếu flashcards)');
    }

    const flashcards = data.flashcards
      .filter(fc => fc && fc.front && fc.back)
      .map(fc => ({
        front: String(fc.front).trim(),
        back: String(fc.back).trim(),
        hint: fc.hint ? String(fc.hint).trim() : undefined,
        tags: Array.isArray(fc.tags) ? fc.tags.map(String) : undefined
      }));

    if (flashcards.length === 0) {
      console.warn("[Flashcard Generation] ⚠️ Không có flashcard nào được tạo");
      return { flashcards: [] };
    }

    // 3. Validate flashcards
    const validation = FlashcardValidator.validateSet(flashcards);
    console.log(`[Flashcard Validation] Score: ${validation.summary.averageScore}/100`);
    console.log(`[Flashcard Validation] Valid: ${validation.summary.valid}/${validation.summary.total}`);

    if (!validation.valid) {
      console.warn('[Flashcard Validation] Some flashcards have issues');
    } else {
      console.log('[Flashcard Validation] ✅ Tất cả flashcards hợp lệ');
    }

    return { flashcards };
  } catch (err) {
    console.error('[Flashcard Generation] ❌ Lỗi:', err.message);
    throw new Error('Không thể tạo flashcards từ AI: ' + err.message);
  }
}
// --- Exports ---
module.exports = {
    generateQuizFromText,
    generateWordsFromTopic,
    generateSingleWordFromTopic,
    generateLectureFromFile,
    generateMentorResponse,
    generateFlashcardsFromText,
    listAvailableModels
};
