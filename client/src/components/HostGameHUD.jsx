import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faClock, faTrophy, faStar, faChartBar, faListOl, faVolumeHigh, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

export default function HostGameHUD({ 
  room, quiz, currentQuestion = {}, currentQuestionIndex, participants, timeLeft, answeredCount, leaderboard,
  isMuted, onToggleMute 
}) {
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
              
              <div className="flex items-center gap-6">
                  {/* Timer */}
                  <div className="text-center">
                      <div className={`${timeLeft <= 5 ? 'text-red-500' : 'text-blue-400'} text-xs font-bold uppercase`}>Thời gian</div>
                      <div className={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'} font-bold text-xl`}>{timeLeft}s</div>
                  </div>

                  {/* Mute Button */}
                  {onToggleMute && (
                    <button
                        onClick={onToggleMute}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                        <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeHigh} />
                    </button>
                  )}
              </div>
          </div>
      </div>


      {/* BOTTOM PANEL: Leaderboard & Tabs */}
      <div className="bg-[#262626]/60 backdrop-blur-xl rounded-t-3xl border-t-4 border-yellow-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col flex-1 mt-6 overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-white/10 bg-black/20">
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 py-3 font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'leaderboard' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-white/5'}`}
              >
                  <FontAwesomeIcon icon={faListOl} /> Bảng xếp hạng
              </button>
              <button 
                 onClick={() => setActiveTab('stats')}
                 className={`flex-1 py-3 font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'stats' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-white/5'}`}
              >
                  <FontAwesomeIcon icon={faChartBar} /> Thống kê lớp
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[url('/patterns/topography.svg')] bg-opacity-5">
              {activeTab === 'leaderboard' && (
                  <div className="grid grid-cols-1 gap-3">
                      <AnimatePresence>
                      {[...leaderboard].sort((a, b) => b.score - a.score).map((player, idx) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            key={player.socketId}
                            className={`flex items-center gap-4 p-4 rounded-xl border-b-2 ${
                                idx === 0 ? 'bg-gradient-to-r from-yellow-900/60 to-black/40 border-yellow-500' :
                                idx === 1 ? 'bg-gradient-to-r from-gray-800/60 to-black/40 border-gray-400' :
                                idx === 2 ? 'bg-gradient-to-r from-orange-900/60 to-black/40 border-orange-500' :
                                'bg-white/5 border-white/5'
                            } relative overflow-hidden group hover:bg-white/10 transition-colors`}
                        >
                             <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-black text-white text-xl ${
                                 idx <= 2 ? 'bg-white/20 shadow-lg' : 'bg-gray-700/50'
                             }`}>
                                 {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0 flex items-center justify-between mr-4">
                                 <div className="font-bold text-white truncate text-2xl tracking-wide">{player.displayName}</div>
                                 <div className="flex items-center gap-2">
                                     <div className="text-xl text-yellow-500 font-black font-mono">{player.score}</div>
                                     <div className="text-sm text-gray-400 font-bold uppercase">điểm</div>
                                 </div>
                             </div>
                             {idx === 0 && <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-3xl drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] animate-pulse" />}
                        </motion.div>
                      ))}
                      </AnimatePresence>
                      
                      {leaderboard.length === 0 && (
                          <div className="col-span-full text-center text-gray-500 py-12">
                              <FontAwesomeIcon icon={faUsers} className="text-5xl mb-4 opacity-30" />
                              <p className="text-xl">Chưa có dữ liệu xếp hạng...</p>
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
