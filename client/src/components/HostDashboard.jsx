import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faClock, faTrophy, faStar, faChartBar, faListOl } from '@fortawesome/free-solid-svg-icons';

export default function HostDashboard({ room, quiz, currentQuestion, currentQuestionIndex, participants, timeLeft, answeredCount, leaderboard }) {
  const totalParticipants = participants.filter(p => p.isOnline).length;
  const participationRate = totalParticipants > 0 ? Math.round((answeredCount / totalParticipants) * 100) : 0;
  
  // Tab state for the bottom panel
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'questions'

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 relative z-10 flex flex-col h-[calc(100vh-100px)]">
      
      {/* HUD HEADER: Accuracy/Progress Bar */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border-2 border-yellow-500/30 p-4 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gray-800/50 rounded-full mx-4 sm:mx-20 overflow-hidden">
             {/* Background Bar */}
             <div className="w-full h-full bg-gray-700/30" />
             {/* Participation Bar (Left) */}
             <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                style={{ width: `${participationRate}%` }}
             />
             {/* Time Decay Bar (Right - Inverse) - Optional visual effect */}
          </div>

          {/* Central Circle Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#991b1b] rounded-full border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] flex flex-col items-center justify-center z-10 relative group hover:scale-105 transition-transform">
               <div className="text-white text-xs font-bold uppercase tracking-widest opacity-80">Trả lời</div>
               <div className="text-white font-black text-2xl drop-shadow-md">{participationRate}%</div>
               {/* Pulse Effect */}
               <div className="absolute inset-0 rounded-full border border-yellow-500/50 animate-ping opacity-20" />
          </div>

          {/* Side Stats */}
          <div className="flex justify-between items-center px-4 md:px-12 relative z-0 h-16">
              <div className="flex items-center gap-4">
                  <div className="text-center">
                      <div className="text-yellow-500 text-xs font-bold uppercase">Câu hỏi</div>
                      <div className="text-white font-bold text-xl">{currentQuestionIndex + 1}/{quiz.questions.length}</div>
                  </div>
              </div>
              
              <div className="flex items-center gap-4">
                  <div className="text-center">
                      <div className={`${timeLeft <= 5 ? 'text-red-500' : 'text-blue-400'} text-xs font-bold uppercase`}>Thời gian</div>
                      <div className={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'} font-bold text-xl`}>{timeLeft}s</div>
                  </div>
              </div>
          </div>
      </div>

      {/* CENTER STAGE: Question Display */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
          <AnimatePresence mode="wait">
            <motion.div 
               key={currentQuestion.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="w-full max-w-4xl text-center"
            >
                <div className="mb-6">
                    <span className="bg-red-900/60 text-yellow-200 border border-yellow-500/50 px-6 py-2 rounded-full font-bold text-sm shadow-lg uppercase tracking-wider backdrop-blur-sm">
                        {currentQuestion.type === 'multiple-choice' ? 'Chọn đáp án đúng' : 'Điền đáp án'}
                    </span>
                </div>
                
                <h2 className="text-2xl md:text-5xl font-black text-white mb-8 leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] filter">
                    {currentQuestion.question}
                </h2>

                {/* Optional: Show options in simplified view if needed, mirroring standard quiz shows */}
                <div className="grid grid-cols-2 gap-4 w-full opacity-60 hover:opacity-100 transition-opacity duration-300">
                    {currentQuestion.options.map((opt, idx) => (
                        <div key={idx} className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                             <span className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                                {String.fromCharCode(65 + idx)}
                             </span>
                             <span className="text-white text-sm text-left truncate">{opt}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
          </AnimatePresence>
      </div>

      {/* BOTTOM PANEL: Leaderboard & Tabs */}
      <div className="bg-[#262626]/90 backdrop-blur-xl rounded-t-3xl border-t-4 border-yellow-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col h-1/3 min-h-[250px] overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-white/10 bg-black/20">
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-white/5'}`}
              >
                  <FontAwesomeIcon icon={faListOl} /> Bảng xếp hạng
              </button>
              <button 
                 onClick={() => setActiveTab('stats')}
                 className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'stats' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-white/5'}`}
              >
                  <FontAwesomeIcon icon={faChartBar} /> Thống kê lớp
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[url('/patterns/topography.svg')] bg-opacity-5">
              {activeTab === 'leaderboard' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...leaderboard].sort((a, b) => b.score - a.score).map((player, idx) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={player.socketId}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                                idx === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-black/50 border-yellow-500' :
                                idx === 1 ? 'bg-gradient-to-r from-gray-800/50 to-black/50 border-gray-400' :
                                idx === 2 ? 'bg-gradient-to-r from-orange-900/50 to-black/50 border-orange-500' :
                                'bg-white/5 border-white/5'
                            } relative overflow-hidden`}
                        >
                             <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-white ${
                                 idx <= 2 ? 'bg-white/20' : 'bg-gray-700'
                             }`}>
                                 {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="font-bold text-white truncate text-sm">{player.displayName}</div>
                                 <div className="text-xs text-yellow-500 font-mono">{player.score} PTS</div>
                             </div>
                             {idx === 0 && <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-lg drop-shadow-glow" />}
                        </motion.div>
                      ))}
                      
                      {leaderboard.length === 0 && (
                          <div className="col-span-full text-center text-gray-500 py-8">
                              <FontAwesomeIcon icon={faUsers} className="text-3xl mb-2 opacity-50" />
                              <p>Chưa có dữ liệu xếp hạng...</p>
                          </div>
                      )}
                  </div>
              )}
              
              {activeTab === 'stats' && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                      <p>Thống kê chi tiết sẽ hiển thị sau mỗi câu hỏi...</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
