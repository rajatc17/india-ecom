const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'india-ecom' })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

async function analyzeCategoryHierarchy() {
  try {
    console.log('\n🔍 ANALYZING FULL CATEGORY HIERARCHY\n');
    console.log('='.repeat(60));

    const allCategories = await Category.find({ isActive: true });
    
    // Build hierarchy
    const parentCategories = allCategories.filter(cat => !cat.parent);
    const level2Categories = allCategories.filter(cat => {
      if (!cat.parent) return false;
      const parentCat = allCategories.find(c => c._id.toString() === cat.parent.toString());
      return parentCat && !parentCat.parent;
    });
    const level3Categories = allCategories.filter(cat => {
      if (!cat.parent) return false;
      const parentCat = allCategories.find(c => c._id.toString() === cat.parent.toString());
      return parentCat && parentCat.parent;
    });

    console.log(`📊 Category Structure:`);
    console.log(`   Level 1 (Parent): ${parentCategories.length}`);
    console.log(`   Level 2 (Sub): ${level2Categories.length}`);
    console.log(`   Level 3 (Sub-sub): ${level3Categories.length}`);
    console.log(`   Total: ${allCategories.length}`);

    // Show full 3-level hierarchy for first parent
    console.log(`\n🌳 Full Category Hierarchy (first parent):\n`);
    
    const testParent = parentCategories[0];
    console.log(`📁 ${testParent.name}`);
    
    const level2Children = level2Categories.filter(c => 
      c.parent.toString() === testParent._id.toString()
    );
    
    for (const level2 of level2Children.slice(0, 2)) {
      const level3Children = level3Categories.filter(c =>
        c.parent.toString() === level2._id.toString()
      );
      
      console.log(`├─ 📂 ${level2.name}`);
      
      for (const level3 of level3Children.slice(0, 3)) {
        const productCount = await Product.countDocuments({
          category: level3._id,
          isActive: true
        });
        console.log(`│  ├─ 📄 ${level3.name} (${productCount} products)`);
      }
      if (level3Children.length > 3) {
        console.log(`│  └─ ... and ${level3Children.length - 3} more`);
      }
    }

    // SOLUTION: Recursive function to get all descendant category IDs
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 SOLUTION: Recursive Category Filter\n');

    function getAllDescendantIds(categoryId, allCategories) {
      const result = [categoryId];
      
      const children = allCategories.filter(cat => 
        cat.parent && cat.parent.toString() === categoryId.toString()
      );
      
      for (const child of children) {
        result.push(...getAllDescendantIds(child._id, allCategories));
      }
      
      return result;
    }

    console.log(`Testing with: ${testParent.name}\n`);
    
    const allDescendantIds = getAllDescendantIds(testParent._id, allCategories);
    console.log(`Step 1: Get all descendant category IDs (recursive):`);
    console.log(`   Found ${allDescendantIds.length} category IDs (including parent)`);

    console.log(`\nStep 2: Query products with $in operator:`);
    const productsInCategory = await Product.find({
      category: { $in: allDescendantIds },
      isActive: true
    }).populate('category');
    
    console.log(`   Found ${productsInCategory.length} products\n`);
    
    if (productsInCategory.length > 0) {
      console.log(`   Sample products:`);
      productsInCategory.slice(0, 5).forEach(p => {
        console.log(`   ✓ ${p.name} (${p.category?.name})`);
      });
    }

    // Show code example
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 UPDATED CODE FOR YOUR API:\n');
    console.log(`// Helper: Get all descendant category IDs recursively`);
    console.log(`async function getAllCategoryIds(categoryId) {`);
    console.log(`  const allCategories = await Category.find({ isActive: true });`);
    console.log(`  `);
    console.log(`  function getDescendants(id) {`);
    console.log(`    const result = [id];`);
    console.log(`    const children = allCategories.filter(cat =>`);
    console.log(`      cat.parent && cat.parent.toString() === id.toString()`);
    console.log(`    );`);
    console.log(`    for (const child of children) {`);
    console.log(`      result.push(...getDescendants(child._id));`);
    console.log(`    }`);
    console.log(`    return result;`);
    console.log(`  }`);
    console.log(`  `);
    console.log(`  return getDescendants(categoryId);`);
    console.log(`}`);
    console.log(``);
    console.log(`// Get products by category (any level)`);
    console.log(`async function getProductsByCategory(categoryId) {`);
    console.log(`  const allCategoryIds = await getAllCategoryIds(categoryId);`);
    console.log(`  `);
    console.log(`  const products = await Product.find({`);
    console.log(`    category: { $in: allCategoryIds },`);
    console.log(`    isActive: true`);
    console.log(`  }).populate('category');`);
    console.log(`  `);
    console.log(`  return products;`);
    console.log(`}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis complete\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

analyzeCategoryHierarchy();
