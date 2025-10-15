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
    const { items, address, paymentMethod, customerNotes } = req.body;
    
    // Validate input
    if (!items || !items.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    
    if (!address) {
      return res.status(400).json({ error: "Shipping address is required" });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Fetch products and build snapshots
      const productIds = items.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } })
        .session(session);

      // Validate and build order items with product snapshots
      const orderItems = items.map((item) => {
        const product = products.find((p) => p._id.equals(item.productId));
        
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        if (!product.isActive || !product.isAvailable) {
          throw new Error(`Product ${product.name} is not available`);
        }
        
        if (product.stock < item.qty) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        
        // Use effectivePrice (discountedPrice or price)
        const unitPrice = product.effectivePrice;
        const subtotal = unitPrice * item.qty;
        
        return {
          product: product._id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          image: product.primaryImage?.url || product.images[0]?.url,
          price: product.price,
          discountedPrice: product.discountedPrice,
          unitPrice: unitPrice,
          qty: item.qty,
          subtotal: subtotal
        };
      });

      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Calculate shipping fee (free shipping if total > 1000, else 50)
      const shippingFee = subtotal > 1000 ? 0 : 50;
      
      // Tax (simplified - could be based on state)
      const tax = 0;
      
      // Discount (could be from coupon code)
      const discount = 0;
      
      const total = subtotal + shippingFee + tax - discount;

      // Decrement stock for each product
      for (const item of items) {
        const product = products.find((p) => p._id.equals(item.productId));
        await product.reduceStock(item.qty);
      }

      // Create order
      const order = await Order.create(
        [
          {
            user: req.userId,
            items: orderItems,
            subtotal,
            discount,
            shippingFee,
            tax,
            total,
            address,
            paymentMethod,
            customerNotes: customerNotes || '',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            status: 'created'
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

// Get user's orders
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { status, paymentStatus } = req.query;
    const filter = { user: req.userId };
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name slug');
    
    res.json(orders);
  })
);

// Get single order by ID
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('items.product', 'name slug images');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  })
);

// Get order by order number
router.get(
  "/number/:orderNumber",
  auth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
      user: req.userId
    }).populate('items.product', 'name slug images');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  })
);

// Cancel order
router.post(
  "/:id/cancel",
  auth,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        error: `Order cannot be cancelled. Current status: ${order.status}` 
      });
    }
    
    await order.cancelOrder(reason || 'Cancelled by customer');
    
    // Restore stock for cancelled items
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          await product.increaseStock(item.qty);
        }
      }
      
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error restoring stock:', err);
    }
    
    res.json({ message: "Order cancelled successfully", order });
  })
);

module.exports = router;
