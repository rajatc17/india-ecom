const express = require("express");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const User = require("../models/User");

const router = express.Router();

// promote/demote user role
router.patch(
  "/users/:userId/role",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ error: "invalid role" });
    const u = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select("-passwordHash");
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json(u);
  })
);

module.exports = router;