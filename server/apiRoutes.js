const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mammoth = require('mammoth');
const mongoose = require('mongoose');

// Import services
const { 
  generateQuizFromText, 
  generateWordsFromTopic,
  generateSingleWordFromTopic,
  generateFlashcardsFromText,
  generateLectureFromFile,
  generateMentorResponse,
  listAvailableModels
} = require('./geminiService');

const { synthesizeWithGoogleTranslate } = require('./services/ttsService');
const ContentExtractor = require('./utils/contentExtractor');
const RAGService = require('./services/ragService');

// Import models
const Deck = require('./models/Deck');
const User = require('./models/User');
const Topic = require('./models/Topic');
const FlashcardSet = require('./models/FlashcardSet');
const Voice = require('./models/voice');
const Lecture = require('./models/Lecture');

const router = express.Router();

/* =======================================================
   1. MIDDLEWARE CHECK TOKEN
======================================================= */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

/* =======================================================
   2. MULTER UPLOAD
======================================================= */
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng file không được hỗ trợ'));
    }
  }
});

/* =======================================================
   3. AUTH ROUTES
======================================================= */

// REGISTER
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email này đã được sử dụng' });

    const user = new User({ email, password, fullName: fullName || '' });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// LOGIN
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const check = await user.comparePassword(password);
    if (!check) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

/* =======================================================
   4. CONTENT EXTRACTION ROUTES
======================================================= */

// Extract content từ nhiều định dạng (PDF, DOCX, URL, YouTube, Image)
router.post('/extract-content', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { url, text, type } = req.body;
    
    let extractedContent;
    
    // Case 1: File upload (PDF, DOCX, PPTX, Image)
    if (req.file) {
      const fileType = type || 'auto';
      console.log(`[Content Extraction] Processing file: ${req.file.originalname}, type: ${fileType}`);
      
      extractedContent = await ContentExtractor.extractContent(req.file.buffer, fileType);
    }
    // Case 2: URL (Web scraping hoặc YouTube)
    else if (url) {
      console.log(`[Content Extraction] Processing URL: ${url}`);
      
      const urlType = url.includes('youtube.com') || url.includes('youtu.be') 
        ? 'youtube' 
        : 'url';
      
      extractedContent = await ContentExtractor.extractContent(url, urlType);
    }
    // Case 3: Plain text
    else if (text) {
      console.log(`[Content Extraction] Processing plain text (${text.length} chars)`);
      extractedContent = await ContentExtractor.extractFromText(text);
    }
    else {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp file, URL, hoặc text' 
      });
    }
    
    // Validate extracted content
    const validation = ContentExtractor.validateContent(extractedContent);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.error 
      });
    }
    
    res.json({
      success: true,
      content: extractedContent.text,
      metadata: extractedContent.metadata
    });
    
  } catch (error) {
    console.error('[Content Extraction] Error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi trích xuất nội dung: ' + error.message 
    });
  }
});

/* =======================================================
   5. QUIZ / DECK ROUTES
======================================================= */

// UPLOAD MULTI-FORMAT → QUIZ (Hỗ trợ PDF, DOCX, URL, YouTube)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, courseCode, questionCount, url, text, useRAG, storeDocument } = req.body;
    const numQuestions = parseInt(questionCount) || 10;

    if (!title)
      return res.status(400).json({ message: 'Thiếu title.' });

    let extractedText;
    let fileMetadata = {};
    
    // Extract content từ nhiều nguồn
    if (req.file) {
      // File upload (PDF, DOCX, etc.)
      console.log(`[Quiz Upload] Processing file: ${req.file.originalname}`);
      const result = await ContentExtractor.extractContent(req.file.buffer, 'auto');
      extractedText = result.text;
      fileMetadata = {
        fileName: req.file.originalname,
        fileType: req.file.originalname.split('.').pop().toLowerCase(),
        size: req.file.size
      };
    } 
    else if (url) {
      // URL hoặc YouTube
      console.log(`[Quiz Upload] Processing URL: ${url}`);
      const urlType = url.includes('youtube.com') || url.includes('youtu.be') 
        ? 'youtube' 
        : 'url';
      const result = await ContentExtractor.extractContent(url, urlType);
      extractedText = result.text;
      fileMetadata = {
        fileName: title,
        fileType: urlType,
        sourceUrl: url
      };
    }
    else if (text) {
      // Plain text
      extractedText = text;
      fileMetadata = {
        fileName: title,
        fileType: 'txt'
      };
    }
    else {
      return res.status(400).json({ message: 'Vui lòng cung cấp file, URL, hoặc text.' });
    }

    if (!extractedText || extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Nội dung quá ngắn (tối thiểu 50 ký tự).' });

    console.log(`[Quiz Upload] Extracted ${extractedText.length} characters, generating ${numQuestions} questions...`);

    // RAG: Lưu document vào database nếu được yêu cầu
    let storedDocument = null;
    if (storeDocument === 'true' || storeDocument === true) {
      try {
        storedDocument = await RAGService.storeDocument(
          req.userId, 
          title, 
          extractedText, 
          {
            ...fileMetadata,
            tags: [courseCode].filter(Boolean)
          }
        );
        console.log(`[RAG] ✅ Đã lưu document: ${storedDocument._id}`);
      } catch (error) {
        console.error('[RAG] ❌ Lỗi lưu document:', error.message);
        // Không fail toàn bộ request nếu lưu document lỗi
      }
    }

    // Generate quiz với RAG nếu được bật
    const ai = await generateQuizFromText(extractedText, numQuestions, {
      template: 'universityExam',
      difficulty: 3,
      userId: req.userId,
      useRAG: useRAG === 'true' || useRAG === true,
      customInstructions: `Tạo quiz cho môn học: ${courseCode || 'Tổng hợp'}`
    });
    
    if (!ai.summary || !ai.questions)
      throw new Error('AI trả về dữ liệu không hợp lệ');

    const deck = new Deck({
      title,
      courseCode,
      summary: ai.summary,
      questions: ai.questions,
      userId: req.userId
    });

    const saved = await deck.save();
    
    // Thêm RAG metadata vào response
    const response = {
      ...saved.toObject(),
      ragMetadata: ai.ragMetadata || null,
      storedDocument: storedDocument ? {
        id: storedDocument._id,
        title: storedDocument.title,
        chunks: storedDocument.metadata.totalChunks
      } : null
    };
    
    res.status(201).json(response);

  } catch (error) {
    console.error('[Quiz Upload] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// GET ALL DECKS
router.get('/decks', verifyToken, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: new mongoose.Types.ObjectId(req.userId) })
      .sort({ createdAt: -1 });

    res.json(decks);
  } catch {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET SINGLE DECK (Authenticated - for owner)
router.get('/decks/:id', verifyToken, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.userId)
    });

    if (!deck)
      return res.status(404).json({ message: 'Không tìm thấy deck' });

    res.json(deck);
  } catch {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET PUBLIC DECK (No authentication required - for shared links)
router.get('/decks/public/:id', async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      isPublic: true
    });

    if (!deck)
      return res.status(404).json({ message: 'Quiz không tồn tại hoặc chưa được chia sẻ công khai' });

    res.json(deck);
  } catch (error) {
    console.error('Error fetching public deck:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// UPDATE DECK PUBLIC STATUS
router.patch('/decks/:id/public', verifyToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.userId)
    });

    if (!deck)
      return res.status(404).json({ message: 'Không tìm thấy deck' });

    deck.isPublic = isPublic;
    await deck.save();

    res.json({ 
      message: isPublic ? 'Quiz đã được chia sẻ công khai' : 'Quiz đã được đặt về riêng tư',
      deck 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// DELETE DECK
router.delete('/decks/:id', verifyToken, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.userId)
    });

    if (!deck)
      return res.status(404).json({ message: 'Không tìm thấy deck để xóa' });

    await Deck.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa thành công', deletedId: deck._id });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

/* =======================================================
   6. TOPICS ROUTES
======================================================= */

router.get('/topics', verifyToken, async (req, res) => {
  try {
    const topics = await Topic.find({
      $or: [{ isSystem: true }, { author: req.userId }]
    }).sort({ isSystem: -1, createdAt: -1 });

    res.json(topics);
  } catch {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/topics/:id', verifyToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic || (!topic.isSystem && topic.author.toString() !== req.userId))
      return res.status(404).json({ message: 'Không có quyền truy cập' });

    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// CREATE TOPIC BY AI
router.post('/topics/generate', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title)
      return res.status(400).json({ message: 'Thiếu title' });

    const ai = await generateWordsFromTopic(title);

    const topic = new Topic({
      title,
      words: ai.words,
      isSystem: false,
      author: req.userId
    });

    const saved = await topic.save();
    res.status(201).json(saved);

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Thay đổi endpoint này để CHỈ GỌI AI và trả về word data (KHÔNG LƯU DB)
router.post('/topics/generate-single', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Thiếu "title" của chủ đề.' });
    }

    console.log(`Đang gọi AI (Single Word) tạo từ cho chủ đề: ${title}`);
    const aiWord = await generateSingleWordFromTopic(title);

    if (!aiWord || !aiWord.word || !aiWord.definition || !aiWord.example) {
      console.error("Lỗi: AI không trả về từ hợp lệ:", aiWord);
      throw new Error("AI không trả về dữ liệu từ vựng hợp lệ.");
    }

    // Endpoint này chỉ dùng để gợi ý nghĩa/ví dụ cho client
    res.status(200).json(aiWord); 

  } catch (error) {
    console.error("Lỗi trong /topics/generate-single:", error.message);
    res.status(500).json({ message: 'Lỗi từ server: ' + error.message });
  }
});

// Endpoint MỚI: Thêm 1 từ vào Topic đã tồn tại (ĐƯỢC GỌI KHI NHẤN LƯU)
router.post('/topics/:topicId/words', verifyToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { word, definition, example } = req.body;

        if (!word || !definition) {
            return res.status(400).json({ message: 'Từ và Định nghĩa là bắt buộc.' });
        }

        const currentUserId = new mongoose.Types.ObjectId(req.userId);

        // Tìm topic (chỉ cho phép author sửa)
        const topic = await Topic.findOne({ 
            _id: topicId,
            author: currentUserId 
        });

        if (!topic) {
            return res.status(404).json({ message: 'Không tìm thấy Topic hoặc bạn không có quyền sửa.' });
        }

        // Tạo đối tượng từ mới
        const newWordEntry = { 
            word: word.trim(), 
            definition: definition.trim(), 
            example: example ? example.trim() : ''
        };

        // Thêm từ mới vào mảng 'words'
        topic.words.push(newWordEntry);
        await topic.save();

        console.log(` Đã thêm từ '${word}' vào Topic ID: ${topicId}`);
        res.status(200).json(topic);

    } catch (error) {
        console.error('Lỗi khi thêm từ vào topic:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

/* =======================================================
   7. FLASHCARDS ROUTES
======================================================= */

// AI generate flashcards (Hỗ trợ multi-format)
router.post('/flashcards/generate', verifyToken, upload.single('file'), async (req, res) => {
  console.log('Đã nhận request /api/flashcards/generate...');
  try {
    const { title, courseCode, text, count, url } = req.body;
    if (!title) return res.status(400).json({ message: 'Thiếu title' });

    let sourceText = '';
    
    // Extract từ nhiều nguồn
    if (text && String(text).trim().length > 0) {
      sourceText = String(text);
    } 
    else if (req.file) {
      console.log(`[Flashcard Generate] Processing file: ${req.file.originalname}`);
      const result = await ContentExtractor.extractContent(req.file.buffer, 'auto');
      sourceText = result.text;
    }
    else if (url) {
      console.log(`[Flashcard Generate] Processing URL: ${url}`);
      const urlType = url.includes('youtube.com') || url.includes('youtu.be') 
        ? 'youtube' 
        : 'url';
      const result = await ContentExtractor.extractContent(url, urlType);
      sourceText = result.text;
    }
    else {
      return res.status(400).json({ message: 'Thiếu text, file, hoặc URL' });
    }

    if (sourceText.trim().length < 50) {
      return res.status(400).json({ message: 'Nội dung quá ngắn (>= 50 ký tự)' });
    }

    console.log(`[Flashcard Generate] Extracted ${sourceText.length} chars, generating ${count || 'default'} flashcards...`);
    const ai = await generateFlashcardsFromText(sourceText, { count });

    // Đảm bảo AI trả về đúng key 'flashcards'
    if (!ai || !Array.isArray(ai.flashcards)) {
        console.error("Lỗi: geminiService.generateFlashcardsFromText không trả về { flashcards: [...] }");
        throw new Error("AI không trả về dữ liệu flashcards hợp lệ.");
    }

    const setDoc = await FlashcardSet.create({
      title,
      courseCode: courseCode || '',
      flashcards: ai.flashcards,
      userId: req.userId 
    });

    console.log(' Tạo flashcard set thành công! ID:', setDoc._id);
    return res.status(201).json(setDoc);
  } catch (e) {
    console.error('Lỗi /api/flashcards/generate:', e);
    return res.status(500).json({ message: 'Lỗi nội bộ: ' + e.message });
  }
});
// Tạo flashcard set thủ công
router.post('/flashcards', verifyToken, async (req, res) => {
  console.log('Đã nhận request POST /api/flashcards...');
  try {
    const { title, courseCode, flashcards } = req.body;
    if (!title) return res.status(400).json({ message: 'Thiếu title' });
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(400).json({ message: 'Thiếu flashcards' });
    }
    const cleaned = flashcards
      .filter(fc => fc && fc.front && fc.back)
      .map(fc => ({
        front: String(fc.front).trim(),
        back: String(fc.back).trim(),
        hint: fc.hint ? String(fc.hint).trim() : undefined,
        tags: Array.isArray(fc.tags) ? fc.tags.map(String) : undefined
      }));

    const setDoc = await FlashcardSet.create({ 
        title, 
        courseCode: courseCode || '', 
        flashcards: cleaned, 
        userId: req.userId 
    });
    console.log(' Tạo flashcard set thủ công thành công! ID:', setDoc._id);
    return res.status(201).json(setDoc);
  } catch (e) {
    console.error('Lỗi POST /api/flashcards:', e);
    return res.status(500).json({ message: 'Lỗi nội bộ: ' + e.message });
  }
});

// Danh sách flashcard sets
router.get('/flashcards', verifyToken, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    
    // Chỉ tìm các set CÓ userId khớp
    const sets = await FlashcardSet.find({
        userId: currentUserId 
    }).sort({ createdAt: -1 });
    
    console.log(` Flashcards fetched for User ID: ${req.userId}. Count: ${sets.length}`);
    
    res.json(sets);
  } catch (error) {
     console.error('❌ Lỗi khi lấy danh sách flashcard sets:', error);
     res.status(500).json({ message: 'Lỗi server' });
  }
});

// Chi tiết 1 set
router.get('/flashcards/:id', verifyToken, async (req, res) => {
    try {
        const setId = req.params.id;
        
        const currentUserId = new mongoose.Types.ObjectId(req.userId);

        // Đảm bảo chỉ lấy của user hiện tại
        const set = await FlashcardSet.findOne({ 
            _id: setId, 
        });

        if (!set) {
            return res.status(404).json({ message: 'Không tìm thấy bộ Flashcard này.' });
        }
        
        res.json(set);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết Flashcard Set:', error);
        res.status(500).json({ message: 'Lỗi server khi truy vấn chi tiết Flashcard Set.' });
    }
});

// GET PUBLIC FLASHCARD SET (No authentication required - for shared links)
router.get('/flashcards/public/:id', async (req, res) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      isPublic: true
    });

    if (!set)
      return res.status(404).json({ message: 'Flashcard set không tồn tại hoặc chưa được chia sẻ công khai' });

    res.json(set);
  } catch (error) {
    console.error('Error fetching public flashcard set:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// UPDATE FLASHCARD SET PUBLIC STATUS
router.patch('/flashcards/:id/public', verifyToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.userId)
    });

    if (!set)
      return res.status(404).json({ message: 'Không tìm thấy flashcard set' });

    set.isPublic = isPublic;
    await set.save();

    res.json({ 
      message: isPublic ? 'Flashcard set đã được chia sẻ công khai' : 'Flashcard set đã được đặt về riêng tư',
      set 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Xóa 1 set flashcard
router.delete('/flashcards/:id', verifyToken, async (req, res) => {
    try {
        const setDoc = await FlashcardSet.findOne({ 
            _id: req.params.id, 
            userId: new mongoose.Types.ObjectId(req.userId) 
        });
        if (!setDoc) return res.status(404).json({ message: 'Không tìm thấy bộ flashcard để xóa' });
        
        await FlashcardSet.findByIdAndDelete(req.params.id);
        console.log(' Đã xóa flashcard set:', setDoc._id);
        res.json({ message: 'Đã xóa flashcard set thành công', deletedId: setDoc._id });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

/* =======================================================
   8. MENTOR + LECTURE ROUTES
======================================================= */

// Upload tài liệu → sinh bài giảng (Hỗ trợ multi-format) + Lưu lịch sử
router.post('/mentor/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { url, text } = req.body;
    
    let extractedText;
    let sourceInfo = {};
    
    if (req.file) {
      console.log(`[Lecture Upload] Processing file: ${req.file.originalname}`);
      const result = await ContentExtractor.extractContent(req.file.buffer, 'auto');
      extractedText = result.text;
      sourceInfo = {
        name: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size
      };
    }
    else if (url) {
      console.log(`[Lecture Upload] Processing URL: ${url}`);
      const urlType = url.includes('youtube.com') || url.includes('youtu.be') 
        ? 'youtube' 
        : 'url';
      const result = await ContentExtractor.extractContent(url, urlType);
      extractedText = result.text;
      sourceInfo = {
        name: url,
        fileType: urlType,
        size: extractedText.length
      };
    }
    else if (text) {
      extractedText = text;
      sourceInfo = {
        name: 'Text input',
        fileType: 'text/plain',
        size: text.length
      };
    }
    else {
      return res.status(400).json({ message: 'Vui lòng cung cấp file, URL, hoặc text.' });
    }

    if (!extractedText || extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Nội dung quá ngắn' });

    console.log(`[Lecture Upload] Generating lecture from ${extractedText.length} characters...`);
    const ai = await generateLectureFromFile(extractedText);

    // Lưu vào database
    const lecture = new Lecture({
      userId: req.userId,
      title: ai.title,
      sections: ai.sections,
      sourceFile: sourceInfo,
      metadata: {
        totalSections: ai.sections.length,
        estimatedDuration: Math.ceil(ai.sections.length * 2), // ~2 phút/section
        language: 'vi'
      }
    });

    await lecture.save();
    console.log(` Lecture saved to database: ${lecture._id}`);

    // Trả về kèm ID để client có thể load lại
    res.status(201).json({
      ...ai,
      _id: lecture._id,
      createdAt: lecture.createdAt
    });
  } catch (error) {
    console.error('[Lecture Upload] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Lấy danh sách lịch sử bài giảng
router.get('/mentor/lectures', verifyToken, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const lectures = await Lecture.find({ userId: req.userId })
      .sort({ lastAccessedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('title createdAt lastAccessedAt accessCount metadata sourceFile');

    const total = await Lecture.countDocuments({ userId: req.userId });

    res.json({
      lectures,
      total,
      hasMore: total > parseInt(skip) + lectures.length
    });
  } catch (error) {
    console.error('[Get Lectures] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Lấy chi tiết 1 bài giảng
router.get('/mentor/lectures/:id', verifyToken, async (req, res) => {
  try {
    const lecture = await Lecture.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!lecture) {
      return res.status(404).json({ message: 'Không tìm thấy bài giảng' });
    }

    // Cập nhật lần truy cập
    await lecture.markAccessed();

    res.json(lecture);
  } catch (error) {
    console.error('[Get Lecture Detail] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Xóa bài giảng
router.delete('/mentor/lectures/:id', verifyToken, async (req, res) => {
  try {
    const lecture = await Lecture.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!lecture) {
      return res.status(404).json({ message: 'Không tìm thấy bài giảng' });
    }

    await Lecture.findByIdAndDelete(req.params.id);
    console.log(` Deleted lecture: ${lecture._id}`);

    res.json({ message: 'Đã xóa bài giảng thành công', deletedId: lecture._id });
  } catch (error) {
    console.error('[Delete Lecture] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Mentor Chat
router.post('/mentor/chat', verifyToken, async (req, res) => {
  try {
    const { question, lectureContext } = req.body;

    if (!question)
      return res.status(400).json({ message: 'Thiếu câu hỏi' });

    const answer = await generateMentorResponse(question, lectureContext || '');
    res.json({ response: answer });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

/* =======================================================
   9. VOICE CONFIG + TTS ROUTES
======================================================= */

// Get voice config
router.get('/mentor/voice-config', verifyToken, async (req, res) => {
  try {
    let v = await Voice.findOne({ userId: req.userId });

    if (!v) {
      v = new Voice({
        userId: req.userId,
        engine: 'web-speech',
        gender: 'female',
        language: 'vi',
        voiceName: '',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      await v.save();
    }

    res.json(v);
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server: ' + e.message });
  }
});

// Update voice config
router.put('/mentor/voice-config', verifyToken, async (req, res) => {
  try {
    const { engine, gender, language, voiceName, rate, pitch, volume } = req.body;

    let v = await Voice.findOne({ userId: req.userId });
    if (!v) v = new Voice({ userId: req.userId });

    if (engine !== undefined) v.engine = engine;
    if (gender !== undefined) v.gender = gender;
    if (language !== undefined) v.language = language;
    if (voiceName !== undefined) v.voiceName = voiceName;
    if (rate !== undefined) v.rate = rate;
    if (pitch !== undefined) v.pitch = pitch;
    if (volume !== undefined) v.volume = volume;

    await v.save();
    res.json(v);

  } catch (e) {
    res.status(500).json({ message: 'Lỗi server: ' + e.message });
  }
});

// TTS generate - Google Translate (Fallback)
router.post('/mentor/tts/synthesize', verifyToken, async (req, res) => {
  try {
    const { text, options } = req.body;

    if (!text)
      return res.status(400).json({ message: 'Thiếu text' });

    const maxLength = 5000;
    const processedText =
      text.length > maxLength ? text.substring(0, maxLength) : text;

    const opts = {
      language: options?.language || 'vi',
      gender: options?.gender || 'female',
      rate: options?.rate || 1.0,
      volume: options?.volume || 1.0
    };

    const audio = await synthesizeWithGoogleTranslate(processedText, opts);

    const buffer = Buffer.isBuffer(audio)
      ? audio
      : Buffer.from(audio);

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// TTS generate - Google Cloud TTS (Premium)
const googleTTSService = require('./services/googleTTSService');

router.post('/mentor/tts/google-synthesize', verifyToken, async (req, res) => {
  try {
    const { text, options } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Kiểm tra Google Cloud TTS có sẵn không
    if (!googleTTSService.isAvailable()) {
      return res.status(503).json({ 
        message: 'Google Cloud TTS not available. Please check credentials.',
        fallback: true 
      });
    }

    const maxLength = 5000;
    const processedText = text.length > maxLength ? text.substring(0, maxLength) : text;

    // Cấu hình TTS với SSML để giọng truyền cảm hơn
    const ttsOptions = {
      language: options?.language || 'vi-VN',
      gender: options?.gender || 'FEMALE',
      voiceName: options?.voiceName || null,
      rate: options?.rate || 1.0,
      pitch: options?.pitch || 0.0,
      volume: options?.volume || 0.0,
      useSSML: true, // Bật SSML để giọng đọc tự nhiên và truyền cảm hơn
    };

    // Synthesize với Google Cloud TTS
    const audioBuffer = await googleTTSService.synthesizeSpeech(processedText, ttsOptions);

    // Trả về audio
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache 1 hour
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('❌ Google Cloud TTS Error:', error);
    res.status(500).json({
      message: 'Lỗi khi tạo giọng đọc',
      error: error.message,
      fallback: true // Client có thể fallback về Google Translate TTS
    });
  }
});

// Lấy danh sách giọng đọc
router.get('/mentor/tts/voices', verifyToken, async (req, res) => {
  try {
    if (!googleTTSService.isAvailable()) {
      return res.status(503).json({ 
        message: 'Google Cloud TTS not available',
        voices: [] 
      });
    }

    const { language = 'vi-VN' } = req.query;
    const voices = await googleTTSService.listVoices(language);
    
    // Sắp xếp: WaveNet/Neural2 trước, Standard sau
    const sortedVoices = voices.sort((a, b) => {
      const aScore = a.name.includes('Wavenet') ? 3 : a.name.includes('Neural') ? 2 : 1;
      const bScore = b.name.includes('Wavenet') ? 3 : b.name.includes('Neural') ? 2 : 1;
      return bScore - aScore;
    });

    res.json({ 
      voices: sortedVoices,
      count: sortedVoices.length 
    });
  } catch (error) {
    console.error('❌ Error listing voices:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách giọng',
      error: error.message 
    });
  }
});

// Kiểm tra trạng thái Google Cloud TTS
router.get('/mentor/tts/status', verifyToken, (req, res) => {
  const isAvailable = googleTTSService.isAvailable();
  res.json({
    googleCloudTTS: isAvailable,
    fallbackTTS: true, // Google Translate TTS luôn có
    message: isAvailable 
      ? 'Google Cloud TTS is available' 
      : 'Using fallback TTS (Google Translate)'
  });
});

/* =======================================================
   10. DEBUG ROUTES
======================================================= */

router.get('/test', (req, res) => {
  res.json({ status: 'OK', message: 'API Routes đang chạy!' });
});

router.get('/debug/models', async (req, res) => {
  const models = await listAvailableModels();
  res.json(models);
});

/* =======================================================
   11. SEARCH ROUTES - TÌM KIẾM QUIZ CÔNG KHAI
======================================================= */

// Tìm kiếm Quiz (Deck) công khai
router.get('/search/quizzes', async (req, res) => {
  try {
    const { q, courseCode, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
    }

    const searchQuery = {
      isPublic: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { courseCode: { $regex: q, $options: 'i' } }
      ]
    };

    // Nếu có filter theo courseCode
    if (courseCode && courseCode.trim().length > 0) {
      searchQuery.courseCode = { $regex: courseCode, $options: 'i' };
    }

    const quizzes = await Deck.find(searchQuery)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });

  } catch (error) {
    console.error('[Search Quizzes] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Tìm kiếm Flashcard Sets công khai
router.get('/search/flashcards', async (req, res) => {
  try {
    const { q, courseCode, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
    }

    const searchQuery = {
      isPublic: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { courseCode: { $regex: q, $options: 'i' } }
      ]
    };

    // Nếu có filter theo courseCode
    if (courseCode && courseCode.trim().length > 0) {
      searchQuery.courseCode = { $regex: courseCode, $options: 'i' };
    }

    const flashcardSets = await FlashcardSet.find(searchQuery)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: flashcardSets.length,
      data: flashcardSets
    });

  } catch (error) {
    console.error('[Search Flashcards] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// Tìm kiếm tất cả (Quiz + Flashcard)
router.get('/search/all', async (req, res) => {
  try {
    const { q, courseCode, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
    }

    const searchQuery = {
      isPublic: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { courseCode: { $regex: q, $options: 'i' } }
      ]
    };

    if (courseCode && courseCode.trim().length > 0) {
      searchQuery.courseCode = { $regex: courseCode, $options: 'i' };
    }

    const limitNum = parseInt(limit);
    const halfLimit = Math.ceil(limitNum / 2);

    // Tìm song song
    const [quizzes, flashcardSets] = await Promise.all([
      Deck.find(searchQuery)
        .populate('userId', 'email fullName')
        .sort({ createdAt: -1 })
        .limit(halfLimit),
      FlashcardSet.find(searchQuery)
        .populate('userId', 'email fullName')
        .sort({ createdAt: -1 })
        .limit(halfLimit)
    ]);

    // Gắn type để frontend phân biệt
    const quizzesWithType = quizzes.map(q => ({ ...q.toObject(), type: 'quiz' }));
    const flashcardsWithType = flashcardSets.map(f => ({ ...f.toObject(), type: 'flashcard' }));

    // Merge và sort theo thời gian
    const allResults = [...quizzesWithType, ...flashcardsWithType]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: allResults.length,
      quizCount: quizzes.length,
      flashcardCount: flashcardSets.length,
      data: allResults
    });

  } catch (error) {
    console.error('[Search All] Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
});

// User Dashboard Routes
const userRoutes = require('./routes/userRoutes');
router.use('/user', userRoutes);

// Profile Routes
const profileRoutes = require('./routes/profileRoutes');
router.use('/profile', profileRoutes);

// Room Routes
const roomRoutes = require('./routes/roomRoutes');
router.use('/rooms', roomRoutes);

// Email Verification Routes - DISABLED (OTP feature not ready)
// TODO: Enable when email service is configured
// const emailRoutes = require('./routes/emailRoutes');
// router.use('/email', emailRoutes);

/* =======================================================
   RAG (Retrieval-Augmented Generation) ENDPOINTS
======================================================= */

// Import validation middleware and error handler
const {
  validateSearchQuery,
  validatePagination,
  validateSearchOptions,
  validateAdvancedSearch,
  validateUserId,
  validateSuggestionRequest,
  validateFeedbackRequest,
  validateClickRequest,
  createRateLimiter
} = require('./middleware/searchValidation');

const { errorHandler } = require('./utils/errorHandler');
const { searchLogger } = require('./utils/searchLogger');
const { InputValidator } = require('./utils/errorHandler');

// Rate limiting for search operations
const searchRateLimit = createRateLimiter(60, 60000); // 60 requests per minute
const suggestionRateLimit = createRateLimiter(120, 60000); // 120 requests per minute for suggestions

// Lấy danh sách documents của user
router.get('/rag/documents', 
  verifyToken, 
  validateUserId,
  validatePagination,
  searchRateLimit,
  errorHandler.wrapAsync(async (req, res) => {
    const { fileType, search, sortBy = 'createdAt' } = req.query;
    const { page, limit } = req.validatedPagination;
    
    const result = await RAGService.getUserDocuments(req.validatedUserId, {
      page,
      limit,
      fileType,
      search,
      sortBy
    });
    
    res.json({
      success: true,
      documents: result.items,
      pagination: result.pagination
    });
  })
);

// Tìm kiếm documents với enhanced filtering
router.get('/rag/search', 
  verifyToken,
  validateUserId,
  validateSearchQuery,
  validatePagination,
  validateSearchOptions,
  searchRateLimit,
  errorHandler.wrapAsync(async (req, res) => {
    const { highlightTerms = true } = req.validatedOptions;
    const { page, limit } = req.validatedPagination;
    
    const startTime = Date.now();
    
    const documents = await RAGService.searchDocuments(req.validatedUserId, req.validatedQuery, {
      ...req.validatedOptions,
      page,
      limit,
      highlightTerms
    });
    
    const responseTime = Date.now() - startTime;
    
    // Record search in history for suggestions (async, don't wait)
    const SuggestionEngine = require('./utils/suggestionEngine');
    const suggestionEngine = new SuggestionEngine();
    
    suggestionEngine.recordSearch(req.validatedUserId, req.validatedQuery, documents, {
      ...req.validatedOptions,
      page,
      limit
    }, {
      strategy: req.validatedOptions.searchStrategies ? req.validatedOptions.searchStrategies[0] : 'exact',
      responseTime,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    }).catch(error => {
      searchLogger.error('Failed to record search history', { 
        error: error.message,
        userId: req.validatedUserId,
        query: req.validatedQuery
      });
    });
    
    res.json({
      success: true,
      documents: documents.items || documents,
      pagination: documents.pagination,
      searchMetrics: {
        responseTime,
        query: req.validatedQuery,
        totalResults: documents.items?.length || documents.length || 0
      }
    });
  })
);

// Advanced search with boolean operators and enhanced filters
router.post('/rag/search/advanced', 
  verifyToken,
  validateUserId,
  validateAdvancedSearch,
  searchRateLimit,
  errorHandler.wrapAsync(async (req, res) => {
    const startTime = Date.now();
    
    const documents = await RAGService.advancedSearch(req.validatedUserId, req.validatedQuery, {
      ...req.validatedOptions,
      limit: req.validatedLimit,
      sortBy: req.validatedSortBy,
      sortOrder: req.validatedSortOrder,
      dateRange: req.validatedDateRange
    });
    
    const responseTime = Date.now() - startTime;
    
    // Record search in history for suggestions (async, don't wait)
    const SuggestionEngine = require('./utils/suggestionEngine');
    const suggestionEngine = new SuggestionEngine();
    
    suggestionEngine.recordSearch(req.validatedUserId, req.validatedQuery, documents, {
      ...req.validatedOptions,
      limit: req.validatedLimit,
      dateRange: req.validatedDateRange
    }, {
      strategy: 'advanced',
      responseTime,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    }).catch(error => {
      searchLogger.error('Failed to record advanced search history', { 
        error: error.message,
        userId: req.validatedUserId,
        query: req.validatedQuery
      });
    });
    
    res.json({
      success: true,
      documents,
      query: {
        original: req.validatedQuery,
        parsed: RAGService.parseAdvancedQuery(req.validatedQuery)
      },
      appliedFilters: {
        ...req.validatedOptions,
        totalFilters: Object.values(req.validatedOptions).filter(f => 
          f && (Array.isArray(f) ? f.length > 0 : Object.keys(f).length > 0)
        ).length
      },
      searchMetrics: {
        responseTime,
        totalResults: documents.items?.length || documents.length || 0
      }
    });
  })
);

// Lấy context liên quan cho một query
router.post('/rag/context', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const { query, maxChunks = 5, maxContextLength = 3000, includePublic = false } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query is required',
          field: 'query'
        }
      });
    }
    
    // Validate query
    const validatedQuery = InputValidator.validateSearchQuery(query);
    
    // Validate numeric parameters
    const validatedMaxChunks = Math.min(Math.max(parseInt(maxChunks) || 5, 1), 20);
    const validatedMaxContextLength = Math.min(Math.max(parseInt(maxContextLength) || 3000, 100), 10000);
    
    const result = await RAGService.getRelevantContext(req.validatedUserId, validatedQuery, {
      maxChunks: validatedMaxChunks,
      maxContextLength: validatedMaxContextLength,
      includePublic: Boolean(includePublic)
    });
    
    res.json({
      success: true,
      ...result
    });
  })
);

// Xóa document
router.delete('/rag/documents/:id', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const documentId = req.params.id;
    
    // Validate document ID format
    if (!/^[0-9a-fA-F]{24}$/.test(documentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID format',
          field: 'documentId'
        }
      });
    }
    
    const Document = require('./models/Document');
    
    const document = await Document.findOne({
      _id: documentId,
      userId: req.validatedUserId
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied'
        }
      });
    }
    
    await Document.deleteOne({ _id: documentId });
    
    // Log document deletion
    searchLogger.info('Document deleted', {
      documentId,
      userId: req.validatedUserId,
      title: document.title
    });
    
    res.json({
      success: true,
      message: 'Document deleted successfully',
      documentId
    });
  })
);

// Cập nhật document (title, tags, isPublic)
router.put('/rag/documents/:id', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const documentId = req.params.id;
    const { title, tags, isPublic } = req.body;
    
    // Validate document ID format
    if (!/^[0-9a-fA-F]{24}$/.test(documentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID format',
          field: 'documentId'
        }
      });
    }
    
    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title must be a non-empty string',
            field: 'title'
          }
        });
      }
      
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title is too long (max 200 characters)',
            field: 'title'
          }
        });
      }
    }
    
    // Validate tags if provided
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tags must be an array',
            field: 'tags'
          }
        });
      }
      
      if (tags.length > 20) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Too many tags (max 20)',
            field: 'tags'
          }
        });
      }
    }
    
    const Document = require('./models/Document');
    
    const document = await Document.findOne({
      _id: documentId,
      userId: req.validatedUserId
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied'
        }
      });
    }
    
    // Apply updates
    if (title !== undefined) document.title = title.trim();
    if (tags !== undefined) document.tags = tags.filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0);
    if (isPublic !== undefined) document.isPublic = Boolean(isPublic);
    
    await document.save();
    
    // Log document update
    searchLogger.info('Document updated', {
      documentId,
      userId: req.validatedUserId,
      updates: { title: title !== undefined, tags: tags !== undefined, isPublic: isPublic !== undefined }
    });
    
    res.json({
      success: true,
      document
    });
  })
);

// Nâng cấp mentor response với RAG
router.post('/mentor/chat-rag', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const { question, lectureId, useRAG = true } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Question is required',
          field: 'question'
        }
      });
    }
    
    // Validate question
    const validatedQuestion = InputValidator.validateSearchQuery(question);
    
    // Validate lecture ID if provided
    if (lectureId && !/^[0-9a-fA-F]{24}$/.test(lectureId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid lecture ID format',
          field: 'lectureId'
        }
      });
    }
    
    // Lấy lecture context nếu có
    let lectureContext = '';
    if (lectureId) {
      const lecture = await Lecture.findOne({
        _id: lectureId,
        userId: req.validatedUserId
      });
      
      if (lecture) {
        lectureContext = lecture.sections
          .map(section => `${section.title}: ${section.content}`)
          .join('\n\n');
        
        // Mark lecture as accessed
        await lecture.markAccessed();
      }
    }
    
    // Generate response với RAG
    const response = await generateMentorResponse(validatedQuestion, lectureContext, {
      userId: req.validatedUserId,
      useRAG: Boolean(useRAG),
      customInstructions: 'Trả lời như một giảng viên thân thiện, dễ hiểu.'
    });
    
    // Log mentor interaction
    searchLogger.info('Mentor chat interaction', {
      userId: req.validatedUserId,
      question: validatedQuestion.substring(0, 100),
      lectureId,
      useRAG: Boolean(useRAG)
    });
    
    res.json({
      success: true,
      ...response
    });
  })
);

/* =======================================================
   RAG SEARCH SUGGESTIONS AND HISTORY ENDPOINTS
======================================================= */

const SuggestionEngine = require('./utils/suggestionEngine');
const SearchHistory = require('./models/SearchHistory');

// Initialize suggestion engine
const suggestionEngine = new SuggestionEngine({
  maxSuggestions: 10,
  minQueryLength: 1,
  cacheTimeout: 5 * 60 * 1000 // 5 minutes
});

// Get real-time search suggestions (Requirements 3.1, 3.2, 3.5)
router.get('/rag/search/suggestions', 
  verifyToken,
  validateUserId,
  validateSuggestionRequest,
  suggestionRateLimit,
  errorHandler.wrapAsync(async (req, res) => {
    const suggestions = await suggestionEngine.getSuggestions(req.validatedUserId, req.validatedPartialQuery, {
      maxSuggestions: req.validatedLimit,
      includeContentSuggestions: req.validatedIncludeContent,
      includeHistorySuggestions: req.validatedIncludeHistory,
      includeRecentSearches: req.validatedIncludeRecent,
      timeWindow: req.validatedTimeWindow
    });
    
    res.json({
      success: true,
      query: req.validatedPartialQuery,
      suggestions: suggestions.map(s => ({
        text: s.text,
        type: s.type,
        source: s.source,
        frequency: s.frequency,
        relevanceScore: s.relevanceScore
      })),
      count: suggestions.length,
      cached: false // Could implement cache hit detection
    });
  })
);

// Get user search history (Requirement 3.4)
router.get('/rag/search/history', 
  verifyToken,
  validateUserId,
  validatePagination,
  errorHandler.wrapAsync(async (req, res) => {
    const { timeWindow } = req.query;
    const { page, limit } = req.validatedPagination;
    
    // Validate time window
    let validatedTimeWindow = null;
    if (timeWindow) {
      const numericTimeWindow = parseInt(timeWindow);
      if (isNaN(numericTimeWindow) || numericTimeWindow < 1 || numericTimeWindow > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Time window must be between 1 and 365 days',
            field: 'timeWindow'
          }
        });
      }
      validatedTimeWindow = numericTimeWindow;
    }
    
    const skip = (page - 1) * limit;
    
    let query = { userId: req.validatedUserId };
    
    // Add time window filter if provided
    if (validatedTimeWindow) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - validatedTimeWindow);
      query.createdAt = { $gte: cutoffDate };
    }
    
    const [history, total] = await Promise.all([
      SearchHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('query normalizedQuery createdAt resultCount satisfaction searchFilters searchMetadata')
        .lean(),
      SearchHistory.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// Record search query and results for suggestions (Internal use by search endpoints)
router.post('/rag/search/record', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const { 
      query,
      resultCount,
      searchFilters = {},
      searchMetadata = {}
    } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query is required',
          field: 'query'
        }
      });
    }
    
    // Validate query
    const validatedQuery = InputValidator.validateSearchQuery(query);
    
    // Validate result count
    const validatedResultCount = Math.max(0, parseInt(resultCount) || 0);
    
    // Add request metadata
    const metadata = {
      ...searchMetadata,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };
    
    const searchHistory = await suggestionEngine.recordSearch(
      req.validatedUserId,
      validatedQuery,
      { length: validatedResultCount }, // Mock results array for count
      searchFilters,
      metadata
    );
    
    res.json({
      success: true,
      searchId: searchHistory._id,
      message: 'Search recorded successfully'
    });
  })
);

// Record click on search result (Requirement 3.3)
router.post('/rag/search/click', 
  verifyToken,
  validateUserId,
  validateClickRequest,
  errorHandler.wrapAsync(async (req, res) => {
    await suggestionEngine.recordClick(
      req.validatedUserId,
      req.validatedQuery,
      req.validatedDocumentId,
      req.validatedPosition
    );
    
    res.json({
      success: true,
      message: 'Click recorded successfully'
    });
  })
);

// Update search satisfaction rating
router.post('/rag/search/feedback', 
  verifyToken,
  validateUserId,
  validateFeedbackRequest,
  errorHandler.wrapAsync(async (req, res) => {
    await suggestionEngine.updateSatisfaction(
      req.validatedUserId,
      req.validatedQuery,
      req.validatedRating
    );
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  })
);

// Get search analytics
router.get('/rag/search/analytics', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const { timeWindow = 30 } = req.query;
    
    // Validate time window
    const validatedTimeWindow = Math.min(Math.max(parseInt(timeWindow) || 30, 1), 365);
    
    const analytics = await suggestionEngine.getSearchAnalytics(
      req.validatedUserId,
      validatedTimeWindow
    );
    
    res.json({
      success: true,
      analytics,
      timeWindow: validatedTimeWindow,
      generatedAt: new Date()
    });
  })
);

// Clear suggestion cache (Admin/Debug endpoint)
router.post('/rag/search/clear-cache', 
  verifyToken,
  validateUserId,
  errorHandler.wrapAsync(async (req, res) => {
    const { userId } = req.body;
    
    // Validate user ID if provided
    let targetUserId = null;
    if (userId) {
      targetUserId = InputValidator.validateUserId(userId);
    }
    
    if (targetUserId) {
      suggestionEngine.clearCacheForUser(targetUserId);
    } else {
      suggestionEngine.clearCache();
    }
    
    res.json({
      success: true,
      message: targetUserId ? 'User cache cleared' : 'All cache cleared',
      cacheStats: suggestionEngine.getCacheStats()
    });
  })
);

// System health endpoint
router.get('/rag/health', 
  verifyToken,
  errorHandler.wrapAsync(async (req, res) => {
    const health = errorHandler.getSystemHealth();
    
    res.json({
      success: true,
      ...health
    });
  })
);

module.exports = router;
