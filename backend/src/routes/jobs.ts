import express, { type Request, type Response } from 'express';
import { Job, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, job_type } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (job_type) query.job_type = job_type;

    const jobs = await Job.find(query).sort({ created_at: -1 });

    const formattedJobs = jobs.map(job => {
      const obj = job.toObject() as any;
      return {
        ...obj,
        id: job._id.toString()
      };
    });

    return res.json(formattedJobs);
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
    const jobId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let job;
    let actualJobId: string | null = null;
    
    if (jobId.match(/^[0-9a-fA-F]{24}$/)) {
      actualJobId = jobId;
    } else {
      const allJobs = await Job.find().lean();
      const found = allJobs.find(j => {
        const idNum = parseInt(j._id.toString().slice(-8), 16);
        return idNum === parseInt(jobId, 10);
      });
      if (found) {
        actualJobId = found._id.toString();
      }
    }

    if (!actualJobId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (isAdmin) {
      job = await Job.findByIdAndUpdate(
        actualJobId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } else {
      job = await Job.findOneAndUpdate(
        { 
          _id: actualJobId,
          posted_by_user_id: userId 
        },
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found or user not authorized' });
    }

    return res.json({ job, success: true });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let job;
    let actualJobId: string | null = null;
    
    if (jobId.match(/^[0-9a-fA-F]{24}$/)) {
      actualJobId = jobId;
    } else {
      const allJobs = await Job.find().lean();
      const found = allJobs.find(j => {
        const idNum = parseInt(j._id.toString().slice(-8), 16);
        return idNum === parseInt(jobId, 10);
      });
      if (found) {
        actualJobId = found._id.toString();
      }
    }

    if (!actualJobId) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (isAdmin) {
      job = await Job.findById(actualJobId);
    } else {
      job = await Job.findOne({ 
        _id: actualJobId,
        posted_by_user_id: userId 
      });
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found or user not authorized' });
    }

    await Job.findByIdAndDelete(job._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({ error: 'Failed to delete job' });
  }
});

router.post('/:id/apply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.contact_email) {
      return res.status(400).json({ error: 'Job contact email not found' });
    }

    console.log(`[Job Application] Job: "${job.title}" | Employer Email: ${job.contact_email}`);

    const user = await User.findOne({ user_id: req.user!.user_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userName = String(user.full_name || user.email || 'A user');
    const userEmail = String(user.email || user.patient_email || 'Not provided');
    const phone = String(user.phone ? (user.country_code ? `${user.country_code} ${user.phone}` : user.phone) : 'Not provided');
    const state = String(user.state || 'Not specified');
    const country = String(user.country || 'Not specified');
    
    let experienceText = 'Not specified';
    if (user.experience) {
      experienceText = String(user.experience);
    }
    
    let qualificationText = 'Not specified';
    if (user.education) {
      qualificationText = String(user.education);
    }
    
    const resumeUrl = user.resume_url 
      ? `https://themavy.com/api/uploads/profile/${user.resume_url}` 
      : null;

    const emailText = `Hi,

A user from MavyTech has applied for the job "${job.title}".

**Applicant Details:**
- Name: ${userName}
- Email: ${userEmail}
- Phone: ${phone}
- Country: ${country}
- State: ${state}
- Experience: ${experienceText}
- Qualification: ${qualificationText}
${resumeUrl ? `Resume: ${resumeUrl}` : ''}

Regards,
MavyTech`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <p>Hi,</p>
        <p>A user from MavyTech has applied for the job "<strong>${job.title}</strong>".</p>
        <p><strong>Applicant Details:</strong></p>
        <ul style="list-style: none; padding-left: 0;">
          <li>- Name: ${userName}</li>
          <li>- Email: ${userEmail}</li>
          <li>- Phone: ${phone}</li>
          <li>- Country: ${country}</li>
          <li>- State: ${state}</li>
          <li>- Experience: ${experienceText}</li>
          <li>- Qualification: ${qualificationText}</li>
          ${resumeUrl ? `<li>Resume: <a href="${resumeUrl}">${resumeUrl}</a></li>` : ''}
        </ul>
        <p>Regards,<br>MavyTech</p>
      </div>
    `;

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);

        const senderEmail = process.env.RESEND_FROM_EMAIL || 'careers@themavy.com';
        const senderName = process.env.RESEND_FROM_NAME || 'MavyTech Careers';

        console.log(`[Job Application] Sending email to: ${job.contact_email}`);
        console.log(`[Job Application] From: ${senderEmail}`);
        console.log(`[Job Application] Applicant: ${userName} (${userEmail})`);

        const emailResult = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          replyTo: userEmail,
          to: job.contact_email,
          subject: `Job Application: ${job.title}`,
          text: emailText,
          html: emailHtml,
        });

        if (emailResult.data) {
          console.log(`[Job Application] ✅ Email sent successfully!`);
          console.log(`[Job Application] 📧 Email ID: ${emailResult.data.id || 'N/A'}`);
          console.log(`[Job Application] 📧 Email destination: ${job.contact_email}`);
          console.log(`[Job Application] 📧 Subject: Job Application: ${job.title}`);
          console.log(`[Job Application] 📧 Track email at: https://resend.com/emails/${emailResult.data.id || ''}`);
        } else if (emailResult.error) {
          console.error(`[Job Application] ❌ Email send failed:`, emailResult.error);
        } else {
          console.log(`[Job Application] ✅ Email sent successfully!`);
          console.log(`[Job Application] 📧 Email destination: ${job.contact_email}`);
        }
      } else {
        const senderEmail = process.env.RESEND_FROM_EMAIL || 'careers@themavy.com';
        console.log('❌ RESEND_API_KEY not found. Email would be sent:', {
          from: senderEmail,
          to: job.contact_email,
          subject: `Job Application: ${job.title}`,
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
    }

    return res.json({ 
      success: true,
      message: 'Application sent successfully',
      employerEmail: job.contact_email,
      jobTitle: job.title
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;
