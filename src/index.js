require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Serveur sur http://localhost:${process.env.PORT}`);
});
