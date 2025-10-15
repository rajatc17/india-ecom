const mongoose = require('mongoose');
const Category = require('../src/models/Category'); // Adjust path as needed
const seedData = require('./category_seed_data.json');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bharat_bazaar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'india-ecom'
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  await seedCategories();
});

async function seedCategories() {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Map to store references by name
    const categoryRefs = new Map();

    // Phase 1: Insert top-level categories (level 0)
    console.log('\n📦 Phase 1: Creating top-level categories...');
    const topLevel = seedData.filter(cat => cat.level === 0);

    for (const catData of topLevel) {
      const category = await Category.create(catData);
      categoryRefs.set(catData.name, category._id);
      console.log(`   ✓ ${catData.icon} ${catData.name}`);
    }

    // Phase 2: Insert subcategories (level 1)
    console.log('\n📦 Phase 2: Creating subcategories...');
    const subLevel = seedData.filter(cat => cat.level === 1);

    for (const catData of subLevel) {
      // Replace placeholder with actual parent ID
      const parentName = catData.parent.replace('{REF:', '').replace('}', '');
      const parentId = categoryRefs.get(parentName);

      if (!parentId) {
        console.warn(`   ⚠️  Parent not found for: ${catData.name}`);
        continue;
      }

      const category = await Category.create({
        ...catData,
        parent: parentId
      });

      categoryRefs.set(catData.name, category._id);
      console.log(`   ✓ ${catData.name} (under ${parentName})`);
    }

    // Phase 3: Insert sub-subcategories (level 2)
    console.log('\n📦 Phase 3: Creating sub-subcategories...');
    const subSubLevel = seedData.filter(cat => cat.level === 2);

    for (const catData of subSubLevel) {
      // Replace placeholder with actual parent ID
      const parentName = catData.parent.replace('{REF:', '').replace('}', '');
      const parentId = categoryRefs.get(parentName);

      if (!parentId) {
        console.warn(`   ⚠️  Parent not found for: ${catData.name}`);
        continue;
      }

      await Category.create({
        ...catData,
        parent: parentId
      });

      console.log(`   ✓ ${catData.name}`);
    }

    // Summary
    const total = await Category.countDocuments();
    const rootCount = await Category.countDocuments({ level: 0 });
    const subCount = await Category.countDocuments({ level: 1 });
    const leafCount = await Category.countDocuments({ level: 2 });

    console.log('\n' + '='.repeat(60));
    console.log('✨ Category Seeding Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total Categories: ${total}`);
    console.log(`   - Root Categories: ${rootCount}`);
    console.log(`   - Subcategories: ${subCount}`);
    console.log(`   - Leaf Categories: ${leafCount}`);
    console.log('='.repeat(60));

    // Display category tree
    console.log('\n🌳 Category Tree Preview:\n');
    const tree = await Category.getTree();
    displayTree(tree);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

function displayTree(categories, indent = '') {
  categories.forEach((cat, idx) => {
    const isLast = idx === categories.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const childIndent = indent + (isLast ? '  ' : '│ ');

    console.log(`${indent}${prefix} ${cat.icon || '📁'} ${cat.name} (${cat.productCount} products)`);

    if (cat.children && cat.children.length > 0) {
      displayTree(cat.children, childIndent);
    }
  });
}

// Run if called directly
if (require.main === module) {
  console.log('🌱 Starting category seeding process...');
}
