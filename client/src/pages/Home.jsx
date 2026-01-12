import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import FallingBlossoms from "../components/FallingBlossoms.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import { isAuthenticated } from "../utils/auth.js";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackCard from "../components/FeedbackCard.jsx";
import FAQSection from "../components/FAQSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faLink
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  PDF: faFilePdf,
  DOCX: faFileWord,
  PPTX: faFilePowerpoint,
  URL: faLink
};

// Animation fade-in mượt mà
const baseFadeInVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.1,
    },
  }),
};

// Dữ liệu feedback
const feedbackData = [
  {
    quote: "Quả thật là cứu tinh mùa thi! Chỉ mất 3 phút upload file slide 70 trang, AI đã trả về bộ quiz hoàn chỉnh.",
    name: "Nguyễn Ngọc Tuấn",
    role: "Sinh viên năm 3, ĐH HUTECH",
    avatarInitial: "P",
    bgColor: "bg-green-100",
  },
  {
    quote: "Giao diện Tết quá ấm áp! UniQuizz giúp mình giảm bớt áp lực ôn thi nhờ sự tập trung cao độ.",
    name: "Lê Kim Nghĩa",
    role: "Sinh viên năm 4, FTU",
    avatarInitial: "N",
    bgColor: "bg-yellow-100",
  },
  {
    quote: "Mentor AI quá đỉnh! Giải thích kiến thức siêu chi tiết. Cảm giác như có gia sư 1 kèm 1.",
    name: "Lê Quốc Khánh",
    role: "Sinh viên năm 2, UEH",
    avatarInitial: "T",
    bgColor: "bg-blue-100",
  },
  {
    quote: "Tuyệt vời cho Flash Card! AI tự động tách và tạo thẻ từ tài liệu rất thông minh.",
    name: "Trần Hoàng Văn",
    role: "Sinh viên năm cuối, HUB",
    avatarInitial: "L",
    bgColor: "bg-red-100",
  },
  {
    quote: "Cơ chế tạo quiz rất thông minh, không mắc lỗi dịch thuật. Công cụ tốt nhất tôi từng dùng.",
    name: "Công Trường",
    role: "Sinh viên IT, HCMUTE",
    avatarInitial: "H",
    bgColor: "bg-purple-100",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const nextSlide = useCallback(() => {
    setStartIndex((prev) => (prev + 1) % feedbackData.length);
  }, []);

  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + feedbackData.length) % feedbackData.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const visibleCards = [
    feedbackData[startIndex],
    feedbackData[(startIndex + 1) % feedbackData.length],
    feedbackData[(startIndex + 2) % feedbackData.length],
  ];

  const handleStartNow = () => {
    if (isLoggedIn) navigate("/create");
    else navigate("/register");
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 relative overflow-x-hidden selection:bg-red-200 dark:selection:bg-red-900">
      <FallingBlossoms />
      <Header />

      {/* Hero Section */}
      <motion.section
        className="relative px-8 pt-32 pb-20 flex flex-col items-center text-center overflow-hidden"
        variants={baseFadeInVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-orange-50 to-yellow-100 dark:from-red-950 dark:via-orange-950 dark:to-yellow-950 opacity-60 dark:opacity-40"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-300 dark:bg-red-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-300 dark:bg-orange-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Decorative Elements */}
        <motion.img src="/tet_left.png" className="absolute left-5 top-5 w-28 opacity-90 z-10" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 0.9 }} transition={{ duration: 1, ease: "easeOut" }} />
        <motion.img src="/tet_right.png" className="absolute right-5 top-5 w-28 opacity-90 z-10" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 0.9 }} transition={{ duration: 1, ease: "easeOut" }} />

        {/* Content */}
        <div className="relative z-10">
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 dark:from-red-400 dark:via-orange-400 dark:to-yellow-400 drop-shadow-lg leading-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Học Tết - Nhớ Nhà
            <br />
            Nhưng Vẫn Hiệu Quả
          </motion.h1>

          <motion.p
            className="mt-6 text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Tạo quiz tự động từ file .docx bằng AI. Học nhanh, nhớ lâu, tiết kiệm thời gian - để bạn có thêm những phút giây đoàn tụ cùng gia đình dịp Tết.
          </motion.p>

          {/* Buttons: Giữ hiệu ứng Shine + Wiggle bạn đã thích */}
          <motion.div
            className="mt-12 flex gap-6 flex-wrap justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Button 1 */}
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/create" className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-red-500/40 border-2 border-red-400/20 overflow-hidden group">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }} />
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} className="relative z-10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </motion.div>
                <span className="relative z-10">Tạo Quiz Mới</span>
              </Link>
            </motion.div>

            {/* Button 2 */}
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/flashcard-hub" className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/40 border-2 border-green-400/20 overflow-hidden group">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }} />
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }} className="relative z-10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </motion.div>
                <span className="relative z-10">Học Flashcard</span>
              </Link>
            </motion.div>

            {/* Button 3 */}
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/myquizzes" className="relative flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl font-bold text-lg shadow-lg border-2 border-red-200 dark:border-red-800 overflow-hidden group">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/50 dark:via-white/10 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }} />
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 }} className="relative z-10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </motion.div>
                <span className="relative z-10">Quiz Của Tôi</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }}>
            {[
              { val: "10K+", label: "Quiz đã tạo", color: "text-red-600 dark:text-red-400" },
              { val: "5K+", label: "Người dùng", color: "text-orange-600 dark:text-orange-400" },
              { val: "98%", label: "Hài lòng", color: "text-yellow-600 dark:text-yellow-400" }
            ].map((stat, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.1 }} className="text-center cursor-default">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.val}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </motion.div>
      </motion.section>

      {/* ⭐ FEATURES SECTION - GIỮ STYLE CŨ + THÊM HOVER MỚI ⭐ */}
      <motion.section
        className="py-20 px-8 relative z-10 bg-white dark:bg-gray-900"
        variants={baseFadeInVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={1}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Tại sao UniQuizz sẽ giúp bạn học tốt hơn?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Công nghệ AI kết hợp trải nghiệm học tập hiện đại</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 (Red/Orange Style) */}
            <motion.div
              className="group relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-8 rounded-2xl border border-red-100 dark:border-red-900/50 overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }} // Hover: Bay lên + Scale nhẹ
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Blob background - Scale khi hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 dark:bg-red-800 rounded-full -mr-16 -mt-16 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>

                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 group-hover:text-red-500 transition-colors">AI tạo câu hỏi tự động</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Hỗ trợ PDF, DOCX, PPTX, URL, YouTube → nhận quiz đầy đủ chỉ sau vài giây. Công nghệ AI thông minh hiểu ngữ cảnh.</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['PDF', 'DOCX', 'PPTX', 'URL'].map((tag) => (
                    <span
                      key={tag}
                      className="
        px-2 py-1 
        bg-red-100 dark:bg-red-900/30 
        text-red-600 dark:text-red-400 
        text-xs rounded-full font-medium 
        transition-transform duration-200 ease-out
        hover:scale-110 cursor-default flex items-center gap-1
      "
                    >
                      <FontAwesomeIcon icon={iconMap[tag]} className="w-3.5 h-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>

              </div>
            </motion.div>

            {/* Feature 2 (Green Style) */}
            <motion.div
              className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8 rounded-2xl border border-green-100 dark:border-green-900/50 overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full -mr-16 -mt-16 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>

                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 group-hover:text-green-500 transition-colors">Giao diện học đẹp</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Tinh tế, tối giản, lấy cảm hứng từ không khí Tết ấm áp. Dark mode mượt mà giúp học tập thoải mái mọi lúc.</p>
              </div>
            </motion.div>

            {/* Feature 3 (Blue Style) */}
            <motion.div
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-8 rounded-2xl border border-blue-100 dark:border-blue-900/50 overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full -mr-16 -mt-16 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>

                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 group-hover:text-blue-500 transition-colors">Theo dõi tiến độ học</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Lưu quiz, xem kết quả mỗi lần luyện tập. Dashboard thông minh giúp bạn nắm rõ điểm mạnh, điểm yếu.</p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Feature 4 (Purple/Pink Horizontal) */}
            <motion.div
              className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden flex items-center gap-4"
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 group-hover:text-purple-500 transition-colors">Mentor AI 24/7</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Hỏi đáp với AI mentor bất cứ lúc nào, giải thích chi tiết từng khái niệm khó hiểu.</p>
              </div>
            </motion.div>

            {/* Feature 5 (Yellow/Amber Horizontal) */}
            <motion.div
              className="group relative bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 overflow-hidden flex items-center gap-4"
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 group-hover:text-yellow-500 transition-colors">Flashcard Hub</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Học từ vựng, thuật ngữ với flashcard thông minh. Thuật toán lặp lại ngắt quãng.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Mentor AI */}
      <motion.section
        className="relative z-10 py-24 px-8 bg-gradient-to-b from-red-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden"
        variants={baseFadeInVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={2}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-2 h-2 bg-yellow-300 dark:bg-yellow-400 rounded-full top-10 left-1/4 animate-bounce opacity-70" />
          <div className="absolute w-2 h-2 bg-yellow-300 dark:bg-yellow-400 rounded-full top-1/2 left-10 animate-ping opacity-70" />
          <div className="absolute w-2 h-2 bg-yellow-300 dark:bg-yellow-400 rounded-full bottom-16 right-1/3 animate-bounce opacity-70" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">Gặp gỡ <span className="text-red-600 dark:text-red-400">Miku Mentor</span></h2>
            <p className="mt-5 text-lg text-gray-700 dark:text-gray-300 max-w-md">Tính năng mới! Củng cố kiến thức của bạn với một mentor 2D. Tải tài liệu lên và để Miku giảng bài cho bạn.</p>

            <motion.div whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/mentor"
                className="mt-8 inline-block px-10 py-4 rounded-xl bg-red-600 dark:bg-red-500 text-white font-semibold shadow-lg hover:bg-red-700 dark:hover:bg-red-600"
              >
                Trải nghiệm ngay
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-8 bg-red-400/20 dark:bg-red-500/30 rounded-full blur-2xl group-hover:bg-red-400/30 transition-all duration-700 ease-in-out" />
              <img src="https://media.tenor.com/UATloqaC3aAAAAAi/hatsune-miku.gif" alt="Miku Dance" className="relative w-72 md:w-96 animate-float drop-shadow-2xl dark:drop-shadow-[0_20px_40px_rgba(239,68,68,0.4)]" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Cách Hoạt Động */}
      <motion.section
        className="mt-10 px-8 pb-20 relative z-10 bg-white dark:bg-gray-900"
        variants={baseFadeInVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={3}
      >
        <div className="max-w-5xl mx-auto py-16">
          <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Hoạt động như thế nào?</h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Chỉ 3 bước đơn giản để có ngay bộ câu hỏi ôn tập.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { id: 1, title: "Tải lên tài liệu", desc: "Chỉ cần tải lên file .docx chứa nội dung bài học của bạn." },
              { id: 2, title: "AI xử lý", desc: "UniQuizz AI sẽ đọc, hiểu và tạo ra các câu hỏi trắc nghiệm." },
              { id: 3, title: "Bắt đầu học", desc: "Làm quiz, xem lại đáp án và theo dõi tiến độ ngay lập tức." }
            ].map((step) => (
              <motion.div
                key={step.id}
                className="group flex flex-col items-center text-center cursor-default"
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-bold text-2xl rounded-full flex items-center justify-center mb-4 transition-transform duration-500 ease-in-out group-hover:scale-110 group-hover:bg-red-200 dark:group-hover:bg-red-800 shadow-md">
                  {step.id}
                </div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{step.title}</h4>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <FAQSection baseFadeInVariants={baseFadeInVariants} />

      {/* CTA Section */}
      <motion.section
        className="relative z-10 py-20 mt-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/bgCTA.jpg')" }}
        variants={baseFadeInVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={5}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="max-w-2xl mx-auto text-center px-8 relative z-20">
          <h2 className="text-3xl font-extrabold text-white dark:text-gray-100">Sẵn sàng học tập hiệu quả dịp Tết?</h2>
          <p className="mt-4 text-lg text-gray-200 dark:text-gray-300">{isLoggedIn ? "Bắt đầu tạo quiz đầu tiên của bạn ngay." : "Tạo tài khoản miễn phí và bắt đầu tạo quiz đầu tiên trong vài giây."}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block mt-8">
            <button
              onClick={handleStartNow}
              className="px-10 py-4 rounded-xl bg-red-600 text-white font-semibold shadow-xl hover:bg-orange-500 text-lg transition-colors"
            >
              {isLoggedIn ? "Tạo Quiz Mới Ngay" : "Bắt đầu ngay"}
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ⭐ TESTIMONIALS - Reviews từ người dùng ⭐ */}

      <motion.section

        className="py-24 relative z-10 overflow-hidden"

        variants={baseFadeInVariants}

        initial="hidden"

        whileInView="visible"

        viewport={{ once: true, amount: 0.2 }}

        custom={6}

      >

        {/* Background linear */}

        <div className="absolute inset-0 bg-linear-to-b from-gray-50 via-red-50/30 to-orange-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-orange-950/20"></div>



        {/* Decorative Elements */}

        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 dark:bg-red-800 rounded-full opacity-20 blur-2xl"></div>

        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-200 dark:bg-orange-800 rounded-full opacity-20 blur-2xl"></div>



        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">

          <motion.div

            initial={{ y: 20, opacity: 0 }}

            whileInView={{ y: 0, opacity: 1 }}

            viewport={{ once: true }}

            className="mb-16"

          >

            <h3 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-100 mb-4">

              Khách Hàng Nói Gì Về UniQuizz?

            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">

              Hơn 5,000 sinh viên đã tin tưởng và sử dụng UniQuizz để cải thiện kết quả học tập

            </p>

          </motion.div>



          <div className="relative max-w-5xl mx-auto px-4">

            {/* Navigation Buttons */}

            <button

              onClick={prevSlide}

              className="absolute left-0 top-1/2 -mt-6 z-20 p-4 rounded-full bg-white dark:bg-gray-800 shadow-2xl text-red-600 dark:text-red-400 

              border border-red-100 dark:border-red-900 md:-ml-12

              transform transition-all duration-300 ease-out 

              hover:bg-red-50 dark:hover:bg-gray-700 hover:scale-110 hover:shadow-xl"

              aria-label="Previous testimonial"

            >

              <svg

                xmlns="http://www.w3.org/2000/svg"

                className="h-6 w-6"

                fill="none"

                viewBox="0 0 24 24"

                stroke="currentColor"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  strokeWidth={2}

                  d="M15 19l-7-7 7-7"

                />

              </svg>

            </button>



            {/* Testimonial Cards */}

            <motion.div

              key={startIndex}

              initial={{ x: 100, opacity: 0 }}

              animate={{ x: 0, opacity: 1 }}

              exit={{ x: -100, opacity: 0 }}

              transition={{ duration: 0.6, ease: "easeOut" }}

              className="grid grid-cols-1 md:grid-cols-3 gap-6"

            >

              {visibleCards.map((card, index) => (

                <motion.div

                  key={index}

                  initial={{ y: 20, opacity: 0 }}

                  animate={{ y: 0, opacity: 1 }}

                  transition={{ delay: index * 0.1 }}

                >

                  <FeedbackCard {...card} />

                </motion.div>

              ))}

            </motion.div>



            <button

              onClick={nextSlide}

              className="absolute right-0 top-1/2 -mt-6 z-20 p-4 rounded-full bg-white dark:bg-gray-800 shadow-2xl text-red-600 dark:text-red-400 

              border border-red-100 dark:border-red-900 md:-mr-12

              transform transition-all duration-300 ease-out 

              hover:bg-red-50 dark:hover:bg-gray-700 hover:scale-110 hover:shadow-xl"

              aria-label="Next testimonial"

            >

              <svg

                xmlns="http://www.w3.org/2000/svg"

                className="h-6 w-6"

                fill="none"

                viewBox="0 0 24 24"

                stroke="currentColor"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  strokeWidth={2}

                  d="M9 5l7 7-7 7"

                />

              </svg>

            </button>

          </div>



          {/* Pagination Dots */}

          <div className="flex justify-center mt-12 space-x-3">

            {feedbackData.map((_, i) => (

              <button

                key={i}

                onClick={() => setStartIndex(i)}

                className={`h-3 rounded-full transition-all duration-300 ease-out hover:scale-125 cursor-pointer

                ${i === startIndex

                    ? "bg-linear-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500 w-8 shadow-lg"

                    : "bg-gray-300 dark:bg-gray-600 w-3 hover:bg-gray-400 dark:hover:bg-gray-500"

                  }`}

                aria-label={`Chuyển đến feedback ${i + 1}`}

              ></button>

            ))}

          </div>



          {/* Trust Indicators */}

          <motion.div

            className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-600 dark:text-gray-400"

            initial={{ y: 20, opacity: 0 }}

            whileInView={{ y: 0, opacity: 1 }}

            viewport={{ once: true }}

            transition={{ delay: 0.3 }}

          >

            <div className="flex items-center gap-2 group cursor-default">

              <svg className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">

                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />

              </svg>

              <span className="font-semibold">4.9/5</span>

              <span className="text-sm">từ 500+ đánh giá</span>

            </div>

            <div className="flex items-center gap-2 group cursor-default">

              <svg className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

              </svg>

              <span className="font-semibold">98%</span>

              <span className="text-sm">khách hàng hài lòng</span>

            </div>

            <div className="flex items-center gap-2 group cursor-default">

              <svg className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />

              </svg>

              <span className="font-semibold">5,000+</span>

              <span className="text-sm">người dùng</span>

            </div>

          </motion.div>

        </div>

      </motion.section>
      <Footer />
    </div>
  );
}