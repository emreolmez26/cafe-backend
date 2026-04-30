const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. KAYIT: Sisteme yeni personel (Garson/Admin) ekler
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Şifreyi veritabanına kaydetmeden önce "karıştırıyoruz" (Hashing)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'WAITER' // Rol verilmezse varsayılan Garson olsun
      }
    });

    res.status(201).json({ success: true, message: "Personel başarıyla kaydedildi." });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    res.status(500).json({ success: false, message: "Kayıt işlemi başarısız." });
  }
};

// 2. GİRİŞ: Kullanıcıyı doğrular ve ona 8 saatlik dijital anahtar (JWT) verir
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre!" });
    }

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre!" });
    }

    // JWT_SECRET'ı .env dosyasından çekiyoruz (Daha güvenli!)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      username: user.username
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Giriş yapılamadı." });
  }
};