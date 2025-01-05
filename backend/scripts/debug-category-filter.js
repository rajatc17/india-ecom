const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'india-ecom' })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

async function debugCategoryFilter() {
  try {
    console.log('\n🔍 DEBUGGING CATEGORY FILTER\n');
    console.log('='.repeat(60));

    // 1. Check categories
    console.log('\n1️⃣  Checking Categories:');
    const categories = await Category.find({ isActive: true });
    console.log(`   Found ${categories.length} active categories (total)`);
    
    if (categories.length === 0) {
      console.log('   ❌ No categories found! Please create categories first.');
      return;
    }

    categories.slice(0, 5).forEach(cat => {
      console.log(`   - ${cat.name} (slug: ${cat.slug}, id: ${cat._id})`);
    });
    
    // 2. Check products
    console.log('\n2️⃣  Checking Products:');
    const allProducts = await Product.find({ isActive: true });
    console.log(`   Found ${allProducts.length} active products (total)`);
    
    if (allProducts.length === 0) {
      console.log('   ❌ No products found!');
      return;
    }

    allProducts.slice(0, 5).forEach(prod => {
      console.log(`   - ${prod.name} (category: ${prod.category})`);
    });

    // 3. Test category filter with first category
    const testCategory = categories[0];
    console.log(`\n3️⃣  Testing filter with category: ${testCategory.name}`);
    console.log(`   ID: ${testCategory._id}`);
    console.log(`   Slug: ${testCategory.slug}`);

    // Test by ID
    console.log('\n   A) Filter by ObjectId:');
    const productsByID = await Product.find({ 
      category: testCategory._id,
      isActive: true 
    }).populate('category');
    console.log(`   Found ${productsByID.length} products`);
    if (productsByID.length > 0) {
      productsByID.forEach(p => {
        console.log(`      - ${p.name} (${p.category?.name || 'No category'})`);
      });
    } else {
      console.log(`      ⚠️  No products found for this category!`);
    }

    // Test by string ID
    console.log('\n   B) Filter by String ID:');
    const productsByStringID = await Product.find({ 
      category: testCategory._id.toString(),
      isActive: true 
    }).populate('category');
    console.log(`   Found ${productsByStringID.length} products`);

    // Check product category field types
    console.log('\n4️⃣  Checking Product Category Field Types:');
    const sampleProducts = await Product.find({ isActive: true }).limit(3);
    sampleProducts.forEach((product, idx) => {
      console.log(`   Product ${idx + 1}: ${product.name}`);
      console.log(`      Category value: ${product.category}`);
      console.log(`      Category type: ${typeof product.category}`);
      console.log(`      Is ObjectId? ${product.category instanceof mongoose.Types.ObjectId}`);
    });

    // Check for products without categories
    console.log('\n5️⃣  Checking for products without categories:');
    const productsWithoutCategory = await Product.countDocuments({ 
      category: null,
      isActive: true 
    });
    console.log(`   Found ${productsWithoutCategory} products without category`);

    // 6. Check all products by each category
    console.log('\n6️⃣  Products grouped by category:');
    for (const cat of categories.slice(0, 3)) {
      const count = await Product.countDocuments({ 
        category: cat._id,
        isActive: true 
      });
      console.log(`   ${cat.name}: ${count} products`);
    }

    // 7. Check for invalid category references
    console.log('\n7️⃣  Checking for invalid category references:');
    const allProductsWithCategory = await Product.find({ 
      category: { $ne: null },
      isActive: true 
    }).populate('category');
    
    const invalidRefs = allProductsWithCategory.filter(p => !p.category);
    if (invalidRefs.length > 0) {
      console.log(`   ⚠️  Found ${invalidRefs.length} products with invalid category references:`);
      invalidRefs.forEach(p => {
        console.log(`      - ${p.name} (category ID: ${p.category})`);
      });
    } else {
      console.log(`   ✅ All product category references are valid`);
    }

    // 8. Sample aggregation query
    console.log('\n8️⃣  Category product count (aggregation):');
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true, category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    for (const stat of categoryStats) {
      const cat = await Category.findById(stat._id);
      console.log(`   ${cat?.name || 'Unknown'}: ${stat.count} products`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Debug complete\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugCategoryFilter();