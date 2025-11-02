const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const seedData = require('./products_100_seed.json');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bharat_bazaar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'india-ecom'
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB\n');
  await seedProducts();
});

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding process...\n');

    // Optional: Clear existing products (comment out if you want to keep existing data)
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products\n`);

    // Load all categories to build slug-to-ID map
    console.log('📦 Loading category references...');
    const categories = await Category.find({});

    if (categories.length === 0) {
      console.error('❌ No categories found! Please run seedCategories.js first.');
      process.exit(1);
    }

    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.slug, cat._id);
    });

    console.log(`   ✓ Loaded ${categories.length} categories\n`);

    // Process and insert products
    console.log('🛍️  Creating products...\n');
    const createdProducts = [];
    let successCount = 0;
    let errorCount = 0;

    for (const productData of seedData) {
      try {
        // Extract category slug from reference placeholder {REF:slug}
        const categorySlug = productData.category.replace('{REF:', '').replace('}', '');
        const categoryId = categoryMap.get(categorySlug);

        if (!categoryId) {
          console.warn(`   ⚠️  Category "${categorySlug}" not found for: ${productData.name}`);
          errorCount++;
          continue;
        }

        // Create product with resolved category reference
        const product = await Product.create({
          ...productData,
          category: categoryId
        });

        createdProducts.push(product);
        successCount++;

        // Display progress for every 10th product
        if (successCount % 10 === 0) {
          console.log(`   ✓ Created ${successCount} products...`);
        }

      } catch (err) {
        console.error(`   ❌ Error creating product "${productData.name}":`, err.message);
        errorCount++;
      }
    }

    console.log(`\n   ✓ Successfully created ${successCount} products`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Failed to create ${errorCount} products`);
    }

    // Update product counts in categories
    console.log('\n📊 Updating category product counts...');
    for (const [slug, categoryId] of categoryMap) {
      const count = await Product.countDocuments({ category: categoryId, isActive: true });
      await Category.findByIdAndUpdate(categoryId, { productCount: count });
    }
    console.log('   ✓ Category product counts updated\n');

    // Generate summary statistics
    await generateSummary();

  } catch (error) {
    console.error('\n❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

async function generateSummary() {
  console.log('='.repeat(70));
  console.log('✨ Product Seeding Complete!');
  console.log('='.repeat(70));

  // Basic counts
  const total = await Product.countDocuments();
  const active = await Product.countDocuments({ isActive: true });
  const giTagged = await Product.countDocuments({ giTagged: true });
  const featured = await Product.countDocuments({ isFeatured: true });
  const inStock = await Product.countDocuments({ stock: { $gt: 0 } });
  const lowStock = await Product.countDocuments({ 
    $expr: { $lte: ['$stock', '$lowStockThreshold'] } 
  });
  const freeShipping = await Product.countDocuments({ freeShipping: true });

  console.log(`\n📊 Product Statistics:`);
  console.log(`   - Total Products: ${total}`);
  console.log(`   - Active: ${active}`);
  console.log(`   - GI Tagged: ${giTagged}`);
  console.log(`   - Featured: ${featured}`);
  console.log(`   - In Stock: ${inStock}`);
  console.log(`   - Low Stock Warning: ${lowStock}`);
  console.log(`   - Free Shipping Eligible: ${freeShipping}`);

  // Price statistics
  const priceStats = await Product.aggregate([
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
      }
    }
  ]);

  if (priceStats.length > 0) {
    const stats = priceStats[0];
    console.log(`\n💰 Pricing Overview:`);
    console.log(`   - Average Price: ₹${Math.round(stats.avgPrice)}`);
    console.log(`   - Price Range: ₹${stats.minPrice} - ₹${stats.maxPrice}`);
    console.log(`   - Total Inventory Value: ₹${Math.round(stats.totalValue).toLocaleString('en-IN')}`);
  }

  // Top 10 categories by product count
  console.log(`\n📦 Top Categories by Product Count:`);
  const topCategories = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  for (const catStat of topCategories) {
    const category = await Category.findById(catStat._id);
    if (category) {
      console.log(`   - ${category.name}: ${catStat.count} products (Avg: ₹${Math.round(catStat.avgPrice)})`);
    }
  }

  // Region distribution
  console.log(`\n🗺️  Regional Distribution (Top 10):`);
  const regionStats = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$region',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  regionStats.forEach(stat => {
    console.log(`   - ${stat._id}: ${stat.count} products`);
  });

  // Stock alerts
  console.log(`\n⚠️  Low Stock Products:`);
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  })
  .select('name stock lowStockThreshold')
  .sort({ stock: 1 })
  .limit(5);

  if (lowStockProducts.length > 0) {
    lowStockProducts.forEach(p => {
      console.log(`   - ${p.name}: ${p.stock} units (threshold: ${p.lowStockThreshold})`);
    });
  } else {
    console.log(`   ✓ All products have adequate stock`);
  }

  console.log('\n' + '='.repeat(70));
}

// Run seeder
if (require.main === module) {
  console.log('\n🚀 Bharat Bazaar - Product Seeder');
  console.log('='.repeat(70) + '\n');
}

module.exports = { seedProducts };
