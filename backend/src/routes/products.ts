import express, { Response } from 'express';
import { BusinessProduct } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const products = await BusinessProduct.find({ business_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    return res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const product = await BusinessProduct.create({
      business_user_id: req.user!.user_id,
      name: req.body.name,
      description: req.body.description || null,
      category: req.body.category || null,
      manufacturer: req.body.manufacturer || null,
      model_number: req.body.model_number || null,
      specifications: req.body.specifications || null,
      dealer_price: req.body.dealer_price || null,
      customer_price: req.body.customer_price || null,
      currency: req.body.currency || "INR",
      is_active: true
    });

    return res.status(201).json({ id: product._id, success: true });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const product = await BusinessProduct.findOne({ 
      _id: req.params.id,
      business_user_id: req.user!.user_id 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const product = await BusinessProduct.findOneAndUpdate(
      { 
        _id: req.params.id,
        business_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product, success: true });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const product = await BusinessProduct.findOneAndDelete({ 
      _id: req.params.id,
      business_user_id: req.user!.user_id 
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
