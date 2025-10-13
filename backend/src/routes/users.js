const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/me', auth, async (req, res) => {
  // debug: console.log('req.userId', req.userId);
  const user = await User.findById(req.userId).populate('wishlist', 'name price images region');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user); // toJSON already strips passwordHash
});

module.exports = router;