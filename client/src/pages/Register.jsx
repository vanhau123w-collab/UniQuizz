import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_ENDPOINTS } from "../config/api.js";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 'none', label: '', color: '' };
    if (pwd.length < 6) return { strength: 'weak', label: 'Yếu', color: 'bg-red-500' };
    if (pwd.length < 10) return { strength: 'medium', label: 'Trung bình', color: 'bg-yellow-500' };
    return { strength: 'strong', label: 'Mạnh', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    // Validate fields
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập họ tên";
    if (!email.trim()) errors.email = "Vui lòng nhập email";
    if (!password) errors.password = "Vui lòng nhập mật khẩu";
    if (password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (password !== confirmPassword) errors.confirmPassword = "Mật khẩu không khớp";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    try {
      // Đăng ký trực tiếp (bỏ qua OTP)
      // TODO: Enable OTP verification when email service is ready
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      // Lưu token và user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("userUpdate"));

      toast.success("Đăng ký thành công!");
      
      setTimeout(() => {
        navigate("/");
      }, 1000);

      /* 
      // === CODE CŨ - GỬI OTP (DISABLED) ===
      // Bước 1: Gửi OTP qua email
      const otpRes = await fetch(`${API_ENDPOINTS.REGISTER.replace('/auth/register', '/email/send-otp')}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        throw new Error(otpData.message || "Không thể gửi mã xác thực");
      }

      // Bước 2: Chuyển đến trang xác thực OTP
      toast.success("Mã xác thực đã được gửi đến email của bạn!");
      
      setTimeout(() => {
        navigate("/verify-email", { 
          state: { 
            email,
            fullName,
            password
          } 
        });
      }, 1000);
      */
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đăng ký");
      toast.error(err.message || "Đăng ký thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Dùng màu nền #fff7f0 giống trang chủ
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 flex flex-col">
      <Header />
      
      {/* Phần nội dung chính */}
      <div className="grow flex items-center justify-center py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full m-4">
          <h2 className="text-3xl font-bold text-center text-red-600 dark:text-red-400 mb-6">
            Tạo tài khoản
          </h2>
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm text-center mb-4">{error}</p>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="fullName">
                Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  fieldErrors.fullName ? 'border-red-500 dark:border-red-400' : 'dark:border-gray-600'
                }`}
                placeholder="Nhập họ và tên của bạn"
              />
              {fieldErrors.fullName && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  fieldErrors.email ? 'border-red-500 dark:border-red-400' : 'dark:border-gray-600'
                }`}
                placeholder="email@example.com"
                required
              />
              {fieldErrors.email && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                    fieldErrors.password ? 'border-red-500 dark:border-red-400' : 'dark:border-gray-600'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldErrors.password}</p>
              )}
              {password && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.strength === 'weak' ? '33%' : passwordStrength.strength === 'medium' ? '66%' : '100%' }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    Độ mạnh: <span className={passwordStrength.strength === 'strong' ? 'text-green-600 dark:text-green-400' : passwordStrength.strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirmPassword">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                    fieldErrors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'dark:border-gray-600'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 dark:bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : "Đăng ký"}
            </button>
          </form>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-red-600 dark:text-red-400 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}