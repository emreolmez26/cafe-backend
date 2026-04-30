const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protectStaff } = require('../middleware/staffAuth'); // Yeni muhafızımız geldi!

// 1. DİKKAT: Masayı sadece giriş yapmış GARSON/ADMİN açabilir.
router.post('/open', protectStaff, tableController.openTable); 

// 2. Müşteri için korumaya gerek yok, o zaten QR okutup PIN ile girecek.
router.post('/join', tableController.joinTable); 

// 3. Masayı kapatma işlemini de sadece personel yapmalı!
router.post('/close', protectStaff, tableController.closeTable);

// Bu iki rota sadece PERSONEL (Garson/Kasa) tarafından kullanılabilir
router.get('/bill/:tableNumber', protectStaff, tableController.getBill);
router.post('/checkout', protectStaff, tableController.checkout);

module.exports = router;