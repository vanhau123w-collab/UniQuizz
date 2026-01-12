// client/src/components/EnhancedSearchInput.jsx - Enhanced search input with autocomplete
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faTimes, faHistory, faFilter, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import API_BASE_URL from '../config/api.js';
import { isAuthenticated } from '../utils/auth.js';

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const EnhancedSearchInput = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Tìm kiếm tài liệu...",
  showFilters = true,
  filters = {},
  onFiltersChange = () => {}
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced function to fetch suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      // Check authentication first
      if (!isAuthenticated()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      
      if (!query || query.length < 1) {
        // Show recent searches when no query
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/rag/search/history?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSearchHistory(data.searches || []);
            setSuggestions(data.searches?.map(s => ({ 
              text: s.query, 
              type: 'history',
              count: s.resultCount 
            })) || []);
          }
        } catch (error) {
          console.error('Error fetching search history:', error);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_BASE_URL}/api/rag/search/suggestions?q=${encodeURIComponent(query)}&limit=10`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue !== value) {
      debouncedFetchSuggestions(newValue);
      setShowSuggestions(true);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    onSearch(suggestion.text);
    
    // Record click if it's a content suggestion
    if (suggestion.type === 'content') {
      recordSuggestionClick(suggestion);
    }
  };

  // Record suggestion click for analytics
  const recordSuggestionClick = async (suggestion) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/rag/search/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: value,
          selectedSuggestion: suggestion.text,
          suggestionType: suggestion.type
        })
      });
    } catch (error) {
      console.error('Error recording suggestion click:', error);
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      onSearch(value);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (value || suggestions.length > 0) {
      setShowSuggestions(true);
    }
    debouncedFetchSuggestions(value);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get suggestion icon
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'history': return faHistory;
      default: return faSearch;
    }
  };

  return (
    <div className="relative">
      {/* Main Search Input */}
      <div className="relative">
        <FontAwesomeIcon 
          icon={faSearch} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={() => {
              onChange('');
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      {showFilters && (
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <FontAwesomeIcon icon={faFilter} />
          Bộ lọc nâng cao
          <FontAwesomeIcon icon={showAdvancedFilters ? faChevronUp : faChevronDown} />
        </button>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại file
              </label>
              <select
                value={filters.fileType || ''}
                onChange={(e) => onFiltersChange({ ...filters, fileType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="txt">Text</option>
                <option value="url">Website</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Tags Filter */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                placeholder="ví dụ: javascript, react, tutorial"
                value={filters.tags || ''}
                onChange={(e) => onFiltersChange({ ...filters, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Search Options */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includePublic || false}
                    onChange={(e) => onFiltersChange({ ...filters, includePublic: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bao gồm tài liệu công khai</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.caseSensitive || false}
                    onChange={(e) => onFiltersChange({ ...filters, caseSensitive: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Phân biệt hoa thường</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.highlightTerms !== false}
                    onChange={(e) => onFiltersChange({ ...filters, highlightTerms: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Làm nổi bật từ khóa</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                   rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {loading && (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}
          
          {!loading && suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                       border-b border-gray-100 dark:border-gray-700 last:border-b-0
                       flex items-center gap-3 transition-colors"
            >
              <FontAwesomeIcon 
                icon={getSuggestionIcon(suggestion.type)} 
                className="text-gray-400 dark:text-gray-500 text-sm"
              />
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white text-sm">
                  {suggestion.text}
                </div>
                {suggestion.count !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.count} kết quả
                  </div>
                )}
              </div>
              {suggestion.type === 'history' && (
                <span className="text-xs text-gray-400 dark:text-gray-500">Lịch sử</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;