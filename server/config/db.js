const mongoose = require('mongoose');
const IndexManager = require('../utils/indexManager');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose đã tự động xử lý các tùy chọn này trong phiên bản mới
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize enhanced search indexes after connection
    try {
      await IndexManager.initialize();
      console.log('✅ Enhanced search indexes initialized');
    } catch (indexError) {
      console.warn('⚠️ Could not initialize search indexes:', indexError.message);
      // Don't fail the connection if indexes can't be created
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Thoát ứng dụng nếu kết nối thất bại
  }
};

module.exports = connectDB;