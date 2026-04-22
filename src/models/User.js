const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  name: { 
    type: String 
  },
  avatar: {
     type: String 
    },
  googleId: { 
    type: String 
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);