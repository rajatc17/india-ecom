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