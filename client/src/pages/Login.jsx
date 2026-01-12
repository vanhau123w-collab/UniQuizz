import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_ENDPOINTS } from "../config/api.js";

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Nhận thông báo và email từ trang Register
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Tự động điền email nếu có
      if (location.state.email) {
        setEmail(location.state.email);
      }
      // Xóa state sau khi đã hiển thị
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsLoading(true);

    // Validate
    const errors = {};
    if (!email.trim()) errors.email = "Vui lòng nhập email";
    if (!password) errors.password = "Vui lòng nhập mật khẩu";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      // Lưu token và user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Dispatch custom event để Header cập nhật (trong cùng tab)
      window.dispatchEvent(new Event("userUpdate"));

      toast.success(`Chào mừng ${data.user.fullName || data.user.email}!`);

      // Chuyển về trang chủ hoặc trang trước đó
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đăng nhập");
      toast.error(err.message || "Đăng nhập thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 flex flex-col">
      <Header />
      
      <div className="grow flex items-center justify-center py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full m-4">
          <h2 className="text-3xl font-bold text-center text-red-600 dark:text-red-400 mb-6">
            Đăng nhập
          </h2>
          <form onSubmit={handleSubmit}>
            {successMessage && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4 text-center">
                {successMessage}
              </div>
            )}
            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm text-center mb-4">{error}</p>
            )}
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-red-600 dark:text-red-400 hover:underline">
                Quên mật khẩu?
              </Link>
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
                  <span>Đang đăng nhập...</span>
                </>
              ) : "Đăng nhập"}
            </button>
          </form>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-red-600 dark:text-red-400 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}