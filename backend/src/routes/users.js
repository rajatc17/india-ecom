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

router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allowedFields = ['name', 'phone', 'gender', 'dateOfBirth', 'addresses'];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    if (updates.addresses !== undefined && !Array.isArray(updates.addresses)) {
      return res.status(400).json({ error: 'addresses must be an array' });
    }

    Object.assign(user, updates);
    await user.save();

    return res.json(user);
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors || {}).map((entry) => entry.message),
      });
    }

    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router;