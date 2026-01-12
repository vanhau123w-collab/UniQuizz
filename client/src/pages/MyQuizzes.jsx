import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuizCard from "../components/QuizCard";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để xem quiz của bạn");
        setIsLoading(false);
        return;
      }
      
      const res = await fetch(API_ENDPOINTS.DECKS, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("userUpdate"));
          navigate("/login");
          return;
        }
        throw new Error("Không thể tải danh sách quiz");
      }
      
      const data = await res.json();
      
      // Map dữ liệu từ MongoDB sang format cho QuizCard
      const formattedQuizzes = data.map((deck) => ({
        id: deck._id,
        title: deck.title,
        questionCount: deck.questions?.length || 0,
        courseCode: deck.courseCode,
        isPublic: deck.isPublic || false,
      }));
      
      setQuizzes(formattedQuizzes);
      setFilteredQuizzes(formattedQuizzes);
    } catch (err) {
      console.error("Lỗi khi tải quiz:", err);
      setError(err.message || "Có lỗi xảy ra khi tải danh sách quiz");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuizzes(quizzes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(query) ||
      (quiz.courseCode && quiz.courseCode.toLowerCase().includes(query))
    );
    setFilteredQuizzes(filtered);
  }, [searchQuery, quizzes]);

  const handleDeleteQuiz = async (quizId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Vui lòng đăng nhập để xóa quiz");
        navigate("/login");
        return;
      }

      const res = await fetch(API_ENDPOINTS.DELETE_DECK(quizId), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Không thể xóa quiz");
      }

      // Xóa quiz khỏi danh sách local ngay lập tức để UX tốt hơn
      setQuizzes((prevQuizzes) => prevQuizzes.filter((q) => q.id !== quizId));
      
      // Có thể thêm thông báo thành công ở đây nếu muốn
      console.log("Đã xóa quiz thành công");
    } catch (err) {
      console.error("Lỗi khi xóa quiz:", err);
      alert(err.message || "Có lỗi xảy ra khi xóa quiz");
      // Refresh lại danh sách để đảm bảo đồng bộ
      fetchQuizzes();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Header />

      {/* Phần nội dung chính */}
      <main className="grow max-w-6xl mx-auto w-full px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Quiz của tôi
          </h1>
          
          <div className="flex gap-3">
            <Link
              to="/create-room"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Tạo phòng
            </Link>
            <Link
              to="/join-room"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Tham gia
            </Link>
          </div>
          
          {/* Search bar */}
          {!isLoading && quizzes.length > 0 && (
            <div className="relative max-w-md w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm quiz..."
                className="w-full px-4 py-2 pl-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center text-gray-600 py-12">
            <p>Đang tải danh sách quiz...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center text-red-600 py-12">
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchQuizzes}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && quizzes.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400 py-12">
            <p className="mb-4">Bạn chưa có bộ quiz nào.</p>
            <Link
              to="/create"
              className="inline-block px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Tạo quiz mới ngay
            </Link>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !error && quizzes.length > 0 && filteredQuizzes.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">Không tìm thấy quiz nào</p>
            <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 text-red-600 dark:text-red-400 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Quiz list */}
        {!isLoading && !error && filteredQuizzes.length > 0 && (
          <>
            {searchQuery && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tìm thấy {filteredQuizzes.length} quiz
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <QuizCard 
                  key={quiz.id} 
                  quiz={quiz} 
                  onDelete={handleDeleteQuiz}
                  onPublicToggle={(quizId, isPublic) => {
                    // Update local state
                    setQuizzes(prev => prev.map(q => 
                      q.id === quizId ? { ...q, isPublic } : q
                    ));
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}