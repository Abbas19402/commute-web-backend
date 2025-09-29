import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.ts';
import driverRoutes from './routes/driverRoutes.ts';
import cookieParser from 'cookie-parser';


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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Start server after DB connection
  app.listen(PORT,"0.0.0.0",() => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => console.error(err));  

