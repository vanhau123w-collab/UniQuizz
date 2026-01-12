import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      toast.success("Email khôi phục mật khẩu đã được gửi!");
    } catch (err) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 flex flex-col">
      <Header />
      
      <div className="grow flex items-center justify-center py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full m-4">
          {!emailSent ? (
            <>
              <h2 className="text-3xl font-bold text-center text-red-600 dark:text-red-400 mb-2">
                Quên mật khẩu?
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Nhập email của bạn để nhận link khôi phục mật khẩu
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="email@example.com"
                    required
                  />
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
                      <span>Đang gửi...</span>
                    </>
                  ) : "Gửi link khôi phục"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Email đã được gửi!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để khôi phục mật khẩu.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Không nhận được email? Kiểm tra thư mục spam hoặc{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  gửi lại
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
