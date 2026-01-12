import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AchievementBadge({ 
  icon, 
  title, 
  description, 
  unlocked, 
  progress = 0,
  total = 100,
  color = 'yellow'
}) {
  const [showDetails, setShowDetails] = useState(false);

  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-600 dark:text-yellow-400',
      glow: 'shadow-yellow-500/50'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      glow: 'shadow-red-500/50'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'shadow-blue-500/50'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
      glow: 'shadow-green-500/50'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      glow: 'shadow-purple-500/50'
    }
  };

  const colors = colorClasses[color] || colorClasses.yellow;

  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 ${colors.bg} ${colors.border} cursor-pointer transition-all duration-300 ${
        unlocked ? `hover:shadow-xl ${colors.glow}` : 'opacity-60 grayscale'
      }`}
      whileHover={unlocked ? { scale: 1.05, y: -5 } : {}}
      onClick={() => setShowDetails(!showDetails)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Unlock Animation */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent`}></div>
        </motion.div>
      )}

      {/* Badge Icon */}
      <div className="flex items-center gap-3 relative z-10">
        <motion.div
          className={`text-4xl ${unlocked ? colors.text : 'text-gray-400 dark:text-gray-600'}`}
          animate={unlocked ? {
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5, repeat: unlocked ? Infinity : 0, repeatDelay: 5 }}
        >
          {icon}
        </motion.div>

        <div className="flex-1">
          <h3 className={`font-bold ${colors.text} text-sm`}>
            {title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>

          {/* Progress Bar for locked achievements */}
          {!unlocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{progress}/{total}</span>
                <span>{Math.round((progress / total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress / total) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                ></motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Unlocked Badge */}
        {unlocked && (
          <motion.div
            className={`absolute -top-2 -right-2 w-6 h-6 ${colors.text.replace('text-', 'bg-')} rounded-full flex items-center justify-center`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Details Popup */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {unlocked 
              ? '🎉 Chúc mừng! Bạn đã mở khóa thành tích này.' 
              : `Còn ${total - progress} nữa để mở khóa!`
            }
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
