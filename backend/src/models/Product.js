const { Schema, model } = require("mongoose");

const ProductSchema = new Schema(
  {
    // Basic Info
    name: { 
      type: String, 
      required: true, 
      trim: true,
      index: true
    },
    slug: { 
      type: String, 
      unique: true, 
      required: true, 
      lowercase: true,
      trim: true,
      index: true
    },
    sku: { 
      type: String, 
      unique: true, 
      sparse: true,
      trim: true,
      uppercase: true
    },
    description: { 
      type: String,
      maxlength: 5000
    },
    
    // Category (now references Category model)
    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true,
      index: true 
    },
    
    // Pricing
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discountedPrice: { 
      type: Number, 
      min: 0,
      validate: {
        validator: function(value) {
          return !value || value < this.price;
        },
        message: 'Discounted price must be less than original price'
      }
    },
    discount: { 
      type: Number, 
      min: 0, 
      max: 100 
    }, // Percentage
    
    // Inventory
    stock: { 
      type: Number, 
      default: 0, 
      min: 0,
      index: true
    },
    lowStockThreshold: { 
      type: Number, 
      default: 5 
    },
    isAvailable: { 
      type: Boolean, 
      default: true,
      index: true
    },
    
    // Product Details
    brand: { 
      type: String,
      trim: true
    },
    material: { 
      type: String,
      trim: true
    },
    weight: Number, // in grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    
    // Images (enhanced structure)
    images: [{
      url: { type: String, required: true },
      alt: String,
      isPrimary: { type: Boolean, default: false },
      order: { type: Number, default: 0 }
    }],
    
    // Indian Market Specific
    region: { 
      type: String, 
      index: true,
      trim: true
    },
    giTagged: { 
      type: Boolean, 
      default: false,
      index: true
    },
    
    // SEO & Discovery
    tags: [{ type: String, lowercase: true, trim: true }],
    
    // Reviews & Ratings
    averageRating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5 
    },
    reviewCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // Shipping
    shippingWeight: Number, // in grams
    freeShipping: { 
      type: Boolean, 
      default: false 
    },
    
    // Admin
    isActive: { 
      type: Boolean, 
      default: true, 
      index: true 
    },
    isFeatured: { 
      type: Boolean, 
      default: false, 
      index: true 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual Fields
ProductSchema.virtual('effectivePrice').get(function() {
  return this.discountedPrice || this.price;
});

ProductSchema.virtual('inStock').get(function() {
  return this.stock > 0 && this.isAvailable;
});

ProductSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

ProductSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

ProductSchema.virtual('discountPercentage').get(function() {
  if (!this.discountedPrice) return 0;
  return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
});

// Instance Methods
ProductSchema.methods.hasStock = function(quantity = 1) {
  return this.stock >= quantity && this.isAvailable;
};

ProductSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock for ${this.name}. Available: ${this.stock}, Requested: ${quantity}`);
  }
  this.stock -= quantity;
  return this.save();
};

ProductSchema.methods.increaseStock = async function(quantity) {
  this.stock += quantity;
  return this.save();
};

ProductSchema.methods.updateRating = async function(newRating) {
  // Recalculate average rating
  const totalRating = this.averageRating * this.reviewCount;
  this.reviewCount += 1;
  this.averageRating = (totalRating + newRating) / this.reviewCount;
  return this.save();
};

// Pre-save hook to auto-generate slug
ProductSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Calculate discount percentage if discountedPrice is set
  if (this.discountedPrice && this.price) {
    this.discount = Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  
  next();
});

// Indexes for common queries
ProductSchema.index({ category: 1, price: 1 }); // Filter by category, sort by price
ProductSchema.index({ category: 1, averageRating: -1 }); // Top-rated in category
ProductSchema.index({ region: 1, giTagged: 1 }); // GI-tagged products by region
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search
ProductSchema.index({ isActive: 1, stock: 1 }); // Available products with stock
ProductSchema.index({ isFeatured: 1, isActive: 1 }); // Featured products
ProductSchema.index({ createdAt: -1 }); // New arrivals

module.exports = model('Product', ProductSchema);