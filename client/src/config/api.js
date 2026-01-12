// config/api.js
// Cấu hình API endpoint

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const API_ENDPOINTS = {
  // --- File/Upload ---
  UPLOAD: `${API_BASE_URL}/api/upload`,
  
  // --- Deck/Flashcard Endpoints ---
  // ⭐️ FLASHCARD_SETS (Sửa từ DECK nếu backend dùng Flashcards) ⭐️
  FLASHCARD_SETS: `${API_BASE_URL}/api/flashcards`, 
  // ⭐️ TẠO FLASHCARD TỪ FILE (Cần cho trang CreateFlashcardPage) ⭐️
  FLASHCARD_GENERATE: `${API_BASE_URL}/api/flashcards/generate`,
  FLASHCARD_BY_ID: (id) => `${API_BASE_URL}/api/flashcards/${id}`,
  FLASHCARD_PUBLIC: (id) => `${API_BASE_URL}/api/flashcards/public/${id}`,
  FLASHCARD_UPDATE_PUBLIC: (id) => `${API_BASE_URL}/api/flashcards/${id}/public`,
  
  // Các Deck/Flashcard cũ đã có
  DECKS: `${API_BASE_URL}/api/decks`,
  DECK_BY_ID: (id) => `${API_BASE_URL}/api/decks/${id}`,
  DECK_PUBLIC: (id) => `${API_BASE_URL}/api/decks/public/${id}`,
  DECK_UPDATE_PUBLIC: (id) => `${API_BASE_URL}/api/decks/${id}/public`,
  DELETE_DECK: (id) => `${API_BASE_URL}/api/decks/${id}`,

  // --- Topic/Vocabulary Endpoints ---
  // ⭐️ LẤY TẤT CẢ TOPICS (Cần cho trang VocabularyPage) ⭐️
  TOPICS: `${API_BASE_URL}/api/topics`,
  // ⭐️ TẠO TOPIC BẰNG AI (Cần cho trang VocabularyPage) ⭐️
  TOPIC_GENERATE: `${API_BASE_URL}/api/topics/generate`,
  TOPIC_BY_ID: (id) => `${API_BASE_URL}/api/topics/${id}`,

  TEST: `${API_BASE_URL}/api/test`,
  
  // --- Auth endpoints ---
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,

  // --- Search endpoints ---
  SEARCH_QUIZZES: `${API_BASE_URL}/api/search/quizzes`,
  SEARCH_FLASHCARDS: `${API_BASE_URL}/api/search/flashcards`,
  SEARCH_ALL: `${API_BASE_URL}/api/search/all`,
};

export default API_BASE_URL;