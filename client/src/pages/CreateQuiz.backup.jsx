import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [questionCount, setQuestionCount] = useState(10); // Số lượng câu hỏi, mặc định 10
  const [file, setFile] = useState(null); // Để lưu file .docx
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hàm validate và set file (dùng chung cho cả click và drag)
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) {
      return false;
    }

    // Chỉ chấp nhận file .docx
    if (!selectedFile.name.endsWith(".docx")) {
      setError("Chỉ chấp nhận file .docx");
      setFile(null);
      return false;
    }

    setFile(selectedFile);
    setError("");
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  // Handler để click vào toàn bộ vùng upload
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError("Vui lòng nhập tiêu đề và tải lên 1 file .docx");
      return;
    }

    setIsLoading(true);
    setError("");

    // Dùng FormData để gửi file
    const formData = new FormData();
    formData.append("title", title);
    formData.append("courseCode", courseCode || "");
    formData.append("questionCount", questionCount.toString());
    formData.append("file", file); // Tên 'file' phải khớp với backend

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để tạo quiz");
        setIsLoading(false);
        navigate("/login");
        return;
      }

      const res = await fetch(API_ENDPOINTS.UPLOAD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Không cần 'Content-Type', FormData sẽ tự đặt
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Tạo quiz thất bại");
      }

      const newQuiz = await res.json();
      console.log("Tạo quiz thành công:", newQuiz);
      setIsLoading(false);
      navigate("/myquizzes"); // Chuyển hướng khi thành công
    } catch (err) {
      console.error("Lỗi khi tạo quiz:", err);
      // Hiển thị lỗi chi tiết hơn
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setError(
          `Không thể kết nối đến server. Vui lòng kiểm tra xem server đã chạy chưa (${API_ENDPOINTS.TEST})`
        );
      } else {
        setError(err.message || "Có lỗi xảy ra khi tạo quiz");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] flex flex-col">
      <Header />

      {/* Phần nội dung chính */}
      <main className="grow flex items-center justify-center py-12">
        <div className="max-w-2xl w-full mx-auto p-8 bg-white rounded-2xl shadow-lg border-t-4 border-red-700">
          <h1 className="text-3xl font-bold text-center text-red-700 mb-2">
            Tạo Quiz mới
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Tải lên file .docx và để AI làm phần còn lại.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tiêu đề */}
            <div>
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="title"
              >
                Tiêu đề Quiz*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Ví dụ: Lịch sử Đảng - Chương 1"
                required
              />
            </div>

            {/* Mã học phần (Tùy chọn) */}
            <div>
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="courseCode"
              >
                Mã học phần (Tùy chọn)
              </label>
              <input
                type="text"
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Ví dụ: PHIL101"
              />
            </div>

            {/* Số lượng câu hỏi */}
            <div>
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="questionCount"
              >
                Số lượng câu hỏi
              </label>
              <input
                type="text"
                id="questionCount"
                value={questionCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = parseInt(raw);

                  // Nếu không phải số → không set
                  if (isNaN(parsed)) {
                    setQuestionCount("");
                    return;
                  }

                  // Giới hạn từ 1 đến 50
                  const value = Math.max(1, Math.min(50, parsed));
                  setQuestionCount(value);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Mặc định: 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nhập số lượng câu hỏi muốn tạo (1-50). Mặc định: 10
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="file"
              >
                Tài liệu (.docx)*
              </label>
              <div
                onClick={handleUploadAreaClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
                  isDragging
                    ? "border-red-500 bg-red-50"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-red-400"
                }`}
              >
                {file ? (
                  <div className="space-y-2 text-center w-full">
                    <svg
                      className="mx-auto h-12 w-12 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Đã chọn: {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click để chọn file khác hoặc kéo thả file mới
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 transition-colors ${
                        isDragging ? "text-red-500" : "text-gray-400"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M342.6 73.4C330.1 60.9 309.8 60.9 297.3 73.4L169.3 201.4C156.8 213.9 156.8 234.2 169.3 246.7C181.8 259.2 202.1 259.2 214.6 246.7L288 173.3L288 384C288 401.7 302.3 416 320 416C337.7 416 352 401.7 352 384L352 173.3L425.4 246.7C437.9 259.2 458.2 259.2 470.7 246.7C483.2 234.2 483.2 213.9 470.7 201.4L342.7 73.4zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 480C96 533 139 576 192 576L448 576C501 576 544 533 544 480L544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480C480 497.7 465.7 512 448 512L192 512C174.3 512 160 497.7 160 480L160 416z" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="font-medium text-red-600">
                        Tải lên file
                      </span>
                      <span className="pl-1">hoặc kéo thả</span>
                    </div>
                    <p className="text-xs text-gray-500">Chỉ hỗ trợ file .docx</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept=".docx"
              />
            </div>

            {/* Nút Submit */}
            <div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý (AI)..." : "Tạo Quiz ngay"}
              </button>
            </div>

            {/* Báo lỗi */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
