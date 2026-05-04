// src/controllers/menuController.js
const prisma = require("../db"); // Prisma bağlantımızı çağırdık

exports.getAllMenu = async (req, res) => {
  try {
    // Kategorileri bul, bulurken içine o kategoriye ait ürünleri de ekle (SQL'deki JOIN mantığı)
    const menuData = await prisma.category.findMany({
      include: {
        products: true, // Sadece kategorinin adını değil, içindeki ürünleri de getir
      },
    });

    res.status(200).json({
      success: true,
      message: "Gerçek menü veritabanından başarıyla çekildi!",
      data: menuData,
    });
  } catch (error) {
    console.error("Menü çekme hatası:", error);
    res
      .status(500)
      .json({ success: false, message: "Veritabanına ulaşılamadı" });
  }
};

// 1. YENİ ÜRÜN EKLEME (Dashboard'dan gelen verilerle)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      categoryId,
      description,
      imageUrl,
      subCategory,
      extraOptions,
    } = req.body;

    if (!name || !price || !categoryId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Ürün adı, fiyatı ve kategorisi zorunludur.",
        });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        description: description || null,
        imageUrl: imageUrl || null,
        subCategory: subCategory || null,
        extraOptions: extraOptions || null,
      },
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Ürün başarıyla eklendi!",
        data: newProduct,
      });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res
      .status(500)
      .json({ success: false, message: "Ürün eklenirken bir hata oluştu." });
  }
};

// 2. ÜRÜN SİLME
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // Silinecek ürünün ID'si URL'den gelecek

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ success: true, message: "Ürün başarıyla silindi." });
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Ürün silinemedi (Siparişi verilmiş bir ürünü silemezsiniz).",
      });
  }
};
