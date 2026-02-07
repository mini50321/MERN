import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { Course } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/test-model', async (_req: Request, res: Response) => {
  try {
    const courseCount = await Course.countDocuments();
    return res.json({ 
      success: true, 
      message: 'Course model is working',
      count: courseCount 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Course model error',
      stack: error?.stack 
    });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    try {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    } catch (error) {
      cb(error as Error);
    }
  }
});

const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Video file is too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  return next();
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const query: any = { is_active: true };
    
    if (category && category !== 'All') {
      query.category = category;
    }

    const courses = await Course.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    const formattedCourses = courses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      duration_hours: course.duration_hours,
      modules_count: course.modules_count,
      category: course.category,
      thumbnail_gradient: 'from-blue-500 to-cyan-500',
      image_url: course.image_url || course.thumbnail_url || '',
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      total_enrollments: course.total_enrollments,
      instructor_name: course.instructor_name,
      price: course.price,
      currency: course.currency,
      equipment_name: course.equipment_name || '',
      equipment_model: course.equipment_model || '',
      submitted_by_user_id: course.submitted_by_user_id
    }));

    return res.json(formattedCourses);
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

router.post('/upload-video', authMiddleware, upload.single('video'), handleMulterError, async (req: AuthRequest, res: Response) => {
  let responseSent = false;
  
  const sendError = (status: number, message: string, details?: string): void => {
    if (!responseSent) {
      responseSent = true;
      res.status(status).json({ 
        error: message,
        ...(details && { details })
      });
    }
  };

  const sendSuccess = (data: any): void => {
    if (!responseSent) {
      responseSent = true;
      res.json(data);
    }
  };

  try {
    if (!req.file) {
      sendError(400, 'No video file provided');
      return;
    }

    const file = req.file;
    
    if (!file.mimetype.startsWith('video/')) {
      sendError(400, 'File must be a video');
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      sendError(413, `Video file is too large. Maximum size is ${maxSize / (1024 * 1024)}MB. Please compress your video or use a smaller file.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      console.warn(`Large video file detected: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }

    let base64Video: string;
    try {
      const chunkSize = 512 * 1024;
      const chunks: string[] = [];
      const totalChunks = Math.ceil(file.buffer.length / chunkSize);
      
      console.log(`Processing video: ${(file.size / (1024 * 1024)).toFixed(2)}MB in ${totalChunks} chunks`);
      
      for (let i = 0; i < file.buffer.length; i += chunkSize) {
        const chunk = file.buffer.slice(i, i + chunkSize);
        chunks.push(chunk.toString('base64'));
        
        if (chunks.length % 10 === 0) {
          console.log(`Processed ${chunks.length}/${totalChunks} chunks`);
        }
      }
      
      console.log('Joining base64 chunks...');
      base64Video = `data:${file.mimetype};base64,${chunks.join('')}`;
      console.log('Base64 conversion complete');
    } catch (bufferError: any) {
      console.error('Error converting video to base64:', bufferError);
      console.error('Buffer error details:', bufferError?.message, bufferError?.stack);
      if (bufferError.message?.includes('offset') || bufferError.message?.includes('RangeError') || bufferError.name === 'RangeError' || bufferError.name === 'TypeError') {
        sendError(413, 'Video file is too large to process. Please use a video file smaller than 100MB, or compress your video file.');
        return;
      }
      sendError(500, 'Failed to process video', bufferError?.message || 'Unknown error during video conversion');
      return;
    }

    sendSuccess({
      success: true,
      video_url: base64Video,
      message: 'Video uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload course video error:', error);
    console.error('Error details:', error?.message, error?.stack);
    
    let errorMessage = 'Failed to upload video';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'Video file is too large. Maximum size is 100MB. Please compress your video or use a smaller file.';
    } else if (error?.name === 'RangeError' || error?.message?.includes('RangeError')) {
      errorMessage = 'Video file is too large to process. Please use a video file smaller than 20MB, or compress your video file.';
    }
    
    sendError(500, errorMessage, error?.message || 'Unknown error');
  }
});

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  console.log('=== /submit route hit ===');
  console.log('Course model:', Course ? 'Available' : 'NOT AVAILABLE');
  
  try {
    const body = req.body;
    
    console.log('=== Course Submission Started ===');
    console.log('Course model available:', !!Course);
    console.log('User ID:', req.user?.user_id);
    console.log('Request body keys:', Object.keys(body || {}));
    
    if (!body || typeof body !== 'object') {
      console.log('Invalid request body');
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    if (!body.title || !body.description || !body.category || !body.video_url) {
      return res.status(400).json({ 
        error: 'Title, description, category, and video are required',
        received: {
          title: !!body.title,
          description: !!body.description,
          category: !!body.category,
          video_url: !!body.video_url
        }
      });
    }
    
    console.log('All required fields present, creating course...');

    const durationHours = body.duration_hours !== null && body.duration_hours !== undefined 
      ? (typeof body.duration_hours === 'number' ? body.duration_hours : parseFloat(String(body.duration_hours)) || 0)
      : 0;
    
    const modulesCount = body.modules_count !== null && body.modules_count !== undefined
      ? (typeof body.modules_count === 'number' ? body.modules_count : parseInt(String(body.modules_count), 10) || 0)
      : 0;
    
    const price = body.price !== null && body.price !== undefined
      ? (typeof body.price === 'number' ? body.price : parseFloat(String(body.price)) || 0)
      : 0;

    const course = await Course.create({
      title: String(body.title),
      description: String(body.description),
      category: String(body.category),
      video_url: String(body.video_url),
      image_url: body.image_url || null,
      thumbnail_url: body.image_url || null,
      instructor_name: body.instructor_name ? String(body.instructor_name) : 'Instructor',
      instructor_bio: body.instructor_bio ? String(body.instructor_bio) : null,
      instructor_image_url: body.instructor_image_url || null,
      instructor_credentials: body.instructor_credentials ? String(body.instructor_credentials) : null,
      learning_objectives: body.learning_objectives ? String(body.learning_objectives) : null,
      prerequisites: body.prerequisites ? String(body.prerequisites) : null,
      course_outline: body.course_outline ? String(body.course_outline) : (body.content ? String(body.content) : null),
      duration_hours: durationHours,
      modules_count: modulesCount,
      price: price,
      currency: body.currency ? String(body.currency) : 'INR',
      equipment_name: body.equipment_name ? String(body.equipment_name) : null,
      equipment_model: body.equipment_model ? String(body.equipment_model) : null,
      content: body.content ? String(body.content) : null,
      submitted_by_user_id: req.user!.user_id,
      status: 'approved',
      is_active: true,
      average_rating: 0,
      total_reviews: 0,
      total_enrollments: 0
    });

    console.log('Course created successfully:', course._id.toString());
    return res.status(201).json({ success: true, course_id: course._id.toString() });
  } catch (error: any) {
    console.error('=== Course Submission Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    if (error?.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key]?.message
      }));
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationErrors
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to submit course',
      details: error?.message || 'Unknown error',
      errorType: error?.name || 'Unknown'
    });
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

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id;
    const body = req.body;
    
    let course;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findOneAndUpdate(
        { 
          _id: courseId,
          submitted_by_user_id: req.user!.user_id 
        },
        { $set: body },
        { new: true }
      );
    } else {
      const allCourses = await Course.find({ submitted_by_user_id: req.user!.user_id }).lean();
      const found = allCourses.find(c => {
        const idNum = parseInt(c._id.toString().slice(-8), 16);
        return idNum === parseInt(courseId, 10);
      });
      if (found) {
        course = await Course.findOneAndUpdate(
          { 
            _id: found._id,
            submitted_by_user_id: req.user!.user_id 
          },
          { $set: body },
          { new: true }
        );
      }
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found or user not authorized' });
    }

    return res.json({ course, success: true });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id;
    
    let course;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findOne({ 
        _id: courseId,
        submitted_by_user_id: req.user!.user_id 
      });
    } else {
      const allCourses = await Course.find({ submitted_by_user_id: req.user!.user_id }).lean();
      const found = allCourses.find(c => {
        const idNum = parseInt(c._id.toString().slice(-8), 16);
        return idNum === parseInt(courseId, 10);
      });
      if (found) {
        course = await Course.findOne({ 
          _id: found._id,
          submitted_by_user_id: req.user!.user_id 
        });
      }
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found or user not authorized' });
    }

    await Course.findByIdAndDelete(course._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;


