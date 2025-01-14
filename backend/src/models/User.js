const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AddressSchema = new mongoose.Schema(
  {
    label: String,
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: String,
    addresses: [AddressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

// instance method to set password
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

// instance method to compare password
UserSchema.methods.validatePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// hide sensitive fields in JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
