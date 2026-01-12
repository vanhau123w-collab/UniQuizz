import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faCrown, faHome } from '@fortawesome/free-solid-svg-icons';
import ReactConfetti from 'react-confetti';
import ParticipantAvatar from './ParticipantAvatar';
import CharacterAvatar from './CharacterAvatar';

const HostLeaderboard = ({ leaderboard, onExit }) => {
  const [windowSize, setWindowSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  // Podium Order: 2nd, 1st, 3rd
  const podiumOrder = [
    top3[1] || null, // 2nd
    top3[0] || null, // 1st
    top3[2] || null  // 3rd
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-900 text-white">
      {/* Fixed Background Layers */}
      <div className="fixed inset-0 z-0 bg-[url('/backgrounds/bg_CaNhan.png')] bg-cover bg-center"></div>
      <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Scrollable Content Wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start pt-24 pb-20">

        <ReactConfetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={300} gravity={0.1} />

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-26"
        >
          <h1 className="text-4xl mt-6 md:text-6xl font-extrabold text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-2 drop-shadow-lg">
            <FontAwesomeIcon icon={faTrophy} className="mr-3 text-yellow-500" />
            BẢNG VÀNG VINH DANH
            <FontAwesomeIcon icon={faTrophy} className="ml-3 text-yellow-500" />
          </h1>
          <p className="text-gray-300 text-lg mb-30">Chúc mừng các nhà vô địch!</p>
        </motion.div>

        {/* PODIUM AREA */}
        <div className="w-full max-w-3xl flex items-end justify-center gap-4 mb-10 px-4 h-[380px]">
          {podiumOrder.map((player, index) => {
            if (!player) return <div key={index} className="w-1/3 max-w-[200px]"></div>;

            let rank = 0;
            let heightClass = "";
            let colorClass = "";
            let delay = 0;

            if (index === 1) { // 1st Place
              rank = 1;
              heightClass = "h-[300px]";
              colorClass = "bg-gradient-to-t from-yellow-600 to-yellow-400 border-yellow-300";
              delay = 0.5;
            } else if (index === 0) { // 2nd Place
              rank = 2;
              heightClass = "h-[220px]";
              colorClass = "bg-gradient-to-t from-gray-500 to-gray-300 border-gray-200";
              delay = 0.3;
            } else { // 3rd Place
              rank = 3;
              heightClass = "h-[160px]";
              colorClass = "bg-gradient-to-t from-orange-700 to-orange-500 border-orange-300";
              delay = 0.1;
            }

            return (
              <motion.div
                key={player.userId || player.displayName}
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: delay, type: "spring", stiffness: 100 }}
                className={`relative flex-1 max-w-[200px] flex flex-col items-center justify-end ${index === 1 ? 'z-20' : 'z-10'}`}
              >
                {/* Avatar Floating */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                  className="mb-4 flex flex-col items-center w-full"
                >
                  {rank === 1 && (
                    <FontAwesomeIcon icon={faCrown} className="text-5xl text-yellow-300 mb-2 drop-shadow-lg animate-bounce" />
                  )}
                  {rank === 2 && (
                    <FontAwesomeIcon icon={faCrown} className="text-4xl text-gray-300 mb-2 drop-shadow-lg" />
                  )}
                  {rank === 3 && (
                    <FontAwesomeIcon icon={faCrown} className="text-4xl text-orange-400 mb-2 drop-shadow-lg" />
                  )}

                  {/* Avatar Container */}
                  <div className={`rounded-2xl border-4 shadow-xl overflow-hidden bg-white/10 backdrop-blur-sm mb-2 flex items-end justify-center relative ${rank === 1 ? 'border-yellow-300 w-24 h-32' : rank === 2 ? 'border-gray-300 w-20 h-28' : 'border-orange-300 w-20 h-28'
                    }`}>
                    {/* Use CharacterAvatar if config exists */}
                    {player.characterConfig ? (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full flex items-end justify-center overflow-visible">
                        <div className="transform scale-[1] origin-bottom translate-y-2">
                          <CharacterAvatar config={player.characterConfig} size={120} />
                        </div>
                      </div>
                    ) : (
                      <div className={rank === 1 ? '' : 'transform scale-90 origin-bottom'}>
                        <ParticipantAvatar name={player.displayName} index={0} />
                      </div>
                    )}
                  </div>

                  <div className="text-center bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 w-full max-w-[140px]">
                    <p className="font-bold text-white text-sm md:text-base truncate">{player.displayName}</p>
                    <p className="text-xs font-mono text-yellow-300">{player.score} pts</p>
                  </div>
                </motion.div>

                {/* PILLAR */}
                <div className={`w-full ${heightClass} ${colorClass} rounded-t-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] border-t-4 border-white/30 flex items-start justify-center pt-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
                  <span className="text-5xl md:text-7xl font-black text-white/30 drop-shadow-sm font-outline-2">
                    {rank}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* OTHERS LIST (Scrollable) */}
        {others.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full mt-12 max-w-3xl bg-white/10 backdrop-blur-md rounded-xl p-4 max-h-[300px] overflow-y-auto custom-scrollbar border border-white/10 mb-8"
          >
            <div className="flex flex-col gap-3">
              {others.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-lg hover:bg-black/60 transition">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-400 w-6">#{idx + 4}</span>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
                      <ParticipantAvatar name={player.displayName} size="sm" />
                    </div>
                    <span className="font-semibold">{player.displayName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-yellow-500 font-bold">{player.score} pts</p>
                    <p className="text-xs text-gray-400">{player.correctAnswers} câu đúng</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-8 mb-8 flex gap-4">
          <button
            onClick={onExit}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg flex items-center gap-2 transform hover:scale-105 transition"
          >
            <FontAwesomeIcon icon={faHome} />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostLeaderboard;
