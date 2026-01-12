import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../components/Header.jsx"; 
import Footer from "../components/Footer.jsx"; 
import api from '../api.js'; 
import { motion, AnimatePresence } from 'framer-motion';
// ⭐️ IMPORT HÀM LẤY TOKEN TỪ utils/auth.js ⭐️
import { getAuthToken } from '../utils/auth.js'; 

// --- API FUNCTIONS ---

// API: Tạo Flashcard
const generateFlashcardsFromFile = async (formData) => {
    // ⭐️ Gắn Token vào headers cho API POST ⭐️
    const token = getAuthToken();
    if (!token) throw new Error("Unauthorized: Missing token.");

    const response = await api.post('/flashcards/generate', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            // Axios tự động đặt Content-Type cho FormData
        }
    });
    return response.data; 
};

// API: Lấy danh sách Flashcard Sets
const fetchFlashcardSets = async () => {
    // ⭐️ Gắn Token vào headers cho API GET ⭐️
    const token = getAuthToken();
    if (!token) {
        console.warn("Không tìm thấy token. Không thể tải Flashcard Sets.");
        return []; 
    }

    const response = await api.get('/flashcards', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        }
    });
    return response.data;
};
// --------------------------------------------------------------------------------

// NotificationModal (Component Modal giữ nguyên)
const NotificationModal = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const title = type === 'success' ? 'Thành công!' : 'Lỗi!';
    const backdropVariants = { visible: { opacity: 1, backdropFilter: 'blur(2px)' }, hidden: { opacity: 0, backdropFilter: 'blur(0px)' } };
    const modalVariants = { hidden: { y: "-100vh", opacity: 0 }, visible: { y: "0", opacity: 1, transition: { delay: 0.1, duration: 0.3 } }, };

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose} 
                >
                    <motion.div
                        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div className={`py-2 px-4 rounded-t-lg ${bgColor} text-white font-bold text-center -mx-6 -mt-6 mb-4`}>
                            {title}
                        </div>
                        <p className="text-gray-700 mb-6 text-center">{message}</p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                        >
                            OK
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
// --------------------------------------------------------------------------------


function CreateFlashcardPage() {
    const navigate = useNavigate();
    
    // State cho Form
    const [flashcardTitle, setFlashcardTitle] = useState('');
    const [flashcardFile, setFlashcardFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    
    // State cho Modal
    const [modalMessage, setModalMessage] = useState(null);
    const [modalType, setModalType] = useState('success'); 

    // State cho danh sách Flashcard Sets
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [isLoadingSets, setIsLoadingSets] = useState(true);
    
    // HÀM TẢI DỮ LIỆU ĐƯỢC CHIA SẺ (BUỘC TẢI LẠI TỪ SERVER) 
    const loadSets = async () => {
        setIsLoadingSets(true); 
        try {
            const data = await fetchFlashcardSets();
            setFlashcardSets(data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách flashcards:", error);
            // Có thể thêm logic kiểm tra lỗi 401 để chuyển hướng đến login
        } finally {
            setIsLoadingSets(false);
        }
    };
    
    // EFFECT: Tải danh sách khi trang được mở
    useEffect(() => {
        loadSets();
    }, []);

    // Hàm validate và set file (dùng chung cho cả click và drag)
    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) {
            return false;
        }

        // Chỉ chấp nhận file .docx
        if (!selectedFile.name.endsWith(".docx")) {
            setModalMessage("Chỉ chấp nhận file .docx");
            setModalType('error');
            setFlashcardFile(null);
            return false;
        }

        setFlashcardFile(selectedFile);
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

    
    const handleFlashcardUpload = async (e) => {
        e.preventDefault();
        
        // Kiểm tra Token trước khi gọi API POST
        if (!getAuthToken()) {
            setModalMessage('Vui lòng đăng nhập lại để tạo Flashcards.');
            setModalType('error');
            navigate('/login');
            return;
        }

        if (!flashcardTitle.trim()) {
            setModalMessage('Vui lòng nhập tiêu đề cho bộ Flashcards.');
            setModalType('error');
            return;
        }
        if (!flashcardFile) {
            setModalMessage('Vui lòng chọn file .docx.');
            setModalType('error');
            return;
        }
        
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('title', flashcardTitle);
            formData.append('file', flashcardFile);
            
            // 1. GỌI API TẠO (đã được sửa để gắn token)
            const setDoc = await generateFlashcardsFromFile(formData); 

            setFlashcardTitle('');
            setFlashcardFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = null; // Reset input file
            }

            // 2. BUỘC TẢI LẠI TOÀN BỘ DANH SÁCH TỪ DB
            await loadSets(); 

            setModalMessage(`Tạo bộ Flashcards "${setDoc.title}" thành công!`);
            setModalType('success');
            
        } catch (error) {
            console.error("Lỗi khi tạo Flashcards từ file:", error);
            const errorMessage = error.response?.data?.message || error.message || "Lỗi không xác định";
            setModalMessage(`Lỗi: Không thể tạo Flashcards. ${errorMessage}`);
            setModalType('error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCloseModal = () => {
        setModalMessage(null);
    };

    return (
        <div className="min-h-screen bg-[#fff7f0] relative flex flex-col">
            <Header />
            <div className="h-20 sm:h-24"></div> 
            
            <main className="grow max-w-4xl mx-auto px-4 pt-8 relative z-10 w-full"> 
                <button 
                    onClick={() => navigate('/flashcard-hub')} 
                    className="mb-6 text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 
                               px-4 py-2 rounded-full font-semibold transition duration-200 shadow-sm"
                >
                    ← Trở về Hub Flashcard
                </button>
                
                {/* FORM TẠO (Giữ nguyên) */}
                <div className=" w-full mx-auto p-8 bg-white rounded-2xl shadow-lg mb-8 border-t-4 border-red-700">
                    <h1 className="text-3xl font-bold mb-6 text-red-700">Tạo Flashcards từ Tài liệu</h1>
                    <section className="p-6  rounded-xl mb-12">
                         <p className="text-gray-700 mb-4">
                            Tải file .docx tài liệu học tập của bạn. AI sẽ đọc và tự động tạo các cặp **Front/Back** Flashcards.
                        </p>
                        <form onSubmit={handleFlashcardUpload}>
                            <label htmlFor="flashcard-title" className="font-semibold text-gray-700 mb-1 block">Tiêu đề bộ Flashcard</label>
                            <input
                                id="flashcard-title"
                                type="text"
                                value={flashcardTitle}
                                onChange={(e) => setFlashcardTitle(e.target.value)}
                                placeholder="Ví dụ: Chương 3: Khí Hậu"
                                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                                required
                                disabled={isGenerating}
                            />
                    
                            <label htmlFor="file-input" className="font-semibold text-gray-700 mb-1 block py-2">Chọn file tài liệu (.docx)</label>
                            <div
                                onClick={handleUploadAreaClick}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`mt-1 flex justify-center px-6 mb-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
                                    isDragging
                                        ? "border-red-500 bg-red-50"
                                        : flashcardFile
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-300 hover:border-red-400"
                                }`}
                            >
                                {flashcardFile ? (
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
                                            ✓ Đã chọn: {flashcardFile.name}
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
                                id="file-input"
                                name="file-input"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept=".docx"
                                disabled={isGenerating}
                            />
                    
                            <button
                                type="submit"
                                className={`w-full py-3 rounded-lg text-white font-bold transition duration-200 ${
                                    isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                                }`}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Đang gọi AI tạo Flashcards...' : 'Tạo Flashcards từ File Ngay'}
                            </button>
                        </form>
                    </section>
                </div>
                
                {/* ⭐️ SECTION: DANH SÁCH FLASHCARD ĐÃ TẠO ⭐️ */}
                <section className="mb-20">
                    {/* ... */}
                    {isLoadingSets ? (
                        <p className="text-gray-600">Đang tải danh sách...</p>
                    ) : flashcardSets.length === 0 ? (
                        <p className="text-gray-600">Bạn chưa tạo bộ flashcard nào từ file.</p>
                    ) : (
                        <div className="space-y-2">
                            {flashcardSets.map((set, index) => (
                                <div 
                                    key={set._id} 
                                    className={`p-4 rounded-lg shadow-sm cursor-pointer transition duration-200 
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        border-l-4 border-red-400 hover:shadow-md
                                    `}
                                    // ⭐️ SỬA ĐỔI: Chuyển đến TopicDetailsPage với ID của SET ⭐️
                                    onClick={() => navigate(`/topic-details/${set._id}`)}
                                >
                                    <h3 className="text-xl font-bold text-gray-700">{set.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        {set.courseCode ? `${set.courseCode} | ` : ''}
                                        {set.flashcards?.length || 0} thẻ
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>
            <Footer />
            
            <NotificationModal 
                message={modalMessage} 
                type={modalType} 
                onClose={handleCloseModal} 
            />
        </div>
    );
}

export default CreateFlashcardPage;