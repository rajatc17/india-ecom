const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AddressSchema = new mongoose.Schema(
  {
    label: { 
      type: String, 
      enum: ['Home', 'Work', 'Other'], 
      default: 'Home' 
    },
    fullName: { type: String, required: true },
    phone: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Invalid phone number'
      }
    },
    line1: { type: String, required: true, maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    landmark: String,
    city: { type: String, required: true },
    state: { 
      type: String, 
      required: true,
      enum: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
        'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
        'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
        'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh', 
        'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
        'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
      ]
    },
    pincode: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Invalid pincode format'
      }
    },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
    type: { 
      type: String, 
      enum: ['billing', 'shipping', 'both'], 
      default: 'both' 
    }
  },
  { timestamps: true }
);

const WishlistItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    // Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    
    // Profile
    name: { type: String, trim: true },
    phone: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[6-9]\d{9}$/.test(v);
        },
        message: 'Invalid phone number'
      }
    },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer-not-to-say'] 
    },
    dateOfBirth: Date,
    
    // E-commerce
    addresses: [AddressSchema],
    wishlist: [WishlistItemSchema],
    
    // Role
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    
    // Tracking
    lastLogin: Date,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

UserSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault);
});

// Indexes
UserSchema.index({ name: 'text', email: 'text' });

// Password methods
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

UserSchema.methods.validatePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Address methods
UserSchema.methods.setDefaultAddress = async function(addressId) {
  this.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId.toString();
  });
  return this.save();
};

// Wishlist methods
UserSchema.methods.addToWishlist = async function(productId) {
  if (!this.wishlist.some(item => item.product.equals(productId))) {
    this.wishlist.push({ product: productId });
    return this.save();
  }
  return this;
};

UserSchema.methods.removeFromWishlist = async function(productId) {
  this.wishlist = this.wishlist.filter(
    item => !item.product.equals(productId)
  );
  return this.save();
};

// Utility methods
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

// Hide sensitive fields in JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
