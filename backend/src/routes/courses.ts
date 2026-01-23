import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    const baseCourses = [
      {
        id: 1,
        title: 'Introduction to Biomedical Equipment Maintenance',
        description: 'Learn the fundamentals of maintaining biomedical equipment in hospitals and clinics.',
        duration_hours: 3,
        modules_count: 5,
        category: 'Equipment Maintenance',
        thumbnail_gradient: 'from-blue-500 to-cyan-500',
        image_url: '',
        average_rating: 4.8,
        total_reviews: 12,
        total_enrollments: 45,
        instructor_name: 'Mavy Instructor',
        price: 0,
        currency: 'INR',
        equipment_name: 'General Biomedical Equipment',
        equipment_model: ''
      }
    ];

    const courses = category && category !== 'All'
      ? baseCourses.filter(c => c.category === category)
      : baseCourses;

    return res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/my-enrollments', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get enrollments error:', error);
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

router.get('/:courseId/details', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId) || 1;

    const course = {
      id: courseId,
      title: 'Introduction to Biomedical Equipment Maintenance',
      description: 'Learn the fundamentals of maintaining biomedical equipment in hospitals and clinics.',
      category: 'Equipment Maintenance',
      duration_hours: 3,
      modules_count: 5,
      video_url: '',
      content: '',
      instructor_name: 'Mavy Instructor',
      instructor_bio: 'Biomedical engineer with industry experience.',
      instructor_image_url: '',
      instructor_credentials: 'B.E. Biomedical Engineering',
      learning_objectives: '',
      prerequisites: '',
      price: 0,
      currency: 'INR',
      average_rating: 4.8,
      total_reviews: 12,
      total_enrollments: 45,
      image_url: '',
      equipment_name: 'General Biomedical Equipment',
      equipment_model: ''
    };

    return res.json(course);
  } catch (error) {
    console.error('Get course details error:', error);
    return res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

router.get('/:courseId/reviews', async (_req: Request, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get course reviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/:courseId/enrollment', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ is_enrolled: false });
  } catch (error) {
    console.error('Get course enrollment error:', error);
    return res.status(500).json({ error: 'Failed to fetch enrollment status' });
  }
});

router.get('/:courseId/my-review', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ has_reviewed: false });
  } catch (error) {
    console.error('Get my review error:', error);
    return res.status(500).json({ error: 'Failed to fetch user review status' });
  }
});

router.post('/:courseId/enroll', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, is_enrolled: true });
  } catch (error) {
    console.error('Enroll course error:', error);
    return res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

router.post('/:courseId/reviews', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.get('/:courseId/modules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.courseId) || 1;

    const modules = [
      {
        id: 1,
        module_number: 1,
        title: 'Getting Started',
        description: 'Overview of biomedical equipment maintenance.',
        total_lessons: 1,
        completed_lessons: 0,
        lessons: [
          {
            id: courseId * 100 + 1,
            lesson_number: 1,
            title: 'Introduction',
            description: 'Welcome to the course.',
            content_type: 'video',
            video_url: '',
            content: '',
            duration_minutes: 10,
            is_free_preview: true,
            is_completed: false
          }
        ]
      }
    ];

    return res.json(modules);
  } catch (error) {
    console.error('Get course modules error:', error);
    return res.status(500).json({ error: 'Failed to fetch course modules' });
  }
});

router.get('/:courseId/progress', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      progress_percentage: 0,
      is_completed: false
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    return res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

router.post('/:courseId/certificate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.courseId) || 1;
    return res.json({
      course_id: courseId,
      certificate_url: '',
      issued_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

router.post('/upload-video', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      video_url: ''
    });
  } catch (error) {
    console.error('Upload course video error:', error);
    return res.status(500).json({ error: 'Failed to upload video' });
  }
});

router.post('/submit', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(201).json({ success: true, course_id: 1 });
  } catch (error) {
    console.error('Submit course error:', error);
    return res.status(500).json({ error: 'Failed to submit course' });
  }
});

router.get('/instructor/my-courses', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get instructor courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch instructor courses' });
  }
});

router.get('/instructor/earnings', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      total_earnings: 0,
      pending_payouts: 0
    });
  } catch (error) {
    console.error('Get instructor earnings error:', error);
    return res.status(500).json({ error: 'Failed to fetch instructor earnings' });
  }
});

export default router;


