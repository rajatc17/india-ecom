const express = require("express");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Check if email exists
router.post(
  "/check-email",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: "Email required" });

    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  })
);

// Register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const user = new User({ email, name });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toJSON() });
  })
);

// Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: user.toJSON() });
  })
);

module.exports = router;
