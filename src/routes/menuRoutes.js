const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Kullanıcı GET isteğiyle "/" adresine gelirse (yani /api/menu/ olacak), 
// git menuController'daki "getAllMenu" fonksiyonunu çalıştır.

router.get('/', menuController.getAllMenu);

module.exports = router;