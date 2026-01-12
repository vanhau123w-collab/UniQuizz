import { motion } from 'framer-motion';
import { useState } from 'react';

export default function StudyStreakCalendar({ studyData = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate last 12 weeks (84 days) like GitHub
  const generateCalendarData = () => {
    const weeks = [];
    const today = new Date();
    
    for (let week = 11; week >= 0; week--) {
      const days = [];
      for (let day = 6; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + day));
        
        // Mock data - random activity level
        const activity = studyData.find(d => 
          new Date(d.date).toDateString() === date.toDateString()
        );
        
        days.push({
          date: date,
          level: activity ? activity.level : Math.floor(Math.random() * 5), // 0-4
          count: activity ? activity.count : Math.floor(Math.random() * 10)
        });
      }
      weeks.push(days.reverse());
    }
    return weeks.reverse();
  };

  const weeks = generateCalendarData();

  const getColorClass = (level) => {
    const colors = {
      0: 'bg-gray-100 dark:bg-gray-800',
      1: 'bg-green-200 dark:bg-green-900',
      2: 'bg-green-400 dark:bg-green-700',
      3: 'bg-green-600 dark:bg-green-500',
      4: 'bg-green-800 dark:bg-green-400'
    };
    return colors[level] || colors[0];
  };

  const monthLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Chuỗi Học Tập 🔥
      </h2>
      
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            <div className="h-3"></div>
            {monthLabels.map((label, i) => (
              <div key={i} className="h-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="relative w-3 h-3"
                >
                  <motion.div
                    className={`absolute inset-0 rounded-sm ${getColorClass(day.level)} cursor-pointer`}
                    whileHover={{ 
                      scale: 1.8,
                      zIndex: 50
                    }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={`${day.date.toLocaleDateString('vi-VN')}: ${day.count} hoạt động`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {hoveredDay.date.toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {hoveredDay.count} hoạt động học tập
          </p>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Ít</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getColorClass(level)}`}></div>
          ))}
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
}
