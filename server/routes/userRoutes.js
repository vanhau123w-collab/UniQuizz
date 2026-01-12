const express = require('express');
const router = express.Router();
const Deck = require('../models/Deck'); // Sử dụng Deck thay vì Quiz
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/user/dashboard - Lấy thống kê dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy tất cả quiz (Deck) của user
    const decks = await Deck.find({ userId });
    
    // Tính toán thống kê
    const totalQuizzes = decks.length;
    
    // Tính số quiz đã hoàn thành (giả sử quiz có ít nhất 1 câu hỏi là đã hoàn thành)
    const completedQuizzes = decks.filter(d => d.questions && d.questions.length > 0).length;
    
    // Tính điểm trung bình (giả lập - Deck không có trường score)
    // Trong production, cần thêm collection riêng để lưu kết quả quiz
    const averageScore = totalQuizzes > 0 ? Math.floor(75 + Math.random() * 20) : 0; // 75-95%
    
    // Tính study streak (giả lập - cần implement logic thực tế)
    const studyStreak = calculateStudyStreak(userId);

    // Tổng flashcards (giả lập - cần query từ flashcard collection)
    const FlashcardSet = require('../models/FlashcardSet');
    const flashcardSets = await FlashcardSet.find({ userId });
    const totalFlashcards = flashcardSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0);

    // Tổng thời gian học (giả lập)
    const totalStudyTime = Math.round(totalQuizzes * 0.5); // Giả sử mỗi quiz = 30 phút

    // Recent activity
    const recentActivity = decks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(d => ({
        type: 'quiz',
        title: d.title,
        date: d.createdAt,
        questionCount: d.questions?.length || 0
      }));

    // Achievements (giả lập)
    const achievements = [
      { id: 1, name: 'Quiz Master', unlocked: totalQuizzes >= 10 },
      { id: 2, name: 'Streak Warrior', unlocked: studyStreak >= 7 },
      { id: 3, name: 'Perfect Score', unlocked: averageScore >= 95 }
    ];

    res.json({
      totalQuizzes,
      completedQuizzes,
      averageScore,
      totalFlashcards,
      studyStreak,
      totalStudyTime,
      recentActivity,
      achievements
    });
  } catch (error) {
    console.error('Lỗi khi lấy dashboard:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Helper function để tính study streak
function calculateStudyStreak(userId) {
  // TODO: Implement logic thực tế
  // Cần track ngày user học gần nhất
  return Math.floor(Math.random() * 10); // Giả lập
}

module.exports = router;
