require("dotenv").config();
const express = require("express");
const connectDB = require('./db')

const app = express();
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

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);