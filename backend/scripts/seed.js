require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

async function seedCategories() {
  console.log('\n📦 Seeding Categories...\n');
  
  // Clear existing categories
  await Category.deleteMany({});
  
  // Create root categories
  const handicrafts = await Category.create({
    name: 'Handicrafts',
    slug: 'handicrafts',
    description: 'Traditional Indian handicrafts',
    icon: '🎨',
    level: 0,
    sortOrder: 1
  });
  
  const textiles = await Category.create({
    name: 'Handloom & Textiles',
    slug: 'handloom-textiles',
    description: 'Traditional Indian textiles and fabrics',
    icon: '🧵',
    level: 0,
    sortOrder: 2
  });
  
  const art = await Category.create({
    name: 'Paintings & Art',
    slug: 'paintings-art',
    description: 'Traditional and folk art',
    icon: '🖼️',
    level: 0,
    sortOrder: 3
  });
  
  // Create subcategories under Handicrafts
  const pottery = await Category.create({
    name: 'Pottery',
    slug: 'pottery',
    parent: handicrafts._id,
    level: 1,
    sortOrder: 1
  });
  
  const bluePottery = await Category.create({
    name: 'Blue Pottery',
    slug: 'blue-pottery',
    parent: pottery._id,
    level: 2,
    sortOrder: 1
  });
  
  // Create subcategories under Textiles
  const silk = await Category.create({
    name: 'Silk',
    slug: 'silk',
    parent: textiles._id,
    level: 1,
    sortOrder: 1
  });
  
  const kanchipuramSilk = await Category.create({
    name: 'Kanchipuram Silk',
    slug: 'kanchipuram-silk',
    parent: silk._id,
    level: 2,
    sortOrder: 1
  });
  
  // Create subcategories under Art
  const folkArt = await Category.create({
    name: 'Folk Art',
    slug: 'folk-art',
    parent: art._id,
    level: 1,
    sortOrder: 1
  });
  
  const madhubani = await Category.create({
    name: 'Madhubani',
    slug: 'madhubani',
    parent: folkArt._id,
    level: 2,
    sortOrder: 1
  });
  
  console.log('✅ Categories created successfully\n');
  
  return {
    bluePottery,
    kanchipuramSilk,
    madhubani,
    handicrafts,
    textiles,
    art
  };
}

async function seedProducts(categories) {
  console.log('📦 Seeding Products...\n');
  
  // Clear existing products
  await Product.deleteMany({});
  
  const seedData = [
    {
      name: 'Blue Pottery Vase',
      slug: 'blue-pottery-vase',
      category: categories.bluePottery._id,
      price: 3305,
      discountedPrice: 2810,
      stock: 10,
      material: 'Ceramic',
      region: 'Rajasthan',
      giTagged: true,
      description: 'Traditional Jaipur blue pottery vase with floral motifs.',
      images: [{
        url: 'https://example.com/bluepottery.jpg',
        alt: 'Blue Pottery Vase from Jaipur',
        isPrimary: true,
        order: 0
      }],
      tags: ['pottery', 'blue-pottery', 'jaipur', 'gi-tagged'],
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Kanchipuram Silk Saree',
      slug: 'kanchipuram-silk-saree',
      category: categories.kanchipuramSilk._id,
      price: 15000,
      discountedPrice: 13500,
      stock: 5,
      material: 'Silk',
      region: 'Tamil Nadu',
      giTagged: true,
      description: 'Handwoven silk saree from Kanchipuram region.',
      images: [{
        url: 'https://example.com/kanchipuram.jpg',
        alt: 'Kanchipuram Silk Saree',
        isPrimary: true,
        order: 0
      }],
      tags: ['silk', 'saree', 'kanchipuram', 'gi-tagged'],
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Madhubani Painting',
      slug: 'madhubani-painting',
      category: categories.madhubani._id,
      price: 4500,
      stock: 8,
      region: 'Bihar',
      giTagged: true,
      description: 'Traditional Mithila-style painting using natural pigments.',
      images: [{
        url: 'https://example.com/madhubani.jpg',
        alt: 'Madhubani Painting from Bihar',
        isPrimary: true,
        order: 0
      }],
      tags: ['painting', 'madhubani', 'folk-art', 'gi-tagged'],
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Terracotta Clay Diya Set',
      slug: 'terracotta-clay-diya-set',
      category: categories.handicrafts._id,
      price: 299,
      discountedPrice: 249,
      stock: 50,
      material: 'Terracotta',
      region: 'West Bengal',
      giTagged: false,
      description: 'Set of 10 handmade terracotta diyas for festivals.',
      images: [{
        url: 'https://example.com/diya.jpg',
        alt: 'Terracotta Diya Set',
        isPrimary: true,
        order: 0
      }],
      tags: ['diya', 'terracotta', 'festival', 'handicraft'],
      isActive: true,
      isFeatured: false,
      lowStockThreshold: 10
    },
    {
      name: 'Banarasi Silk Dupatta',
      slug: 'banarasi-silk-dupatta',
      category: categories.textiles._id,
      price: 5500,
      discountedPrice: 4950,
      stock: 12,
      material: 'Silk',
      region: 'Uttar Pradesh',
      giTagged: true,
      description: 'Elegant Banarasi silk dupatta with gold zari work.',
      images: [{
        url: 'https://example.com/banarasi-dupatta.jpg',
        alt: 'Banarasi Silk Dupatta',
        isPrimary: true,
        order: 0
      }],
      tags: ['banarasi', 'silk', 'dupatta', 'zari', 'gi-tagged'],
      isActive: true,
      isFeatured: true
    }
  ];
  
  const products = await Product.insertMany(seedData);
  console.log(`✅ ${products.length} products created successfully\n`);
  
  return products;
}

async function updateCategoryCounts() {
  console.log('📊 Updating category product counts...\n');
  
  const categories = await Category.find({});
  
  for (const category of categories) {
    const count = await Product.countDocuments({ category: category._id });
    category.productCount = count;
    await category.save();
    console.log(`  ✓ ${category.name}: ${count} products`);
  }
  
  console.log('');
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'india-ecom' });
    console.log('✅ Connected to DB\n');

    // Step 1: Seed categories
    const categories = await seedCategories();
    
    // Step 2: Seed products
    await seedProducts(categories);
    
    // Step 3: Update product counts
    await updateCategoryCounts();

    await mongoose.disconnect();
    console.log('✅ Seeding complete & disconnected\n');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();