const express = require('express');
const Product = require('../models/Product');
const isAdmin = require('../middleware/isAdmin');
const mongoose = require('mongoose');
const { getAllCategoryIds } = require('../utils/categoryHelper');
const Fuse = require('fuse.js');
const router = express.Router();

const PRODUCT_LIST_SELECT = 'name slug price discountedPrice discount brand images category region giTagged isFeatured stock averageRating reviewCount createdAt';
const PRODUCT_DETAIL_SELECT = 'name slug description price discountedPrice discount images category region giTagged stock averageRating reviewCount brand material tags freeShipping';

const REGION_RULES = [
  {
    key: 'pan-india',
    label: 'Pan-India',
    matchers: [/\bmultiple\b/i, /\bpan[-\s]?india\b/i],
  },
  {
    key: 'rajasthan',
    label: 'Rajasthan',
    matchers: [/\brajasthan\b/i, /\bjaipur\b/i, /\bjodhpur\b/i, /\budaipur\b/i],
  },
  {
    key: 'west-bengal',
    label: 'West Bengal',
    matchers: [/\bwest\s*bengal\b/i, /\bwb\b/i, /\bshantiniketan\b/i, /\bbengal\b/i],
  },
  {
    key: 'uttar-pradesh',
    label: 'Uttar Pradesh',
    matchers: [/\buttar\s*pradesh\b/i, /\bup\b/i, /\bkhurja\b/i, /\bmoradabad\b/i],
  },
  {
    key: 'chhattisgarh',
    label: 'Chhattisgarh',
    matchers: [/\bchhattisgarh\b/i, /\bbastar\b/i],
  },
  {
    key: 'kashmir',
    label: 'Kashmir',
    matchers: [/\bkashmir\b/i],
  },
  {
    key: 'maharashtra',
    label: 'Maharashtra',
    matchers: [/\bmaharashtra\b/i],
  },
  {
    key: 'odisha',
    label: 'Odisha',
    matchers: [/\bodisha\b/i, /\borissa\b/i],
  },
  {
    key: 'tripura',
    label: 'Tripura',
    matchers: [/\btripura\b/i],
  },
];

const toSlug = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findRegionRule = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  const slug = toSlug(normalized);
  return REGION_RULES.find(
    (rule) =>
      rule.key === slug ||
      rule.label.toLowerCase() === normalized ||
      rule.matchers.some((matcher) => matcher.test(normalized))
  );
};

const buildRegionRegex = (region = '') => {
  const input = String(region).trim();
  if (!input) return null;

  const matchedRule = findRegionRule(input);
  if (matchedRule) {
    const combinedPattern = matchedRule.matchers
      .map((matcher) => `(?:${matcher.source})`)
      .join('|');
    return new RegExp(combinedPattern, 'i');
  }

  return new RegExp(`^${escapeRegex(input)}$`, 'i');
};

const toCanonicalRegion = (region = '') => {
  const trimmed = String(region).trim();
  if (!trimmed) return null;

  const matchedRule = findRegionRule(trimmed);
  if (matchedRule) {
    return {
      key: matchedRule.key,
      label: matchedRule.label,
    };
  }

  const normalizedLabel = trimmed.replace(/\s+/g, ' ');
  return {
    key: toSlug(normalizedLabel),
    label: normalizedLabel,
  };
};

function toProductDetailPayload(product) {
  if (!product) return product;
  return {
    ...product,
    // Keep frontend compatibility while model uses giTagged and flat rating fields.
    giTag: Boolean(product.giTagged),
    rating: {
      average: Number(product.averageRating || 0),
      count: Number(product.reviewCount || 0)
    }
  };
}

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

    // Build filter object
    const filter = { isActive: true };

    // Category filter - support both ID and slug (with hierarchical filtering)
    if (category) {
      const Category = require('../models/Category');
      
      // Check if it's a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category) && 
                              /^[0-9a-fA-F]{24}$/.test(category);
      
      let categoryDoc = null;
      
      if (isValidObjectId) {
        // Try to find by ID
        categoryDoc = await Category.findById(category);
      }
      
      // If not found by ID, try slug
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({ slug: category });
      }
      
      if (categoryDoc) {
        // Get all descendant category IDs (includes subcategories)
        const allCategoryIds = await getAllCategoryIds(categoryDoc._id);
        filter.category = { $in: allCategoryIds };
      } else {
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

    // Region filter
    if (region) {
      const regionRegex = buildRegionRegex(region);
      if (regionRegex) {
        filter.region = { $regex: regionRegex };
      }
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
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const baseFilter = { ...filter };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Math.min(Number(limit), 100);

    let products = [];
    let total = 0;

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(escaped, 'i');
      const regexFilter = { ...baseFilter, name: nameRegex };

      // Primary: strict name match (partial)
      const [regexProducts, regexTotal] = await Promise.all([
        Product.find(regexFilter)
          .select(PRODUCT_LIST_SELECT)
          .slice('images', 1)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(regexFilter)
      ]);

      if (regexTotal > 0) {
        products = regexProducts;
        total = regexTotal;
      } else {
        // Fallback: fuzzy search for typos
        const candidateLimit = Math.min(Math.max(limitNum * 15, 200), 600);
        const candidates = await Product.find(baseFilter)
          .select(PRODUCT_LIST_SELECT)
          .slice('images', 1)
          .populate('category', 'name slug')
          .limit(candidateLimit)
          .lean();

        const fuse = new Fuse(candidates, {
          keys: ['name'],
          threshold: 0.35,
          ignoreLocation: true,
          minMatchCharLength: 2
        });

        const results = fuse.search(q);
        total = results.length;
        products = results
          .slice(skip, skip + limitNum)
          .map((result) => result.item);
      }
    } else {
      // Execute query (non-search)
      const [list, count] = await Promise.all([
        Product.find(filter)
          .select(PRODUCT_LIST_SELECT)
          .slice('images', 1)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(filter)
      ]);

      products = list;
      total = count;
    }

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
      .select(PRODUCT_LIST_SELECT)
      .slice('images', 1)
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
      .select(PRODUCT_DETAIL_SELECT)
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(toProductDetailPayload(product));
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ 
      message: 'Error fetching product', 
      error: error.message 
    });
  }
});

// GET /api/products/regions - Get normalized region buckets for browse experiences
router.get('/regions', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50);

    const products = await Product.find({ isActive: true })
      .select('region')
      .lean();

    const regionMap = new Map();

    products.forEach((product) => {
      const canonical = toCanonicalRegion(product?.region);
      if (!canonical) return;

      const existing = regionMap.get(canonical.key);
      if (existing) {
        existing.count += 1;
      } else {
        regionMap.set(canonical.key, {
          key: canonical.key,
          label: canonical.label,
          count: 1,
        });
      }
    });

    const regions = Array.from(regionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    res.json({
      regions,
      total: regions.length,
    });
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({
      message: 'Error fetching regions',
      error: error.message,
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

// GET /api/products/admin/all - Get all products for admin (including inactive)
router.get('/admin/all', isAdmin, async (req, res) => {
  try {
    const {
      q, category, region, gi, minPrice, maxPrice,
      inStock, featured, isActive, sort = '-createdAt', 
      page = 1, limit = 20
    } = req.query;

    console.log('📥 Admin request query params:', req.query);

    // Build filter object (no isActive filter by default for admin)
    const filter = {};

    // Category filter
    if (category) {
      const Category = require('../models/Category');
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category) && 
                              /^[0-9a-fA-F]{24}$/.test(category);
      
      let categoryDoc = null;
      
      if (isValidObjectId) {
        categoryDoc = await Category.findById(category);
      }
      
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({ slug: category });
      }
      
      if (categoryDoc) {
        const allCategoryIds = await getAllCategoryIds(categoryDoc._id);
        filter.category = { $in: allCategoryIds };
      }
    }

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    // Region filter
    if (region) {
      const regionRegex = buildRegionRegex(region);
      if (regionRegex) {
        filter.region = { $regex: regionRegex };
      }
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
    } else if (inStock === 'false') {
      filter.stock = { $lte: 0 };
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    } else if (featured === 'false') {
      filter.isFeatured = false;
    }

    // Active status filter (admin can filter by active/inactive)
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    console.log('🔎 Admin filter object:', JSON.stringify(filter, null, 2));

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

    console.log('📦 Admin products found:', products.length);
    console.log('📊 Total count:', total);

    // Add stock status and availability info
    const productsWithStatus = products.map(product => ({
      ...product,
      stockStatus: product.stock > 0 ? 'in-stock' : 'out-of-stock',
      lowStock: product.stock > 0 && product.stock <= 10
    }));

    res.json({
      products: productsWithStatus,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        total,
        active: await Product.countDocuments({ ...filter, isActive: true }),
        inactive: await Product.countDocuments({ ...filter, isActive: false }),
        outOfStock: await Product.countDocuments({ ...filter, stock: { $lte: 0 } }),
        lowStock: await Product.countDocuments({ ...filter, stock: { $gt: 0, $lte: 10 } })
      }
    });
  } catch (error) {
    console.error('❌ Admin get products error:', error);
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: error.message 
    });
  }
});

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