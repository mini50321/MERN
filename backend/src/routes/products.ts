import express, { type Response } from 'express';
import { BusinessProduct } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res: Response) => {
  try {
    const products = [
      { id: 1, name: 'X-Ray Machines', speciality_id: 2, description: 'Medical imaging equipment' },
      { id: 2, name: 'MRI Scanners', speciality_id: 2, description: 'Magnetic resonance imaging systems' },
      { id: 3, name: 'CT Scanners', speciality_id: 2, description: 'Computed tomography equipment' },
      { id: 4, name: 'Ultrasound Machines', speciality_id: 2, description: 'Ultrasonic diagnostic equipment' },
      { id: 5, name: 'ECG Machines', speciality_id: 1, description: 'Electrocardiogram devices' },
      { id: 6, name: 'Defibrillators', speciality_id: 1, description: 'Cardiac resuscitation equipment' },
      { id: 7, name: 'Ventilators', speciality_id: 12, description: 'Respiratory support equipment' },
      { id: 8, name: 'Patient Monitors', speciality_id: 20, description: 'Vital signs monitoring systems' },
      { id: 9, name: 'Infusion Pumps', speciality_id: 20, description: 'Medication delivery systems' },
      { id: 10, name: 'Surgical Instruments', speciality_id: 2, description: 'Operating room equipment' },
      { id: 11, name: 'Endoscopy Equipment', speciality_id: 11, description: 'Minimally invasive diagnostic tools' },
      { id: 12, name: 'Dialysis Machines', speciality_id: 15, description: 'Kidney treatment equipment' },
      { id: 13, name: 'Anesthesia Machines', speciality_id: 17, description: 'Anesthesia delivery systems' },
      { id: 14, name: 'Laboratory Equipment', speciality_id: 19, description: 'Lab testing and analysis tools' },
      { id: 15, name: 'Wheelchairs', speciality_id: 23, description: 'Mobility assistance devices' },
      { id: 16, name: 'Hospital Beds', speciality_id: 20, description: 'Patient care beds' },
      { id: 17, name: 'Stethoscopes', speciality_id: 1, description: 'Basic diagnostic tool' },
      { id: 18, name: 'Blood Pressure Monitors', speciality_id: 1, description: 'Hypertension monitoring devices' },
      { id: 19, name: 'Glucometers', speciality_id: 13, description: 'Blood glucose monitoring' },
      { id: 20, name: 'Pulse Oximeters', speciality_id: 12, description: 'Oxygen saturation monitors' },
      { id: 21, name: 'Nebulizers', speciality_id: 12, description: 'Respiratory medication delivery' },
      { id: 22, name: 'Oxygen Concentrators', speciality_id: 12, description: 'Oxygen therapy equipment' },
      { id: 23, name: 'Surgical Lights', speciality_id: 2, description: 'Operating room lighting' },
      { id: 24, name: 'Autoclaves', speciality_id: 2, description: 'Sterilization equipment' },
      { id: 25, name: 'Electrosurgical Units', speciality_id: 2, description: 'Surgical cutting and coagulation' },
      { id: 26, name: 'Laparoscopic Equipment', speciality_id: 2, description: 'Minimally invasive surgery tools' },
      { id: 27, name: 'C-Arm Systems', speciality_id: 2, description: 'Mobile X-ray imaging' },
      { id: 28, name: 'Bone Densitometers', speciality_id: 2, description: 'Bone density measurement' },
      { id: 29, name: 'Mammography Systems', speciality_id: 6, description: 'Breast imaging equipment' },
      { id: 30, name: 'Dental X-Ray Units', speciality_id: 2, description: 'Dental imaging equipment' }
    ];

    return res.json(products);
  } catch (error) {
    console.error('Get products catalog error:', error);
    return res.status(500).json({ error: 'Failed to fetch products catalog' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    console.log('Fetching business products for user:', userId);
    
    const products = await BusinessProduct.find({ business_user_id: userId })
      .sort({ created_at: -1 });
    
    console.log(`Found ${products.length} products for user ${userId}`);
    
    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id.toString()
    }));
    
    return res.json(formattedProducts);
  } catch (error) {
    console.error('Get business products error:', error);
    return res.status(500).json({ error: 'Failed to fetch business products' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    console.log('Creating product for user:', userId);
    console.log('Product data:', JSON.stringify(req.body));
    
    const product = await BusinessProduct.create({
      business_user_id: userId,
      name: req.body.name,
      description: req.body.description || null,
      category: req.body.category || null,
      manufacturer: req.body.manufacturer || null,
      model_number: req.body.model_number || null,
      specifications: req.body.specifications || null,
      dealer_price: req.body.dealer_price ? Number(req.body.dealer_price) : null,
      customer_price: req.body.customer_price ? Number(req.body.customer_price) : null,
      currency: req.body.currency || "INR",
      is_active: true
    });

    console.log('Product created successfully:', product._id.toString());
    
    const productObj = product.toObject();
    return res.status(201).json({ 
      ...productObj,
      id: product._id.toString(),
      success: true 
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    console.error('Error details:', error?.message);
    console.error('Stack trace:', error?.stack);
    return res.status(500).json({ 
      error: 'Failed to create product',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const mongoose = await import('mongoose');
    
    let product;
    if (mongoose.default.Types.ObjectId.isValid(productId)) {
      product = await BusinessProduct.findOne({ 
        _id: new mongoose.default.Types.ObjectId(productId),
        business_user_id: req.user!.user_id 
      });
    } else {
      product = await BusinessProduct.findOne({ 
        _id: productId,
        business_user_id: req.user!.user_id 
      });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error: any) {
    console.error('Get product error:', error);
    console.error('Error details:', error?.message);
    return res.status(500).json({ error: 'Failed to fetch product', details: error?.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const userId = req.user!.user_id;
    const mongoose = await import('mongoose');
    
    console.log('Update product - productId:', productId, 'userId:', userId, 'body:', JSON.stringify(req.body));
    
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.description !== undefined) updateData.description = req.body.description ? String(req.body.description) : null;
    if (req.body.category !== undefined) updateData.category = req.body.category ? String(req.body.category) : null;
    if (req.body.manufacturer !== undefined) updateData.manufacturer = req.body.manufacturer ? String(req.body.manufacturer) : null;
    if (req.body.model_number !== undefined) updateData.model_number = req.body.model_number ? String(req.body.model_number) : null;
    if (req.body.specifications !== undefined) updateData.specifications = req.body.specifications ? String(req.body.specifications) : null;
    if (req.body.dealer_price !== undefined && req.body.dealer_price !== '') {
      updateData.dealer_price = Number(req.body.dealer_price);
    } else if (req.body.dealer_price === '') {
      updateData.dealer_price = null;
    }
    if (req.body.customer_price !== undefined && req.body.customer_price !== '') {
      updateData.customer_price = Number(req.body.customer_price);
    } else if (req.body.customer_price === '') {
      updateData.customer_price = null;
    }
    if (req.body.currency !== undefined) updateData.currency = String(req.body.currency || "INR");
    if (req.body.is_active !== undefined) updateData.is_active = Boolean(req.body.is_active);
    
    let product;
    
    if (mongoose.default.Types.ObjectId.isValid(productId)) {
      product = await BusinessProduct.findOneAndUpdate(
        { 
          _id: new mongoose.default.Types.ObjectId(productId),
          business_user_id: userId 
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      const allProducts = await BusinessProduct.find({ business_user_id: userId });
      const numericId = parseInt(productId);
      
      let foundProduct = null;
      
      if (!isNaN(numericId)) {
        foundProduct = allProducts.find((p: any) => {
          const objIdStr = p._id.toString();
          const lastDigits = objIdStr.slice(-8);
          const lastDigitsNum = parseInt(lastDigits, 16);
          return lastDigitsNum === numericId || objIdStr.includes(productId);
        });
      }
      
      if (!foundProduct) {
        foundProduct = allProducts.find((p: any) => p._id.toString().includes(productId));
      }
      
      if (foundProduct) {
        product = await BusinessProduct.findOneAndUpdate(
          { _id: foundProduct._id, business_user_id: userId },
          { $set: updateData },
          { new: true, runValidators: true }
        );
      }
    }

    if (!product) {
      console.log('Product not found for update - productId:', productId, 'userId:', userId);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product updated successfully');
    const productObj = product.toObject();
    return res.json({ 
      ...productObj,
      id: productObj._id?.toString() || productId,
      success: true 
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    console.error('Error details:', error?.message);
    console.error('Stack trace:', error?.stack);
    return res.status(500).json({ 
      error: 'Failed to update product',
      details: error?.message || 'Unknown error'
    });
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
