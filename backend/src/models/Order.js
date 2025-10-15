const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const OrderItemSchema = new Schema(
  {
    product: { 
      type: Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    // Snapshot of product at time of order
    name: { type: String, required: true },
    slug: String,
    sku: String,
    image: String,
    
    // Pricing
    price: { type: Number, required: true, min: 0 },
    discountedPrice: Number,
    unitPrice: { type: Number, required: true, min: 0 },
    
    // Quantity
    qty: { type: Number, required: true, min: 1 },
    
    // Calculated
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const OrderAddressSchema = new Schema(
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
    line1: { type: String, required: true },
    line2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Invalid pincode'
      }
    },
    country: { type: String, default: 'India' }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    // Order Info
    orderNumber: { 
      type: String, 
      unique: true, 
      index: true 
    },
    
    // User
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Items
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'Order must have at least one item'
      }
    },
    
    // Pricing
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    
    // Payment
    paymentMethod: { 
      type: String, 
      enum: ['cod', 'online', 'upi', 'card', 'wallet'],
      required: true
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentId: String,
    paidAt: Date,
    
    // Shipping
    address: { type: OrderAddressSchema, required: true },
    shippingStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'out-for-delivery', 'delivered'],
      default: 'pending'
    },
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date,
    
    // Overall Status
    status: { 
      type: String, 
      enum: ['created', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'created',
      index: true
    },
    
    // Cancellation
    cancelledAt: Date,
    cancelReason: String,
    
    // Notes
    customerNotes: String,
    adminNotes: String,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, status: 1 });

// Pre-save: Generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save: Calculate totals
OrderSchema.pre('save', function(next) {
  // Calculate item subtotals
  this.items.forEach(item => {
    if (!item.subtotal) {
      item.subtotal = item.unitPrice * item.qty;
    }
  });
  
  // Calculate order subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calculate total
  this.total = this.subtotal + this.shippingFee + this.tax - this.discount;
  
  next();
});

// Instance Methods
OrderSchema.methods.canBeCancelled = function() {
  return ['created', 'confirmed', 'processing'].includes(this.status);
};

OrderSchema.methods.cancelOrder = async function(reason) {
  if (!this.canBeCancelled()) {
    throw new Error('Order cannot be cancelled in current status');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  
  return this.save();
};

OrderSchema.methods.markAsPaid = async function(paymentId) {
  this.paymentStatus = 'paid';
  this.paymentId = paymentId;
  this.paidAt = new Date();
  
  if (this.status === 'created') {
    this.status = 'confirmed';
  }
  
  return this.save();
};

OrderSchema.methods.updateShipping = async function(status, trackingNumber) {
  this.shippingStatus = status;
  
  if (trackingNumber) {
    this.trackingNumber = trackingNumber;
  }
  
  if (status === 'shipped') {
    this.shippedAt = new Date();
    this.status = 'shipped';
  }
  
  if (status === 'delivered') {
    this.deliveredAt = new Date();
    this.status = 'delivered';
  }
  
  return this.save();
};

// Virtuals
OrderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

OrderSchema.virtual('isRecent').get(function() {
  return this.daysSinceOrder <= 7;
});

module.exports = model("Order", OrderSchema);
