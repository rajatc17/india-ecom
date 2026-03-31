require("dotenv").config();
const express = require("express");
const cors = require('cors');
const connectDB = require('./db')

const app = express();

// CORS should be before other middleware
const normalizeOrigin = (value = '') => value.trim().replace(/\/$/, '').toLowerCase();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests and configured browser origins.
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
  });
});

const PORT  = process.env.PORT || 5000;
connectDB().then(()=>{
    app.listen(PORT, ()=> console.log(`Server & DB running on ${PORT}`));
});

const products = require('./routes/products');
app.use('/api/products', products);

const categoriesRoutes = require('./routes/categories');
app.use('/api/categories', categoriesRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const adminOrdersRoutes = require('./routes/adminOrders');
app.use('/api/admin', adminOrdersRoutes);

const adminUsersRoutes = require('./routes/adminUsers');
app.use('/api/admin', adminUsersRoutes);

const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);