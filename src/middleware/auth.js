const prisma = require('../db');

const verifyTableSession = async (req, res, next) => {
  // Müşteri token'ı genelde header'da "Authorization" olarak gönderilir
  const token = req.headers['authorization'];
  const { tableNumber } = req.body;

  if (!token || !tableNumber) {
    return res.status(403).json({ success: false, message: "Yetkisiz erişim: Token veya Masa No eksik." });
  }

  try {
    const table = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) }
    });

    // Masadaki token ile müşterinin gönderdiği token uyuşuyor mu?
    if (!table || table.sessionToken !== token) {
      return res.status(401).json({ success: false, message: "Oturum geçersiz. Lütfen tekrar giriş yapın." });
    }

    // Her şey yolundaysa bir sonraki aşamaya (Sipariş oluşturmaya) geç
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Güvenlik kontrolü sırasında hata oluştu." });
  }
};

module.exports = { verifyTableSession };