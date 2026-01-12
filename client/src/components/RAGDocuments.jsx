// client/src/components/RAGDocuments.jsx - Quản lý tài liệu RAG
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFile, faFileText, faFilePdf, faFileWord, faFileImage,
  faSearch, faTrash, faEdit, faEye, faGlobe, faLock,
  faChartBar, faCalendar, faTag, faStar
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import EnhancedSearchInput from './EnhancedSearchInput';
import HighlightedText from './HighlightedText';
import API_BASE_URL from '../config/api.js';
import { isAuthenticated } from '../utils/auth.js';

const RAGDocuments = ({ userId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    fileType: '',
    dateFrom: '',
    dateTo: '',
    tags: '',
    includePublic: false,
    caseSensitive: false,
    highlightTerms: true
  });
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerms, setSearchTerms] = useState([]);

  // Fetch documents with enhanced search
  const fetchDocuments = async (page = 1) => {
    // Check authentication first
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để xem tài liệu');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (searchQuery) {
        params.append('q', searchQuery);
        // Store search terms for highlighting
        setSearchTerms(searchQuery.split(/\s+/).filter(term => term.length > 0));
      } else {
        setSearchTerms([]);
      }
      
      // Add filters
      if (searchFilters.fileType) params.append('fileTypes', searchFilters.fileType);
      if (searchFilters.tags) params.append('tags', searchFilters.tags);
      if (searchFilters.includePublic) params.append('includePublic', 'true');
      if (searchFilters.caseSensitive) params.append('caseSensitive', 'true');
      if (searchFilters.highlightTerms) params.append('highlightTerms', 'true');
      
      // Add date range filter
      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const dateRange = {};
        if (searchFilters.dateFrom) dateRange.start = searchFilters.dateFrom;
        if (searchFilters.dateTo) dateRange.end = searchFilters.dateTo;
        params.append('dateRange', JSON.stringify(dateRange));
      }
      
      const endpoint = searchQuery ? '/api/rag/search' : '/api/rag/documents';
      const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setPagination(data.pagination || {});
        
        // Record search if it was a search query
        if (searchQuery && data.documents) {
          recordSearch(searchQuery, data.documents);
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi tải documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Lỗi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  // Record search for analytics
  const recordSearch = async (query, results) => {
    if (!isAuthenticated()) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/rag/search/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          resultCount: results.length,
          filters: searchFilters,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error recording search:', error);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setSearchFilters(newFilters);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchDocuments(currentPage);
    }
  }, [currentPage, searchQuery, searchFilters]);

  // Rate search result
  const rateSearchResult = async (documentId, rating) => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/rag/search/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          documentId,
          rating,
          timestamp: new Date().toISOString()
        })
      });
      toast.success('Cảm ơn phản hồi của bạn!');
    } catch (error) {
      console.error('Error rating search result:', error);
    }
  };
  // Delete document
  const handleDelete = async (documentId) => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để xóa tài liệu');
      return;
    }
    
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/rag/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Đã xóa tài liệu');
        fetchDocuments(currentPage);
      } else {
        throw new Error('Lỗi xóa tài liệu');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Lỗi xóa tài liệu');
    }
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return faFilePdf;
      case 'docx': return faFileWord;
      case 'txt': return faFileText;
      case 'url': case 'youtube': return faGlobe;
      default: return faFile;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show login message if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faLock} className="text-6xl text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Cần đăng nhập
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vui lòng đăng nhập để truy cập thư viện tài liệu RAG
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Thư viện tài liệu RAG
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Quản lý tài liệu để tăng cường AI với RAG (Retrieval-Augmented Generation)
        </p>
      </div>

      {/* Enhanced Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <EnhancedSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Tìm kiếm tài liệu... (hỗ trợ từ khóa ngắn, cụm từ trong dấu ngoặc kép)"
          showFilters={true}
          filters={searchFilters}
          onFiltersChange={handleFiltersChange}
        />
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <span>Đang tìm kiếm...</span>
            ) : (
              <span>
                Tìm thấy {documents?.length || 0} kết quả cho "{searchQuery}"
                {searchFilters.fileType && ` trong file ${searchFilters.fileType.toUpperCase()}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : (!documents || documents.length === 0) ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faFile} className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Chưa có tài liệu nào
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Tải lên tài liệu và bật "Lưu vào RAG" khi tạo quiz để bắt đầu xây dựng thư viện kiến thức của bạn
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {documents.map((doc) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl 
                       border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600
                       transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <FontAwesomeIcon 
                    icon={getFileIcon(doc.fileType)} 
                    className="text-xl sm:text-2xl text-blue-500 dark:text-blue-400 mt-1"
                  />
                  <div className="flex items-center gap-2">
                    {doc.isPublic ? (
                      <FontAwesomeIcon icon={faGlobe} className="text-green-500 dark:text-green-400" title="Công khai" />
                    ) : (
                      <FontAwesomeIcon icon={faLock} className="text-gray-400 dark:text-gray-500" title="Riêng tư" />
                    )}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm sm:text-base">
                  <HighlightedText 
                    text={doc.title} 
                    searchTerms={searchTerms}
                  />
                </h3>
                
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faFileText} className="text-xs" />
                    {doc.metadata?.totalWords || 0} từ
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faChartBar} className="text-xs" />
                    {doc.metadata?.totalChunks || 0} chunks
                  </span>
                </div>
              </div>

              {/* Content Preview with Highlighting */}
              {doc.searchSnippet && searchQuery && (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                    Đoạn văn liên quan:
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    <HighlightedText 
                      text={doc.searchSnippet} 
                      searchTerms={searchTerms}
                    />
                  </div>
                </div>
              )}

              {/* Search Result Rating (only show for search results) */}
              {searchQuery && (
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Kết quả này có hữu ích?
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => rateSearchResult(doc._id, rating)}
                          className="text-gray-300 hover:text-yellow-500 transition-colors"
                          title={`Đánh giá ${rating} sao`}
                        >
                          <FontAwesomeIcon icon={faStar} className="text-xs" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                  <div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      {doc.usageStats?.quizGenerated || 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Quiz</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {doc.usageStats?.flashcardsGenerated || 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Flashcard</div>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-600 dark:text-purple-400">
                      {doc.usageStats?.mentorQuestions || 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Mentor</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                  <span className="hidden sm:inline">{formatDate(doc.createdAt)}</span>
                  <span className="sm:hidden">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 
                             rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0 && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                                 text-xs rounded-full flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faTag} className="text-xs" />
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                                     text-xs rounded-full">
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 sm:mt-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                  currentPage === page
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGDocuments;