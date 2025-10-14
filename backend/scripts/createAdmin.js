require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "india-ecom" });
    const email = process.argv[2];
    const pwd = process.argv[3];
    if (!email || !pwd)
      throw new Error("Usage: node scripts/createAdmin.js email password");

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: "Admin", role: "admin" });
      await user.setPassword(pwd);
      await user.save();
      console.log("Admin user created:", user._id);
    } else {
      user.role = "admin";
      await user.save();
      console.log("Existing user promoted to admin:", user._id);
    }

    const token = signToken(user._id);
    console.log("\nJWT Token:");
    console.log(token)

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
