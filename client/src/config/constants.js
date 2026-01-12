// App Configuration
export const APP_CONFIG = {
  // Production URL - Lấy từ env hoặc fallback
  PRODUCTION_URL: import.meta.env.VITE_APP_URL || 'https://uniquizz.com',
  
  // Development URL
  DEVELOPMENT_URL: 'http://localhost:5173',
  
  // Get current base URL
  getBaseUrl: () => {
    // Ưu tiên env variable
    if (import.meta.env.VITE_APP_URL) {
      return import.meta.env.VITE_APP_URL;
    }
    
    // Nếu đang ở production (deployed)
    if (import.meta.env.PROD) {
      return APP_CONFIG.PRODUCTION_URL;
    }
    
    // Development: sử dụng current origin
    return window.location.origin;
  }
};

// App Info
export const APP_INFO = {
  name: 'UniQuizz',
  tagline: 'Học nhanh, nhớ lâu, tiết kiệm thời gian',
  description: 'Tạo quiz tự động từ file .docx bằng AI',
  email: 'teeforwork21@gmail.com',
  facebook: 'https://www.facebook.com/nhatthien.nguyen.566'
};
