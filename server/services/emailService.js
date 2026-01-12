const nodemailer = require('nodemailer');

// Cấu hình email transporter
const createTransporter = () => {
  // Option 1: Gmail SMTP (Default)
  if (process.env.SMTP_SERVICE === 'gmail' || !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  
  // Option 2: Custom SMTP Server
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Cho phép self-signed certificates
    }
  });
};

// Generate OTP code (6 số)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email xác thực
const sendVerificationEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'UniQuizz',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎓 Xác thực tài khoản UniQuizz',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #fff7f0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: #fff7f0;
              border: 2px dashed #dc2626;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 48px;
              font-weight: bold;
              color: #dc2626;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #dc2626;
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 UniQuizz</h1>
              <p style="color: white; margin: 10px 0 0 0;">Học nhanh, nhớ lâu, tiết kiệm thời gian</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937;">Xin chào ${userName || 'bạn'}! 👋</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Cảm ơn bạn đã đăng ký tài khoản UniQuizz. Để hoàn tất quá trình đăng ký, 
                vui lòng xác thực địa chỉ email của bạn bằng mã OTP bên dưới:
              </p>

              <div class="otp-box">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">MÃ XÁC THỰC CỦA BẠN</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Mã có hiệu lực trong 10 phút</p>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý bảo mật:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>UniQuizz sẽ không bao giờ yêu cầu mã qua điện thoại</li>
                  <li>Nếu bạn không đăng ký, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <p style="color: #4b5563; line-height: 1.6;">
                Sau khi xác thực, bạn có thể:
              </p>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>✅ Tạo quiz tự động từ file .docx</li>
                <li>✅ Học flashcard thông minh</li>
                <li>✅ Chat với Mentor AI</li>
                <li>✅ Theo dõi tiến độ học tập</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email" class="button">
                  Xác thực ngay
                </a>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">
                <strong>UniQuizz</strong> - Nền tảng học tập thông minh
              </p>
              <p style="margin: 0;">
                Email: teeforwork21@gmail.com | 
                <a href="https://www.facebook.com/nhatthien.nguyen.566" style="color: #dc2626;">Facebook</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} UniQuizz. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Gửi email chào mừng sau khi xác thực
const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'UniQuizz',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎉 Chào mừng đến với UniQuizz!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #fff7f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center; color: white; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Chào mừng đến với UniQuizz!</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${userName}! 👋</h2>
              <p>Tài khoản của bạn đã được xác thực thành công! Bạn đã sẵn sàng để bắt đầu hành trình học tập thông minh.</p>
              <h3>🚀 Bắt đầu ngay:</h3>
              <ul>
                <li>📝 Tạo quiz đầu tiên từ file .docx</li>
                <li>📚 Khám phá flashcard</li>
                <li>🤖 Chat với Mentor AI</li>
                <li>📊 Xem dashboard của bạn</li>
              </ul>
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">
                  Vào Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              <p><strong>UniQuizz</strong> - Học nhanh, nhớ lâu, tiết kiệm thời gian</p>
              <p>Email: teeforwork21@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent');
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendWelcomeEmail,
};

