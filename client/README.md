# UniQuizzDom – Client

## ⚡ Giới thiệu  
**UniQuizzDom** là ứng dụng web dạng quiz/trắc nghiệm/học tập, được phát triển để giúp người dùng luyện tập kiến thức một cách dễ dàng và thú vị.  
Client của UniQuizzDom được deploy lên Vercel, giúp truy cập nhanh, responsive trên đa thiết bị.  

## 📁 Cấu trúc dự án  

```
/client
 ├── public/          # assets tĩnh: hình ảnh, favicon, files tĩnh...
 ├── src/             # mã nguồn chính  
 │    ├── components/ # các component UI  
 │    ├── pages/      # các trang chính của ứng dụng  
 │    ├── services/   # các module gọi API / xử lý logic  
 │    ├── styles/     # style / CSS / theme  
 │    └── utils/      # các helper, util function  
 ├── .env.local       # biến môi trường (nếu có)  
 ├── package.json     # khai báo dependency & scripts  
 └── README.md        # file này  
```

## 🚀 Cài đặt & Chạy local  

1. Clone repo về máy:  
   ```bash
   git clone <URL repo của bạn>
   cd <thư mục client>
   ```  
2. Cài dependencies:  
   ```bash
   npm install
   # hoặc yarn / pnpm tuỳ cách bạn quản lý
   ```  
3. Chạy dev server:  
   ```bash
   npm run dev
   ```  
4. Mở trình duyệt vào `http://localhost:5173` để xem app  

> Nếu có file `.env.local`, nhớ thiết lập biến theo hướng dẫn trước khi chạy.  

## 🌐 Deploy  

App được deploy lên Vercel. Mỗi khi bạn push code lên branch chính (main / master), Vercel sẽ tự động build & deploy — không cần thao tác thủ công. :contentReference[oaicite:1]{index=1}  

Bạn cũng có thể cấu hình biến môi trường, domain riêng, hoặc các thiết lập khác trong dashboard của Vercel.  

## 🔧 Công nghệ / Công cụ sử dụng  

- Framework / Library front-end (React / Next.js / … — tuỳ bạn dùng gì)  
- CSS / SASS / Styled-components / … (tuỳ)  
- Các module để gọi API, quản lý state, xử lý form / quiz, v.v.  
- Vercel để deploy và hosting (miễn phí, dễ dàng, tự động). :contentReference[oaicite:2]{index=2}  

## ✅ Hướng dẫn đóng góp  

- Fork repo & clone về máy bạn.  
- Tạo branch theo feature bạn muốn: `feature/<tên-feature>` hoặc `fix/<tên-fix>`.  
- Viết code & test kỹ trước khi commit.  
- Đặt tên commit rõ ràng, viết ghi chú (commit message) dễ hiểu.  
- Khi muốn gửi pull request (PR), mô tả rõ feature / bug / fix bạn thực hiện, kèm ảnh chụp màn hình (nếu UI thay đổi).  

## 📝 Ghi chú  

- Nếu app có dùng API backend (quiz, người dùng, kết quả …), nhớ thiết lập đúng URL API khi chạy local (trong `.env.local` hoặc config).  
- Kiểm tra responsive trên mobile & desktop.  
- Kiểm thử tính năng quiz — tạo / làm bài / xem kết quả / xem lịch sử (nếu có).  

