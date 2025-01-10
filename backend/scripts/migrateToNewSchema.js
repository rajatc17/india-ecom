require("dotenv").config();
const mongoose = require("mongoose");

// Import old Product model (before migration)
const OldProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  subcategory: String,
  subsubcategory: String,
  price: Number,
  discountedPrice: Number,
  stock: Number,
  material: String,
  region: String,
  giTagged: Boolean,
  description: String,
  images: [String],
}, { timestamps: true });

const OldProduct = mongoose.model('OldProduct', OldProductSchema, 'products');

// Import new models
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

async function migrateCategories() {
  console.log("\n📦 Starting Category Migration...\n");
  
  // Get all unique categories from existing products
  const products = await OldProduct.find({});
  
  const categoryMap = new Map(); // category name -> category document
  const subcategoryMap = new Map(); // subcategory name -> subcategory document
  const subsubcategoryMap = new Map(); // subsubcategory name -> subsubcategory document
  
  // Step 1: Create root categories
  console.log("Creating root categories...");
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  for (const catName of uniqueCategories) {
    try {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let category = await Category.findOne({ slug });
      
      if (!category) {
        category = await Category.create({
          name: catName,
          slug: slug,
          level: 0,
          parent: null,
          isActive: true
        });
        console.log(`  ✓ Created category: ${catName}`);
      }
      
      categoryMap.set(catName, category);
    } catch (error) {
      console.error(`  ✗ Error creating category ${catName}:`, error.message);
    }
  }
  
  // Step 2: Create subcategories
  console.log("\nCreating subcategories...");
  for (const product of products) {
    if (product.subcategory && product.category) {
      const key = `${product.category}:${product.subcategory}`;
      
      if (!subcategoryMap.has(key)) {
        try {
          const parentCategory = categoryMap.get(product.category);
          if (!parentCategory) continue;
          
          const slug = product.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          let subcategory = await Category.findOne({ slug, parent: parentCategory._id });
          
          if (!subcategory) {
            subcategory = await Category.create({
              name: product.subcategory,
              slug: slug,
              level: 1,
              parent: parentCategory._id,
              isActive: true
            });
            console.log(`  ✓ Created subcategory: ${product.subcategory} under ${product.category}`);
          }
          
          subcategoryMap.set(key, subcategory);
        } catch (error) {
          console.error(`  ✗ Error creating subcategory ${product.subcategory}:`, error.message);
        }
      }
    }
  }
  
  // Step 3: Create sub-subcategories
  console.log("\nCreating sub-subcategories...");
  for (const product of products) {
    if (product.subsubcategory && product.subcategory && product.category) {
      const key = `${product.category}:${product.subcategory}:${product.subsubcategory}`;
      
      if (!subsubcategoryMap.has(key)) {
        try {
          const parentKey = `${product.category}:${product.subcategory}`;
          const parentSubcategory = subcategoryMap.get(parentKey);
          if (!parentSubcategory) continue;
          
          const slug = product.subsubcategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          let subsubcategory = await Category.findOne({ slug, parent: parentSubcategory._id });
          
          if (!subsubcategory) {
            subsubcategory = await Category.create({
              name: product.subsubcategory,
              slug: slug,
              level: 2,
              parent: parentSubcategory._id,
              isActive: true
            });
            console.log(`  ✓ Created sub-subcategory: ${product.subsubcategory}`);
          }
          
          subsubcategoryMap.set(key, subsubcategory);
        } catch (error) {
          console.error(`  ✗ Error creating sub-subcategory ${product.subsubcategory}:`, error.message);
        }
      }
    }
  }
  
  return { categoryMap, subcategoryMap, subsubcategoryMap };
}

async function migrateProducts(categoryMap, subcategoryMap, subsubcategoryMap) {
  console.log("\n📦 Starting Product Migration...\n");
  
  const oldProducts = await OldProduct.find({});
  let successCount = 0;
  let errorCount = 0;
  
  for (const oldProduct of oldProducts) {
    try {
      // Determine which category to use (most specific available)
      let categoryId;
      
      if (oldProduct.subsubcategory && oldProduct.subcategory && oldProduct.category) {
        const key = `${oldProduct.category}:${oldProduct.subcategory}:${oldProduct.subsubcategory}`;
        const category = subsubcategoryMap.get(key);
        categoryId = category?._id;
      } else if (oldProduct.subcategory && oldProduct.category) {
        const key = `${oldProduct.category}:${oldProduct.subcategory}`;
        const category = subcategoryMap.get(key);
        categoryId = category?._id;
      } else if (oldProduct.category) {
        const category = categoryMap.get(oldProduct.category);
        categoryId = category?._id;
      }
      
      if (!categoryId) {
        console.error(`  ✗ No category found for product: ${oldProduct.name}`);
        errorCount++;
        continue;
      }
      
      // Generate slug
      const slug = oldProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ 
        $or: [
          { slug },
          { name: oldProduct.name }
        ]
      });
      
      if (existingProduct) {
        console.log(`  ⊙ Product already exists: ${oldProduct.name}`);
        continue;
      }
      
      // Convert images from string array to object array
      const images = (oldProduct.images || []).map((url, index) => ({
        url,
        alt: oldProduct.name,
        isPrimary: index === 0,
        order: index
      }));
      
      // Create new product with enhanced schema
      await Product.create({
        name: oldProduct.name,
        slug,
        category: categoryId,
        price: oldProduct.price,
        discountedPrice: oldProduct.discountedPrice,
        stock: oldProduct.stock || 0,
        material: oldProduct.material,
        region: oldProduct.region,
        giTagged: oldProduct.giTagged || false,
        description: oldProduct.description,
        images,
        isActive: true,
        isAvailable: (oldProduct.stock || 0) > 0,
        createdAt: oldProduct.createdAt,
        updatedAt: oldProduct.updatedAt
      });
      
      successCount++;
      console.log(`  ✓ Migrated product: ${oldProduct.name}`);
      
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error migrating product ${oldProduct.name}:`, error.message);
    }
  }
  
  console.log(`\n✓ Migration complete: ${successCount} products migrated, ${errorCount} errors`);
}

async function updateProductCounts() {
  console.log("\n📊 Updating category product counts...\n");
  
  const categories = await Category.find({});
  
  for (const category of categories) {
    const count = await Product.countDocuments({ category: category._id });
    category.productCount = count;
    await category.save();
    console.log(`  ✓ ${category.name}: ${count} products`);
  }
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "india-ecom" });
    console.log("✓ Connected to database\n");
    
    // Step 1: Migrate categories
    const { categoryMap, subcategoryMap, subsubcategoryMap } = await migrateCategories();
    
    // Step 2: Migrate products
    await migrateProducts(categoryMap, subcategoryMap, subsubcategoryMap);
    
    // Step 3: Update product counts
    await updateProductCounts();
    
    console.log("\n✅ Migration completed successfully!\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  }
})();
