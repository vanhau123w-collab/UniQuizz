import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import ScrollToTop from "./components/ScrollToTop";
import Analytics from "./components/Analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import InstallPWA from "./components/InstallPWA";
import { useEffect } from "react";
import { registerServiceWorker } from "./utils/pwa";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyQuizzes from "./pages/MyQuizzes";
import CreateQuiz from "./pages/CreateQuiz";
import QuizPlayer from "./pages/QuizPlayer";
import MentorPage from "./pages/MentorPage";
import Dashboard from "./pages/Dashboard";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import VerifyEmail from "./pages/VerifyEmail";
import VocabularyPage from './pages/VocabularyPage'; 
import FlashcardPage from './pages/FlashcardPage';
import TopicDetailsPage from './pages/TopicDetailsPage';
import FlashcardHubPage from './pages/FlashcardHubPage';
import CreateFlashcardPage from './pages/CreateFlashcardPage';
import MyFlashcards from './pages/MyFlashcards';
import ForgotPassword from './pages/ForgotPassword';
import SearchPage from './pages/SearchPage';
import RAGDocumentsPage from './pages/RAGDocumentsPage';
import RoomRedirect from './pages/RoomRedirect';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import MultiplayerRoom from './pages/MultiplayerRoom';
export default function App() {
  // Unregister Service Worker to fix white screen issue
  useEffect(() => {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('✅ Service Worker unregistered');
        });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Analytics />
          <ThemeToggle />
          <ScrollToTop />
          <InstallPWA />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/myquizzes" element={<MyQuizzes />} />

        <Route path="/create" element={<CreateQuiz />} />

        <Route path="/quiz/:quizId" element={<QuizPlayer />} />
        <Route path="/mentor" element={<MentorPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* ⚠️ Routes mới cho Học Từ Vựng */}
        <Route path="/flashcard-hub" element={<FlashcardHubPage />} />
        <Route path="/create-flashcard" element={<CreateFlashcardPage />} />
        <Route path="/my-flashcards" element={<MyFlashcards />} />

        {/* RAG Documents */}
        <Route path="/rag-documents" element={<RAGDocumentsPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route 
          path="/topic-details/:topicId" 
          element={<TopicDetailsPage />} 
          // ⭐️ THÊM KEY ĐỂ BUỘC COMPONENT RENDER LẠI KHI topicId THAY ĐỔI ⭐️
          key={location.pathname} 
        />
        <Route path="/flashcard/:topicId" element={<FlashcardPage />} />

        {/* Route tìm kiếm */}
        <Route path="/search" element={<SearchPage />} />

        {/* Route xem quiz công khai */}
        <Route path="/decks/public/:id" element={<QuizPlayer />} />

        {/* Multiplayer Routes */}
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/room/:roomCode" element={<MultiplayerRoom />} />
        <Route path="/r/:roomCode" element={<RoomRedirect />} />
        
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
