// server/services/ttsService.js
// Chỉ sử dụng Google Translate TTS (miễn phí, không cần credentials)
// Hỗ trợ chọn giọng nam/nữ, âm lượng, tốc độ
require('dotenv').config();
const axios = require('axios');

// Hàm chia text thành các đoạn ngắn (cho Google Translate TTS)
function splitTextIntoChunks(text, maxLength = 180) {
    const chunks = [];
    const sentences = text.split(/([.!?。！？\n])/);
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (currentChunk.length + sentence.length <= maxLength) {
            currentChunk += sentence;
        } else {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
}

// Hàm chuyển text sang audio bằng Google Translate TTS
// options: { language: 'vi', gender: 'male' | 'female', rate: 1.0, volume: 1.0 }
async function synthesizeWithGoogleTranslate(text, options = {}) {
    try {
        const language = options.language || 'vi';
        const gender = options.gender || 'female'; // 'male' hoặc 'female'
        const maxLength = 180;
        let audioBuffers = [];

        // Google Translate TTS có thể chọn giọng nam/nữ bằng cách thay đổi voice index
        // Voice index: 0 = nữ, 1 = nam (cho một số ngôn ngữ)
        const voiceIndex = gender === 'male' ? 1 : 0;

        if (text.length <= maxLength) {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&idx=${voiceIndex}&q=${encodeURIComponent(text)}`;

            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://translate.google.com/',
                    'Origin': 'https://translate.google.com'
                },
                timeout: 15000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            });

            if (response.data && response.data.byteLength > 0) {
                audioBuffers.push(Buffer.from(response.data));
            } else {
                throw new Error('Response rỗng từ Google Translate TTS');
            }
        } else {
            const chunks = splitTextIntoChunks(text, maxLength);
            console.log(`Chia text thành ${chunks.length} đoạn cho Google Translate TTS`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (!chunk || chunk.trim().length === 0) continue;

                const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&idx=${voiceIndex}&q=${encodeURIComponent(chunk)}`;

                try {
                    const response = await axios.get(url, {
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://translate.google.com/',
                            'Origin': 'https://translate.google.com'
                        },
                        timeout: 15000,
                        maxRedirects: 5,
                        validateStatus: function (status) {
                            return status >= 200 && status < 400;
                        }
                    });

                    if (response.data && response.data.byteLength > 0) {
                        audioBuffers.push(Buffer.from(response.data));
                    }

                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } catch (chunkError) {
                    console.error(`Lỗi khi xử lý đoạn ${i + 1}/${chunks.length}:`, chunkError.message);
                    if (chunkError.response && chunkError.response.status === 429) {
                        console.warn('Rate limit, đợi 2 giây...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        i--;
                        continue;
                    }
                }
            }
        }

        if (audioBuffers.length === 0) {
            throw new Error('Không thể tạo audio từ bất kỳ đoạn nào');
        }

        return Buffer.concat(audioBuffers);
    } catch (error) {
        console.error('Lỗi Google Translate TTS:', error);
        if (error.response) {
            const status = error.response.status;
            if (status === 429) {
                throw new Error('Google Translate TTS: Quá nhiều request. Vui lòng thử lại sau.');
            } else if (status === 403) {
                throw new Error('Google Translate TTS: Truy cập bị từ chối. Có thể bị chặn tạm thời.');
            } else {
                throw new Error(`Google Translate TTS lỗi: ${status} - ${error.response.statusText}`);
            }
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Google Translate TTS: Timeout. Vui lòng thử lại.');
        }
        throw new Error('Không thể tạo audio từ Google Translate TTS: ' + error.message);
    }
}

module.exports = {
    synthesizeWithGoogleTranslate
};