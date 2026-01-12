import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";
import Confetti from "../components/Confetti";
import LoadingSkeleton from "../components/LoadingSkeleton";
import CircularTimer from "../components/CircularTimer";
import SEOHead, { getQuizMeta } from "../components/SEOHead";

// Sound effects
const correctSound = new Audio('/correct.mp3');
const wrongSound = new Audio('/wrong.mp3');
const winSound = new Audio('/winsound.mp3');

export default function QuizPlayer() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timerActive, setTimerActive] = useState(true);
  const [timePerQuestion] = useState(30); // 30 seconds per question

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        const token = getAuthToken();
        console.log('[QuizPlayer] Fetching quiz:', quizId);
        console.log('[QuizPlayer] Has token:', !!token);
        
        let res;
        let fetchMethod = '';
        
        // Nếu có token, thử fetch quiz của user trước (nhanh hơn)
        if (token) {
          console.log('[QuizPlayer] Trying authenticated fetch...');
          fetchMethod = 'authenticated';
          res = await fetch(API_ENDPOINTS.DECK_BY_ID(quizId), {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          // Nếu không tìm thấy (404), thử public
          if (res.status === 404) {
            console.log('[QuizPlayer] Not found in user quizzes, trying public...');
            fetchMethod = 'public';
            res = await fetch(API_ENDPOINTS.DECK_PUBLIC(quizId));
          }
        } else {
          // Không có token, chỉ fetch public
          console.log('[QuizPlayer] No token, trying public fetch...');
          fetchMethod = 'public';
          res = await fetch(API_ENDPOINTS.DECK_PUBLIC(quizId));
        }

        console.log('[QuizPlayer] Response status:', res.status, 'Method:', fetchMethod);

        if (!res.ok) {
          if (res.status === 401) {
            setError("Vui lòng đăng nhập để xem quiz này");
            setIsLoading(false);
            return;
          }
          if (res.status === 404) {
            setError("Quiz không tồn tại hoặc chưa được chia sẻ công khai");
            setIsLoading(false);
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Không thể tải quiz (${res.status})`);
        }

        const data = await res.json();
        console.log('[QuizPlayer] Quiz loaded successfully:', data.title);
        setQuiz(data);
      } catch (err) {
        console.error("[QuizPlayer] Error loading quiz:", err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
          setError(err.message || "Có lỗi xảy ra khi tải quiz");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, navigate]);

  // Cleanup: Stop background music when component unmounts
  useEffect(() => {
    return () => {
      if (window.soundManager) {
        window.soundManager.stopBackgroundMusic();
      }
    };
  }, []);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswerSelect = (option) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return; 
    setIsAnswered(true);
    setTimerActive(false); // Stop timer

    if (selectedAnswer === currentQuestion.answer) {
      setScore(score + 1);
      correctSound.play();
      setShowConfetti(true); // Trigger confetti!
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      wrongSound.play();
    }
  };

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      wrongSound.play();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      // Reset states immediately for smooth transition
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimerActive(true);
      
      // Use setTimeout to batch state updates and reduce lag
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionKey(prevKey => prevKey + 1);
      }, 0);
    } else {
      setShowResults(true);
      // Play win sound if score is good
      const percentage = ((score + (selectedAnswer === currentQuestion.answer ? 1 : 0)) / quiz.questions.length) * 100;
      if (percentage >= 70) {
        winSound.play();
        setShowConfetti(true);
      }
    }
  };

  const getOptionClass = (option) => {
    let baseClasses = "relative w-full p-4 border-2 rounded-lg text-left font-medium transition-all duration-300 flex items-center";
    let iconClass = "";

    if (!isAnswered) {
      if (selectedAnswer === option) {
        baseClasses += " bg-red-100 border-red-400 text-red-800 shadow-md scale-105"; 
        iconClass = "bg-red-600";
      } else {
        baseClasses += " bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200"; 
        iconClass = "bg-gray-300";
      }
    } else {
      if (option === currentQuestion.answer) {
        baseClasses += " bg-green-100 border-green-500 text-green-800 shadow-lg"; 
        iconClass = "bg-green-600";
      } else if (option === selectedAnswer && option !== currentQuestion.answer) {
        baseClasses += " bg-red-100 border-red-500 text-red-800 shadow-lg"; 
        iconClass = "bg-red-600";
      } else {
        baseClasses += " bg-gray-50 border-gray-200 text-gray-600 opacity-70"; 
        iconClass = "bg-gray-300";
      }
    }

    return { baseClasses, iconClass };
  };

  if (isLoading) {
    return <LoadingSkeleton type="quiz" />;
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md"
        >
          <div className="text-6xl mb-4">😕</div>
          <div className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">
            {error || "Không tìm thấy quiz."}
          </div>
          <button
            onClick={() => navigate("/myquizzes")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Quay về "Quiz của tôi"
          </button>
        </motion.div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const resultMessage = percentage >= 70 ? "Chúc mừng, bạn đã làm rất tốt!" : "Hãy cố gắng hơn nữa nhé!";
    const emoji = percentage >= 90 ? "🏆" : percentage >= 70 ? "🎉" : percentage >= 50 ? "😊" : "😔";

    return (
      <>
        <Confetti trigger={showConfetti} />
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-lg w-full border-2 border-red-100 dark:border-red-900"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-8xl mb-6"
            >
              {emoji}
            </motion.div>

            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-4">
              Hoàn thành Quiz!
            </h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                Điểm của bạn:
              </p>
              <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
                {score} / {quiz.questions.length}
              </div>
            </motion.div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{resultMessage}</p>

            {/* Circular Progress */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="relative w-48 h-48 mx-auto mb-8"
            >
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - percentage / 100) }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{percentage}%</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition shadow-lg hover:shadow-xl"
              >
                Làm lại Quiz
              </motion.button>
              <motion.button
                onClick={() => {
                  // Stop any background music if playing
                  if (window.soundManager) {
                    window.soundManager.stopBackgroundMusic();
                  }
                  navigate("/myquizzes");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 py-4 rounded-xl font-semibold border-2 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-gray-600 transition shadow-md"
              >
                Quay về "Quiz của tôi"
              </motion.button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Quiz Interface
  return (
    <>
      <SEOHead {...getQuizMeta(quiz)} />
      <Confetti trigger={showConfetti} />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-red-100 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">{quiz.title}</h1>
              </div>
              <div className="flex items-center gap-6">
                <CircularTimer
                  duration={timePerQuestion}
                  onTimeUp={handleTimeUp}
                  isActive={timerActive && !isAnswered}
                  size={60}
                  resetKey={currentQuestionIndex} // Reset timer mỗi câu hỏi
                />
                <button
                  onClick={() => {
                    // Stop any background music if playing
                    if (window.soundManager) {
                      window.soundManager.stopBackgroundMusic();
                    }
                    navigate('/myquizzes');
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline font-medium">Thoát</span>
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Câu {currentQuestionIndex + 1}/{quiz.questions.length}
              </span>
              <div className="relative flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </motion.div>
              </div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
              </span>
            </div>
          </div>
        </header>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionKey}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-2xl border-2 border-red-100 dark:border-red-900"
          >
          {/* Question */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold">?</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>
          </motion.div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const { baseClasses, iconClass } = getOptionClass(option);
              const isCorrect = isAnswered && option === currentQuestion.answer;
              const isWrong = isAnswered && option === selectedAnswer && option !== currentQuestion.answer;
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={isAnswered}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  className={`${baseClasses} group relative overflow-hidden`}
                >
                  {/* Animated background on correct answer */}
                  {isCorrect && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 shrink-0 ${iconClass} shadow-md transition-transform group-hover:scale-110`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="grow text-left">{option}</span>
                  
                  {isCorrect && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="ml-auto text-green-700 dark:text-green-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                  {isWrong && (
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="ml-auto text-red-700 dark:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            className="mt-12 flex justify-between items-center"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Điểm hiện tại: <span className="font-bold text-red-600 dark:text-red-400 text-lg">{score}</span>
            </div>
            
            {!isAnswered ? (
              <motion.button
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer}
                whileHover={selectedAnswer ? { scale: 1.05 } : {}}
                whileTap={selectedAnswer ? { scale: 0.95 } : {}}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg hover:from-red-700 hover:to-orange-700 transition disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                Kiểm tra
              </motion.button>
            ) : (
              <motion.button
                onClick={handleNextQuestion}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <>
                    Tiếp theo
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : (
                  <>
                    Xem kết quả
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </>
  );
}