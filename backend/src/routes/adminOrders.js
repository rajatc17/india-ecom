const express = require("express");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const Order = require("../models/Order");

const router = express.Router();

// GET all orders with pagination
router.get(
  "/orders",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "email name"),
      Order.countDocuments(),
    ]);
    res.json({ total, page, limit, orders });
  })
);

// PATCH order status
router.patch(
  "/orders/:orderId",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowed = ["created", "paid", "shipped", "cancelled", "refunded"];
    if (!status || !allowed.includes(status))
      return res.status(400).json({ error: "invalid status" });
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("user", "email name");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  })
);

module.exports = router;
