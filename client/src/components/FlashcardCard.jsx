import React, { useState } from "react";
import { Link } from "react-router-dom";
import ShareButton from "./ShareButton";
import { API_ENDPOINTS } from "../config/api.js";
import { getAuthToken } from "../utils/auth.js";

export default function FlashcardCard({ flashcardSet, onDelete, onPublicToggle }) {
  const [isPublic, setIsPublic] = useState(flashcardSet.isPublic || false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa flashcard set "${flashcardSet.title}"?`)) {
      onDelete?.(flashcardSet.id);
    }
  };

  const handlePublicToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsTogglingPublic(true);
      const token = getAuthToken();
      
      const res = await fetch(API_ENDPOINTS.FLASHCARD_UPDATE_PUBLIC(flashcardSet.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: !isPublic })
      });

      if (!res.ok) {
        throw new Error('Không thể cập nhật trạng thái chia sẻ');
      }

      const data = await res.json();
      setIsPublic(data.set.isPublic);
      onPublicToggle?.(flashcardSet.id, data.set.isPublic);
      
    } catch (error) {
      console.error('Error toggling public status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái chia sẻ');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-50 dark:border-gray-700 overflow-visible flex flex-col hover:shadow-xl transition-shadow relative">
      <div className="p-5 flex flex-col grow">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex-1">
            {flashcardSet.title}
          </h4>
          <div className="ml-2">
            <ShareButton 
              quiz={{ _id: flashcardSet.id, title: flashcardSet.title }} 
              type="flashcard" 
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {flashcardSet.cardCount || flashcardSet.flashcards?.length || 0} thẻ
          {flashcardSet.courseCode && ` • ${flashcardSet.courseCode}`}
        </p>

        {/* Public status badge */}
        <div className="mb-4">
          <button
            onClick={handlePublicToggle}
            disabled={isTogglingPublic}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isPublic 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isTogglingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isPublic ? 'Click để đặt về riêng tư' : 'Click để chia sẻ công khai'}
          >
            {isPublic ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Công khai
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Riêng tư
              </>
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-auto flex gap-3">
          <Link
            to={`/flashcard/${flashcardSet.id}`}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 dark:bg-red-500 text-white font-semibold text-center hover:bg-red-700 dark:hover:bg-red-600 transition"
          >
            Học ngay
          </Link>
          <button
            onClick={handleDelete}
            title="Xóa"
            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-900 hover:text-red-800 dark:hover:text-red-300 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
