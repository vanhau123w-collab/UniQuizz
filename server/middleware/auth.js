const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Lấy token từ header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Kiểm tra token có tồn tại không
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};
