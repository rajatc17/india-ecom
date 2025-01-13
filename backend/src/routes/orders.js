// src/routes/orders.js
const express = require("express");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

// Place order
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { items, address } = req.body; // items: [{ productId, qty }]
    if (!items || !items.length)
      return res.status(400).json({ error: "Cart empty" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Fetch products and build snapshots
      const pids = items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: pids } }).session(
        session
      );

      // Map and validate stock, build order items
      let total = 0;
      const orderItems = items.map((i) => {
        const prod = products.find((p) => p._id.equals(i.productId));
        if (!prod) throw new Error(`Product ${i.productId} not found`);
        if (prod.stock < i.qty)
          throw new Error(`Insufficient stock for ${prod.name}`);
        total += prod.price * i.qty;
        return {
          productId: prod._id,
          name: prod.name,
          unitPrice: prod.price,
          qty: i.qty,
        };
      });

      // Decrement stock
      for (const it of items) {
        await Product.updateOne(
          { _id: it.productId, stock: { $gte: it.qty } },
          { $inc: { stock: -it.qty } }
        ).session(session);
      }

      // Create order
      const order = await Order.create(
        [
          {
            user: req.userId,
            items: orderItems,
            total,
            address,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json(order[0]);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ error: err.message });
    }
  })
);

// User orders
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  })
);

module.exports = router;
