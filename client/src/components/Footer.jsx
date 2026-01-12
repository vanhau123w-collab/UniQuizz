import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-gray-800 border-t border-red-100 dark:border-gray-700 py-8 px-4 relative z-10 mt-20">
      {/*
        THAY ĐỔI 1:
        - Đổi 'md:grid-cols-4' thành 'md:grid-cols-6'
        - Đổi 'gap-12' thành 'gap-8' để cân đối hơn
      */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8 text-gray-700 dark:text-gray-300 items-start">
        
        {/* Cột 1: Thêm 'md:col-span-2' */}
        <div className="flex flex-col py-4 px-4 md:col-span-2">
          <img
            src="/logo.png"
            alt="UniQuizz Logo"
            className="w-32 h-auto object-contain mb-4 drop-shadow-lg"
          />
          <h1 className="text-2xl font-extrabold text-red-500 dark:text-red-400 mb-2 tracking-wide">
            UniQuizz <span className="text-gray-700 dark:text-gray-300">x Đom Đóm 71</span>
          </h1>
          {/* Bỏ 'max-w-xs' để text tự động căn theo cột mới */}
          <p className="text-base text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
            Học nhanh, nhớ lâu, tiết kiệm thời gian.
          </p>
        </div>

        {/* Cột 2: (Mặc định là col-span-1) */}
        <div className="flex flex-col py-4 px-4">
          <nav className="flex flex-col gap-2 text-sm">
            <Link to="/" className="hover:text-red-600 dark:hover:text-red-400 transition">
              Trang chủ
            </Link>
            <Link to="/create" className="hover:text-red-600 dark:hover:text-red-400 transition">
              Tạo Quiz
            </Link>
            <Link to="/myquizzes" className="hover:text-red-600 dark:hover:text-red-400 transition">
              Quiz của tôi
            </Link>
          </nav>
        </div>

        {/* Cột 3: (Mặc định là col-span-1) */}
        <div className="flex flex-col py-4 px-4">
          <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Liên hệ</h5>
          <nav className="flex flex-col gap-2 text-sm">
            <a
              href="https://www.facebook.com/nhatthien.nguyen.566"
              className="hover:text-red-600 dark:hover:text-red-400 transition"
            >
              Facebook
            </a>
            <a
              href="mailto:teeforwork21@gmail.com"
              className="hover:text-red-600 dark:hover:text-red-400 transition"
            >
              Email
            </a>
            <Link to="/terms" className="hover:text-red-600 dark:hover:text-red-400 transition">
              Điều khoản
            </Link>
            <Link to="/privacy" className="hover:text-red-600 dark:hover:text-red-400 transition">
              Bảo mật
            </Link>
          </nav>
        </div>

        <div className="flex flex-col py-4 px-4 md:col-span-2">
          <div className="rounded-xl overflow-hidden shadow-md w-full h-56">
            <iframe
              title="HCMUTE Map"
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.484210342377!2d106.76951641474966!3d10.850726692270914!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752763f2385d81%3A0x833b7a597696c685!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBTxrAgcGjhuqFtIEvhu7kgdGh14bqtdCBUcC4gSENN!5e0!3m2!1svi!2s"
              style={{ border: 0 }}
            ></iframe>
          </div>
        </div>
      </div>

      {/* Dòng Copyright ở dưới cùng */}
      <div className="max-w-6xl mx-auto border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} UniQuizz. Phát triển bởi Đom Đóm 71.</p>
      </div>
    </footer>
  );
}