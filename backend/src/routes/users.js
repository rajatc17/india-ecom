const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const ALLOWED_PROFILE_FIELDS = ['name', 'phone', 'gender', 'dateOfBirth', 'addresses'];

const ensureSingleDefaultAddress = (addresses = []) => {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return [];
  }

  let foundDefault = false;
  const normalized = addresses.map((address, index) => {
    const isDefault = Boolean(address?.isDefault);
    if (isDefault && !foundDefault) {
      foundDefault = true;
      return { ...address, isDefault: true };
    }

    return { ...address, isDefault: false };
  });

  if (!foundDefault) {
    normalized[0].isDefault = true;
  }

  return normalized;
};

const mergePatchedAddresses = (existingAddresses = [], patchAddresses = []) => {
  const existing = existingAddresses.map((address) => ({ ...address.toObject(), _id: address._id }));
  const byId = new Map(existing.map((address) => [String(address._id), address]));
  const touchedIds = new Set();
  const additions = [];

  for (const incoming of patchAddresses) {
    if (!incoming || typeof incoming !== 'object') {
      continue;
    }

    const incomingId = incoming._id ? String(incoming._id) : null;
    if (incomingId) {
      const target = byId.get(incomingId);
      if (!target) {
        const error = new Error(`Address not found: ${incomingId}`);
        error.statusCode = 400;
        throw error;
      }

      touchedIds.add(incomingId);
      byId.set(incomingId, {
        ...target,
        ...incoming,
        _id: target._id,
      });
      continue;
    }

    additions.push(incoming);
  }

  const merged = existing.map((address) => {
    const id = String(address._id);
    return touchedIds.has(id) ? byId.get(id) : address;
  });

  return [...merged, ...additions];
};

router.get('/me', auth, async (req, res) => {
  // debug: console.log('req.userId', req.userId);
  const user = await User.findById(req.userId).populate('wishlist.product', 'name slug price discountedPrice discount images region stock giTag');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user); // toJSON already strips passwordHash
});

router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.addToWishlist(req.params.productId);
    const updatedUser = await User.findById(req.userId).populate('wishlist.product', 'name slug price discountedPrice discount images region stock giTag');
    res.json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Server error adding to wishlist' });
  }
});

router.delete('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.removeFromWishlist(req.params.productId);
    const updatedUser = await User.findById(req.userId).populate('wishlist.product', 'name slug price discountedPrice discount images region stock giTag');
    res.json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Server error removing from wishlist' });
  }
});

const updateMePutHandler = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => ALLOWED_PROFILE_FIELDS.includes(key))
    );

    if (updates.addresses !== undefined && !Array.isArray(updates.addresses)) {
      return res.status(400).json({ error: 'addresses must be an array' });
    }

    if (Array.isArray(updates.addresses)) {
      updates.addresses = ensureSingleDefaultAddress(updates.addresses);
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
};

const updateMePatchHandler = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => ALLOWED_PROFILE_FIELDS.includes(key))
    );

    if (updates.addresses !== undefined && !Array.isArray(updates.addresses)) {
      return res.status(400).json({ error: 'addresses must be an array' });
    }

    if (Array.isArray(updates.addresses)) {
      updates.addresses = ensureSingleDefaultAddress(
        mergePatchedAddresses(user.addresses || [], updates.addresses)
      );
    }

    Object.assign(user, updates);
    await user.save();

    return res.json(user);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors || {}).map((entry) => entry.message),
      });
    }

    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

router.put('/me', auth, updateMePutHandler);
router.patch('/me', auth, updateMePatchHandler);

module.exports = router;