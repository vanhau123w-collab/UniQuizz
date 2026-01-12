import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FlashcardCard from "../components/FlashcardCard";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";

export default function MyFlashcards() {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlashcardSets();
  }, []);

  const fetchFlashcardSets = async () => {
    try {
      setIsLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để xem flashcard sets của bạn");
        navigate("/login");
        return;
      }

      const res = await fetch(API_ENDPOINTS.FLASHCARD_SETS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("userUpdate"));
          navigate("/login");
          return;
        }
        throw new Error("Không thể tải danh sách flashcard sets");
      }

      const data = await res.json();

      // Map dữ liệu từ MongoDB sang format cho FlashcardCard
      const formattedSets = data.map((set) => ({
        id: set._id,
        title: set.title,
        cardCount: set.flashcards?.length || 0,
        courseCode: set.courseCode,
        isPublic: set.isPublic || false,
        flashcards: set.flashcards,
      }));

      setFlashcardSets(formattedSets);
    } catch (err) {
      console.error("Lỗi khi tải flashcard sets:", err);
      setError(err.message || "Có lỗi xảy ra khi tải danh sách flashcard sets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlashcardSet = async (setId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Vui lòng đăng nhập để xóa flashcard set");
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_ENDPOINTS.FLASHCARD_SETS}/${setId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Không thể xóa flashcard set");
      }

      // Xóa khỏi state local
      setFlashcardSets((prev) => prev.filter((set) => set.id !== setId));
      alert("Đã xóa flashcard set thành công!");
    } catch (err) {
      console.error("Lỗi khi xóa flashcard set:", err);
      alert(err.message || "Có lỗi xảy ra khi xóa flashcard set");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Header />

      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
            Flashcard Sets của tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và ôn tập các bộ flashcard của bạn
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">😕</div>
            <div className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">
              {error}
            </div>
            <Link
              to="/create-flashcard"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Tạo flashcard set mới
            </Link>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && flashcardSets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Chưa có flashcard set nào
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Hãy tạo flashcard set đầu tiên của bạn!
            </p>
            <Link
              to="/create-flashcard"
              className="inline-block px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Tạo flashcard set mới ngay
            </Link>
          </motion.div>
        )}

        {/* Flashcard Sets Grid */}
        {!isLoading && !error && flashcardSets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcardSets.map((set) => (
              <FlashcardCard
                key={set.id}
                flashcardSet={set}
                onDelete={handleDeleteFlashcardSet}
                onPublicToggle={(setId, isPublic) => {
                  // Update local state
                  setFlashcardSets((prev) =>
                    prev.map((s) => (s.id === setId ? { ...s, isPublic } : s))
                  );
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
