import express, { Response } from 'express';
import { User, ServiceOrder, Job, NewsUpdate, SupportTicket } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const range = req.query.range as string || '30d';
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const totalPartners = await User.countDocuments({ 
      account_type: { $ne: 'patient' } 
    });
    
    const totalPatients = await User.countDocuments({ 
      account_type: 'patient' 
    });

    const partnersThisWeek = await User.countDocuments({
      account_type: { $ne: 'patient' },
      created_at: { $gte: weekAgo }
    });

    const patientsThisWeek = await User.countDocuments({
      account_type: 'patient',
      created_at: { $gte: weekAgo }
    });

    const activePartners = await User.countDocuments({
      account_type: { $ne: 'patient' },
      updated_at: { $gte: weekAgo }
    });

    const activePatients = await User.countDocuments({
      account_type: 'patient',
      updated_at: { $gte: weekAgo }
    });

    const partnersByProfession = await User.aggregate([
      { $match: { account_type: { $ne: 'patient' }, profession: { $exists: true } } },
      { $group: { _id: '$profession', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const partnersByAccountType = await User.aggregate([
      { $match: { account_type: { $ne: 'patient' } } },
      { $group: { _id: '$account_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const patientsByState = await User.aggregate([
      { $match: { account_type: 'patient', state: { $exists: true } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalBookings = await ServiceOrder.countDocuments();
    const pendingBookings = await ServiceOrder.countDocuments({ status: 'pending' });
    const acceptedBookings = await ServiceOrder.countDocuments({ status: 'accepted' });
    const completedBookings = await ServiceOrder.countDocuments({ status: 'completed' });
    const cancelledBookings = await ServiceOrder.countDocuments({ status: 'cancelled' });

    const bookingsThisWeek = await ServiceOrder.countDocuments({
      created_at: { $gte: weekAgo }
    });

    const bookingsThisMonth = await ServiceOrder.countDocuments({
      created_at: { $gte: dateThreshold }
    });

    const bookingTrend = await ServiceOrder.aggregate([
      { $match: { created_at: { $gte: dateThreshold } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          bookings: 1,
          _id: 0
        }
      }
    ]);

    const bookingsByStatus = await ServiceOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressTickets = await SupportTicket.countDocuments({ status: 'in_progress' });
    const closedTickets = await SupportTicket.countDocuments({ status: 'closed' });
    const ticketsThisWeek = await SupportTicket.countDocuments({
      created_at: { $gte: weekAgo }
    });

    const totalCourses = 0;
    const totalExhibitions = 0;
    const totalJobs = await Job.countDocuments({ status: 'open' });
    const totalFundraisers = 0;
    const totalNews = await NewsUpdate.countDocuments();

    return res.json({
      userStats: {
        totalPartners,
        totalPatients,
        partnersThisWeek,
        patientsThisWeek,
        activePartners,
        activePatients
      },
      partnersByProfession: partnersByProfession.map(p => ({
        profession: p._id,
        count: p.count
      })),
      partnersByAccountType: partnersByAccountType.map(p => ({
        account_type: p._id,
        count: p.count
      })),
      patientsByState: patientsByState.map(p => ({
        state: p._id,
        count: p.count
      })),
      bookingStats: {
        totalBookings,
        pendingBookings,
        acceptedBookings,
        completedBookings,
        cancelledBookings,
        bookingsThisWeek,
        bookingsThisMonth
      },
      bookingTrend,
      bookingsByStatus: bookingsByStatus.map(b => ({
        status: b._id,
        count: b.count
      })),
      supportStats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        closedTickets,
        avgResponseTime: 0,
        ticketsThisWeek
      },
      engagementMetrics: {
        totalCourses,
        totalExhibitions,
        totalJobs,
        totalFundraisers,
        totalNews
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
