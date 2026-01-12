import { motion } from 'framer-motion';

export default function LoadingSkeleton({ type = 'quiz' }) {
  if (type === 'quiz') {
    return (
      <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900">
        {/* Header Skeleton */}
        <div className="p-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
            {/* Progress Bar Skeleton */}
            <div className="mb-6">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Question Skeleton */}
            <div className="mb-8 space-y-3">
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Options Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>

            {/* Button Skeleton */}
            <div className="mt-10 text-right">
              <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse inline-block"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#fff7f0] dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
                <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
      <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>
  );
}
