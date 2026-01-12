import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fullName, password } = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút = 600 giây
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Redirect nếu không có email
  useEffect(() => {
    if (!email) {
      toast.error("Vui lòng đăng ký trước");
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle OTP input change
  const handleChange = (index, value) => {
    // Chỉ cho phép số
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error("Mã OTP chỉ chứa số");
      return;
    }

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) newOtp.push("");
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP
  const handleVerify = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số");
      return;
    }

    setIsVerifying(true);

    try {
      // Verify OTP
      const verifyResponse = await api.post("/email/verify-otp", {
        email,
        otp: otpCode,
      });

      if (verifyResponse.data.verified) {
        toast.success("Xác thực email thành công!");

        // Register user
        const registerResponse = await api.post("/auth/register", {
          email,
          password,
          fullName,
        });

        if (registerResponse.data.token) {
          toast.success("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
          setTimeout(() => {
            navigate("/login", { state: { email } });
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Lỗi xác thực:", error);
      const message = error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn";
      toast.error(message);
      
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setIsResending(true);

    try {
      await api.post("/email/resend-otp", {
        email,
        fullName,
      });

      toast.success("Mã xác thực mới đã được gửi!");
      setTimeLeft(600); // Reset timer
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Lỗi gửi lại OTP:", error);
      toast.error(error.response?.data?.message || "Không thể gửi lại mã");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900">
      <Header />

      <main className="flex items-center justify-center px-4 py-12 mt-20">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
              Xác Thực Email
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Chúng tôi đã gửi mã xác thực đến
              <br />
              <strong className="text-red-600 dark:text-red-400">{email}</strong>
            </p>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Nhập mã xác thực (6 số)
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-500 dark:focus:border-red-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition"
                    disabled={isVerifying}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mã có hiệu lực trong{" "}
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Mã đã hết hạn. Vui lòng gửi lại.
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full py-3 bg-red-600 dark:bg-red-500 text-white rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xác thực...
                </span>
              ) : (
                "Xác thực"
              )}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Không nhận được mã?
              </p>
              <button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-red-600 dark:text-red-400 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                {isResending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Mẹo:</strong> Kiểm tra thư mục Spam nếu không thấy email.
              </p>
            </div>

            {/* Back to Register */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/register")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                ← Quay lại đăng ký
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
