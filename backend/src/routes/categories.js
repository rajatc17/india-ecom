const express = require("express");
const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");

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
    const tree = await Category.getTree();
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
