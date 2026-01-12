// Migration script: Thêm field isPublic cho các quiz/flashcard cũ
// Chạy script này 1 lần sau khi deploy code mới

const mongoose = require('mongoose');
require('dotenv').config();

const Deck = require('../models/Deck');
const FlashcardSet = require('../models/FlashcardSet');
const Topic = require('../models/Topic');

async function migrate() {
  try {
    console.log('🔄 Bắt đầu migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/uniquizz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Đã kết nối MongoDB');

    // 1. Update Decks (Quiz)
    console.log('\n📝 Đang cập nhật Decks...');
    const deckResult = await Deck.updateMany(
      { isPublic: { $exists: false } }, // Chỉ update những document chưa có field isPublic
      { $set: { isPublic: false } }
    );
    console.log(`✅ Đã cập nhật ${deckResult.modifiedCount} decks`);

    // 2. Update FlashcardSets
    console.log('\n📝 Đang cập nhật FlashcardSets...');
    const flashcardResult = await FlashcardSet.updateMany(
      { isPublic: { $exists: false } },
      { $set: { isPublic: false } }
    );
    console.log(`✅ Đã cập nhật ${flashcardResult.modifiedCount} flashcard sets`);

    // 3. Update Topics (nếu cần)
    console.log('\n📝 Đang cập nhật Topics...');
    const topicResult = await Topic.updateMany(
      { isPublic: { $exists: false }, isSystem: false }, // Chỉ update user topics
      { $set: { isPublic: false } }
    );
    console.log(`✅ Đã cập nhật ${topicResult.modifiedCount} topics`);

    console.log('\n🎉 Migration hoàn tất!');
    console.log('📊 Tổng kết:');
    console.log(`   - Decks: ${deckResult.modifiedCount}`);
    console.log(`   - FlashcardSets: ${flashcardResult.modifiedCount}`);
    console.log(`   - Topics: ${topicResult.modifiedCount}`);

  } catch (error) {
    console.error('❌ Lỗi khi migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Đã đóng kết nối MongoDB');
    process.exit(0);
  }
}

// Chạy migration
migrate();
