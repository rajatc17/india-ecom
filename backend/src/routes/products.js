const express = require('express');
const Product = require('../models/Product');
const isAdmin = require('../middleware/isAdmin');
const mongoose = require('mongoose');
const { getAllCategoryIds } = require('../utils/categoryHelper');
const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/products - Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      q, category, region, gi, minPrice, maxPrice,
      inStock, featured, sort = '-createdAt', page = 1, limit = 20
    } = req.query;

    console.log('📥 Request query params:', req.query);
    console.log('🔍 Category param:', category);

    // Build filter object
    const filter = { isActive: true };

    // Category filter - support both ID and slug (with hierarchical filtering)
    if (category) {
      console.log('🏷️  Processing category filter...');
      const Category = require('../models/Category');
      
      // Check if it's a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category) && 
                              /^[0-9a-fA-F]{24}$/.test(category);
      
      console.log('   Is valid ObjectId?', isValidObjectId);
      
      let categoryDoc = null;
      
      if (isValidObjectId) {
        // Try to find by ID
        categoryDoc = await Category.findById(category);
        console.log('   Found by ID?', categoryDoc ? 'YES' : 'NO');
      }
      
      // If not found by ID, try slug
      if (!categoryDoc) {
        console.log('   Trying to find by slug:', category);
        categoryDoc = await Category.findOne({ slug: category });
        console.log('   Found by slug?', categoryDoc ? 'YES' : 'NO');
        if (categoryDoc) {
          console.log('   Category found:', { id: categoryDoc._id, name: categoryDoc.name, slug: categoryDoc.slug });
        }
      }
      
      if (categoryDoc) {
        // Get all descendant category IDs (includes subcategories)
        const allCategoryIds = await getAllCategoryIds(categoryDoc._id);
        console.log('   ✅ Category filter applied with', allCategoryIds.length, 'categories (including descendants)');
        filter.category = { $in: allCategoryIds };
      } else {
        console.log('   ❌ Category not found, returning empty results');
        return res.json({
          products: [],
          pagination: {
            page: Number(page),
            limit: Math.min(Number(limit), 100),
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    // Region filter
    if (region) {
      filter.region = region;
    }

    // GI-tagged filter
    if (gi === 'true') {
      filter.isGITagged = true;
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
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    console.log('🔎 Final filter object:', JSON.stringify(filter, null, 2));

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Math.min(Number(limit), 100);

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter)
    ]);

    console.log('📦 Products found:', products.length);
    console.log('📊 Total count:', total);

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
    console.error('❌ Get products error:', error);
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