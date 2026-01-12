import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ProgressChart({ data = [] }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Mock data for last 7 days
  const chartData = data.length > 0 ? data : [
    { day: 'T2', score: 75, quizzes: 2 },
    { day: 'T3', score: 82, quizzes: 3 },
    { day: 'T4', score: 68, quizzes: 1 },
    { day: 'T5', score: 90, quizzes: 4 },
    { day: 'T6', score: 85, quizzes: 2 },
    { day: 'T7', score: 78, quizzes: 3 },
    { day: 'CN', score: 92, quizzes: 5 }
  ];

  const maxScore = 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Điểm Số 7 Ngày Qua
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-linear-to-t from-red-600 to-orange-400 rounded"></div>
            <span>Điểm</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="flex items-center">
              <span className="text-xs text-gray-400 dark:text-gray-600 w-8">{value}</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700 border-dashed ml-2"></div>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around pl-10 pb-8">
          {chartData.map((item, index) => {
            const height = (item.score / maxScore) * 100;
            const isHovered = hoveredBar === index;

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 mx-1"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-16 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap z-10"
                  >
                    <div className="font-semibold">{item.day}</div>
                    <div>Điểm: {item.score}%</div>
                    <div>Quiz: {item.quizzes}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </motion.div>
                )}

                {/* Bar */}
                <motion.div
                  className="w-full bg-linear-to-t from-red-600 to-orange-400 rounded-t-lg cursor-pointer transition-all duration-300 hover:from-red-500 hover:to-orange-300"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                  style={{ minHeight: '4px' }}
                >
                  {/* Score label on top of bar */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-800 dark:text-gray-100"
                    >
                      {item.score}%
                    </motion.div>
                  )}
                </motion.div>

                {/* Day label */}
                <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {item.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {Math.round(chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Trung bình</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.max(...chartData.map(item => item.score))}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Cao nhất</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {chartData.reduce((sum, item) => sum + item.quizzes, 0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tổng quiz</div>
        </div>
      </div>
    </div>
  );
}
