const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Pricing at time of purchase
  originalPrice: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },

  // For customizable products: buyer's filled data
  customizationData: [{
    fieldId: String,
    type: { type: String, enum: ['text', 'image', 'signature'] },
    value: String       // text content or image URL
  }],

  // For live courses: enrollment info
  liveEnrollment: {
    enrolledAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false }
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed'],
    default: 'pending'
  },

  // Access to files (generate secure URL or token)
  fileAccess: {
    accessToken: String,
    expiresAt: Date,
    downloadsLeft: { type: Number, default: 5 }  // limit downloads
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);