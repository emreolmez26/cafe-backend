const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Node'un HTTP modülünü çağırdık
const { Server } = require('socket.io'); // 2. Socket.io'yu çağırdık
require('dotenv').config();

const app = express();
const server = http.createServer(app); // 3. Express'i HTTP server'ın içine sardık

// 4. Socket.io Yapılandırması
const io = new Server(server, {
  cors: {
    origin: "*", // Frontend adresin belli olduğunda burayı güncelleriz
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Rotalar
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// 5. Global Erişim (Sipariş verirken io'yu kullanabilmek için)
global.io = io;

// 6. Canlı Bağlantı Takibi
io.on('connection', (socket) => {
  console.log('Yeni bir cihaz bağlandı:', socket.id);

  // Cihazın mutfak ekranı olduğunu belirtmesi için bir "oda" sistemi
  socket.on('join_kitchen', () => {
    socket.join('kitchen_room');
    console.log('Cihaz MUTFAK odasına katıldı.');
  });

  socket.on('disconnect', () => {
    console.log('Bir cihazın bağlantısı koptu.');
  });
});

// 7. DİKKAT: Artık app.listen değil, server.listen diyoruz!
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and Sockets are ready!`);
});