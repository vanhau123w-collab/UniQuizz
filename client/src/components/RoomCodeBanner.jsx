import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faQrcode, faExpand } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';

const RoomCodeBanner = ({ roomCode, onShareClick }) => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const joinUrl = `${baseUrl}/r/${roomCode}`;

  // Format for display (remove protocol)
  const displayUrl = joinUrl.replace(/^https?:\/\//, '');

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${type}!`);
  };

  return (
    <div className="relative max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
      {/* Main Board */}
      <div className="bg-[#1a1a1a] rounded-3xl border-4 border-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.3)] overflow-hidden relative">

        {/* Lights Borders */}
        <div className="absolute top-2 left-2 right-2 h-2 flex justify-between px-2">
          {[...Array(30)].map((_, i) => (
            <div key={`t-${i}`} className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className="absolute bottom-2 left-2 right-2 h-2 flex justify-between px-2">
          {[...Array(30)].map((_, i) => (
            <div key={`b-${i}`} className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-stretch p-2 md:p-0">

          {/* Left Panel: Info (Stack Join & Code) */}
          <div className="flex-[2] flex flex-col border-b-2 md:border-b-0 md:border-r-2 border-dashed border-gray-600 bg-[#262626]">

            {/* Row 1: Join URL */}
            <div className="flex-1 p-4 md:p-6 border-b border-gray-700 hidden md:flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#333] w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border border-gray-500">1</div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tham gia tại</div>
              </div>
              <div className="bg-black rounded-lg p-2 md:p-3 flex items-center justify-between group cursor-pointer hover:bg-gray-900 transition-colors border border-gray-800"
                onClick={() => copyToClipboard(joinUrl, 'link')}>
                <span className="text-sm md:text-2xl font-bold text-white font-mono tracking-wide truncate mr-2">
                  {displayUrl}
                </span>
                <button className="text-gray-500 group-hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>

            {/* Row 2: Room Code */}
            <div className="flex-1 p-4 md:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#333] w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border border-gray-500">2</div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Nhập mã phòng</div>
              </div>
              <div className="bg-black rounded-lg p-2 md:p-3 flex items-center justify-between group cursor-pointer hover:bg-gray-900 transition-colors border border-gray-800"
                onClick={() => copyToClipboard(roomCode, 'mã phòng')}>
                <span className="text-3xl md:text-5xl font-bold text-[#fbbf24] font-mono tracking-[0.2em]">
                  {roomCode}
                </span>
                <button className="text-gray-500 group-hover:text-white transition-colors text-xl">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Big QR Code */}
          <div
            className="flex-1 bg-white p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group relative min-w-[200px]"
            onClick={onShareClick}
            title="Phóng to QR Code"
          >
            <div className="bg-white p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow relative">
              <QRCodeSVG
                value={joinUrl}
                size={160}
                level="H"
                imageSettings={{
                  src: "/favicon.png",
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
              {/* Overlay icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <FontAwesomeIcon icon={faExpand} className="text-black/50 text-3xl drop-shadow-sm" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faQrcode} className="text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold group-hover:text-black transition-colors">Quét Để Vào</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoomCodeBanner;
