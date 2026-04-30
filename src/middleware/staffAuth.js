const jwt = require('jsonwebtoken');

const protectStaff = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.staff = decoded; // İstek içine personelin bilgilerini göm
    next();
  } catch (error) {
    return res.status(401).json({ message: "Oturum süreniz dolmuş." });
  }
};

module.exports = { protectStaff };