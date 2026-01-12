import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import SEOHead from "../components/SEOHead";

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [courseCodeFilter, setCourseCodeFilter] = useState(searchParams.get('courseCode') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      performSearch(q, searchParams.get('courseCode') || '', searchParams.get('type') || 'all');
    }
  }, []);

  const performSearch = async (query, courseCode, type) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ q: query });
      if (courseCode) params.append('courseCode', courseCode);

      const endpoint = type === 'all' 
        ? '/search/all' 
        : type === 'quiz' 
        ? '/search/quizzes' 
        : '/search/flashcards';

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api${endpoint}?${params}`
      );

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams({ q: searchQuery, type: searchType });
    if (courseCodeFilter) params.append('courseCode', courseCodeFilter);
    
    setSearchParams(params);
    performSearch(searchQuery, courseCodeFilter, searchType);
  };

  const handleResultClick = (item) => {
    if (item.type === 'quiz') {
      navigate(`/quiz/${item._id}`);
    } else {
      navigate(`/flashcard/${item._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <SEOHead 
        title="Tìm kiếm Quiz & Flashcard"
        description="Tìm kiếm quiz và flashcard công khai từ cộng đồng UniQuizz"
      />
      <Header />
      
      <main className="grow max-w-6xl mx-auto p-4 sm:p-6 w-full mt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent text-center">
            Tìm kiếm Quiz & Flashcard
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Khám phá hàng ngàn quiz và flashcard từ cộng đồng
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Từ khóa tìm kiếm
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên quiz, mã học phần..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại nội dung
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="quiz">Chỉ Quiz</option>
                <option value="flashcard">Chỉ Flashcard</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mã học phần (tùy chọn)
            </label>
            <input
              type="text"
              value={courseCodeFilter}
              onChange={(e) => setCourseCodeFilter(e.target.value)}
              placeholder="VD: IT3080, MATH101..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={!searchQuery.trim() || isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </>
            )}
          </button>
        </motion.form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tìm kiếm...</p>
            </motion.div>
          ) : hasSearched && results.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
            >
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Không tìm thấy kết quả
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Thử tìm kiếm với từ khóa khác hoặc bỏ bớt bộ lọc
              </p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 text-gray-600 dark:text-gray-400">
                Tìm thấy <span className="font-semibold text-red-600 dark:text-red-400">{results.length}</span> kết quả
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleResultClick(item)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className={`h-2 ${item.type === 'quiz' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-green-500 to-teal-500'}`} />
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === 'quiz' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {item.type === 'quiz' ? '📝 Quiz' : '🗂️ Flashcard'}
                        </span>
                        
                        {item.courseCode && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                            {item.courseCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">
                          {item.userId?.fullName || item.userId?.email || 'Ẩn danh'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {item.type === 'quiz' 
                            ? `${item.questions?.length || 0} câu hỏi` 
                            : `${item.flashcards?.length || 0} thẻ`}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 pb-4">
                      <button className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2">
                        <span>Xem ngay</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default SearchPage;
