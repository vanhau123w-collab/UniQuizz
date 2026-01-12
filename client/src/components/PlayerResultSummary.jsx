import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faStar, faRedo, faHome, faMedal, faChartPie, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import ReactConfetti from 'react-confetti';
import ParticipantAvatar from './ParticipantAvatar';

const PlayerResultSummary = ({ 
  playerData, 
  leaderboard, 
  onExit, 
  onPlayAgain 
}) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate Rank
  const myRank = leaderboard.findIndex(p => p.displayName === playerData.displayName) + 1;
  const isWinner = myRank === 1;
  const isTop3 = myRank <= 3;
  
  // Calculate Stats
  const accuracy = playerData.totalAnswers > 0
    ? Math.round((playerData.correctAnswers / playerData.totalAnswers) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <ReactConfetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={800} />
      
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-yellow-400"
      >
        {/* Heather / Banner */}
        <div className={`pt-8 px-8 pb-32 text-center relative overflow-hidden ${
          isWinner 
            ? 'bg-gradient-to-b from-yellow-300 to-yellow-500' 
            : isTop3 
              ? 'bg-gradient-to-b from-gray-300 to-gray-500' // Silver/Generic Top 3
              : 'bg-gradient-to-b from-red-500 to-red-700'
        }`}>
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-white/20 rounded-full -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 translate-y-10"></div>

          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10"
          >
            {isWinner ? (
              <div className="inline-block p-4 rounded-full bg-white/30 mb-4 backdrop-blur-sm shadow-lg">
                <FontAwesomeIcon icon={faTrophy} className="text-5xl text-yellow-100 drop-shadow-md" />
              </div>
            ) : (
              <div className="inline-block p-4 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
                <FontAwesomeIcon icon={faMedal} className="text-5xl text-white drop-shadow-md" />
              </div>
            )}
            
            <h1 className="text-3xl font-extrabold text-white mb-1 uppercase tracking-wider text-shadow-sm">
              {isWinner ? 'Vô Địch!' : isTop3 ? 'Tuyệt Vời!' : 'Hoàn Thành!'}
            </h1>
            <p className="text-white/90 font-medium">
              {isWinner ? 'Bạn là người chiến thắng!' : `Bạn xếp hạng #${myRank}`}
            </p>
          </motion.div>
        </div>

        {/* Stats Content */}
        <div className="p-8 space-y-6">
          {/* Score Card */}
          <div className="flex justify-center -mt-8 mb-4 relative z-20">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ delay: 0.6, type: 'spring' }}
               className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-4 min-w-[120px] text-center border-2 border-yellow-100 dark:border-gray-600"
             >
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Điểm số</p>
                <div className="text-3xl font-black text-red-600 dark:text-red-400">{playerData.score}</div>
             </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Accuracy */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-700/50 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-300">
                <FontAwesomeIcon icon={faChartPie} />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{accuracy}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Chính xác</div>
            </div>

            {/* Correct/Total */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-700/50 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mb-2 text-green-600 dark:text-green-300">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {playerData.correctAnswers}/{playerData.totalAnswers}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Câu đúng</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onExit}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faHome} />
              Trang chủ
            </button>
            
            {/* Mini Game / Play Again - Just UI for now */}
            <button 
              disabled
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              title="Tính năng sắp ra mắt"
            >
              <FontAwesomeIcon icon={faRedo} />
              Chơi lại
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerResultSummary;
