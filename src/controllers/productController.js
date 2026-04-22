const mongoose = require('mongoose');
const Product = require('../models/Products');
const Order = require('../models/Order');

// ─── CREATE PRODUCT (Seller only) ───
exports.createProduct = async (req, res) => {
  try {
    const {
      title, category, description, price, discount,
      coverImage, customizable, editableFields, liveSession, files
    } = req.body;

    const product = new Product({
      seller: req.user.id,
      title,
      category,
      description,
      price: Number(price),
      discount: Number(discount) || 0,
      coverImage,
      files: files || [],        // ✅ Already array of objects from frontend
      customizable: Boolean(customizable),
      editableFields: editableFields || [],
      liveSession: liveSession || undefined
    });

    await product.save();
    
    // ✅ Send response ONLY ONCE
    res.status(201).json(product);

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du produit' });
  }
};
// ─── GET ALL PRODUCTS (Public) ───
exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const filter = { status: 'published' };

    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Product.find(filter).populate('seller', 'name avatar');

    // Sort options
    if (sort === 'price-asc') query = query.sort({ price: 1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    else if (sort === 'popular') query = query.sort({ salesCount: -1 });

    const products = await query.exec();
    res.json(products);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET SINGLE PRODUCT ───
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name avatar');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET SELLER'S PRODUCTS ───
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── UPDATE PRODUCT ───
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── DELETE PRODUCT ───
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }

    res.json({ message: 'Produit supprimé' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PURCHASE PRODUCT (Buyer) ───
exports.purchaseProduct = async (req, res) => {
  try {
    const { productId, customizationData } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Calculate final price
    const discountAmount = (product.price * (product.discount || 0)) / 100;
    const finalPrice = product.price - discountAmount;

    // Check if already purchased
    const existingOrder = await Order.findOne({ buyer: buyerId, product: productId });
    if (existingOrder) {
      return res.status(400).json({ message: 'Vous avez déjà acheté ce produit' });
    }

    // Create order
    const order = await Order.create({
      buyer: buyerId,
      product: productId,
      seller: product.seller,
      originalPrice: product.price,
      discountApplied: product.discount,
      finalPrice,
      customizationData: customizationData || [],
      paymentStatus: 'completed'  // TODO: integrate real payment (Stripe/PayPal)
    });

    // Increment sales count
    await Product.findByIdAndUpdate(productId, { $inc: { salesCount: 1 } });

    res.status(201).json({
      message: 'Achat réussi',
      order,
      downloadUrl: `/api/products/${productId}/download`  // TODO: implement secure download
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Erreur lors de lachat' });
  }
};

// ─── GET PURCHASED PRODUCTS (Buyer) ───
exports.getMyPurchases = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('product', 'title coverImage files category')
      .populate('seller', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};