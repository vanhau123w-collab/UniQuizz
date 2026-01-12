import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Điều Khoản Sử Dụng
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              1. Chấp Nhận Điều Khoản
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bằng việc truy cập và sử dụng UniQuizz, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              2. Mô Tả Dịch Vụ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              UniQuizz cung cấp nền tảng học tập trực tuyến với các tính năng:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Tạo quiz tự động từ tài liệu bằng AI</li>
              <li>Hệ thống flashcard học từ vựng</li>
              <li>Mentor AI hỗ trợ học tập</li>
              <li>Theo dõi tiến độ học tập cá nhân</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              3. Tài Khoản Người Dùng
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bạn chịu trách nhiệm duy trì tính bảo mật của tài khoản và mật khẩu của mình. Bạn đồng ý chấp nhận trách nhiệm cho tất cả các hoạt động xảy ra dưới tài khoản của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              4. Nội Dung Người Dùng
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bạn giữ quyền sở hữu đối với nội dung mà bạn tải lên UniQuizz. Tuy nhiên, bằng việc tải lên, bạn cấp cho chúng tôi quyền sử dụng nội dung đó để cung cấp và cải thiện dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              5. Hành Vi Bị Cấm
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              Bạn không được:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
              <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
              <li>Tải lên nội dung vi phạm bản quyền</li>
              <li>Cố gắng truy cập trái phép vào hệ thống</li>
              <li>Spam hoặc gửi nội dung độc hại</li>
              <li>Sao chép hoặc phân phối dịch vụ mà không có sự cho phép</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              6. Quyền Sở Hữu Trí Tuệ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Tất cả các quyền sở hữu trí tuệ trong dịch vụ UniQuizz thuộc về chúng tôi hoặc các bên cấp phép của chúng tôi. Bạn không được sao chép, sửa đổi, hoặc phân phối bất kỳ phần nào của dịch vụ mà không có sự cho phép bằng văn bản.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              7. Giới Hạn Trách Nhiệm
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              UniQuizz được cung cấp "như hiện tại" mà không có bất kỳ bảo đảm nào. Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              8. Thay Đổi Điều Khoản
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Chúng tôi có quyền sửa đổi các điều khoản này bất kỳ lúc nào. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              9. Liên Hệ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nếu bạn có bất kỳ câu hỏi nào về Điều Khoản Sử Dụng này, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:teeforwork21@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">teeforwork21@gmail.com</a>
            </p>
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
