require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const seedData = [
  {
    name: 'Blue Pottery Vase',
    category: 'Handicrafts',
    subcategory: 'Pottery',
    subsubcategory: 'Blue Pottery',
    price: 3305,
    discountedPrice: 2810,
    stock: 10,
    material: 'Ceramic',
    region: 'Rajasthan',
    giTagged: true,
    description: 'Traditional Jaipur blue pottery vase with floral motifs.',
    images: ['https://example.com/bluepottery.jpg']
  },
  {
    name: 'Kanchipuram Silk Saree',
    category: 'Handloom & Textiles',
    subcategory: 'Silk',
    subsubcategory: 'Kanchipuram Silk',
    price: 15000,
    discountedPrice: 13500,
    stock: 5,
    material: 'Silk',
    region: 'Tamil Nadu',
    giTagged: true,
    description: 'Handwoven silk saree from Kanchipuram region.',
    images: ['https://example.com/kanchipuram.jpg']
  },
  {
    name: 'Madhubani Painting',
    category: 'Paintings & Art',
    subcategory: 'Folk Art',
    subsubcategory: 'Madhubani',
    price: 4500,
    stock: 8,
    region: 'Bihar',
    giTagged: true,
    description: 'Traditional Mithila-style painting using natural pigments.',
    images: ['https://example.com/madhubani.jpg']
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'india-ecom' });
    console.log('✅ Connected to DB');

    await Product.deleteMany({});
    console.log('🧹 Old products cleared');

    await Product.insertMany(seedData);
    console.log('🌱 Sample products seeded:', seedData.length);

    await mongoose.disconnect();
    console.log('✅ Done & disconnected');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
})();