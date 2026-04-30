// src/controllers/menuController.js
const prisma = require('../db'); // Prisma bağlantımızı çağırdık

exports.getAllMenu = async (req, res) => {
  try {
    // Kategorileri bul, bulurken içine o kategoriye ait ürünleri de ekle (SQL'deki JOIN mantığı)
    const menuData = await prisma.category.findMany({
      include: {
        products: true // Sadece kategorinin adını değil, içindeki ürünleri de getir
      }
    });

    res.status(200).json({
      success: true,
      message: "Gerçek menü veritabanından başarıyla çekildi!",
      data: menuData
    });

  } catch (error) {
    console.error("Menü çekme hatası:", error);
    res.status(500).json({ success: false, message: "Veritabanına ulaşılamadı" });
  }
};