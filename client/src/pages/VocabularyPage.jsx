// client/src/pages/VocabularyPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../components/Header.jsx"; 
import Footer from "../components/Footer.jsx"; 
import { getAuthToken } from '../utils/auth.js';
import FallingBlossoms from '../components/FallingBlossoms.jsx';

// ⭐ IMPORT FRAMER MOTION
import { motion, AnimatePresence } from 'framer-motion';

// ⚠️ MOCK/INLINE LOGIC (Giữ nguyên API logic)
const mockToken = getAuthToken(); 
const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5001/api';

const fetchTopics = async (token) => {
    const response = await fetch(`${API_BASE_URL}/topics`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        throw new Error("Lỗi khi tải danh sách chủ đề.");
    }
    return response.json();
};

const generateNewTopic = async (title, token) => {
    const response = await fetch(`${API_BASE_URL}/topics/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Lỗi khi tạo chủ đề AI.");
    return data;
};
// --------------------------------------------------------------------------------

// ⭐ 1. COMPONENT MODAL SỬ DỤNG FRAMER MOTION ⭐
const NotificationModal = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const title = type === 'success' ? 'Thành công!' : 'Lỗi!';

    const backdropVariants = {
        visible: { opacity: 1, backdropFilter: 'blur(2px)' },
        hidden: { opacity: 0, backdropFilter: 'blur(0px)' }
    };

    const modalVariants = {
        hidden: { y: "-100vh", opacity: 0 },
        visible: { y: "0", opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
    };

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

function VocabularyPage() {
    const token = typeof window !== 'undefined' ? (window.localStorage.getItem("token") || mockToken) : mockToken; 
    const isAuthenticated = !!token;
    const navigate = useNavigate();
    
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // ⭐ 2. STATE CHO MODAL
    const [modalMessage, setModalMessage] = useState(null);
    const [modalType, setModalType] = useState('success'); 
    
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        const loadTopics = async () => {
            try {
                const data = await fetchTopics(token);
                setTopics(data);
            } catch (error) {
                console.error("Lỗi khi tải chủ đề:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTopics();
    }, [isAuthenticated, token, navigate]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!newTopicTitle.trim()) return;
        setIsGenerating(true);
        try {
            const topicTitle = newTopicTitle;
            const newTopic = await generateNewTopic(topicTitle, token);
            setTopics([newTopic, ...topics]); 
            setNewTopicTitle('');
            
            // ⭐ 3. HIỂN THỊ MODAL THÀNH CÔNG
            setModalMessage(`Tạo chủ đề "${topicTitle}" thành công!`);
            setModalType('success');

        } catch (error) {
            console.error("Lỗi khi tạo chủ đề AI:", error);
            
            // ⭐ 4. HIỂN THỊ MODAL THẤT BẠI
            setModalMessage(`Lỗi: Không thể tạo chủ đề. ${error.message}`);
            setModalType('error');

        } finally {
            setIsGenerating(false);
        }
    };
    
    // ⭐ HÀM ĐÓNG MODAL
    const handleCloseModal = () => {
        setModalMessage(null);
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fff7f0] flex flex-col">
                <Header />
                <div className="h-20 sm:h-24"></div> 
                <div className="grow text-center p-8 text-xl">Đang tải danh sách chủ đề...</div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fff7f0] relative flex flex-col">
            <FallingBlossoms />
            <Header />
            <div className="h-20 sm:h-24"></div> 
            
            <main className="grow max-w-4xl mx-auto px-4 relative z-10 w-full"> 
                <h1 className="text-3xl font-bold pt-8 mb-6 text-red-700">Chọn Chủ Đề Học Từ Vựng</h1>
                
                {/* Form Tạo Chủ Đề Mới */}
                <form onSubmit={handleGenerate} className="mb-8 p-4 bg-gray-100 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Tạo Chủ Đề Mới</h2>
                    <input
                        type="text"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="Nhập tên chủ đề bạn muốn học..."
                        className="w-full p-4 border border-gray-300 rounded-lg mb-3"
                        required
                    />
                    <button
                        type="submit"
                        className={`w-full py-4 rounded-lg text-white font-bold transition duration-200 ${
                            isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        }`}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Đang tạo (vui lòng chờ 10-20s)...' : 'Tạo Chủ Đề Từ Vựng Ngay'}
                    </button>
                </form>

                {/* Danh sách Chủ Đề */}
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Danh Sách Chủ Đề Hiện Có ({topics.length})</h2>
                <div className="space-y-2 pb-10">
                    {topics.map((topic, index) => (
                        <div 
                            key={topic._id} 
                            // ⭐️ SỬA: Dùng index để tạo màu xen kẽ và border xanh cho System Topic ⭐️
                            className={`p-4 rounded-lg shadow-sm cursor-pointer transition duration-200 
                                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                ${topic.isSystem ? 'border-l-4 border-green-500' : 'border-l-4 border-white'}
                                hover:shadow-md
                            `}
                            onClick={() => navigate(`/topic-details/${topic._id}`)}
                        >
                            <h3 className="text-xl font-bold text-gray-700">{topic.title}</h3>
                            <p className="text-sm text-gray-500">
                                {topic.isSystem ? 'Chủ đề Hệ thống' : `Tác giả: ${topic.author || 'Bạn'}`}
                                {' | '}
                                {topic.words ? `${topic.words.length} từ` : 'Đang tải...'}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
            
            {/* ⭐ 5. RENDER MODAL ⭐ */}
            <NotificationModal 
                message={modalMessage} 
                type={modalType} 
                onClose={handleCloseModal} 
            />
        </div>
    );
}

export default VocabularyPage;