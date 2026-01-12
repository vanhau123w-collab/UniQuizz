// Google Analytics 4 Helper Functions

export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with your GA4 ID

// Track page views
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined events
export const trackQuizCreated = (quizTitle) => {
  event({
    action: 'quiz_created',
    category: 'Quiz',
    label: quizTitle,
  });
};

export const trackQuizCompleted = (quizId, score) => {
  event({
    action: 'quiz_completed',
    category: 'Quiz',
    label: quizId,
    value: score,
  });
};

export const trackUserRegistered = (method = 'email') => {
  event({
    action: 'sign_up',
    category: 'User',
    label: method,
  });
};

export const trackUserLogin = (method = 'email') => {
  event({
    action: 'login',
    category: 'User',
    label: method,
  });
};

export const trackFlashcardCreated = (topicName) => {
  event({
    action: 'flashcard_created',
    category: 'Flashcard',
    label: topicName,
  });
};

export const trackMentorUsed = (action) => {
  event({
    action: 'mentor_interaction',
    category: 'Mentor',
    label: action,
  });
};

export const trackShareClick = (platform) => {
  event({
    action: 'share',
    category: 'Social',
    label: platform,
  });
};

export const trackCTAClick = (ctaName) => {
  event({
    action: 'cta_click',
    category: 'Engagement',
    label: ctaName,
  });
};
