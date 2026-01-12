import Live2DWidget from "../components/Live2DWidget";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LectureHistory from "../components/LectureHistory";
import { useState, useRef, useEffect } from "react";
import api from "../api";

function ChatPanel({
  messages,
  onSendMessage,
  chatInput,
  setChatInput,
  isPaused,
  isProcessing,
  lecture,
  isPlaying,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm format markdown text thành HTML
  const formatText = (text) => {
    if (!text) return "";
    // Chuyển **text** thành <strong>text</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Chuyển *text* thành <em>text</em> (italic)
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Chuyển xuống dòng thành <br>
    formatted = formatted.replace(/\n/g, "<br>");
    return formatted;
  };

  return (
    <div className="flex flex-col gap-4 p-6 border border-gray-200 rounded-xl bg-white shadow-lg">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 512"
            className="h-6 w-6 text-white"
            fill="currentColor"
          >
            <path d="M352 0c0-17.7-14.3-32-32-32S288-17.7 288 0l0 64-96 0c-53 0-96 43-96 96l0 224c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-224c0-53-43-96-96-96l-96 0 0-64zM160 368c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zM224 176a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm144 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM64 224c0-17.7-14.3-32-32-32S0 206.3 0 224l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96zm544-32c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-800">Chat với Mentor</h2>
          <p className="text-xs text-gray-500">Hỏi đáp trực tiếp với AI</p>
        </div>
      </div>

      <div
        className="flex-1 border border-gray-200 rounded-lg p-4 overflow-y-auto bg-linear-to-b from-gray-50 to-white"
        style={{ minHeight: "300px", maxHeight: "400px" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-500 text-sm">Chưa có tin nhắn nào...</p>
            <p className="text-gray-400 text-xs mt-1">
              Tạm dừng bài giảng để bắt đầu chat
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  msg.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.type === "user"
                      ? "bg-blue-500"
                      : "bg-linear-to-br from-red-500 to-red-600"
                  }`}
                >
                  <span className="text-white text-xs">
                    {msg.type === "user" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 480 512"
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                      >
                        <path d="M224 248a120 120 0 1 1 0-240 120 120 0 1 1 0 240zm-30.5 56l61 0c9.7 0 17.5 7.8 17.5 17.5 0 4.2-1.5 8.2-4.2 11.4l-27.4 32 31 115.1 .6 0 34.6-138.5c2.2-8.7 11.1-14 19.5-10.8 61.9 23.6 105.9 83.6 105.9 153.8 0 15.1-12.3 27.4-27.4 27.4L43.4 512c-15.1 0-27.4-12.3-27.4-27.4 0-70.2 44-130.2 105.9-153.8 8.4-3.2 17.3 2.1 19.5 10.8l34.6 138.5 .6 0 31-115.1-27.4-32c-2.7-3.2-4.2-7.2-4.2-11.4 0-9.7 7.8-17.5 17.5-17.5z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 512"
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                      >
                        <path d="M352 0c0-17.7-14.3-32-32-32S288-17.7 288 0l0 64-96 0c-53 0-96 43-96 96l0 224c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-224c0-53-43-96-96-96l-96 0 0-64zM160 368c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zM224 176a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm144 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM64 224c0-17.7-14.3-32-32-32S0 206.3 0 224l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96zm544-32c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32z" />
                      </svg>
                    )}
                  </span>
                </div>
                <div
                  className={`flex flex-col max-w-[75%] ${
                    msg.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      msg.type === "user"
                        ? "bg-blue-500 text-white rounded-tr-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    {msg.type === "mentor" ? (
                      <p
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatText(msg.text),
                        }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}
                  </div>
                  {msg.type === "mentor" && (
                    <span className="text-xs text-gray-400 mt-1 px-2">
                      Mentor AI
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 512"
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                  >
                    <path d="M352 0c0-17.7-14.3-32-32-32S288-17.7 288 0l0 64-96 0c-53 0-96 43-96 96l0 224c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-224c0-53-43-96-96-96l-96 0 0-64zM160 368c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zm120 0c0-13.3 10.7-24 24-24l32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0c-13.3 0-24-10.7-24-24zM224 176a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm144 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM64 224c0-17.7-14.3-32-32-32S0 206.3 0 224l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96zm544-32c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32z" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input - hiển thị khi có bài giảng */}
      {lecture && (
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isProcessing && chatInput.trim()) {
                  onSendMessage();
                }
              }}
              placeholder={
                isPlaying && !isPaused
                  ? "Tạm dừng để chat với mentor..."
                  : "Nhập câu hỏi của bạn..."
              }
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isProcessing || (isPlaying && !isPaused)}
            />
            <button
              onClick={onSendMessage}
              disabled={isProcessing || !chatInput.trim() || (isPlaying && !isPaused)}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isProcessing ? "..." : "Gửi"}
            </button>
          </div>
          
          {/* Thông báo khi đang phát */}
          {isPlaying && !isPaused && (
            <div className="text-sm text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 animate-pulse">
              ⏸️ <span className="font-medium text-red-600">Tạm dừng</span> bài giảng để chat với mentor
            </div>
          )}
          
          {/* Thông báo khi chưa có bài giảng */}
          {!lecture && (
            <div className="text-sm text-center p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              📤 <span className="font-medium">Upload tài liệu</span> để bắt đầu chat với mentor
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MentorPage() {
  const [lecture, setLecture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  // TTS states - Web Speech API
  const [ttsConfig, setTtsConfig] = useState({
    engine: "web-speech", // 'web-speech', 'google-translate', 'google-cloud'
    gender: "female", // 'female' hoặc 'male'
    voiceName: "", // Tên giọng cụ thể (auto nếu rỗng)
    rate: 1.0,
    pitch: 1.0, // Web Speech API: 0-2
    volume: 1.0,
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [webSpeechVoices, setWebSpeechVoices] = useState([]);
  const [googleCloudAvailable, setGoogleCloudAvailable] = useState(false);
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(false);

  const lectureContextRef = useRef("");
  const live2dRef = useRef(null);
  const audioRef = useRef(null);

  // Load Web Speech API voices
  useEffect(() => {
    // Check Web Speech API support
    if ('speechSynthesis' in window) {
      setWebSpeechAvailable(true);
      console.log("✅ Web Speech API available");

      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter Vietnamese voices
        const viVoices = voices.filter(voice => 
          voice.lang.startsWith('vi') || 
          voice.lang.includes('VN') ||
          voice.name.toLowerCase().includes('vietnam')
        );
        setWebSpeechVoices(viVoices.length > 0 ? viVoices : voices);
        console.log(`📋 Loaded ${viVoices.length} Vietnamese voices`);
      };

      // Load immediately
      loadVoices();

      // Also load when voices change (some browsers load async)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn("⚠️ Web Speech API not supported");
      setWebSpeechAvailable(false);
    }
  }, []);

  // Load voice config và check Google Cloud TTS status
  useEffect(() => {
    const loadVoiceConfig = async () => {
      try {
        // Check Google Cloud TTS status
        const statusResponse = await api.get("/mentor/tts/status");
        setGoogleCloudAvailable(statusResponse.data.googleCloudTTS);
        console.log("🎤 TTS Status:", statusResponse.data);

        // Load voice config
        const response = await api.get("/mentor/voice-config");
        const config = response.data;
        
        // Xác định engine mặc định
        let defaultEngine = config.engine || (webSpeechAvailable ? "web-speech" : "google-translate");
        
        // Nếu engine được lưu là web-speech nhưng không available, fallback
        if (defaultEngine === 'web-speech' && !webSpeechAvailable) {
          defaultEngine = 'google-translate';
        }
        
        setTtsConfig({
          engine: defaultEngine,
          gender: config.gender || "female",
          voiceName: config.voiceName || "",
          rate: config.rate || 1.0,
          pitch: config.pitch || 1.0,
          volume: config.volume || 1.0,
        });

        // Load available voices nếu Google Cloud TTS có sẵn
        if (statusResponse.data.googleCloudTTS) {
          const voicesResponse = await api.get("/mentor/tts/voices?language=vi-VN");
          setAvailableVoices(voicesResponse.data.voices || []);
          console.log(`📋 Loaded ${voicesResponse.data.voices?.length || 0} Google Cloud voices`);
        }
      } catch (error) {
        console.error("Lỗi khi load voice config:", error);
        setGoogleCloudAvailable(false);
      }
    };

    loadVoiceConfig();
  }, [webSpeechAvailable]);

  // Hàm lưu voice config
  const saveVoiceConfig = async () => {
    try {
      await api.put("/mentor/voice-config", {
        engine: ttsConfig.engine,
        gender: ttsConfig.gender,
        language: "vi",
        voiceName: ttsConfig.voiceName,
        rate: ttsConfig.rate,
        pitch: ttsConfig.pitch,
        volume: ttsConfig.volume,
      });

      // Thông báo thành công với thông tin cấu hình
      const engineName = ttsConfig.engine === 'web-speech' ? 'Web Speech API' :
                        ttsConfig.engine === 'google-cloud' ? 'Google Cloud TTS' :
                        'Google Translate TTS';
      
      alert(`✅ Đã lưu cấu hình giọng đọc!\n\n🎤 Engine: ${engineName}\n👤 Giọng: ${ttsConfig.gender === 'female' ? 'Nữ' : 'Nam'}\n⚡ Tốc độ: ${ttsConfig.rate}x`);
      setShowVoiceSettings(false);
    } catch (error) {
      console.error("Lỗi khi lưu voice config:", error);
      alert(
        "❌ Lỗi khi lưu cấu hình:\n" +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Web Speech API (Browser TTS)
  const speakWithWebSpeech = (text, onEnd) => {
    if (!webSpeechAvailable) {
      console.error("Web Speech API not available");
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Start animation
    if (live2dRef.current) {
      live2dRef.current.startSpeaking();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure
    utterance.lang = 'vi-VN';
    utterance.rate = ttsConfig.rate; // 0.1 - 10
    utterance.pitch = ttsConfig.pitch; // 0 - 2
    utterance.volume = ttsConfig.volume; // 0 - 1

    // Select voice
    if (ttsConfig.voiceName && webSpeechVoices.length > 0) {
      const selectedVoice = webSpeechVoices.find(v => v.name === ttsConfig.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Auto-select Vietnamese voice
      const viVoice = webSpeechVoices.find(v => v.lang.startsWith('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }
    }

    // Events
    utterance.onstart = () => {
      console.log("🎤 Web Speech started");
    };

    utterance.onend = () => {
      console.log("✅ Web Speech ended");
      if (live2dRef.current) {
        live2dRef.current.stopSpeaking();
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (error) => {
      console.error("❌ Web Speech error:", error);
      if (live2dRef.current) {
        live2dRef.current.stopSpeaking();
      }
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  };

  // TTS với Google Cloud/Translate (Server-side)
  const speakWithServerTTS = async (text, onEnd) => {
    if (!text) return;

    // Dừng bất kỳ audio nào đang phát
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Bắt đầu animation nhép miệng
    if (live2dRef.current) {
      live2dRef.current.startSpeaking();
    }

    try {
      let response;
      let contentType;
      let usedEngine = '';

      // Thử Google Cloud TTS trước nếu có sẵn
      if (googleCloudAvailable && ttsConfig.engine === 'google-cloud') {
        try {
          console.log("🎤 Using Google Cloud TTS...");
          response = await api.post(
            "/mentor/tts/google-synthesize",
            {
              text,
              options: {
                language: "vi-VN",
                gender: ttsConfig.gender === "female" ? "FEMALE" : "MALE",
                voiceName: ttsConfig.voiceName || null,
                rate: ttsConfig.rate,
                pitch: ttsConfig.pitch,
                volume: 0.0, // Volume trong dB, sẽ điều chỉnh sau
              },
            },
            {
              responseType: "arraybuffer",
              headers: {
                Accept: "audio/mpeg",
              },
              timeout: 30000, // 30 seconds timeout
            }
          );
          contentType = "audio/mpeg";
          usedEngine = 'Google Cloud TTS';
          console.log("✅ Google Cloud TTS success");
        } catch (error) {
          console.warn("⚠️ Google Cloud TTS failed, falling back to Google Translate TTS");
          console.error(error);
          // Fallback to Google Translate TTS
          response = await api.post(
            "/mentor/tts/synthesize",
            {
              text,
              options: {
                language: "vi",
                gender: ttsConfig.gender,
                rate: ttsConfig.rate,
                volume: ttsConfig.volume,
              },
            },
            {
              responseType: "arraybuffer",
              headers: {
                Accept: "audio/webm, audio/*",
              },
              timeout: 30000,
            }
          );
          contentType = response.headers["content-type"] || "audio/webm";
          usedEngine = 'Google Translate TTS (Fallback)';
        }
      } else {
        // Sử dụng Google Translate TTS
        console.log("🎤 Using Google Translate TTS...");
        response = await api.post(
          "/mentor/tts/synthesize",
          {
            text,
            options: {
              language: "vi",
              gender: ttsConfig.gender,
              rate: ttsConfig.rate,
              volume: ttsConfig.volume,
            },
          },
          {
            responseType: "arraybuffer",
            headers: {
              Accept: "audio/webm, audio/*",
            },
            timeout: 30000,
          }
        );
        contentType = response.headers["content-type"] || "audio/webm";
        usedEngine = 'Google Translate TTS';
      }

      // Kiểm tra response
      if (!response.data || response.data.byteLength === 0) {
        throw new Error("Audio response rỗng");
      }

      // Log thông tin
      console.log(`✅ ${usedEngine} - Content-Type: ${contentType}, Size: ${response.data.byteLength} bytes`);

      // Convert arraybuffer thành blob
      const blob = new Blob([response.data], { type: contentType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.volume = ttsConfig.volume;
      audio.playbackRate = ttsConfig.rate;

      // Thêm error handler trước khi play
      audio.onerror = (error) => {
        console.error("❌ Lỗi phát audio:", error);
        console.error("Audio error details:", {
          error: audio.error,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
        URL.revokeObjectURL(audioUrl);
        if (live2dRef.current) {
          live2dRef.current.stopSpeaking();
        }
        audioRef.current = null;
        alert(`❌ Lỗi phát audio (${usedEngine}).\n\nVui lòng thử:\n1. Chuyển sang Web Speech API\n2. Kiểm tra kết nối mạng\n3. Thử lại sau`);
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (live2dRef.current) {
          live2dRef.current.stopSpeaking();
        }
        if (onEnd) onEnd();
        audioRef.current = null;
      };

      audioRef.current = audio;

      // Thử play với error handling
      try {
        await audio.play();
        console.log(`🎵 Playing audio with ${usedEngine}`);
      } catch (playError) {
        console.error("❌ Lỗi khi play audio:", playError);
        URL.revokeObjectURL(audioUrl);
        if (live2dRef.current) {
          live2dRef.current.stopSpeaking();
        }
        audioRef.current = null;
        throw new Error(`Không thể phát audio: ${playError.message}`);
      }
    } catch (error) {
      console.error("❌ Lỗi khi phát giọng đọc:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi không xác định";
      
      // Thông báo lỗi chi tiết hơn
      if (error.code === 'ECONNABORTED') {
        alert("⏱️ Timeout: Server mất quá nhiều thời gian phản hồi.\n\nVui lòng thử:\n1. Chuyển sang Web Speech API\n2. Kiểm tra kết nối mạng");
      } else if (error.response?.status === 503) {
        alert("⚠️ Service không khả dụng.\n\nVui lòng chuyển sang Web Speech API hoặc thử lại sau.");
      } else {
        alert(`❌ Lỗi khi phát giọng đọc:\n${errorMessage}\n\n💡 Gợi ý: Thử chuyển sang Web Speech API trong cài đặt giọng đọc.`);
      }
      
      if (live2dRef.current) {
        live2dRef.current.stopSpeaking();
      }
    }
  };

  // Main TTS function - chọn engine
  const speakText = (text, onEnd) => {
    if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
      console.log("🎤 Using Web Speech API");
      speakWithWebSpeech(text, onEnd);
    } else {
      console.log("🎤 Using Server TTS");
      speakWithServerTTS(text, onEnd);
    }
  };

  // Hàm đọc bài giảng section hiện tại
  const speakCurrentSection = () => {
    if (!lecture) return;

    // Kiểm tra nếu đang phát audio
    if (audioRef.current && !audioRef.current.paused) {
      return;
    }

    const section = lecture.sections[currentSectionIndex];
    if (!section) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    const fullText = `${section.title}. ${section.content}`;
    speakText(fullText, () => {
      // Sau khi đọc xong section, chuyển sang section tiếp theo
      if (currentSectionIndex < lecture.sections.length - 1) {
        setCurrentSectionIndex((prev) => prev + 1);
        setTimeout(() => speakCurrentSection(), 500);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

  // Hàm xử lý upload file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file được hỗ trợ
    const allowedExtensions = ['.docx', '.pdf', '.txt', '.pptx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert(`Vui lòng chọn file có định dạng: ${allowedExtensions.join(', ')}`);
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/mentor/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setLecture(response.data);
      lectureContextRef.current = JSON.stringify(response.data);
      setCurrentSectionIndex(0);
      setMessages([]);
      
      // Thông báo thành công với số phần đã tạo
      const sectionCount = response.data.sections?.length || 0;
      alert(`✅ Tải bài giảng thành công!\n📚 Đã tạo ${sectionCount} phần nội dung.\n🎤 Nhấn nút phát để bắt đầu.`);
    } catch (error) {
      console.error("Lỗi upload:", error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Lỗi khi tải bài giảng:\n${errorMsg}\n\nVui lòng thử lại hoặc chọn file khác.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm load bài giảng từ lịch sử
  const handleLoadLecture = async (lectureId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/mentor/lectures/${lectureId}`);
      const lectureData = response.data;
      
      setLecture(lectureData);
      lectureContextRef.current = JSON.stringify(lectureData);
      setCurrentSectionIndex(0);
      setMessages([]);
      
      // Dừng audio nếu đang phát
      if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (live2dRef.current) {
        live2dRef.current.stopSpeaking();
      }
      setIsPlaying(false);
      setIsPaused(false);
      
      console.log(`✅ Loaded lecture: ${lectureData.title}`);
    } catch (error) {
      console.error("Lỗi khi load bài giảng:", error);
      alert(`❌ Lỗi khi tải bài giảng:\n${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm phát bài giảng với Gemini TTS
  const startLecture = () => {
    if (!lecture) return;

    // Nếu đang tạm dừng, tiếp tục
    if (isPaused) {
      resumeLecture();
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    speakCurrentSection();
  };

  // Hàm dừng bài giảng
  const pauseLecture = () => {
    // Web Speech API
    if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
    // Server TTS
    else if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
    // Dừng animation nhép miệng khi tạm dừng
    if (live2dRef.current) {
      live2dRef.current.stopSpeaking();
    }
  };

  // Hàm tiếp tục bài giảng
  const resumeLecture = () => {
    // Web Speech API
    if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
      if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
        if (live2dRef.current) {
          live2dRef.current.startSpeaking();
        }
      } else {
        // Bắt đầu lại từ section hiện tại
        setIsPlaying(true);
        setIsPaused(false);
        speakCurrentSection();
      }
    }
    // Server TTS
    else if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      if (live2dRef.current) {
        live2dRef.current.startSpeaking();
      }
    } else if (!audioRef.current) {
      // Nếu không đang phát, bắt đầu lại từ section hiện tại
      setIsPlaying(true);
      setIsPaused(false);
      speakCurrentSection();
    }
  };

  // Hàm dừng hoàn toàn
  const stopLecture = () => {
    // Web Speech API
    if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
      window.speechSynthesis.cancel();
    }
    // Server TTS
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Dừng animation nhép miệng
    if (live2dRef.current) {
      live2dRef.current.stopSpeaking();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSectionIndex(0);
  };

  // Hàm gửi câu hỏi
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isProcessingChat) return;

    const question = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { type: "user", text: question }]);
    setIsProcessingChat(true);

    try {
      const response = await api.post("/mentor/chat", {
        question,
        lectureContext: lectureContextRef.current,
      });

      const mentorResponse = response.data.response;

      // Thêm câu trả lời vào messages
      setMessages((prev) => [
        ...prev,
        { type: "mentor", text: mentorResponse },
      ]);

      // Đọc câu trả lời bằng TTS
      // Dừng bài giảng nếu đang phát
      if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Cập nhật state để đồng bộ
      setIsPlaying(false);
      setIsPaused(false);

      // Đọc câu trả lời của mentor
      speakText(mentorResponse);
    } catch (error) {
      console.error("Lỗi chat:", error);
      const errorMessage = error.response?.data?.message 
        ? `Xin lỗi, ${error.response.data.message}` 
        : "Xin lỗi, tôi gặp lỗi khi trả lời. Vui lòng thử lại sau.";
      
      setMessages((prev) => [
        ...prev,
        {
          type: "mentor",
          text: errorMessage,
        },
      ]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f0] relative overflow-x-hidden flex flex-col">
      <Header />

      {/* MAIN WRAPPER */}
      <main className="grow px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-red-700 mb-2">
              Miku Mentor - Trợ thủ thông minh của mọi sinh viên
            </h1>
            <p className="text-lg text-gray-600">
              Tải tài liệu lên, Miku sẽ giảng bài cho bạn nghe và trả lời câu
              hỏi
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Live2D Area – chiếm 2 cột */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Live2D Model Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div
                  className="w-full h-[400px] lg:h-[500px] relative flex items-end justify-center bg-linear-to-b from-red-50 to-red-100"
                  style={{
                    backgroundImage: "url('/bgWaifu.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Model luôn đứng chính giữa đáy */}
                  <div className="flex justify-center items-center mb-[-5px] scale-[90%] lg:scale-100">
                    <Live2DWidget ref={live2dRef} />
                  </div>
                </div>
              </div>

              {/* Lecture History */}
              <LectureHistory 
                onSelectLecture={handleLoadLecture}
                currentLectureId={lecture?._id}
              />

              {/* File Upload Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                      className="h-6 w-6 text-white"
                      fill="currentColor"
                    >
                      <path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32S0 334.3 0 352l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      Upload tài liệu
                    </h3>
                    <p className="text-xs text-gray-500">
                      Hỗ trợ: .docx, .pdf, .txt, .pptx
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt,.pptx"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition cursor-pointer hover:border-red-300"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">
                          Đang xử lý file...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Settings Card - Hiển thị sau khi upload thành công */}
              {lecture && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          fill="currentColor"
                          className="h-6 w-6 text-white"
                        >
                          <path d="M320 64C267 64 224 107 224 160L224 288C224 341 267 384 320 384C373 384 416 341 416 288L416 160C416 107 373 64 320 64zM176 248C176 234.7 165.3 224 152 224C138.7 224 128 234.7 128 248L128 288C128 385.9 201.3 466.7 296 478.5L296 528L248 528C234.7 528 224 538.7 224 552C224 565.3 234.7 576 248 576L392 576C405.3 576 416 565.3 416 552C416 538.7 405.3 528 392 528L344 528L344 478.5C438.7 466.7 512 385.9 512 288L512 248C512 234.7 501.3 224 488 224C474.7 224 464 234.7 464 248L464 288C464 367.5 399.5 432 320 432C240.5 432 176 367.5 176 288L176 248z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          Cấu hình giọng đọc
                        </h3>
                        <p className="text-xs text-gray-500">
                          Chọn giọng nam/nữ và điều chỉnh thông số
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                      className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    >
                      {showVoiceSettings ? "Ẩn" : "Hiện"}
                    </button>
                  </div>

                  {showVoiceSettings && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* TTS Engine Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn công cụ đọc
                        </label>
                        <select
                          value={ttsConfig.engine}
                          onChange={(e) => {
                            const newEngine = e.target.value;
                            // Reset pitch về giá trị mặc định khi chuyển engine
                            const defaultPitch = newEngine === 'web-speech' ? 1.0 : 0.0;
                            setTtsConfig({
                              ...ttsConfig,
                              engine: newEngine,
                              pitch: defaultPitch,
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          {webSpeechAvailable && (
                            <option value="web-speech">🎤 Web Speech API (Browser) - Khuyến nghị</option>
                          )}
                          <option value="google-translate">🔊 Google Translate TTS (Server)</option>
                          {googleCloudAvailable && (
                            <option value="google-cloud">🌟 Google Cloud TTS (WaveNet)</option>
                          )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {ttsConfig.engine === 'web-speech' && '✅ Giọng tự nhiên, chạy trên browser'}
                          {ttsConfig.engine === 'google-translate' && '⚡ Miễn phí, chạy trên server'}
                          {ttsConfig.engine === 'google-cloud' && '⭐ Chất lượng cao nhất (WaveNet)'}
                        </p>
                      </div>

                      {/* TTS Engine Status */}
                      <div className={`border rounded-lg p-3 ${
                        ttsConfig.engine === 'web-speech' ? 'bg-green-50 border-green-200' :
                        ttsConfig.engine === 'google-cloud' ? 'bg-blue-50 border-blue-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            ttsConfig.engine === 'web-speech' ? 'bg-green-500' :
                            ttsConfig.engine === 'google-cloud' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}></span>
                          <span className="text-sm font-medium text-gray-700">
                            {ttsConfig.engine === 'web-speech' && '🎤 Web Speech API'}
                            {ttsConfig.engine === 'google-translate' && '🔊 Google Translate TTS'}
                            {ttsConfig.engine === 'google-cloud' && '🌟 Google Cloud TTS'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {ttsConfig.engine === 'web-speech' && 'Giọng đọc tự nhiên, không cần server'}
                          {ttsConfig.engine === 'google-translate' && 'Giọng đọc cơ bản, miễn phí'}
                          {ttsConfig.engine === 'google-cloud' && 'Giọng đọc WaveNet, chất lượng cao'}
                        </p>
                      </div>

                      {/* Chọn giọng Web Speech API */}
                      {ttsConfig.engine === 'web-speech' && webSpeechVoices.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn giọng đọc
                          </label>
                          <select
                            value={ttsConfig.voiceName}
                            onChange={(e) =>
                              setTtsConfig({
                                ...ttsConfig,
                                voiceName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                          >
                            <option value="">Tự động (Khuyến nghị)</option>
                            {webSpeechVoices.map((voice) => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {webSpeechVoices.length} giọng có sẵn
                          </p>
                        </div>
                      )}

                      {/* Chọn giọng cụ thể (chỉ hiện khi có Google Cloud TTS) */}
                      {ttsConfig.engine === 'google-cloud' && googleCloudAvailable && availableVoices.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn giọng cụ thể
                          </label>
                          <select
                            value={ttsConfig.voiceName}
                            onChange={(e) =>
                              setTtsConfig({
                                ...ttsConfig,
                                voiceName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                          >
                            <option value="">Tự động (Khuyến nghị)</option>
                            {availableVoices.map((voice) => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name}
                                {voice.name.includes('Wavenet') && ' ⭐ WaveNet'}
                                {voice.name.includes('Neural') && ' 🌟 Neural2'}
                                {' - ' + voice.ssmlGender}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            WaveNet/Neural2 = Giọng tự nhiên nhất
                          </p>
                        </div>
                      )}

                      {/* Chọn giọng nam/nữ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giọng đọc
                        </label>
                        <select
                          value={ttsConfig.gender}
                          onChange={(e) =>
                            setTtsConfig({
                              ...ttsConfig,
                              gender: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          <option value="female">Nữ</option>
                          <option value="male">Nam</option>
                        </select>
                      </div>

                      {/* Cấu hình Tốc độ, Cao độ và Âm lượng */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tốc độ: {ttsConfig.rate.toFixed(1)}x
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={ttsConfig.rate}
                            onChange={(e) =>
                              setTtsConfig({
                                ...ttsConfig,
                                rate: parseFloat(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Âm lượng: {ttsConfig.volume.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={ttsConfig.volume}
                            onChange={(e) =>
                              setTtsConfig({
                                ...ttsConfig,
                                volume: parseFloat(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Pitch control */}
                      {(ttsConfig.engine === 'web-speech' || ttsConfig.engine === 'google-cloud') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cao độ (Pitch): {ttsConfig.pitch.toFixed(1)}
                            {ttsConfig.engine === 'web-speech' && ' (0-2)'}
                            {ttsConfig.engine === 'google-cloud' && ' (-20 to +20)'}
                          </label>
                          <input
                            type="range"
                            min={ttsConfig.engine === 'web-speech' ? "0" : "-20"}
                            max={ttsConfig.engine === 'web-speech' ? "2" : "20"}
                            step={ttsConfig.engine === 'web-speech' ? "0.1" : "1"}
                            value={ttsConfig.pitch}
                            onChange={(e) =>
                              setTtsConfig({
                                ...ttsConfig,
                                pitch: parseFloat(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {ttsConfig.engine === 'web-speech' ? 'Âm cao hơn (>1) hoặc thấp hơn (<1)' : 'Âm cao hơn (+) hoặc thấp hơn (-)'}
                          </p>
                        </div>
                      )}

                      {/* Nút lưu */}
                      <button
                        onClick={saveVoiceConfig}
                        className="w-full px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition"
                      >
                        Lưu cấu hình
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lecture Display Card */}
              {lecture && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                      >
                        <path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        Bài giảng
                      </h3>
                      <p className="text-xs text-gray-500">
                        Nội dung đã được xử lý
                      </p>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-linear-to-b from-gray-50 to-white max-h-[300px] overflow-y-auto">
                    <h4 className="font-bold text-xl text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      {lecture.title}
                    </h4>
                    <div className="space-y-4">
                      {lecture.sections.map((section, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            // Jump to section khi click
                            // Dừng Web Speech API
                            if (ttsConfig.engine === 'web-speech' && webSpeechAvailable) {
                              window.speechSynthesis.cancel();
                            }
                            // Dừng Server TTS
                            if (audioRef.current) {
                              audioRef.current.pause();
                              audioRef.current = null;
                            }
                            if (live2dRef.current) {
                              live2dRef.current.stopSpeaking();
                            }
                            setCurrentSectionIndex(idx);
                            setIsPaused(true);
                            setIsPlaying(false);
                          }}
                          className={`p-4 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                            idx === currentSectionIndex
                              ? "bg-yellow-50 border-2 border-yellow-400 shadow-md"
                              : "bg-white border border-gray-200 hover:border-yellow-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-base text-gray-800 mb-2">
                              {idx + 1}. {section.title}
                            </h5>
                            {idx === currentSectionIndex && (
                              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-medium">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          {idx === currentSectionIndex && (
                            <p className="text-sm text-gray-700 leading-relaxed mt-2">
                              {section.content}
                            </p>
                          )}
                          {idx !== currentSectionIndex && (
                            <p className="text-xs text-gray-500 mt-1">
                              Click để nhảy đến phần này
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              {lecture && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {!isPlaying && !isPaused && (
                      <>
                        <button
                          onClick={startLecture}
                          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span>Bắt đầu từ đầu</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsPlaying(true);
                            setIsPaused(false);
                            speakCurrentSection();
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span>Đọc phần đã chọn</span>
                        </button>
                      </>
                    )}
                    {isPlaying && !isPaused && (
                      <button
                        onClick={pauseLecture}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                        <span>Tạm dừng</span>
                      </button>
                    )}
                    {isPaused && (
                      <button
                        onClick={resumeLecture}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Tiếp tục</span>
                      </button>
                    )}
                    {(isPlaying || isPaused) && (
                      <button
                        onClick={stopLecture}
                        className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z"/>
                        </svg>
                        <span>Dừng</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-3">
                    💡 Tip: Click vào bất kỳ phần nào trong bài giảng để nhảy đến phần đó
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: Chat panel – chiếm 1 cột */}
            <div className="lg:col-span-1 w-full">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isPaused={isPaused}
                isProcessing={isProcessingChat}
                lecture={lecture}
                isPlaying={isPlaying}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
