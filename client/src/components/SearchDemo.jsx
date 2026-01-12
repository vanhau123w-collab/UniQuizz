// client/src/components/SearchDemo.jsx - Demo component for testing enhanced search
import React, { useState } from 'react';
import EnhancedSearchInput from './EnhancedSearchInput';
import HighlightedText from './HighlightedText';
import { isAuthenticated } from '../utils/auth.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const SearchDemo = () => {
  // Check authentication first
  if (!isAuthenticated()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <FontAwesomeIcon icon={faLock} className="text-6xl text-gray-400 dark:text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Cần đăng nhập
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vui lòng đăng nhập để sử dụng tính năng demo tìm kiếm
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

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

  const handleSearch = (query) => {
    console.log('Searching for:', query);
    console.log('With filters:', searchFilters);
  };

  const sampleText = "This is a sample document about JavaScript programming and React development. It contains information about modern web development techniques.";
  const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Enhanced Search Demo
      </h2>
      
      <div className="space-y-6">
        {/* Search Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Search Input with Autocomplete
          </h3>
          <EnhancedSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Try typing 'JavaScript' or 'React'..."
            showFilters={true}
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
          />
        </div>

        {/* Highlighting Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Text Highlighting Demo
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200">
              <HighlightedText 
                text={sampleText}
                searchTerms={searchTerms}
              />
            </p>
          </div>
          {searchTerms.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Highlighting terms: {searchTerms.join(', ')}
            </div>
          )}
        </div>

        {/* Current State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Current Search State
          </h3>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto">
            {JSON.stringify({ searchQuery, searchFilters }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SearchDemo;