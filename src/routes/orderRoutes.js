const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyTableSession } = require('../middleware/auth'); // Yazdığın middleware

// Dikkat: Sipariş oluşturma isteği gelince ÖNCE verifyTableSession çalışır!
router.post('/create', verifyTableSession, orderController.createOrder);

module.exports = router;