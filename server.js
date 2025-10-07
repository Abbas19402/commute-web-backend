import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.ts';
import driverRoutes from './routes/driverRoutes.ts';
import Ride from './models/Rides.ts';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import http from 'http';
import { Server } from 'socket.io';
import faqRoutes from './routes/faq.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware 
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json()); // parse JSON body
app.use(cookieParser());
app.use('/AdminUser', userRoutes);
app.use('/DriverUser', driverRoutes);
// Test route
app.get('/', (req, res) => {
  res.send('MERN backend is running');
});


app.post("/api/send-email", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rajcompany1kl@gmail.com", // Replace with your Gmail
        pass: "tnni pgme ambt klll",   // Use App Password, not regular password
      },
    });

    await transporter.sendMail({
      from: '"Delivery System" <rajcompany1kl@gmail.com>',
      to,
      subject,
      text,
    });

    res.status(200).json({ message: "Email sent" });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ error: "Email failed to send" });
  }
});

///// sockets


 const server = http.createServer(app);
 const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
const pendingChats = new Map();
const activeRooms = new Map();


io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('registerAsAdmin', ({ adminId, adminName } = {}) => {
    socket.data.isAdmin = true;
    socket.data.adminId = adminId || `admin-${socket.id}`;
    socket.data.adminName = adminName || 'Admin';

    
    const list = Array.from(pendingChats.entries()).map(([userId, val]) => ({
      userId,
      userName: val.userName || userId,
      trackingId: val.trackingId
    }));
    socket.emit('pendingList', list);
  });

  
  socket.on('chatRequest', async ({ userId, userName, trackingId } = {}) => {
    console.log('Chat request from', userId, userName);
    pendingChats.set(userId, { socketId: socket.id, userName: userName || userId, trackingId });
    
     // trackingId corresponds to Ride._id
    const ride = await Ride.findById(trackingId);
    if (!ride) return;

    // Find which admin(s) are linked to this ride
    const targetAdminId = String(ride.adminId);

   io.sockets.sockets.forEach((s) => {
      if (s.data?.isAdmin && s.data.adminId === targetAdminId) {
        s.emit('newChatRequest', { userId, userName: userName || userId, trackingId });
      }
    });

    socket.emit('waitingForAdmin');
  });


  socket.on('acceptChat', ({ userId, adminId, adminName, trackingId } = {}) => {
    const pending = pendingChats.get(userId);
    if (!pending) {
      socket.emit('acceptFailed', { reason: 'Request not available (maybe already accepted).' });
      return;
    }

    const userSocketId = pending.socketId;
    const userSocket = io.sockets.sockets.get(userSocketId);
    if (!userSocket) {
      socket.emit('acceptFailed', { reason: 'User disconnected.' });
      pendingChats.delete(userId);
     
      io.sockets.sockets.forEach((s) => {
        if (s.data && s.data.isAdmin) s.emit('removePending', { userId });
      });
      
      return;
    }

    
    const roomId = `${userId}-${adminId}-${Date.now()}`;
    activeRooms.set(roomId, { userSocketId, adminSocketId: socket.id });

    socket.join(roomId);
    userSocket.join(roomId);
console.log('tracking id' , trackingId  );
    
    io.to(roomId).emit('chatStarted', {
      roomId,
      userId,
      adminId,
      adminName: adminName || socket.data.adminName || 'Admin'
    });

    pendingChats.delete(userId);
    io.sockets.sockets.forEach((s) => {
      if (s.data && s.data.isAdmin) s.emit('removePending', { userId });
    });
  });


  socket.on('sendMessage', ({ roomId, sender, text } = {}) => {
    io.to(roomId).emit('receiveMessage', { sender, text, ts: Date.now() });
  });

 
  socket.on('endChat', ({ roomId, by } = {}) => {
    const info = activeRooms.get(roomId);
    if (info) {
      io.to(roomId).emit('chatEnded', { roomId, by });
      
      const clients = io.sockets.adapter.rooms.get(roomId);
      if (clients) {
        for (const clientId of clients) {
          const s = io.sockets.sockets.get(clientId);
          if (s) s.leave(roomId);
        }
      }
      activeRooms.delete(roomId);
    }
  });

 
  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);


    for (const [userId, val] of pendingChats.entries()) {
      if (val.socketId === socket.id) {
        pendingChats.delete(userId);
        io.sockets.sockets.forEach((s) => {
          if (s.data && s.data.isAdmin) s.emit('removePending', { userId });
        });
      }
    }

    for (const [roomId, val] of activeRooms.entries()) {
      if (val.userSocketId === socket.id || val.adminSocketId === socket.id) {
        io.to(roomId).emit('chatEnded', { roomId, by: 'disconnect' });
        activeRooms.delete(roomId);
      }
    }
  });
});



 app.use('/api/faq', faqRoutes);
 // Remove or comment this:
// mongoose.connect(...).then(() => {
//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// })

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Start the combined HTTP & Socket.IO server instead of app.listen()
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => console.error(err));
