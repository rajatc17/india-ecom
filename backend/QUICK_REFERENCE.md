# Quick Reference - New Product & Category Models

## Category Model

### Schema
```javascript
{
  name: String,              // "Blue Pottery"
  slug: String,              // "blue-pottery" (auto-generated)
  parent: ObjectId,          // Reference to parent category
  level: Number,             // 0, 1, or 2 (auto-calculated)
  description: String,
  image: String,
  icon: String,              // Emoji or icon class
  isActive: Boolean,
  sortOrder: Number,
  productCount: Number,      // Auto-updated
  createdAt: Date,
  updatedAt: Date
}
```

### Methods

```javascript
// Static methods
Category.getRootCategories()     // Get all root (level 0) categories
Category.getTree()               // Get full category tree with children

// Instance methods
category.getChildren()           // Get all direct children of this category

// Virtual fields
category.path                    // "Fashion > Sarees > Banarasi" (async)
```

### Example Usage

```javascript
// Get category tree for navigation
const tree = await Category.getTree();

// Get root categories
const roots = await Category.getRootCategories();

// Get category by slug
const category = await Category.findOne({ slug: 'blue-pottery' });

// Get category children
const children = await category.getChildren();

// Create new category
const newCat = await Category.create({
  name: 'New Category',
  slug: 'new-category',    // Optional - auto-generated
  parent: parentCategoryId, // Optional - null for root
  icon: '🎨'
});
```

---

## Product Model

### Schema
```javascript
{
  // Basic
  name: String,
  slug: String,              // "blue-pottery-vase" (required, auto-generated)
  sku: String,               // Stock Keeping Unit
  description: String,
  
  // Category
  category: ObjectId,        // Reference to Category (required)
  
  // Pricing
  price: Number,             // Required, min: 0
  discountedPrice: Number,   // Must be < price
  discount: Number,          // 0-100 (auto-calculated)
  
  // Inventory
  stock: Number,
  lowStockThreshold: Number, // Default: 5
  isAvailable: Boolean,
  
  // Details
  brand: String,
  material: String,
  weight: Number,            // grams
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  // Images
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean,
    order: Number
  }],
  
  // Indian Market
  region: String,
  giTagged: Boolean,
  
  // SEO & Discovery
  tags: [String],
  
  // Reviews
  averageRating: Number,     // 0-5
  reviewCount: Number,
  
  // Shipping
  shippingWeight: Number,
  freeShipping: Boolean,
  
  // Admin
  isActive: Boolean,
  isFeatured: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Virtual Fields (Read-only)

```javascript
product.effectivePrice        // Returns discountedPrice || price
product.inStock              // Returns stock > 0 && isAvailable
product.isLowStock           // Returns stock > 0 && stock <= threshold
product.primaryImage         // Returns primary image or first image
product.discountPercentage   // Returns calculated discount %
```

### Instance Methods

```javascript
// Check stock
product.hasStock(quantity)          // Returns boolean
product.hasStock(5)                 // true if stock >= 5

// Reduce stock (on order)
await product.reduceStock(quantity)
await product.reduceStock(5)        // Throws error if insufficient

// Increase stock (on return/cancellation)
await product.increceStock(quantity)
await product.increaseStock(5)

// Update rating
await product.updateRating(newRating)
await product.updateRating(4.5)     // Recalculates average
```

### Example Usage

```javascript
// Create product
const category = await Category.findOne({ slug: 'blue-pottery' });
const product = await Product.create({
  name: 'Blue Pottery Vase',
  slug: 'blue-pottery-vase',  // Optional - auto-generated
  category: category._id,
  price: 3305,
  discountedPrice: 2810,      // Must be < price
  stock: 10,
  images: [{
    url: 'https://example.com/vase.jpg',
    alt: 'Blue Pottery Vase',
    isPrimary: true,
    order: 0
  }],
  tags: ['pottery', 'blue-pottery', 'handicraft'],
  region: 'Rajasthan',
  giTagged: true,
  isActive: true,
  isFeatured: false
});

// Get products with category
const products = await Product.find({})
  .populate('category')
  .sort({ createdAt: -1 });

// Filter by category
const categoryProducts = await Product.find({ 
  category: categoryId 
});

// Get featured products
const featured = await Product.find({ 
  isFeatured: true, 
  isActive: true 
});

// Text search
const results = await Product.find({ 
  $text: { $search: 'silk saree' } 
});

// Check and reduce stock
const product = await Product.findById(productId);
if (product.hasStock(orderQuantity)) {
  await product.reduceStock(orderQuantity);
} else {
  throw new Error('Insufficient stock');
}

// Use virtual fields
console.log(product.effectivePrice);      // 2810
console.log(product.inStock);             // true
console.log(product.discountPercentage);  // 15
console.log(product.primaryImage.url);    // "https://..."
```

---

## Common Queries

### Get Category Tree
```javascript
GET /api/categories/tree

Response:
[
  {
    _id: "...",
    name: "Handicrafts",
    slug: "handicrafts",
    level: 0,
    children: [
      {
        name: "Pottery",
        slug: "pottery",
        level: 1,
        children: [
          { name: "Blue Pottery", slug: "blue-pottery", level: 2 }
        ]
      }
    ]
  }
]
```

### Get Products by Category
```javascript
GET /api/products?category=<categoryId>

const categoryId = req.query.category;
const products = await Product.find({ category: categoryId })
  .populate('category');
```

### Get Products by Region
```javascript
GET /api/products?region=Rajasthan

const products = await Product.find({ region: req.query.region })
  .populate('category');
```

### Get GI-Tagged Products
```javascript
GET /api/products?giTagged=true

const products = await Product.find({ giTagged: true })
  .populate('category');
```

### Get Featured Products
```javascript
GET /api/products/featured

const products = await Product.find({ 
  isFeatured: true, 
  isActive: true 
})
  .populate('category')
  .limit(10);
```

### Search Products
```javascript
GET /api/products/search?q=pottery

const products = await Product.find({ 
  $text: { $search: req.query.q } 
})
  .populate('category');
```

---

## Migration Commands

### Fresh Install
```bash
node scripts/seed.js
```

### Migrate Existing Data
```bash
node scripts/migrateToNewSchema.js
```

---

## Indexes

### Product Indexes
- `{ slug: 1 }` - Unique
- `{ category: 1, price: 1 }`
- `{ category: 1, averageRating: -1 }`
- `{ region: 1, giTagged: 1 }`
- `{ name: 'text', description: 'text', tags: 'text' }`
- `{ isActive: 1, stock: 1 }`
- `{ isFeatured: 1, isActive: 1 }`
- `{ createdAt: -1 }`

### Category Indexes
- `{ slug: 1 }` - Unique
- `{ parent: 1, isActive: 1 }`
- `{ level: 1, isActive: 1 }`

---

## Validation Rules

### Product
- `name`: Required, trimmed
- `slug`: Required, unique, lowercase
- `category`: Required, must reference valid Category
- `price`: Required, min: 0
- `discountedPrice`: Optional, must be < price
- `discount`: 0-100
- `stock`: min: 0
- `averageRating`: 0-5

### Category
- `name`: Required, unique, trimmed
- `slug`: Required, unique, lowercase
- `level`: 0-2
- `parent`: Must reference valid Category if not root

---

## Tips & Best Practices

1. **Always populate category** when fetching products for display
2. **Use virtual fields** instead of calculating in frontend
3. **Use instance methods** for stock operations to maintain consistency
4. **Set isPrimary** on one image for each product
5. **Use tags** for better searchability
6. **Set isFeatured** for homepage/promotion products
7. **Use slug** for SEO-friendly URLs
8. **Keep category hierarchy** max 3 levels deep
9. **Update productCount** after bulk operations
10. **Use indexes** for frequently queried fields

---

## Need Help?

- See `MIGRATION_GUIDE.md` for detailed documentation
- Check `seed.js` for complete examples
- Review model files for all available options
