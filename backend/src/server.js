require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Server health check!",
  });
});


app.listen(5000, ()=>console.log('Server is running on port 5000'));