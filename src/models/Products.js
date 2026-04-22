// backend/src/models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['courses', 'ebooks', 'music', 'photos', 'software', 'templates', 'uikits'],
    required: true
  },
  description: { type: String, trim: true },

  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },

  coverImage: { type: String },

  // ✅ FIXED: Array of objects, not strings
  files: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  }],

  customizable: { type: Boolean, default: false },
  
  editableFields: [{
    type: { type: String, enum: ['text', 'image', 'signature'] },
    label: { type: String }
  }],

  liveSession: {
    title: String,
    date: Date,
    time: String,
    duration: Number,
    maxAttendees: Number,
    price: Number,
    description: String,
    isScheduled: { type: Boolean, default: false }
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },

  salesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },

}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text', category: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);