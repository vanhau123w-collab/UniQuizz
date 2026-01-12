// Mock Email Service - Chỉ dùng để test, không gửi email thật

// Generate OTP code (6 số)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock gửi email - Log ra console thay vì gửi thật
const sendVerificationEmail = async (email, otp, userName) => {
  console.log('\n========================================');
  console.log('📧 MOCK EMAIL - Không gửi email thật');
  console.log('========================================');
  console.log('To:', email);
  console.log('Subject: 🎓 Xác thực tài khoản UniQuizz');
  console.log('OTP Code:', otp);
  console.log('User:', userName);
  console.log('========================================\n');
  
  // Giả lập delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true, messageId: 'mock-' + Date.now() };
};

// Mock welcome email
const sendWelcomeEmail = async (email, userName) => {
  console.log('\n========================================');
  console.log('🎉 MOCK WELCOME EMAIL');
  console.log('========================================');
  console.log('To:', email);
  console.log('User:', userName);
  console.log('========================================\n');
  
  return { success: true };
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendWelcomeEmail,
};
