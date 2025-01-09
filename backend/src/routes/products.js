const express = require('express');
const Product = require('../models/Product');
const isAdmin = require('../middleware/isAdmin');
const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/products - Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      q,              // Search query
      category,       // Category ID
      region,         // Region filter
      gi,             // GI-tagged only
      minPrice,       // Price range
      maxPrice,
      inStock,        // Only available products
      featured,       // Featured products
      sort = '-createdAt', // Sort field
      page = 1,       // Pagination
      limit = 20
    } = req.query;

    // Build filter object
    const filter = { isActive: true }; // Only show active products

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Region filter
    if (region) {
      filter.region = region;
    }

    // GI-tagged filter
    if (gi === 'true') {
      filter.giTagged = true;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // In stock filter
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
      filter.isAvailable = true;
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Math.min(Number(limit), 100); // Max 100 per page

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Convert to plain JS objects (faster)
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: error.message 
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    
    const products = await Product.find({ 
      isFeatured: true, 
      isActive: true,
      isAvailable: true 
    })
      .populate('category', 'name slug')
      .limit(limit)
      .lean();

    res.json(products);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      message: 'Error fetching featured products', 
      error: error.message 
    });
  }
});

// GET /api/products/slug/:slug - Get product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    })
      .populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ 
      message: 'Error fetching product', 
      error: error.message 
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Only return if active or user is admin
    if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    res.status(500).json({ 
      message: 'Error fetching product', 
      error: error.message 
    });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// POST /api/products - Create product (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'slug', 'price', 'category', 'stock'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        fields: missingFields 
      });
    }

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug: req.body.slug });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product slug already exists' });
    }

    // Whitelist allowed fields (security)
    const allowedFields = [
      'name', 'slug', 'sku', 'description', 'category', 
      'price', 'discountedPrice', 'discount', 'stock',
      'brand', 'material', 'weight', 'dimensions',
      'images', 'region', 'giTagged', 'tags',
      'shippingWeight', 'freeShipping',
      'isActive', 'isFeatured'
    ];

    const productData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        productData[field] = req.body[field];
      }
    });

    const product = await Product.create(productData);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating product', 
      error: error.message 
    });
  }
});

// PATCH /api/products/:id - Update product (Admin only)
router.patch('/:id', isAdmin, async (req, res) => {
  try {
    // Whitelist allowed fields
    const allowedFields = [
      'name', 'slug', 'sku', 'description', 'category',
      'price', 'discountedPrice', 'discount', 'stock',
      'brand', 'material', 'weight', 'dimensions',
      'images', 'region', 'giTagged', 'tags',
      'shippingWeight', 'freeShipping',
      'isActive', 'isFeatured'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If updating slug, check for duplicates
    if (updates.slug) {
      const existingProduct = await Product.findOne({ 
        slug: updates.slug,
        _id: { $ne: req.params.id }
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'Product slug already exists' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error updating product', 
      error: error.message 
    });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    res.status(500).json({ 
      message: 'Error deleting product', 
      error: error.message 
    });
  }
});

// PATCH /api/products/:id/stock - Update stock (Admin only)
router.patch('/:id/stock', isAdmin, async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({ message: 'Quantity must be a number' });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (operation === 'add') {
      await product.increaseStock(quantity);
    } else if (operation === 'subtract') {
      await product.reduceStock(quantity);
    } else {
      product.stock = quantity;
      await product.save();
    }

    res.json(product);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      message: 'Error updating stock', 
      error: error.message 
    });
  }
});

module.exports = router;