import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill room code from URL query parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Nếu chưa đăng nhập, bắt buộc nhập tên
    if (!token && !displayName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }

    // Nếu đã đăng nhập, lấy tên từ user
    const finalDisplayName = token 
      ? JSON.parse(user).fullName || JSON.parse(user).email
      : displayName.trim();

    setLoading(true);

    try {
      // Navigate với state
      navigate(`/room/${roomCode.toUpperCase()}`, {
        state: { displayName: finalDisplayName }
      });
    } catch (error) {
      toast.error('Lỗi khi tham gia phòng');
      console.error(error);
      setLoading(false);
    }
  };

  const token = localStorage.getItem('token');

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/backgrounds/festive-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      >
        <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for contrast */}
      </div>

      <div className="relative z-50">
        <Header />
      </div>
      
      <div className="flex-1 relative z-10 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-3xl border-4 border-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.3)] p-8 relative overflow-hidden group">
            
            {/* Decorative Lights (Top & Bottom of Card) */}
            <div className="absolute top-2 left-4 right-4 flex justify-between px-1">
                {[...Array(20)].map((_, i) => (
                    <div key={`t-${i}`} className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
            <div className="absolute bottom-2 left-4 right-4 flex justify-between px-1">
                {[...Array(20)].map((_, i) => (
                    <div key={`b-${i}`} className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-white mb-2 text-center drop-shadow-md">
                Tham gia phòng
              </h1>
              <p className="text-gray-400 text-center mb-8">
                Nhập mã phòng để bắt đầu thi đấu
              </p>

              <div className="space-y-6">
                {/* Room Code */}
                {/* Room Code */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Mã phòng
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="VD: TEE2105"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#fbbf24] focus:border-[#fbbf24] text-white text-center text-xl font-mono font-bold tracking-widest uppercase transition-all placeholder-gray-600"
                  />
                </div>

                {/* Display Name (chỉ hiện nếu chưa đăng nhập) */}
                {!token && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">
                      Tên của bạn
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên hiển thị"
                      maxLength={30}
                      className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#fbbf24] focus:border-[#fbbf24] text-white transition-all placeholder-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Tên này chỉ dùng cho phòng này
                    </p>
                  </div>
                )}

                {/* Join Button */}
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-xl hover:from-amber-300 hover:to-yellow-500 font-bold text-lg shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/50 transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang vào phòng...
                    </span>
                  ) : 'THAM GIA NGAY'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#1a1a1a] text-gray-500">
                      hoặc
                    </span>
                  </div>
                </div>

                {/* Create Room */}
                {token ? (
                  <button
                    onClick={() => navigate('/create-room')}
                    className="w-full px-6 py-3 border border-gray-700 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition font-medium"
                  >
                    Tạo phòng mới
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 border border-gray-700 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition font-medium"
                  >
                    Đăng nhập để tạo phòng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
      {/* Footer pinned to bottom relative to content */}
      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </div>
  );
}
