// client/src/pages/FlashcardPage.jsx
// ⭐️ PHIÊN BẢN ĐÚNG (CÓ THỂ MỞ CẢ 2 LOẠI) ⭐️

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SEOHead, { getFlashcardMeta, getTopicMeta } from "../components/SEOHead";
import api from "../api.js";

// --- API FUNCTIONS (SAO CHÉP TỪ TOPICDETAILSPAGE) ---

// API 1: Lấy Flashcard Set (từ file) - Thử public trước
const fetchFlashcardSetById = async (setId) => {
  try {
    // Thử fetch public flashcard set trước (không cần token)
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/flashcards/public/${setId}`);
    if (response.ok) {
      return await response.json();
    }
    // Nếu không phải public, thử với token
    const authResponse = await api.get(`/flashcards/${setId}`);
    return authResponse.data;
  } catch (error) {
    throw error;
  }
};

// API 2: Lấy Topic (từ vựng)
const fetchTopicById = async (topicId) => {
  const response = await api.get(`/topics/${topicId}`);
  return response.data;
};

// ⭐️ HÀM HỢP NHẤT DỮ LIỆU (CHUẨN HÓA) ⭐️
const normalizeData = (data) => {
  if (data && data.words) {
    // Logic cho Topic
    return {
      id: data._id,
      title: data.title,
      type: "topic",
      items: data.words.map((item) => ({
        front: item.word,
        back: item.definition,
        example: item.example,
      })),
    };
  }
  if (data && data.flashcards) {
    // Logic cho FlashcardSet
    return {
      id: data._id,
      title: data.title,
      type: "flashcard-set",
      items: data.flashcards.map((item) => ({
        front: item.front,
        back: item.back,
        example: item.hint || "",
      })),
    };
  }
  return null; // Dữ liệu không hợp lệ
};

// ⭐️ HÀM GỌI DỮ LIỆU CHUNG ⭐️
const fetchCombinedData = async (id) => {
  try {
    // 1. Thử tải dưới dạng Topic trước
    const topicData = await fetchTopicById(id);
    return normalizeData(topicData);
  } catch (topicError) {
    const status = topicError.response?.status;
    if (status === 404 || status === 403) {
      // 2. Nếu 404, thử tải dưới dạng Flashcard Set
      try {
        const setData = await fetchFlashcardSetById(id);
        return normalizeData(setData);
      } catch (setError) {
        throw setError; // Ném lỗi của API thứ 2
      }
    }
    throw topicError; // Ném lỗi của API thứ 1 (nếu là 401, 500...)
  }
};

// --------------------------------------------------------------------------------

function FlashcardPage() {
  // ⭐️ SỬA 1: Dùng { id } để khớp với Route /flashcard/:id
  const { topicId: id } = useParams();
  const navigate = useNavigate();

  const [itemData, setItemData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardKey, setCardKey] = useState(0); // For animation reset

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // ⭐️ SỬA 3: Gọi hàm fetchCombinedData
        const data = await fetchCombinedData(id);

        if (!data || !data.items || data.items.length === 0) {
          setItemData(null);
        } else {
          setItemData(data);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu flashcard:", error);
        navigate("/flashcard-hub"); // Quay về Hub nếu lỗi
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]); // ⭐️ SỬA 5: Dùng 'id'

  // Keyboard shortcuts - PHẢI ĐẶT TRƯỚC EARLY RETURNS
  useEffect(() => {
    if (!itemData || !itemData.items) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
          setCardKey(prev => prev + 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < itemData.items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          setCardKey(prev => prev + 1);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, itemData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <Header />
        <div className="grow text-center p-8 text-xl text-gray-800 dark:text-gray-200">Đang tải dữ liệu...</div>
        <Footer />
      </div>
    );
  }

  if (!itemData || !itemData.items || itemData.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <Header />
        <div className="grow text-center p-8 text-xl text-red-600 dark:text-red-400">
          Không tìm thấy nội dung hoặc bộ này chưa có thẻ nào.
        </div>
        <Footer />
      </div>
    );
  }

  const { title, type, items } = itemData;
  const currentItem = items[currentIndex];

  const flipCard = () => setIsFlipped(!isFlipped);

  const nextCard = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setCardKey(prev => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setCardKey(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden flex flex-col">
      <SEOHead {...(type === 'topic' ? getTopicMeta({ title, words: items }) : getFlashcardMeta({ title, flashcards: items }))} />
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        /* Flashcard Front - Light Mode */
        .flashcard-front {
          background: linear-gradient(to bottom right, #ef4444, #ec4899);
        }
        
        /* Flashcard Back - Light Mode */
        .flashcard-back {
          background: linear-gradient(to bottom right, #3b82f6, #9333ea);
        }
        
        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
          .flashcard-front {
            background: linear-gradient(to bottom right, #7f1d1d, #831843);
          }
          
          .flashcard-back {
            background: linear-gradient(to bottom right, #1e3a8a, #581c87);
          }
        }
        
        /* Dark Mode - Class based (for manual toggle) */
        .dark .flashcard-front {
          background: linear-gradient(to bottom right, #7f1d1d, #831843);
        }
        
        .dark .flashcard-back {
          background: linear-gradient(to bottom right, #1e3a8a, #581c87);
        }
      `}</style>
      <Header />
      <main className="grow max-w-4xl mx-auto p-4 sm:p-6 text-center relative z-10 w-full mt-20">
        <motion.button
          onClick={() =>
            navigate(type === "topic" ? "/vocabulary" : "/flashcard-hub")
          }
          className="mb-8 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 
                     px-6 py-3 rounded-full font-semibold transition duration-200 shadow-md hover:shadow-lg
                     flex items-center gap-2 mx-auto"
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Trở về {type === "topic" ? "Chủ đề" : "Hub Flashcard"}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-lg font-medium">{items.length} thẻ</span>
          </div>
        </motion.div>

        {/* Flashcard Component with 3D Flip Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cardKey}
            initial={{ opacity: 0, x: 100, rotateY: -90 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -100, rotateY: 90 }}
            transition={{ duration: 0.4 }}
            className="perspective-1000 w-full h-80 mb-8"
          >
            <motion.div
              onClick={flipCard}
              className="relative w-full h-full cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ 
                duration: 0.6, 
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            {/* Mặt trước (Front) */}
            <motion.div
              className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl flex items-center justify-center p-8 flashcard-front"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
            >
              <div className="text-center">
                <motion.p 
                  className="text-4xl md:text-5xl font-black text-white drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentItem.front}
                </motion.p>
                <motion.div
                  className="mt-6 flex items-center justify-center gap-2 text-white/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium">Bấm để lật</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Mặt sau (Back) */}
            <motion.div
              className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl flex items-center justify-center p-8 flashcard-back"
              style={{ 
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="text-center w-full">
                <motion.p 
                  className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentItem.back}
                </motion.p>
                {currentItem.example && (
                  <motion.div
                    className="mt-6 px-6 py-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: isFlipped ? 1 : 0, scale: isFlipped ? 1 : 0.9 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-lg italic text-white">
                      "{currentItem.example}"
                    </p>
                  </motion.div>
                )}
                <motion.div
                  className="mt-6 flex items-center justify-center gap-2 text-white/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isFlipped ? 1 : 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium">Bấm để lật lại</span>
                </motion.div>
              </div>
            </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 flex flex-wrap justify-center gap-3 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-800 dark:text-gray-200">←</kbd>
            <span>Lùi</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-800 dark:text-gray-200">→</kbd>
            <span>Tiếp</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-800 dark:text-gray-200">Space</kbd>
            <span>Lật thẻ</span>
          </div>
        </motion.div>

        {/* Navigation Buttons with Animation */}
        <div className="flex justify-center items-center gap-4 pb-10">
          <motion.button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: currentIndex === 0 ? 1 : 1.05, x: -5 }}
            whileTap={{ scale: currentIndex === 0 ? 1 : 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Lùi
          </motion.button>

          {/* Progress indicator */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {items.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'w-8 bg-red-600 dark:bg-red-500' 
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          <motion.button
            onClick={nextCard}
            disabled={currentIndex === items.length - 1}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: currentIndex === items.length - 1 ? 1 : 1.05, x: 5 }}
            whileTap={{ scale: currentIndex === items.length - 1 ? 1 : 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Tiếp
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default FlashcardPage;
