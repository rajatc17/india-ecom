const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CategorySchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      index: true
    },
    parent: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
      default: null,
      index: true
    },
    level: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 2 // 0=category, 1=subcategory, 2=subsubcategory
    },
    description: { 
      type: String,
      maxlength: 1000
    },
    image: String,
    icon: String, // Emoji or icon class
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    sortOrder: { 
      type: Number, 
      default: 0 
    },
    productCount: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to get full path (e.g., "Fashion > Sarees > Banarasi")
CategorySchema.virtual('path').get(async function() {
  let path = [this.name];
  let current = this;
  
  while (current.parent) {
    current = await this.model('Category').findById(current.parent);
    if (current) path.unshift(current.name);
  }
  
  return path.join(' > ');
});

// Instance method to get all children
CategorySchema.methods.getChildren = function() {
  return this.model('Category').find({ parent: this._id });
};

// Static method to get root categories
CategorySchema.statics.getRootCategories = function() {
  return this.find({ parent: null, isActive: true }).sort({ sortOrder: 1 });
};

// Static method to get category tree
CategorySchema.statics.getTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1 });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => 
        (parentId === null && cat.parent === null) || 
        (cat.parent && cat.parent.toString() === parentId)
      )
      .map(cat => ({
        ...cat.toObject(),
        children: buildTree(cat._id.toString())
      }));
  };
  
  return buildTree();
};

// Pre-save hook to auto-generate slug if not provided
CategorySchema.pre('save', async function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Set level based on parent
  if (this.parent) {
    const parent = await this.model('Category').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
    }
  } else {
    this.level = 0;
  }
  
  next();
});

// Indexes for performance
CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ level: 1, isActive: 1 });

module.exports = model('Category', CategorySchema);
