import { motion } from "framer-motion";
import FAQItem from "./FAQItem";

export default function FAQSection({ baseFadeInVariants }) {
  return (
    <motion.section
      className="mt-10 px-8 pb-10 relative z-10 bg-white dark:bg-gray-900"
      variants={baseFadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      custom={4}
    >
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Câu hỏi thường gặp
        </h3>

        {/* 2-column layout giống giao diện trong ảnh */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
          <FAQItem
            question="UniQuizz có miễn phí không?"
            answer="Hoàn toàn miễn phí. UniQuizz được tạo ra nhằm hỗ trợ sinh viên trong việc học tập."
          />

          <FAQItem
            question="File của tôi có được bảo mật không?"
            answer="Chúng tôi không lưu trữ file của bạn. Nội dung sau khi xử lý sẽ bị xóa ngay lập tức."
          />

          <FAQItem
            question="UniQuizz tạo câu hỏi bằng cách nào?"
            answer="Hệ thống AI phân tích tài liệu và tạo câu hỏi theo dạng bạn chọn."
          />

          <FAQItem
            question="Tôi có thể chỉnh sửa câu hỏi sau khi tạo không?"
            answer="Hoàn toàn được. Bạn có thể tùy chỉnh câu hỏi, đáp án và xuất file theo ý muốn."
          />

          <FAQItem
            question="UniQuizz hỗ trợ định dạng nào?"
            answer="Hỗ trợ file .docx, .txt và PDF. Các định dạng khác sẽ được bổ sung trong tương lai."
          />

          <FAQItem
            question="Có giới hạn dung lượng file không?"
            answer="Hệ thống hiện cho phép tối đa 10MB để đảm bảo tốc độ xử lý tốt nhất."
          />
        </div>
      </div>
    </motion.section>
  );
}
