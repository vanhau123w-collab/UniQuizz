import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCopy, 
  faCheck, 
  faUser,
  faPlay
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import ParticipantAvatar from './ParticipantAvatar'; // Reuse avatar component if possible, or simple img

export default function ShareRoomModal({ isOpen, onClose, roomCode, quizTitle, participants = [] }) {
  const [copied, setCopied] = useState(false);

  // Generate URLs
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const joinUrl = `${baseUrl}/join-room?code=${roomCode}`;
  const shortUrl = `${baseUrl}/r/${roomCode}`; 

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container - Wide Layout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] text-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px] border border-gray-800"
            >
              
              {/* Left Column: Join Info (QR & Code) */}
              <div className="w-full md:w-5/12 bg-gradient-to-br from-gray-900 to-black p-8 flex flex-col items-center justify-center relative border-r border-gray-800">
                <div className="text-center space-y-2 mb-8">
                   <h3 className="text-gray-400 text-sm uppercase tracking-wider">Tham gia tại</h3>
                   <div 
                      onClick={() => handleCopy(shortUrl)}
                      className="bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-lg cursor-pointer transition flex items-center gap-2 group border border-white/10"
                   >
                      <span className="text-red-400 font-bold text-lg">uniquizzdom.vercel.app</span>
                      <FontAwesomeIcon icon={faCopy} className="text-gray-500 group-hover:text-white transition-colors text-xs" />
                   </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white p-4 rounded-2xl shadow-xl transform transition hover:scale-105 duration-300">
                  <QRCodeSVG
                    value={shortUrl}
                    size={220}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: '/favicon.png',
                      height: 48,
                      width: 48,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mt-8 text-center w-full">
                  <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Hoặc nhập mã</p>
                  <div 
                    onClick={() => handleCopy(roomCode)}
                    className="text-6xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 cursor-pointer hover:scale-105 transition-transform inline-block"
                  >
                    {roomCode}
                  </div>
                </div>
              </div>

              {/* Right Column: Participants List */}
              <div className="flex-1 bg-[#252525] flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#252525] z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-700 p-2 rounded-lg">
                            <FontAwesomeIcon icon={faUser} className="text-gray-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-white">
                                {participants.length} người tham gia
                            </h3>
                            <p className="text-gray-400 text-xs">Đang chờ người chơi khác...</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {participants.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin mb-4"></div>
                            <p>Đang đợi người chơi tham gia...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {participants.map((p, index) => (
                                <div key={p.socketId || index} className="flex items-center gap-4 bg-gray-800/50 p-3 rounded-xl border border-white/5 hover:border-white/10 transition">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner">
                                        {p.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-200">{p.displayName}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Action (Optional Start Button visual placeholder if needed, or close) */}
                <div className="p-6 border-t border-gray-700 bg-[#252525]">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transform transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlay} className="text-sm" />
                        BẮT ĐẦU NGAY
                    </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
