const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

// Yetki kontrolü yapacak olan middleware'imizi çağırıyoruz
// (Dosya adın "staffAuth.js" ise yolu ona göre ayarlarsın)
const { protectStaff } = require("../middleware/staffAuth");

// 1. MÜŞTERİ ROTASI: Herkes menüyü görebilir (Koruma yok)
router.get("/", menuController.getAllMenu);

// 2. ADMİN ROTALARI: Sadece token'ı olan yetkililer işlem yapabilir
router.post("/add", protectStaff, menuController.createProduct);
router.delete("/delete/:id", protectStaff, menuController.deleteProduct);

module.exports = router;
    