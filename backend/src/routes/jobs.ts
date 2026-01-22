import express, { type Request, type Response } from 'express';
import { Job } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, job_type } = req.query;
    const query: any = {};
    
    if (status) query.status = status;
    if (job_type) query.job_type = job_type;

    const jobs = await Job.find(query)
      .sort({ created_at: -1 });
    
    return res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description || null,
      job_type: req.body.job_type || null,
      location: req.body.location || null,
      compensation: req.body.compensation || null,
      experience: req.body.experience || null,
      company_name: req.body.company_name || null,
      contact_email: req.body.contact_email || null,
      contact_number: req.body.contact_number || null,
      posted_by_user_id: req.user!.user_id,
      status: 'open',
      deadline_date: req.body.deadline_date || null
    });

    return res.status(201).json({ id: job._id, success: true });
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOneAndUpdate(
      { 
        _id: req.params.id,
        posted_by_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({ job, success: true });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOneAndDelete({ 
      _id: req.params.id,
      posted_by_user_id: req.user!.user_id 
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
