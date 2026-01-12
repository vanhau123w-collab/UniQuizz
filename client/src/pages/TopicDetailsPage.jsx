import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import api from "../api.js";
import { getAuthToken } from "../utils/auth.js";

// ================= API GỐC ===================

const fetchFlashcardSetById = async (setId) => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized: Missing token.");

  const response = await api.get(`/flashcards/${setId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const fetchTopicById = async (topicId) => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized: Missing token.");

  const response = await api.get(`/topics/${topicId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const normalizeData = (data) => {
  if (data.words) {
    return {
      id: data._id,
      title: data.title,
      courseCode: data.courseCode || "",
      type: "topic",
      items: data.words.map((item) => ({
        front: item.word,
        back: item.definition,
        example: item.example,
      })),
    };
  }

  if (data.flashcards) {
    return {
      id: data._id,
      title: data.title,
      courseCode: data.courseCode || "",
      type: "flashcard-set",
      items: data.flashcards.map((item) => ({
        front: item.front,
        back: item.back,
        example: item.hint || "",
      })),
    };
  }
  return null;
};

const fetchCombinedData = async (id) => {
  try {
    const topicData = await fetchTopicById(id);
    return normalizeData(topicData);
  } catch (topicError) {
    const status = topicError.response?.status;
    if (status === 404 || status === 403) {
      try {
        const setData = await fetchFlashcardSetById(id);
        return normalizeData(setData);
      } catch (setError) {
        throw setError;
      }
    }
    throw topicError;
  }
};

const cleanMarkdown = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
};

const speakWord = (text) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Trình duyệt không hỗ trợ tính năng đọc văn bản.");
  }
};

// ======================================================
// ⭐️ NEW FEATURE — ADD WORD + AI SUGGESTION
// ======================================================

// API: Thêm từ vào Topic hiện có (dựa trên endpoint POST /topics/:topicId/words)
const addWordToTopic = async (topicId, wordData) => {
  const token = getAuthToken();
  // Endpoint này được gọi khi nhấn LƯU
  const response = await api.post(`/topics/${topicId}/words`, wordData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// API: Lấy gợi ý từ AI (chỉ gọi AI, không lưu DB)
const getAISuggestion = async (word) => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized: Missing token.");

  const response = await api.post(
    "/topics/generate-single",
    { title: word },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // ⭐️ ĐÃ SỬA LỖI: Backend trả về trực tiếp đối tượng từ vựng { word, definition, example } ⭐️
  const suggestion = response.data;

  // Kiểm tra tính hợp lệ cơ bản
  if (!suggestion || !suggestion.definition || !suggestion.example) {
    throw new Error(
      "Server AI không trả về gợi ý hợp lệ (thiếu nghĩa hoặc ví dụ)."
    );
  }

  return {
    definition: suggestion.definition || "",
    example: suggestion.example || "",
  };
};

// ========================================================
// ⭐️ COMPONENT CHÍNH
// ========================================================

function TopicDetailsPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [itemData, setItemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State cho form thêm từ
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newDef, setNewDef] = useState("");
  const [newEx, setNewEx] = useState("");

  // AI Suggest
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchCombinedData(topicId);
        setItemData(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          navigate("/vocabulary");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [topicId, navigate]);

  // ===============================================
  // Hàm gọi AI (gợi ý)
  // ===============================================
  const handleAISuggest = async () => {
    if (!newWord.trim()) {
      setAiError("Nhập từ cần gợi ý trước.");
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);
    setAiError(null);

    try {
      const suggestion = await getAISuggestion(newWord.trim());
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error("AI suggestion error:", err);
      const serverMsg =
        err.response?.data?.message || err.message || String(err);
      setAiError(serverMsg);
      alert("Lỗi AI: " + serverMsg);
    } finally {
      setAiLoading(false);
    }
  };

  // ===============================================
  // Lưu từ mới
  // ===============================================
  const handleSaveWord = async () => {
    if (!newWord.trim() || !newDef.trim()) {
      alert("Vui lòng nhập ít nhất từ và nghĩa.");
      return;
    }

    try {
      const payload = {
        word: newWord.trim(),
        definition: newDef.trim(),
        example: newEx.trim(),
      };

      // ⭐️ Gọi API ADD WORD (endpoint POST /topics/:topicId/words) ⭐️
      await addWordToTopic(topicId, payload);

      // reload data để cập nhật danh sách
      const refreshed = await fetchCombinedData(topicId);
      setItemData(refreshed);

      // reset form
      setShowAddForm(false);
      setNewWord("");
      setNewDef("");
      setNewEx("");
      setAiSuggestion(null);
      setAiError(null);
    } catch (err) {
      console.error("Lỗi khi lưu từ:", err);
      const msg = err.response?.data?.message || err.message || String(err);
      alert("Lỗi khi lưu: " + msg);
    }
  };

  // ===============================================
  // Giao diện chính
  // ===============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff7f0] flex flex-col">
        <Header />
        <div className="h-20 sm:h-24"></div>
        <div className="grow text-center p-8 text-xl">Đang tải chi tiết...</div>
        <Footer />
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="min-h-screen bg-[#fff7f0] flex flex-col">
        <Header />
        <div className="h-20 sm:h-24"></div>
        <div className="grow text-center p-8 text-xl text-red-600">
          Không tìm thấy nội dung này.
        </div>
        <Footer />
      </div>
    );
  }

  const { title, type, items } = itemData;

  return (
    <div className="min-h-screen bg-[#fff7f0] relative flex flex-col">
      <Header />
      <div className="h-16 sm:h-24"></div>

      <main className="grow max-w-4xl mx-auto px-4 pt-2 relative z-10 w-full">
        <div className="flex items-start justify-between mb-6">
          <button
            onClick={() =>
              navigate(type === "topic" ? "/vocabulary" : "/flashcard-hub")
            }
            className="text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 
                                   px-4 py-2 rounded-full font-semibold transition duration-200 shadow-sm"
          >
            ← Trở về {type === "topic" ? "Chủ đề" : "Hub Flashcard"}
          </button>

          {/* KHỐI NÚT */}
          <div className="flex items-center gap-3">
            {/* Chỉ hiển thị nút Thêm từ mới khi là topic */}
            {type === "topic" && (
              <button
                className={`px-4 py-2 rounded-full font-semibold transition duration-300 shadow-md flex items-center gap-2 
                  ${
                    showAddForm
                      ? "bg-red-100 text-red-700 border-red-400 hover:bg-red-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-red-500 hover:text-red-600"
                  }`}
                onClick={() => setShowAddForm((prev) => !prev)}
                aria-expanded={showAddForm}
              >
                {/* Icon + */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="h-5 w-5 fill-red-600"
                >
                  <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" />
                </svg>
                <span className="text-sm">Thêm từ mới</span>
              </button>
            )}

            {/* Nút Luyện Tập: hiển thị nếu items tồn tại (không phụ thuộc type) */}
            {items?.length > 0 && (
              <button
                onClick={() => navigate(`/flashcard/${itemData.id}`)}
                className="px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-bold hover:bg-green-700 transition duration-300 shadow-lg flex items-center gap-2"
              >
                Luyện Tập
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-extrabold mb-4 text-red-700">
          {title}
          <span className="text-xl text-gray-500 ml-3">
            ({type === "topic" ? "Từ vựng" : "Bộ Flashcard"})
          </span>
        </h1>

        <p className="text-gray-600 mb-6">
          Tổng cộng: {items?.length || 0} mục.
        </p>

        {/* =============================================
            ⭐️ FORM THÊM TỪ (Đã đồng bộ giao diện)
            ============================================= */}
        {showAddForm && (
          <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-red-400 mb-8">
            {" "}
            {/* rounded-xl cho đồng bộ */}
            <h2 className="text-xl font-bold mb-3 text-gray-700">
              Thêm Từ Vựng
            </h2>
            <label className="font-semibold text-gray-600">Từ vựng:</label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4 transition duration-200"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Ví dụ: abandon"
            />
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleAISuggest}
                // Nút Gợi ý: Đã đồng bộ style
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition duration-200 font-semibold text-sm"
                disabled={aiLoading} // Thêm disabled khi đang tải
              >
                {aiLoading ? "Đang gọi AI..." : "Gợi ý bằng AI"}
              </button>

              {aiLoading && (
                <span className="text-red-600 font-medium">
                  AI đang xử lý...
                </span>
              )}
              {aiError && (
                <span className="text-sm text-red-600 font-medium">
                  {aiError}
                </span>
              )}
            </div>
            {/* Hiển thị gợi ý AI */}
            {aiSuggestion && (
              <div className="border p-4 rounded-lg bg-red-50 mb-4 shadow-sm">
                <h3 className="font-bold text-red-700">Gợi ý từ AI:</h3>

                <p className="mt-2 text-gray-700">
                  <b>Nghĩa:</b> {aiSuggestion.definition}
                </p>
                <p className="mt-1 text-gray-500">
                  <b>Ví dụ:</b> {aiSuggestion.example}
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setNewDef(aiSuggestion.definition);
                      setNewEx(aiSuggestion.example);
                    }}
                    // Nút Dùng gợi ý: Đã đồng bộ style
                    className="px-4 py-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition duration-200 font-semibold text-sm"
                  >
                    Dùng gợi ý
                  </button>

                  <button
                    onClick={handleAISuggest}
                    // Nút Tạo lại: Đã đồng bộ style
                    className="px-4 py-2 bg-yellow-600 text-white rounded-xl shadow-md hover:bg-yellow-700 transition duration-200 font-semibold text-sm"
                  >
                    Tạo lại
                  </button>

                  <button
                    onClick={() => {
                      setAiSuggestion(null);
                      setAiError(null);
                    }}
                    // Nút Bỏ qua: Đã đồng bộ style
                    className="px-4 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition duration-200 font-semibold text-sm"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}
            <label className="font-semibold mt-4 block text-gray-600">
              Nghĩa:
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4 transition duration-200"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
            />
            <label className="font-semibold text-gray-600">Ví dụ:</label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4 transition duration-200"
              value={newEx}
              onChange={(e) => setNewEx(e.target.value)}
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSaveWord}
                // Nút Lưu: Đã đồng bộ style
                className="px-6 py-2.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition duration-200 font-bold"
              >
                Lưu
              </button>

              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAiSuggestion(null);
                  setAiError(null);
                }}
                // Nút Đóng: Đã đồng bộ style
                className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded-full shadow-md hover:bg-gray-400 transition duration-200 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        {/* DANH SÁCH TỪ */}
        <div className="space-y-3 pb-20">
          {items?.map((item, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-400 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <p className="text-xl font-bold text-gray-800">
                    {cleanMarkdown(item.front)}
                  </p>

                  {/* LOA ICON (SVG lớn) */}
                  {type === "topic" && (
                    <button
                      onClick={() => speakWord(item.front)}
                      className="text-red-500 hover:text-red-700 transition"
                      aria-label={`Đọc từ ${item.front}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 fill-current"
                        viewBox="0 0 640 640"
                      >
                        <path d="M533.6 96.5C523.3 88.1 508.2 89.7 499.8 100C491.4 110.3 493 125.4 503.3 133.8C557.5 177.8 592 244.8 592 320C592 395.2 557.5 462.2 503.3 506.3C493 514.7 491.5 529.8 499.8 540.1C508.1 550.4 523.3 551.9 533.6 543.6C598.5 490.7 640 410.2 640 320C640 229.8 598.5 149.2 533.6 96.5zM473.1 171C462.8 162.6 447.7 164.2 439.3 174.5C430.9 184.8 432.5 199.9 442.8 208.3C475.3 234.7 496 274.9 496 320C496 365.1 475.3 405.3 442.8 431.8C432.5 440.2 431 455.3 439.3 465.6C447.6 475.9 462.8 477.4 473.1 469.1C516.3 433.9 544 380.2 544 320.1C544 260 516.3 206.3 473.1 171.1zM412.6 245.5C402.3 237.1 387.2 238.7 378.8 249C370.4 259.3 372 274.4 382.3 282.8C393.1 291.6 400 305 400 320C400 335 393.1 348.4 382.3 357.3C372 365.7 370.5 380.8 378.8 391.1C387.1 401.4 402.3 402.9 412.6 394.6C434.1 376.9 448 350.1 448 320C448 289.9 434.1 263.1 412.6 245.5zM80 416L128 416L262.1 535.2C268.5 540.9 276.7 544 285.2 544C304.4 544 320 528.4 320 509.2L320 130.8C320 111.6 304.4 96 285.2 96C276.7 96 268.5 99.1 262.1 104.8L128 224L80 224C53.5 224 32 245.5 32 272L32 368C32 394.5 53.5 416 80 416z" />
                      </svg>
                    </button>
                  )}
                </div>

                <p className="text-md text-gray-600 mt-1">
                  <span className="font-semibold">
                    {type === "topic" ? "Định nghĩa:" : "Mặt sau:"}
                  </span>{" "}
                  {cleanMarkdown(item.back)}
                </p>
                {item.example && (
                  <p className="text-sm italic text-gray-500 mt-1">
                    <span className="font-semibold">
                      {type === "topic" ? "Ví dụ:" : "Hint/Ví dụ:"}
                    </span>{" "}
                    {cleanMarkdown(item.example)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default TopicDetailsPage;
