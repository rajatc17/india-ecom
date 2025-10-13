const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: String,
    unitPrice: Number,
    qty: Number,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    status: { type: String, default: "created" }, // created, paid, shipped, cancelled
    address: {
      label: String,
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
