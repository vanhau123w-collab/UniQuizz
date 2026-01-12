import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RoomRedirect() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (roomCode) {
      // Redirect to join-room page with the room code
      navigate(`/join-room?code=${roomCode}`, { replace: true });
    } else {
      // If no room code, go to home
      navigate('/', { replace: true });
    }
  }, [roomCode, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
