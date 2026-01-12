const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

// Khởi tạo client
let client;

try {
  // Kiểm tra credentials file
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                         path.join(__dirname, '../config/google-tts-credentials.json');
  
  if (fs.existsSync(credentialsPath)) {
    client = new textToSpeech.TextToSpeechClient({
      keyFilename: credentialsPath
    });
    console.log('✅ Google Cloud TTS initialized successfully');
  } else {
    console.warn('⚠️ Google Cloud TTS credentials not found. Using fallback TTS.');
    client = null;
  }
} catch (error) {
  console.error('❌ Error initializing Google Cloud TTS:', error.message);
  client = null;
}

/**
 * Chuyển text thành SSML để giọng đọc truyền cảm hơn
 */
function textToSSML(text) {
  // Thêm các break và emphasis để giọng tự nhiên hơn
  let ssml = '<speak>';
  
  // Chia text thành câu
  const sentences = text.split(/([.!?。！？])/);
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i]?.trim();
    const punctuation = sentences[i + 1] || '';
    
    if (!sentence) continue;
    
    // Thêm emphasis cho từ quan trọng (chữ in hoa, từ đặc biệt)
    let processedSentence = sentence;
    
    // Nhấn mạnh từ viết hoa
    processedSentence = processedSentence.replace(/\b([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]{2,})\b/g, 
      '<emphasis level="strong">$1</emphasis>');
    
    // Thêm pause sau dấu câu
    if (punctuation === '.' || punctuation === '。') {
      ssml += `${processedSentence}${punctuation}<break time="500ms"/>`;
    } else if (punctuation === '!' || punctuation === '！') {
      ssml += `<prosody pitch="+2st">${processedSentence}</prosody>${punctuation}<break time="600ms"/>`;
    } else if (punctuation === '?' || punctuation === '？') {
      ssml += `<prosody pitch="+3st">${processedSentence}</prosody>${punctuation}<break time="600ms"/>`;
    } else {
      ssml += `${processedSentence}${punctuation}<break time="300ms"/>`;
    }
  }
  
  ssml += '</speak>';
  return ssml;
}

/**
 * Synthesize speech với Google Cloud TTS (Cải thiện với SSML)
 * @param {string} text - Text cần đọc
 * @param {object} options - Cấu hình giọng đọc
 * @returns {Buffer} - Audio buffer
 */
async function synthesizeSpeech(text, options = {}) {
  if (!client) {
    throw new Error('Google Cloud TTS not initialized. Please check credentials.');
  }

  const {
    language = 'vi-VN',
    gender = 'FEMALE', // MALE, FEMALE, NEUTRAL
    voiceName = null, // Tên giọng cụ thể
    rate = 1.0, // 0.25 - 4.0
    pitch = 0.0, // -20.0 - 20.0
    volume = 0.0, // -96.0 - 16.0 (dB)
    useSSML = true, // Sử dụng SSML để giọng truyền cảm hơn
  } = options;

  // Chọn giọng tự động nếu không chỉ định
  const selectedVoice = voiceName || getRecommendedVoice(language, gender);

  // Sử dụng SSML để giọng đọc tự nhiên và truyền cảm hơn
  const input = useSSML ? { ssml: textToSSML(text) } : { text };

  const request = {
    input,
    voice: {
      languageCode: language,
      name: selectedVoice,
      ssmlGender: gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate,
      pitch: pitch,
      volumeGainDb: volume,
      // Thêm effects để giọng tự nhiên hơn
      effectsProfileId: ['headphone-class-device'],
      // Thêm sample rate cao hơn cho chất lượng tốt hơn
      sampleRateHertz: 24000,
    },
  };

  try {
    console.log(`🎤 Synthesizing speech with voice: ${selectedVoice} (SSML: ${useSSML})`);
    const [response] = await client.synthesizeSpeech(request);
    console.log(`✅ Speech synthesized: ${response.audioContent.length} bytes`);
    return response.audioContent;
  } catch (error) {
    console.error('❌ Google Cloud TTS Error:', error);
    throw error;
  }
}

/**
 * Lấy danh sách giọng đọc có sẵn
 */
async function listVoices(languageCode = 'vi-VN') {
  if (!client) {
    throw new Error('Google Cloud TTS not initialized');
  }

  try {
    const [result] = await client.listVoices({ languageCode });
    console.log(`📋 Found ${result.voices.length} voices for ${languageCode}`);
    return result.voices;
  } catch (error) {
    console.error('❌ Error listing voices:', error);
    throw error;
  }
}

/**
 * Gợi ý giọng đọc tốt nhất (Ưu tiên giọng truyền cảm)
 */
function getRecommendedVoice(language, gender) {
  const recommendations = {
    'vi-VN': {
      // Ưu tiên Neural2 > Wavenet > Standard
      FEMALE: 'vi-VN-Neural2-A', // Giọng nữ Neural2 (truyền cảm nhất)
      MALE: 'vi-VN-Neural2-D',   // Giọng nam Neural2
      NEUTRAL: 'vi-VN-Wavenet-C',
    },
    'en-US': {
      FEMALE: 'en-US-Neural2-F', // Giọng nữ Neural2
      MALE: 'en-US-Neural2-D',   // Giọng nam Neural2
      NEUTRAL: 'en-US-Neural2-A',
    },
  };

  return recommendations[language]?.[gender] || `${language}-Wavenet-A`;
}

/**
 * Kiểm tra xem Google Cloud TTS có sẵn không
 */
function isAvailable() {
  return client !== null;
}

module.exports = {
  synthesizeSpeech,
  listVoices,
  getRecommendedVoice,
  isAvailable,
  textToSSML,
};
