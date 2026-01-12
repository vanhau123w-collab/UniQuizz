import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faSpinner, faLightbulb, faFile, faLink, faVideo, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [inputValue, setInputValue] = useState("10"); // Separate state for input display
  
  // RAG options
  const [useRAG, setUseRAG] = useState(true);
  const [storeDocument, setStoreDocument] = useState(true);
  
  // ⭐ Multi-format support
  const [activeTab, setActiveTab] = useState('file'); // 'file', 'url', 'youtube', 'text'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [text, setText] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success
  const navigate = useNavigate();

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return false;

    // ⭐ Support PDF, DOCX, and PPTX
    const allowedExtensions = ['.pdf', '.docx', '.pptx'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError("Chỉ chấp nhận file PDF, DOCX, hoặc PPTX");
      setFile(null);
      return false;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
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

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⭐ Validate based on active tab
    if (!title) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    
    if (activeTab === 'file' && !file) {
      setError("Vui lòng tải lên file");
      return;
    }
    
    if (activeTab === 'url' && !url) {
      setError("Vui lòng nhập URL");
      return;
    }
    
    if (activeTab === 'youtube' && !youtubeUrl) {
      setError("Vui lòng nhập YouTube URL");
      return;
    }
    
    if (activeTab === 'text' && text.length < 50) {
      setError("Nội dung quá ngắn. Tối thiểu 50 ký tự");
      return;
    }

    setIsLoading(true);
    setStep(2);
    setError("");
    setUploadProgress(0);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Vui lòng đăng nhập để tạo quiz");
        setIsLoading(false);
        setStep(1);
        navigate("/login");
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      let res;

      // ⭐ Send request based on active tab
      if (activeTab === 'file') {
        // Upload file
        const formData = new FormData();
        formData.append("title", title);
        formData.append("courseCode", courseCode || "");
        formData.append("questionCount", questionCount.toString());
        formData.append("useRAG", useRAG.toString());
        formData.append("storeDocument", storeDocument.toString());
        formData.append("file", file);

        res = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // URL, YouTube, or Text
        res = await fetch(API_ENDPOINTS.UPLOAD, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            courseCode: courseCode || "",
            questionCount,
            useRAG,
            storeDocument,
            url: activeTab === 'url' ? url : activeTab === 'youtube' ? youtubeUrl : undefined,
            text: activeTab === 'text' ? text : undefined
          }),
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Tạo quiz thất bại");
      }

      const newQuiz = await res.json();
      console.log("Tạo quiz thành công:", newQuiz);
      
      setStep(3);
      setTimeout(() => {
        navigate("/myquizzes");
      }, 2000);
    } catch (err) {
      console.error("Lỗi khi tạo quiz:", err);
      setStep(1);
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setError(
          `Không thể kết nối đến server. Vui lòng kiểm tra xem server đã chạy chưa`
        );
      } else {
        setError(err.message || "Có lỗi xảy ra khi tạo quiz");
      }
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Header />

      <main className="grow flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-red-100 dark:border-red-900 p-8 md:p-12"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 mb-2">
                    Tạo Quiz Mới
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload file, paste URL, hoặc nhập text - AI sẽ làm phần còn lại ✨
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold" htmlFor="title">
                      Tiêu đề Quiz *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      placeholder="Ví dụ: Lịch sử Đảng - Chương 1"
                      required
                    />
                  </motion.div>

                  {/* Course Code */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold" htmlFor="courseCode">
                      Mã học phần (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      id="courseCode"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                      placeholder="Ví dụ: PHIL101"
                    />
                  </motion.div>

                  {/* Question Count */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold" htmlFor="questionCount">
                      Số lượng câu hỏi
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        id="questionCount"
                        min="1"
                        max="50"
                        value={questionCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setQuestionCount(val);
                          setInputValue(val.toString());
                        }}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inputValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Chỉ cho phép nhập số
                          if (val === '' || /^\d+$/.test(val)) {
                            setInputValue(val);
                            // Cập nhật questionCount nếu là số hợp lệ
                            if (val !== '') {
                              const num = parseInt(val);
                              if (num >= 1 && num <= 50) {
                                setQuestionCount(num);
                              }
                            }
                          }
                        }}
                        onBlur={() => {
                          // Validate khi rời khỏi ô
                          if (inputValue === '' || parseInt(inputValue) < 1) {
                            setQuestionCount(1);
                            setInputValue('1');
                          } else if (parseInt(inputValue) > 50) {
                            setQuestionCount(50);
                            setInputValue('50');
                          } else {
                            setInputValue(questionCount.toString());
                          }
                        }}
                        className="w-16 text-center text-2xl font-bold text-red-600 dark:text-red-400 bg-transparent border-2 border-red-200 dark:border-red-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Kéo thanh trượt hoặc nhập số (1-50)
                    </p>
                  </motion.div>

                  {/* RAG Options */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                  >
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} />
                      🤖 Tùy chọn AI nâng cao (RAG)
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Use RAG */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useRAG}
                          onChange={(e) => setUseRAG(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                                   focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div>
                          <div className="font-medium text-blue-800 dark:text-blue-300">
                            Sử dụng RAG (Retrieval-Augmented Generation)
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            AI sẽ tìm kiếm và sử dụng thông tin từ tài liệu đã lưu để tạo quiz chính xác hơn
                          </div>
                        </div>
                      </label>

                      {/* Store Document */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeDocument}
                          onChange={(e) => setStoreDocument(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                                   focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div>
                          <div className="font-medium text-blue-800 dark:text-blue-300">
                            Lưu tài liệu vào thư viện RAG
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Tài liệu sẽ được lưu để AI có thể sử dụng cho các lần tạo quiz/flashcard sau
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        💡 <strong>Gợi ý:</strong> Bật cả 2 tùy chọn để có trải nghiệm AI tốt nhất. 
                        RAG giúp tạo câu hỏi chính xác hơn dựa trên ngữ cảnh từ tài liệu đã học.
                      </div>
                    </div>
                  </motion.div>

                  {/* ⭐ Multi-format Input with Tabs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-gray-700 dark:text-gray-300 mb-4 font-semibold">
                      Nguồn nội dung *
                    </label>
                    
                    {/* Tab Buttons */}
                    <div className="flex gap-2 mb-4 border-b-2 border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setActiveTab('file')}
                        className={`px-4 py-2 font-medium transition-all ${
                          activeTab === 'file'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 -mb-0.5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <FontAwesomeIcon icon={faFile} className="mr-2" />
                        File
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('url')}
                        className={`px-4 py-2 font-medium transition-all ${
                          activeTab === 'url'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 -mb-0.5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <FontAwesomeIcon icon={faLink} className="mr-2" />
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('youtube')}
                        className={`px-4 py-2 font-medium transition-all ${
                          activeTab === 'youtube'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 -mb-0.5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <FontAwesomeIcon icon={faVideo} className="mr-2" />
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 font-medium transition-all ${
                          activeTab === 'text'
                            ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 -mb-0.5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                        Text
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[300px]">
                      {/* TAB 1: FILE UPLOAD */}
                      {activeTab === 'file' && (
                    <div
                      onClick={handleUploadAreaClick}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex justify-center px-6 py-10 border-3 border-dashed rounded-2xl transition-all cursor-pointer ${
                        isDragging
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 scale-105"
                          : file
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-300 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                      }`}
                    >
                      {file ? (
                        <div className="space-y-4 text-center w-full">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
                          >
                            {file.name.endsWith('.pdf') ? (
                              <span className="text-3xl">📄</span>
                            ) : file.name.endsWith('.docx') ? (
                              <span className="text-3xl">📝</span>
                            ) : file.name.endsWith('.pptx') ? (
                              <span className="text-3xl">📊</span>
                            ) : (
                              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </motion.div>
                          <div>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              ✓ {file.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {formatFileSize(file.size)} • {file.name.split('.').pop().toUpperCase()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm font-medium"
                          >
                            Xóa file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center">
                          <motion.div
                            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3, repeat: isDragging ? Infinity : 0 }}
                          >
                            <svg
                              className={`mx-auto h-16 w-16 transition-colors ${
                                isDragging ? "text-red-500" : "text-gray-400 dark:text-gray-600"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 640 640"
                            >
                              <path d="M342.6 73.4C330.1 60.9 309.8 60.9 297.3 73.4L169.3 201.4C156.8 213.9 156.8 234.2 169.3 246.7C181.8 259.2 202.1 259.2 214.6 246.7L288 173.3L288 384C288 401.7 302.3 416 320 416C337.7 416 352 401.7 352 384L352 173.3L425.4 246.7C437.9 259.2 458.2 259.2 470.7 246.7C483.2 234.2 483.2 213.9 470.7 201.4L342.7 73.4zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 480C96 533 139 576 192 576L448 576C501 576 544 533 544 480L544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480C480 497.7 465.7 512 448 512L192 512C174.3 512 160 497.7 160 480L160 416z" />
                            </svg>
                          </motion.div>
                          <div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                              <span className="text-red-600 dark:text-red-400">Tải lên file</span> hoặc kéo thả
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              Hỗ trợ: <span className="font-semibold">PDF, DOCX, PPTX</span> (tối đa 10MB)
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                                <span>PDF</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                                <span>DOCX</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                                <span>PPTX</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                      )}

                      {/* TAB 2: URL INPUT */}
                      {activeTab === 'url' && (
                        <div className="space-y-4">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                          />
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                              <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                              Ví dụ URL hỗ trợ:
                            </p>
                            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                              <li>• Wikipedia: https://en.wikipedia.org/wiki/...</li>
                              <li>• Medium: https://medium.com/@author/article</li>
                              <li>• Blog: https://blog.example.com/post</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: YOUTUBE INPUT */}
                      {activeTab === 'youtube' && (
                        <div className="space-y-4">
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                          />
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                              ⚠️ Lưu ý:
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              Hiện tại chỉ lấy được tiêu đề và mô tả video. Nếu cần transcript đầy đủ, vui lòng paste vào tab "Text".
                            </p>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: TEXT INPUT */}
                      {activeTab === 'text' && (
                        <div className="space-y-4">
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste nội dung tài liệu, transcript, hoặc ghi chú ở đây...&#10;&#10;Tối thiểu 50 ký tự, tối đa 100,000 ký tự."
                            rows={12}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono text-sm"
                          />
                          <div className="flex justify-between text-sm">
                            <span className={text.length < 50 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
                              {text.length} / 100,000 ký tự
                            </span>
                            {text.length < 50 && text.length > 0 && (
                              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                Cần ít nhất 50 ký tự
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.pptx"
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="submit"
                      disabled={
                        isLoading || 
                        !title || 
                        (activeTab === 'file' && !file) ||
                        (activeTab === 'url' && !url) ||
                        (activeTab === 'youtube' && !youtubeUrl) ||
                        (activeTab === 'text' && text.length < 50)
                      }
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 ease-in-out disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faRocket} className="mr-2" />
                          Tạo Quiz với AI
                        </>
                      )}
                    </button>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                      >
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-8 border-red-200 dark:border-red-900 border-t-red-600 dark:border-t-red-400 rounded-full mx-auto mb-6"
                />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  AI đang xử lý...
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Vui lòng đợi trong giây lát
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 to-orange-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{uploadProgress}%</p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  🎉 Tạo quiz thành công!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Đang chuyển hướng...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
