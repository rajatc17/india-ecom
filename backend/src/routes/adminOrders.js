const express = require("express");
const asyncHandler = require("express-async-handler");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const Order = require("../models/Order");

const router = express.Router();

// GET all orders with pagination and filters
router.get(
  "/orders",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const skip = (page - 1) * limit;
    
    // Filters
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.shippingStatus) filter.shippingStatus = req.query.shippingStatus;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "email name phone")
        .populate("items.product", "name slug"),
      Order.countDocuments(filter),
    ]);
    
    res.json({ total, page, limit, orders });
  })
);

// GET single order details
router.get(
  "/orders/:orderId",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "email name phone")
      .populate("items.product", "name slug images");
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  })
);

// UPDATE order status
router.patch(
  "/orders/:orderId/status",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;
    
    const allowedStatuses = [
      "created", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"
    ];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status", 
        allowedStatuses 
      });
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;
    
    await order.save();
    
    await order.populate("user", "email name phone");
    
    res.json(order);
  })
);

// UPDATE payment status
router.patch(
  "/orders/:orderId/payment",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { paymentStatus, paymentId } = req.body;
    
    const allowedStatuses = ["pending", "paid", "failed", "refunded"];
    
    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        error: "Invalid payment status", 
        allowedStatuses 
      });
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (paymentStatus === 'paid') {
      await order.markAsPaid(paymentId);
    } else {
      order.paymentStatus = paymentStatus;
      if (paymentId) order.paymentId = paymentId;
      await order.save();
    }
    
    await order.populate("user", "email name phone");
    
    res.json(order);
  })
);

// UPDATE shipping status
router.patch(
  "/orders/:orderId/shipping",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { shippingStatus, trackingNumber } = req.body;
    
    const allowedStatuses = [
      "pending", "processing", "shipped", "out-for-delivery", "delivered"
    ];
    
    if (!shippingStatus || !allowedStatuses.includes(shippingStatus)) {
      return res.status(400).json({ 
        error: "Invalid shipping status", 
        allowedStatuses 
      });
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    await order.updateShipping(shippingStatus, trackingNumber);
    await order.populate("user", "email name phone");
    
    res.json(order);
  })
);

// GET order statistics
router.get(
  "/orders/stats/overview",
  auth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "created" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "pending" } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
    ]);
    
    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
    });
  })
);

module.exports = router;
