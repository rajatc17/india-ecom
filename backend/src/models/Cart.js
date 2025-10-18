const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    // Snapshot of product info (in case product changes)
    name: { type: String, required: true },
    slug: String,
    image: String,
    
    // Pricing at the time of adding to cart
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    
    // Cart-specific
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    
    // Calculated field
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { 
    _id: true,
    timestamps: true 
  }
);

// Calculate subtotal before saving cart item
CartItemSchema.pre('save', function(next) {
  const effectivePrice = this.discountedPrice || this.price;
  this.subtotal = effectivePrice * this.quantity;
  next();
});

const CartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: [CartItemSchema],
    
    // Summary fields
    totalItems: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    
    // Optional: Save for later feature
    savedForLater: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    
    // Track when cart was last modified
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true 
  }
);

// Calculate totals before saving
CartSchema.pre('save', function(next) {
  // Calculate total items
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    const effectivePrice = item.discountedPrice || item.price;
    return sum + (effectivePrice * item.quantity);
  }, 0);
  
  // Calculate discount (difference between original and discounted prices)
  this.discount = this.items.reduce((sum, item) => {
    if (item.discountedPrice && item.discountedPrice < item.price) {
      return sum + ((item.price - item.discountedPrice) * item.quantity);
    }
    return sum;
  }, 0);
  
  // Calculate total
  this.total = this.subtotal;
  
  // Update last modified
  this.lastModified = Date.now();
  
  next();
});

// Instance method to check if product exists in cart
CartSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => item.product.toString() === productId.toString());
};

// Instance method to get item by product ID
CartSchema.methods.getItem = function(productId) {
  return this.items.find(item => item.product.toString() === productId.toString());
};

// Instance method to remove expired items (optional - if products get deleted)
CartSchema.methods.removeInvalidItems = async function() {
  const Product = model('Product');
  const validItems = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock > 0) {
      validItems.push(item);
    }
  }
  
  this.items = validItems;
  return this.save();
};

// Static method to get or create cart for user
CartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId });
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  return cart;
};

module.exports = model('Cart', CartSchema);
