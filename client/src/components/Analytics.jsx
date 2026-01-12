import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics 4 Integration
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    if (window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

// Custom event tracking functions
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
  console.log('📊 Event tracked:', eventName, eventParams);
};

// Predefined tracking events
export const analytics = {
  // User actions
  signUp: (method = 'email') => {
    trackEvent('sign_up', { method });
  },
  
  login: (method = 'email') => {
    trackEvent('login', { method });
  },
  
  logout: () => {
    trackEvent('logout');
  },

  // Quiz actions
  createQuiz: (quizTitle) => {
    trackEvent('create_quiz', { 
      quiz_title: quizTitle,
      timestamp: new Date().toISOString()
    });
  },

  startQuiz: (quizId, quizTitle) => {
    trackEvent('start_quiz', { 
      quiz_id: quizId,
      quiz_title: quizTitle 
    });
  },

  completeQuiz: (quizId, score, totalQuestions) => {
    trackEvent('complete_quiz', { 
      quiz_id: quizId,
      score: score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100)
    });
  },

  // Flashcard actions
  createFlashcard: (topicName) => {
    trackEvent('create_flashcard', { 
      topic_name: topicName 
    });
  },

  studyFlashcard: (topicId, cardCount) => {
    trackEvent('study_flashcard', { 
      topic_id: topicId,
      card_count: cardCount 
    });
  },

  // Mentor actions
  uploadDocument: (fileName, fileSize) => {
    trackEvent('upload_document', { 
      file_name: fileName,
      file_size: fileSize 
    });
  },

  startLecture: (lectureTitle) => {
    trackEvent('start_lecture', { 
      lecture_title: lectureTitle 
    });
  },

  chatWithMentor: (questionLength) => {
    trackEvent('chat_mentor', { 
      question_length: questionLength 
    });
  },

  // UI interactions
  toggleDarkMode: (enabled) => {
    trackEvent('toggle_dark_mode', { 
      enabled: enabled 
    });
  },

  clickCTA: (ctaLocation, ctaText) => {
    trackEvent('click_cta', { 
      location: ctaLocation,
      text: ctaText 
    });
  },

  shareQuiz: (method, quizId) => {
    trackEvent('share', { 
      method: method,
      content_type: 'quiz',
      content_id: quizId 
    });
  },

  // Errors
  error: (errorType, errorMessage) => {
    trackEvent('error', { 
      error_type: errorType,
      error_message: errorMessage 
    });
  }
};
