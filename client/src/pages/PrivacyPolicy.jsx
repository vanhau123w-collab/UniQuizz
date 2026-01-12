import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Chính Sách Bảo Mật
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              1. Thông Tin Chúng Tôi Thu Thập
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              Chúng tôi thu thập các loại thông tin sau:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>Thông tin cá nhân:</strong> Tên, email, mật khẩu (được mã hóa)</li>
              <li><strong>Dữ liệu học tập:</strong> Quiz, flashcard, điểm số, tiến độ</li>
              <li><strong>Dữ liệu kỹ thuật:</strong> IP address, browser type, device info</li>
              <li><strong>Cookies:</strong> Để cải thiện trải nghiệm người dùng</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              2. Cách Chúng Tôi Sử Dụng Thông Tin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              Thông tin của bạn được sử dụng để:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>Cung cấp và cải thiện dịch vụ</li>
              <li>Cá nhân hóa trải nghiệm học tập</li>
              <li>Gửi thông báo và cập nhật quan trọng</li>
              <li>Phân tích và cải thiện hiệu suất hệ thống</li>
              <li>Bảo vệ chống lại gian lận và lạm dụng</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              3. Bảo Mật Thông Tin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
              <li>Mật khẩu được hash bằng bcrypt</li>
              <li>Xác thực JWT cho phiên đăng nhập</li>
              <li>Backup dữ liệu định kỳ</li>
              <li>Giám sát bảo mật 24/7</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              4. Chia Sẻ Thông Tin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chúng tôi <strong>KHÔNG</strong> bán hoặc cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ với:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Nhà cung cấp dịch vụ đáng tin cậy (Google Cloud, MongoDB)</li>
              <li>Cơ quan pháp luật khi có yêu cầu hợp pháp</li>
              <li>Với sự đồng ý rõ ràng của bạn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              5. Cookies và Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chúng tôi sử dụng cookies để:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Duy trì phiên đăng nhập</li>
              <li>Lưu preferences (dark mode, language)</li>
              <li>Phân tích traffic (Google Analytics)</li>
              <li>Cải thiện hiệu suất</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
              Bạn có thể tắt cookies trong trình duyệt, nhưng một số tính năng có thể không hoạt động.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              6. Quyền Của Bạn
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              Bạn có quyền:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>Truy cập và tải xuống dữ liệu cá nhân</li>
              <li>Chỉnh sửa hoặc cập nhật thông tin</li>
              <li>Xóa tài khoản và dữ liệu</li>
              <li>Từ chối nhận email marketing</li>
              <li>Khiếu nại về việc xử lý dữ liệu</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              7. Lưu Trữ Dữ Liệu
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Dữ liệu của bạn được lưu trữ:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Trong thời gian bạn sử dụng dịch vụ</li>
              <li>Tối đa 90 ngày sau khi xóa tài khoản (để backup)</li>
              <li>Trên server bảo mật tại Singapore/US</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              8. Dịch Vụ Bên Thứ Ba
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              UniQuizz sử dụng các dịch vụ sau:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li><strong>Google Cloud:</strong> AI và Text-to-Speech</li>
              <li><strong>MongoDB Atlas:</strong> Database hosting</li>
              <li><strong>Google Analytics:</strong> Web analytics</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
              Các dịch vụ này có chính sách bảo mật riêng mà bạn nên xem xét.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              9. Trẻ Em
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Dịch vụ của chúng tôi dành cho người từ 13 tuổi trở lên. Chúng tôi không cố ý thu thập thông tin từ trẻ em dưới 13 tuổi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              10. Thay Đổi Chính Sách
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách này. Thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              11. Liên Hệ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nếu bạn có câu hỏi về Chính Sách Bảo Mật, liên hệ:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:teeforwork21@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">teeforwork21@gmail.com</a></li>
              <li><strong>Facebook:</strong> <a href="https://www.facebook.com/nhatthien.nguyen.566" className="text-red-600 dark:text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">UniQuizz Support</a></li>
            </ul>
          </section>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
