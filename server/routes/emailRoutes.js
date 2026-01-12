const express = require('express');
const router = express.Router();
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');

// Sử dụng mock email nếu chưa config Gmail
const USE_MOCK_EMAIL = !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com';
const emailService = USE_MOCK_EMAIL 
  ? require('../services/emailService.mock')
  : require('../services/emailService');

const { generateOTP, sendVerificationEmail, sendWelcomeEmail } = emailService;

// Log email mode
if (USE_MOCK_EMAIL) {
  console.log('⚠️  Using MOCK email service (OTP will be logged to console)');
  console.log('💡 To use real email, setup EMAIL_USER and EMAIL_PASSWORD in .env');
} else {
  console.log('✅ Using real email service');
}

// POST /api/email/send-otp - Gửi mã OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Kiểm tra rate limit (không gửi quá 3 lần trong 10 phút)
    const recentOTPs = await EmailVerification.find({
      email,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (recentOTPs.length >= 3) {
      return res.status(429).json({ 
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Lưu OTP vào database
    await EmailVerification.create({
      email,
      otp,
    });

    // Gửi email
    await sendVerificationEmail(email, otp, fullName);

    res.json({ 
      success: true, 
      message: 'Mã xác thực đã được gửi đến email của bạn',
      expiresIn: 600 // 10 phút
    });
  } catch (error) {
    console.error('Lỗi khi gửi OTP:', error);
    res.status(500).json({ 
      message: 'Lỗi khi gửi email xác thực',
      error: error.message 
    });
  }
});

// POST /api/email/verify-otp - Xác thực mã OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email và mã OTP là bắt buộc' });
    }

    // Tìm OTP gần nhất
    const verification = await EmailVerification.findOne({
      email,
      otp,
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.status(400).json({ message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }

    // Kiểm tra số lần thử
    if (verification.attempts >= 5) {
      await EmailVerification.deleteMany({ email });
      return res.status(400).json({ 
        message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.' 
      });
    }

    // Tăng số lần thử
    verification.attempts += 1;
    await verification.save();

    // Xóa OTP sau khi xác thực thành công
    await EmailVerification.deleteMany({ email });

    res.json({ 
      success: true, 
      message: 'Xác thực email thành công',
      verified: true
    });
  } catch (error) {
    console.error('Lỗi khi xác thực OTP:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xác thực OTP',
      error: error.message 
    });
  }
});

// POST /api/email/resend-otp - Gửi lại mã OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    // Xóa OTP cũ
    await EmailVerification.deleteMany({ email });

    // Generate OTP mới
    const otp = generateOTP();

    // Lưu OTP mới
    await EmailVerification.create({
      email,
      otp,
    });

    // Gửi email
    await sendVerificationEmail(email, otp, fullName);

    res.json({ 
      success: true, 
      message: 'Mã xác thực mới đã được gửi',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Lỗi khi gửi lại OTP:', error);
    res.status(500).json({ 
      message: 'Lỗi khi gửi lại mã xác thực',
      error: error.message 
    });
  }
});

module.exports = router;
