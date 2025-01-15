const { Schema, model } = require("mongoose");

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, index: true },
    subcategory: { type: String, index: true },
    subsubcategory: { type: String, index: true }, // optional third level
    price: { type: Number, required: true },
    discountedPrice: Number,
    stock: { type: Number, default: 0 },
    material: String,
    region: { type: String, index: true },
    giTagged: { type: Boolean, default: false },
    description: String,
    images: [String],
  },
  { timestamps: true }
);

module.exports = model('Product', ProductSchema);