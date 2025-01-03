const fs = require('fs/promises');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const { uploadImage } = require('../src/utils/cloudinary');

const SEED_PATH = path.join(__dirname, 'products_100_seed.json');
const OUTPUT_PATH = SEED_PATH;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || '1024x1024';

const VIEW_LABELS = [
  'Front angle',
  'Side angle',
  'Top view',
  'Lifestyle usage'
];

function ensureOpenAIConfig() {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OpenAI config. Set OPENAI_API_KEY.');
  }
}

function buildPrompt(product, viewLabel) {
  const parts = [
    product.name,
    product.material ? `Material: ${product.material}` : null,
    product.brand ? `Brand: ${product.brand}` : null,
    product.region ? `Region: ${product.region}` : null
  ].filter(Boolean);

  return [
    `High-quality studio product photo of ${product.name}.`,
    parts.length > 1 ? parts.join('. ') + '.' : null,
    `View: ${viewLabel}.`,
    'Clean neutral background, realistic lighting, sharp focus, no text, no watermark.'
  ].filter(Boolean).join(' ');
}

function extractImageData(response) {
  const data = response?.data?.[0];
  if (data?.b64_json) return data.b64_json;
  if (data?.url) return data.url;
  return null;
}

const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateImage(prompt) {
  ensureOpenAIConfig();

  const response = await ai.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: OPENAI_IMAGE_SIZE,
    response_format: 'b64_json'
  });

  const imageData = extractImageData(response);

  if (!imageData) {
    throw new Error('OpenAI response did not include image data.');
  }

  return imageData;
}

async function generateImagesForProduct(product) {
  const images = [];

  for (let i = 0; i < VIEW_LABELS.length; i += 1) {
    const viewLabel = VIEW_LABELS[i];
    const prompt = buildPrompt(product, viewLabel);

    console.log(`   🎨 Generating image ${i + 1}/4 for ${product.slug} (${viewLabel})`);
    const imageData = await generateImage(prompt);

    console.log(`   ☁️  Uploading image ${i + 1}/4 for ${product.slug}`);
    const uploadResult = await uploadImage({
      imageData,
      folder: `products/${product.slug}`,
      publicId: `${product.slug}-${i + 1}`
    });

    images.push({
      url: uploadResult.secure_url || uploadResult.url,
      alt: `${product.name} View ${i + 1}`,
      isPrimary: i === 0,
      order: i + 1
    });
  }

  return images;
}

async function main() {
  const raw = await fs.readFile(SEED_PATH, 'utf-8');
  const products = JSON.parse(raw);

  console.log(`📦 Loaded ${products.length} products from seed file`);
  console.log('🧹 Overwriting all product images with new Cloudinary uploads');

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    console.log(`\n🔧 Processing ${index + 1}/${products.length}: ${product.slug}`);

    try {
      product.images = await generateImagesForProduct(product);
    } catch (error) {
      console.error(`   ❌ Failed for ${product.slug}: ${error.message}`);
      throw error;
    }
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(products, null, 2));
  console.log(`\n✅ Seed file updated: ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error('\n❌ Image generation failed:', error);
  process.exit(1);
});
