const prisma = require("../db");
const crypto = require("crypto");

// 1. GARSON: Masayı açar, müşteriye vereceği PIN'i üretir
exports.openTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    if (!tableNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Masa numarası gönderilmedi." });
    }

    const pin = crypto.randomInt(1000, 9999).toString();
    const token = crypto.randomBytes(20).toString("hex");

    const updatedTable = await prisma.table.update({
      where: { tableNumber: parseInt(tableNumber) },
      data: {
        status: "DOLU",
        sessionPin: pin,
        sessionToken: token,
      },
    });

    res.status(200).json({
      success: true,
      message: `Masa ${tableNumber} başarıyla açıldı! PIN: ${pin}`,
      data: { tableNumber: updatedTable.tableNumber, pin, token },
    });
  } catch (error) {
    console.error("Masa açma hatası:", error);
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Böyle bir masa numarası kayıtlı değil.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: Masa açılamadı." });
  }
};

// 2. MÜŞTERİ: Masadaki QR'ı okutur ve garsonun verdiği PIN ile sisteme sızar
exports.joinTable = async (req, res) => {
  const { tableNumber, pin } = req.body;

  try {
    const table = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) },
    });

    if (!table || table.status === "BOŞ") {
      return res
        .status(404)
        .json({ success: false, message: "Masa henüz açılmamış." });
    }

    if (table.sessionPin !== pin) {
      return res
        .status(401)
        .json({ success: false, message: "Hatalı PIN kodu!" });
    }

    res.status(200).json({
      success: true,
      token: table.sessionToken,
      pin: table.sessionPin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Giriş yapılamadı." });
  }
};

// 3. YÖNETİCİ/GARSON: Hesabı iptal etme veya zorla sıfırlama
exports.closeTable = async (req, res) => {
  const { tableNumber } = req.body;
  try {
    await prisma.table.update({
      where: { tableNumber: parseInt(tableNumber) },
      data: {
        status: "BOŞ",
        sessionPin: null,
        sessionToken: null,
      },
    });
    res.status(200).json({
      success: true,
      message: "Masa sıfırlandı ve yeni müşteriye hazır.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Masa kapatılamadı." });
  }
};

// ==========================================
// YENİ EKLENEN FİNANSAL İŞLEMLER (KASA)
// ==========================================

// 4. GARSON/KASA: Masanın güncel "Adisyonunu" (Hesabını) getirir
exports.getBill = async (req, res) => {
  try {
    const { tableNumber } = req.params; // GET isteği olduğu için parametreden alıyoruz

    const table = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) },
      include: {
        orders: {
          where: { status: { not: "ODENDI" } }, // Sadece ödenmemiş siparişleri getir
          include: { items: { include: { product: true } } }, // Ürün isimlerini de gör
        },
      },
    });

    if (!table) return res.status(404).json({ message: "Masa bulunamadı." });

    // Siparişlerin toplam tutarını (totalAmount) topla
    const totalBill = table.orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    res.status(200).json({
      success: true,
      tableNumber: table.tableNumber,
      totalAmount: totalBill,
      orders: table.orders,
    });
  } catch (error) {
    console.error("Hesap çıkarma hatası:", error);
    res
      .status(500)
      .json({ success: false, message: "Hesap bilgisi getirilemedi." });
  }
};

// 5. KASA: Ödemeyi tahsil eder, siparişleri "ÖDENDİ" yapar ve masayı sıfırlar
exports.checkout = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    const table = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) },
    });

    if (!table) return res.status(404).json({ message: "Masa bulunamadı." });

    // Adım A: Masadaki tüm açık siparişlerin statüsünü "ODENDI" yap
    await prisma.order.updateMany({
      where: { tableId: table.id, status: { not: "ODENDI" } },
      data: { status: "ODENDI" },
    });

    // Adım B: Masanın kendisini "BOŞ" statüsüne çek ve şifreleri (isyanı) iptal et
    await prisma.table.update({
      where: { tableNumber: parseInt(tableNumber) },
      data: {
        status: "BOŞ",
        sessionPin: null,
        sessionToken: null,
      },
    });

    res.status(200).json({
      success: true,
      message: `Masa ${tableNumber} hesabı ödendi ve masa kapatıldı.`,
    });
  } catch (error) {
    console.error("Checkout hatası:", error);
    res
      .status(500)
      .json({ success: false, message: "Checkout işlemi başarısız." });
  }
};
