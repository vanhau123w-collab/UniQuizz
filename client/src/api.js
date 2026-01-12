// client/src/api.js

import axios from 'axios';
// Đường dẫn này đúng vì api.js nằm cùng cấp với utils
import { getAuthToken } from './utils/auth.js'; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5001/api',
});

// Đây là phần tự động gắn Token
api.interceptors.request.use(
  (config) => {
    // Lấy token bằng hàm của bạn từ utils/auth.js
    const token = getAuthToken(); 
    
    if (token) {
      // Gắn header Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Phần xử lý lỗi 401: Tự động đăng xuất
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token hết hạn hoặc không hợp lệ. Đang đẩy về trang Login.");
      localStorage.removeItem('token'); 
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;