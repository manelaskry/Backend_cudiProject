const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// ✅ SIGNED UPLOAD — Backend signe seulement
router.post('/sign', protect, (req, res) => {
  try {
    const { folder = 'cudi/products' } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );
    
    res.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de signature' });
  }
});

module.exports = router;