const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.post('/', async (req, res) => {
  const p = await Product.create(req.body);
  res.status(201).json(p);
});

router.get('/', async (req, res) => {
  const { q, region, category, gi } = req.query;
  const filter = {};
  if (region) filter.region = region;
  if (category) filter.category = category;
  if (gi) filter.giTagged = gi === 'true';
  if (q) filter.$text = { $search: q }; // needs text index later

  const items = await Product.find(filter).limit(200);
  res.json(items);
});

module.exports = router;