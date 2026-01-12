import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { analytics } from "./Analytics";
import { APP_CONFIG, APP_INFO } from "../config/constants";

export default function ShareButton({ quiz, type = "quiz" }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  // Calculate menu position when opened
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX,
      });
    }
  }, [showMenu]);

  // Validate quiz ID
  const quizId = quiz._id || quiz.id;
  if (!quizId) {
    console.error('ShareButton: Quiz ID is missing', quiz);
    return null; // Don't render if no ID
  }

  // Generate share URL - Sử dụng production URL nếu có
  const baseUrl = APP_CONFIG.getBaseUrl();
  const shareUrl = type === "quiz" 
    ? `${baseUrl}/quiz/${quizId}`
    : `${baseUrl}/flashcard/${quizId}`;

  const shareTitle = quiz.title || `${APP_INFO.name} - ${APP_INFO.tagline}`;
  const shareDescription = `Tham gia làm quiz "${quiz.title}" trên ${APP_INFO.name}! 🎓✨`;

  // Share handlers
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    analytics.shareQuiz("facebook", quiz._id);
    setShowMenu(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(shareDescription);
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    analytics.shareQuiz("twitter", quiz._id);
    setShowMenu(false);
  };

  const shareToZalo = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    analytics.shareQuiz("zalo", quiz._id);
    setShowMenu(false);
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(shareDescription);
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`;
    window.open(url, "_blank", "width=600,height=400");
    analytics.shareQuiz("telegram", quiz._id);
    setShowMenu(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      analytics.shareQuiz("copy_link", quiz._id);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi copy:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        analytics.shareQuiz("web_share", quiz._id);
        setShowMenu(false);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Lỗi khi share:", error);
        }
      }
    }
  };

  return (
    <>
      {/* Share Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
        aria-label="Chia sẻ"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="hidden sm:inline">Chia sẻ</span>
      </button>

      {/* Share Menu - Rendered via Portal */}
      {showMenu && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          ></div>

          {/* Menu */}
          <div 
            className="fixed w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] overflow-hidden max-h-[80vh] overflow-y-auto"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                Chia sẻ {type === "quiz" ? "Quiz" : "Flashcard"}
              </h3>
            </div>

            <div className="p-2">
              {/* Web Share API (Mobile) */}
              {navigator.share && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareViaWebShare();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-0-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                      Chia sẻ...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Chọn ứng dụng
                    </p>
                  </div>
                </button>
              )}

              {/* Facebook */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  shareToFacebook();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    Facebook
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chia sẻ lên Facebook
                  </p>
                </div>
              </button>

              {/* Twitter */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  shareToTwitter();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    Twitter
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tweet về quiz này
                  </p>
                </div>
              </button>

              {/* Zalo */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  shareToZalo();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#0068FF] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    Zalo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gửi qua Zalo
                  </p>
                </div>
              </button>

              {/* Telegram */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  shareToTelegram();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    Telegram
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gửi qua Telegram
                  </p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-600 dark:bg-gray-500 flex items-center justify-center">
                  {copied ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    {copied ? "Đã copy!" : "Copy link"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {copied ? "Link đã được copy" : "Sao chép đường dẫn"}
                  </p>
                </div>
              </button>
            </div>

            {/* Link Preview */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Link chia sẻ:
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 truncate">
                {shareUrl}
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
