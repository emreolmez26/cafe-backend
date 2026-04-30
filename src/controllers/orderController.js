const prisma = require("../db");

exports.createOrder = async (req, res) => {
  try {
    const { tableNumber, items } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Sepetiniz boş!" });
    }

    // 1. Veritabanından güncel ürün fiyatlarını çekelim
    const productIds = items.map((item) => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // 2. Toplam tutarı biz (Backend) hesaplayalım
    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const product = dbProducts.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Ürün bulunamadı: ${item.productId}`);

      totalAmount += product.price * item.quantity; // Fiyat x Adet

      return {
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || "",
      };
    });

    // 3. Masayı bulalım
    const table = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) },
    });

    // 4. Siparişi ve kalemlerini tek seferde oluşturalım
    const newOrder = await prisma.order.create({
      data: {
        tableId: table.id,
        status: "BEKLİYOR",
        totalAmount: totalAmount, // Bizim hesapladığımız güvenli tutar
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: { product: true }, // Yanıtta ürün isimlerini de görelim
        },
      },
    });


    // 5. CANLI BİLDİRİM: Mutfak odasındaki herkese yeni siparişi fırlat
    if (global.io) {
      global.io.to("kitchen_room").emit("new_order", {
        tableNumber: table.tableNumber,
        items: newOrder.items,
        totalAmount: newOrder.totalAmount,
        orderId: newOrder.id,
        orderTime: new Date().toLocaleTimeString("tr-TR"),
      });
    }

    res.status(201).json({
      success: true,
      message: "Siparişiniz mutfağa iletildi. Afiyet olsun!",
      data: newOrder,
    });
  } catch (error) {
    console.error("Sipariş Hatası:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Sipariş işlenirken bir hata oluştu." });
  }
};
