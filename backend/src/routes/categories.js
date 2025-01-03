const express = require("express");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Product = require("../models/Product");

const router = express.Router();

// Get all categories (flat list)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { active, level } = req.query;
    const filter = {};

    if (active === "true") filter.isActive = true;
    if (level !== undefined) filter.level = parseInt(level);

    const categories = await Category.find(filter).sort({
      sortOrder: 1,
      name: 1,
    });
    res.json(categories);
  })
);

// Get category tree (hierarchical structure)
router.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const onlyWithProducts = req.query.onlyWithProducts === "true";

    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });

    // Count products per category (direct assignment)
    const productCounts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          isAvailable: true,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByCategoryId = new Map(
      productCounts.map((row) => [row._id.toString(), row.count])
    );

    // Build tree nodes
    const nodeById = new Map();
    for (const cat of categories) {
      const node = {
        ...cat.toObject({ virtuals: true }),
        children: [],
        directProductCount: countByCategoryId.get(cat._id.toString()) || 0,
        productCount: 0,
      };
      nodeById.set(cat._id.toString(), node);
    }

    const roots = [];
    for (const cat of categories) {
      const node = nodeById.get(cat._id.toString());
      if (cat.parent) {
        const parentNode = nodeById.get(cat.parent.toString());
        if (parentNode) parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Compute subtree product counts (category depth max 3)
    const computeCounts = (node) => {
      const childrenTotal = (node.children || []).reduce(
        (sum, child) => sum + computeCounts(child),
        0
      );
      node.productCount = (node.directProductCount || 0) + childrenTotal;
      return node.productCount;
    };

    for (const root of roots) computeCounts(root);

    const pruneEmpty = (node) => {
      node.children = (node.children || [])
        .map(pruneEmpty)
        .filter((child) => (child.productCount || 0) > 0);
      return node;
    };

    const tree = onlyWithProducts
      ? roots.map(pruneEmpty).filter((n) => (n.productCount || 0) > 0)
      : roots;

    res.json(tree);
  })
);

// Get root categories only
router.get(
  "/root",
  asyncHandler(async (req, res) => {
    const categories = await Category.getRootCategories();
    res.json(categories);
  })
);

// Get single category by slug
router.get(
  "/slug/:slug",
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  })
);

// Get single category by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  })
);

// Get category children
router.get(
  "/:id/children",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const children = await category.getChildren();
    res.json(children);
  })
);

module.exports = router;
