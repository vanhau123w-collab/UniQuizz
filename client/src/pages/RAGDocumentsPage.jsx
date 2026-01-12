// client/src/pages/RAGDocumentsPage.jsx - RAG Documents Page với Header/Footer
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RAGDocuments from '../components/RAGDocuments';
import RAGDemo from '../components/RAGDemo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faFlask
} from '@fortawesome/free-solid-svg-icons';
const RAGDocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                  activeTab === 'documents'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <FontAwesomeIcon icon={faBook} className="text-white" />
                <i className="fas fa-book mr-2"></i>Thư viện tài liệu
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                  activeTab === 'demo'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <FontAwesomeIcon icon={faFlask} className="text-white" />
                Test RAG
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'documents' ? <RAGDocuments /> : <RAGDemo />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RAGDocumentsPage;