import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Leaderboard({ currentUser = null }) {
  const [timeRange, setTimeRange] = useState('week'); // week, month, all

  // Mock leaderboard data
  const leaderboardData = [
    { rank: 1, name: 'Nguyễn Văn A', score: 2850, quizzes: 45, avatar: '🥇', trend: 'up' },
    { rank: 2, name: 'Trần Thị B', score: 2720, quizzes: 42, avatar: '🥈', trend: 'up' },
    { rank: 3, name: 'Lê Văn C', score: 2680, quizzes: 40, avatar: '🥉', trend: 'down' },
    { rank: 4, name: 'Phạm Thị D', score: 2550, quizzes: 38, avatar: '👤', trend: 'same' },
    { rank: 5, name: 'Hoàng Văn E', score: 2480, quizzes: 36, avatar: '👤', trend: 'up' },
    { rank: 6, name: 'Bạn', score: 2350, quizzes: 35, avatar: '👤', trend: 'up', isCurrentUser: true },
    { rank: 7, name: 'Võ Thị F', score: 2280, quizzes: 33, avatar: '👤', trend: 'down' },
    { rank: 8, name: 'Đặng Văn G', score: 2150, quizzes: 31, avatar: '👤', trend: 'same' },
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <span className="text-green-500">↑</span>;
    if (trend === 'down') return <span className="text-red-500">↓</span>;
    return <span className="text-gray-400">-</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Bảng Xếp Hạng 🏆
        </h2>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['week', 'month', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === 'week' ? 'Tuần' : range === 'month' ? 'Tháng' : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboardData.map((user, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
              user.isCurrentUser
                ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 shadow-md'
                : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900'
            }`}
          >
            {/* Rank */}
            <div className={`text-2xl font-bold ${getRankColor(user.rank)} w-8 text-center`}>
              {user.rank <= 3 ? user.avatar : user.rank}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${user.isCurrentUser ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                  {user.name}
                </h3>
                {user.isCurrentUser && (
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">Bạn</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {user.quizzes} quiz hoàn thành
              </p>
            </div>

            {/* Score & Trend */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {user.score.toLocaleString()}
                </span>
                {getTrendIcon(user.trend)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">điểm</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Your Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">#6</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hạng của bạn</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">↑ 2</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tăng tuần này</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">500</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Điểm cần Top 5</div>
          </div>
        </div>
      </motion.div>

      {/* Motivational Message */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💪 Tiếp tục phấn đấu để vào Top 5!
        </p>
      </div>
    </div>
  );
}
