import express, { type Response } from 'express';

const router = express.Router();

router.get('/', async (_req, res: Response) => {
  try {
    const specialities = [
      { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular system' },
      { id: 2, name: 'Orthopedics', description: 'Bones, joints, and musculoskeletal system' },
      { id: 3, name: 'Neurology', description: 'Nervous system and brain' },
      { id: 4, name: 'Oncology', description: 'Cancer treatment and care' },
      { id: 5, name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents' },
      { id: 6, name: 'Gynecology', description: 'Women\'s reproductive health' },
      { id: 7, name: 'Dermatology', description: 'Skin, hair, and nails' },
      { id: 8, name: 'Ophthalmology', description: 'Eye care and vision' },
      { id: 9, name: 'ENT (Ear, Nose, Throat)', description: 'Ear, nose, and throat conditions' },
      { id: 10, name: 'Urology', description: 'Urinary tract and male reproductive system' },
      { id: 11, name: 'Gastroenterology', description: 'Digestive system' },
      { id: 12, name: 'Pulmonology', description: 'Respiratory system and lungs' },
      { id: 13, name: 'Endocrinology', description: 'Hormones and metabolism' },
      { id: 14, name: 'Rheumatology', description: 'Autoimmune and joint diseases' },
      { id: 15, name: 'Nephrology', description: 'Kidney function and diseases' },
      { id: 16, name: 'Psychiatry', description: 'Mental health and behavioral disorders' },
      { id: 17, name: 'Anesthesiology', description: 'Pain management and anesthesia' },
      { id: 18, name: 'Radiology', description: 'Medical imaging and diagnostics' },
      { id: 19, name: 'Pathology', description: 'Disease diagnosis through laboratory analysis' },
      { id: 20, name: 'Emergency Medicine', description: 'Acute care and emergency treatment' },
      { id: 21, name: 'Biomedical Engineering', description: 'Medical equipment and technology' },
      { id: 22, name: 'Nursing', description: 'Patient care and medical support' },
      { id: 23, name: 'Physiotherapy', description: 'Physical therapy and rehabilitation' },
      { id: 24, name: 'Ambulance Services', description: 'Emergency medical transportation' }
    ];

    return res.json(specialities);
  } catch (error) {
    console.error('Get specialities error:', error);
    return res.status(500).json({ error: 'Failed to fetch specialities' });
  }
});

export default router;

