const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// ==================== GET USER'S CART ====================
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId })
      .populate({
        path: 'items.product',
        select: 'name slug images price discountedPrice stock brand'
      });
    
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }
    
    // Check stock availability for each item
    const itemsWithStock = cart.items.map(item => ({
      ...item.toObject(),
      inStock: item.product && item.product.stock >= item.quantity,
      availableStock: item.product ? item.product.stock : 0
    }));
    
    res.json({
      success: true,
      cart: {
        ...cart.toObject(),
        items: itemsWithStock
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cart', 
      error: error.message 
    });
  }
});

// ==================== ADD ITEM TO CART ====================
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be at least 1' 
      });
    }
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${product.stock} items available in stock` 
      });
    }
    
    // Get or create cart
    let cart = await Cart.getOrCreate(req.userId);
    
    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock for new quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add more. Only ${product.stock} items available in stock` 
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
      cart.items[existingItemIndex].discountedPrice = product.discountedPrice;
      const effectivePrice = product.discountedPrice || product.price;
      cart.items[existingItemIndex].subtotal = effectivePrice * newQuantity;
    } else {
      // Add new item
      const effectivePrice = product.discountedPrice || product.price;
      cart.items.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        price: product.price,
        discountedPrice: product.discountedPrice,
        quantity: quantity,
        subtotal: effectivePrice * quantity
      });
    }
    
    await cart.save();
    
    // Populate and return
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug images price discountedPrice stock brand'
    });
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding item to cart', 
      error: error.message 
    });
  }
});

// ==================== UPDATE ITEM QUANTITY ====================
router.put('/update/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid quantity is required (minimum 1)' 
      });
    }
    
    // Get cart
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }
    
    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${product.stock} items available in stock` 
      });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].discountedPrice = product.discountedPrice;
    const effectivePrice = product.discountedPrice || product.price;
    cart.items[itemIndex].subtotal = effectivePrice * quantity;
    
    await cart.save();
    
    // Populate and return
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug images price discountedPrice stock brand'
    });
    
    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating cart', 
      error: error.message 
    });
  }
});

// ==================== REMOVE ITEM FROM CART ====================
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    // Remove item
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    if (cart.items.length === initialLength) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }
    
    await cart.save();
    
    // Populate and return
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug images price discountedPrice stock brand'
    });
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing item from cart', 
      error: error.message 
    });
  }
});

// ==================== CLEAR CART ====================
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing cart', 
      error: error.message 
    });
  }
});

// ==================== GET CART COUNT (for header badge) ====================
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    const count = cart ? cart.totalItems : 0;
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cart count', 
      error: error.message 
    });
  }
});

// ==================== VALIDATE CART (before checkout) ====================
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart is empty' 
      });
    }
    
    const issues = [];
    const validItems = [];
    
    for (const item of cart.items) {
      if (!item.product) {
        issues.push({
          itemId: item._id,
          issue: 'Product no longer available',
          action: 'remove'
        });
        continue;
      }
      
      if (item.product.stock === 0) {
        issues.push({
          itemId: item._id,
          productName: item.name,
          issue: 'Out of stock',
          action: 'remove'
        });
        continue;
      }
      
      if (item.product.stock < item.quantity) {
        issues.push({
          itemId: item._id,
          productName: item.name,
          issue: `Only ${item.product.stock} items available`,
          currentQuantity: item.quantity,
          maxQuantity: item.product.stock,
          action: 'update'
        });
        continue;
      }
      
      // Check if price changed
      const effectivePrice = item.product.discountedPrice || item.product.price;
      const cartEffectivePrice = item.discountedPrice || item.price;
      
      if (effectivePrice !== cartEffectivePrice) {
        issues.push({
          itemId: item._id,
          productName: item.name,
          issue: 'Price has changed',
          oldPrice: cartEffectivePrice,
          newPrice: effectivePrice,
          action: 'price_update'
        });
      }
      
      validItems.push(item);
    }
    
    res.json({
      success: true,
      valid: issues.length === 0,
      issues,
      cart
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error validating cart', 
      error: error.message 
    });
  }
});

// ==================== SYNC CART PRICES (update all prices) ====================
router.post('/sync-prices', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        message: 'No items to sync'
      });
    }
    
    let updated = false;
    
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.price !== product.price || 
            item.discountedPrice !== product.discountedPrice) {
          item.price = product.price;
          item.discountedPrice = product.discountedPrice;
          const effectivePrice = product.discountedPrice || product.price;
          item.subtotal = effectivePrice * item.quantity;
          updated = true;
        }
      }
    }
    
    if (updated) {
      await cart.save();
    }
    
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug images price discountedPrice stock brand'
    });
    
    res.json({
      success: true,
      message: updated ? 'Prices synced successfully' : 'Prices are up to date',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Sync prices error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error syncing prices', 
      error: error.message 
    });
  }
});

module.exports = router;
