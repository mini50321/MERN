export async function calculateAnalytics(db: D1Database, range: string) {
  const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  // Week ago date for "this week" calculations
  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoDateStr = weekAgoDate.toISOString().split("T")[0];

  // Month ago date for "this month" calculations
  const monthAgoDate = new Date();
  monthAgoDate.setDate(monthAgoDate.getDate() - 30);

  // User Statistics - Separated by Partners and Patients
  const totalPartnersResult = await db.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE account_type != 'patient' OR account_type IS NULL"
  ).first();
  const totalPartners = Number(totalPartnersResult?.count) || 0;

  const totalPatientsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE account_type = 'patient'"
  ).first();
  const totalPatients = Number(totalPatientsResult?.count) || 0;

  // New partners/patients this week
  const newPartnersWeekResult = await db.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE (account_type != 'patient' OR account_type IS NULL) AND DATE(created_at) >= ?"
  ).bind(weekAgoDateStr).first();
  const partnersThisWeek = Number(newPartnersWeekResult?.count) || 0;

  const newPatientsWeekResult = await db.prepare(
    "SELECT COUNT(*) as count FROM user_profiles WHERE account_type = 'patient' AND DATE(created_at) >= ?"
  ).bind(weekAgoDateStr).first();
  const patientsThisWeek = Number(newPatientsWeekResult?.count) || 0;

  // Active partners/patients (have activity in last 7 days)
  const activePartnersResult = await db.prepare(
    `SELECT COUNT(DISTINCT user_id) as count FROM user_activity_logs 
     WHERE created_at >= ? 
     AND user_id IN (SELECT user_id FROM user_profiles WHERE account_type != 'patient' OR account_type IS NULL)`
  ).bind(weekAgoDate.toISOString()).first();
  const activePartners = Number(activePartnersResult?.count) || 0;

  const activePatientsResult = await db.prepare(
    `SELECT COUNT(DISTINCT user_id) as count FROM user_activity_logs 
     WHERE created_at >= ? 
     AND user_id IN (SELECT user_id FROM user_profiles WHERE account_type = 'patient')`
  ).bind(weekAgoDate.toISOString()).first();
  const activePatients = Number(activePatientsResult?.count) || 0;

  // Partners by Profession
  const { results: partnersByProfession } = await db.prepare(
    `SELECT COALESCE(profession, 'Not Specified') as profession, COUNT(*) as count 
     FROM user_profiles 
     WHERE account_type != 'patient' OR account_type IS NULL
     GROUP BY profession 
     ORDER BY count DESC 
     LIMIT 10`
  ).all();

  // Partners by Account Type
  const { results: partnersByAccountType } = await db.prepare(
    `SELECT COALESCE(account_type, 'Not Specified') as account_type, COUNT(*) as count 
     FROM user_profiles 
     WHERE account_type != 'patient' OR account_type IS NULL
     GROUP BY account_type 
     ORDER BY count DESC`
  ).all();

  // Patients by State
  const { results: patientsByState } = await db.prepare(
    `SELECT COALESCE(state, 'Not Specified') as state, COUNT(*) as count 
     FROM user_profiles 
     WHERE account_type = 'patient'
     GROUP BY state 
     ORDER BY count DESC 
     LIMIT 15`
  ).all();

  // Booking Statistics
  const totalBookingsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders"
  ).first();
  const totalBookings = Number(totalBookingsResult?.count) || 0;

  const pendingBookingsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE status = 'pending'"
  ).first();
  const pendingBookings = Number(pendingBookingsResult?.count) || 0;

  const acceptedBookingsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE status = 'accepted'"
  ).first();
  const acceptedBookings = Number(acceptedBookingsResult?.count) || 0;

  const completedBookingsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE status = 'completed'"
  ).first();
  const completedBookings = Number(completedBookingsResult?.count) || 0;

  const cancelledBookingsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE status = 'cancelled' OR status = 'declined'"
  ).first();
  const cancelledBookings = Number(cancelledBookingsResult?.count) || 0;

  const bookingsWeekResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE DATE(created_at) >= ?"
  ).bind(weekAgoDateStr).first();
  const bookingsThisWeek = Number(bookingsWeekResult?.count) || 0;

  const bookingsMonthResult = await db.prepare(
    "SELECT COUNT(*) as count FROM service_orders WHERE created_at >= ?"
  ).bind(monthAgoDate.toISOString()).first();
  const bookingsThisMonth = Number(bookingsMonthResult?.count) || 0;

  // Booking Trend (daily bookings over the range)
  const bookingTrend = [];
  for (let i = Math.min(daysAgo - 1, 29); i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    const bookingsOnDate = await db.prepare(
      "SELECT COUNT(*) as count FROM service_orders WHERE DATE(created_at) = ?"
    ).bind(dateStr).first();
    
    bookingTrend.push({
      date: dateStr,
      bookings: Number(bookingsOnDate?.count) || 0,
    });
  }

  // Bookings by Status
  const { results: bookingsByStatus } = await db.prepare(
    `SELECT status, COUNT(*) as count 
     FROM service_orders 
     GROUP BY status 
     ORDER BY count DESC`
  ).all();

  // KYC Statistics
  const totalKYCResult = await db.prepare(
    "SELECT COUNT(*) as count FROM kyc_submissions"
  ).first();
  const totalSubmissions = Number(totalKYCResult?.count) || 0;

  const pendingKYCResult = await db.prepare(
    "SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'pending'"
  ).first();
  const pendingReview = Number(pendingKYCResult?.count) || 0;

  const approvedKYCResult = await db.prepare(
    "SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'approved'"
  ).first();
  const approved = Number(approvedKYCResult?.count) || 0;

  const rejectedKYCResult = await db.prepare(
    "SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'rejected'"
  ).first();
  const rejected = Number(rejectedKYCResult?.count) || 0;

  const pendingKYCWeekResult = await db.prepare(
    "SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'pending' AND DATE(created_at) >= ?"
  ).bind(weekAgoDateStr).first();
  const pendingThisWeek = Number(pendingKYCWeekResult?.count) || 0;

  // Support Ticket Statistics
  const totalTicketsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM support_tickets"
  ).first();
  const totalTickets = Number(totalTicketsResult?.count) || 0;

  const openTicketsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'"
  ).first();
  const openTickets = Number(openTicketsResult?.count) || 0;

  const inProgressTicketsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'in_progress'"
  ).first();
  const inProgressTickets = Number(inProgressTicketsResult?.count) || 0;

  const closedTicketsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'resolved'"
  ).first();
  const closedTickets = Number(closedTicketsResult?.count) || 0;

  // Calculate average response time (time from creation to first admin response)
  const avgResponseResult = await db.prepare(
    `SELECT AVG(
      (julianday(updated_at) - julianday(created_at)) * 24
     ) as avg_hours 
     FROM support_tickets 
     WHERE admin_response IS NOT NULL 
     AND status != 'open'`
  ).first();
  const avgResponseTime = Math.round(Number(avgResponseResult?.avg_hours) || 0);

  const ticketsWeekResult = await db.prepare(
    "SELECT COUNT(*) as count FROM support_tickets WHERE DATE(created_at) >= ?"
  ).bind(weekAgoDateStr).first();
  const ticketsThisWeek = Number(ticketsWeekResult?.count) || 0;

  // Platform Content Counts
  const coursesResult = await db.prepare(
    "SELECT COUNT(*) as count FROM learning_courses WHERE is_active = 1 AND approval_status = 'approved'"
  ).first();
  const totalCourses = Number(coursesResult?.count) || 0;

  const exhibitionsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM medical_exhibitions"
  ).first();
  const totalExhibitions = Number(exhibitionsResult?.count) || 0;

  const jobsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM jobs WHERE status = 'open'"
  ).first();
  const totalJobs = Number(jobsResult?.count) || 0;

  const fundraisersResult = await db.prepare(
    "SELECT COUNT(*) as count FROM fundraisers WHERE status = 'active'"
  ).first();
  const totalFundraisers = Number(fundraisersResult?.count) || 0;

  const newsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM news_updates"
  ).first();
  const totalNews = Number(newsResult?.count) || 0;

  // Feature Access Analytics - Track which features are being used most
  const { results: partnerFeatureUsage } = await db.prepare(
    `SELECT 
      activity_type as feature,
      COUNT(*) as total_uses,
      COUNT(DISTINCT user_id) as unique_users
     FROM user_activity_logs
     WHERE created_at >= ?
     AND user_id IN (SELECT user_id FROM user_profiles WHERE account_type != 'patient' OR account_type IS NULL)
     GROUP BY activity_type
     ORDER BY total_uses DESC`
  ).bind(weekAgoDate.toISOString()).all();

  const { results: patientFeatureUsage } = await db.prepare(
    `SELECT 
      activity_type as feature,
      COUNT(*) as total_uses,
      COUNT(DISTINCT user_id) as unique_users
     FROM user_activity_logs
     WHERE created_at >= ?
     AND user_id IN (SELECT user_id FROM user_profiles WHERE account_type = 'patient')
     GROUP BY activity_type
     ORDER BY total_uses DESC`
  ).bind(weekAgoDate.toISOString()).all();

  // Service Usage Analytics
  const { results: serviceTypeUsage } = await db.prepare(
    `SELECT 
      COALESCE(service_category, 'General Service') as service_type,
      COUNT(*) as booking_count,
      COUNT(DISTINCT patient_user_id) as unique_patients,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
     FROM service_orders
     WHERE created_at >= ?
     GROUP BY service_category
     ORDER BY booking_count DESC`
  ).bind(weekAgoDate.toISOString()).all();

  // Top Accessed Features Overall
  const { results: topFeatures } = await db.prepare(
    `SELECT 
      feature_name as feature,
      COUNT(*) as access_count,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(duration_seconds) as avg_duration
     FROM user_activity_logs
     WHERE created_at >= ?
     GROUP BY feature_name
     ORDER BY access_count DESC
     LIMIT 15`
  ).bind(weekAgoDate.toISOString()).all();

  // Active users right now (last 5 minutes)
  const fiveMinAgo = new Date();
  fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
  const activeNowResult = await db.prepare(
    "SELECT COUNT(DISTINCT user_id) as count FROM user_activity_logs WHERE created_at >= ?"
  ).bind(fiveMinAgo.toISOString()).first();

  return {
    userStats: {
      totalPartners,
      totalPatients,
      partnersThisWeek,
      patientsThisWeek,
      activePartners,
      activePatients,
    },
    partnersByProfession,
    partnersByAccountType,
    patientsByState,
    bookingStats: {
      totalBookings,
      pendingBookings,
      acceptedBookings,
      completedBookings,
      cancelledBookings,
      bookingsThisWeek,
      bookingsThisMonth,
    },
    bookingTrend,
    bookingsByStatus,
    kycStats: {
      totalSubmissions,
      pendingReview,
      approved,
      rejected,
      pendingThisWeek,
    },
    supportStats: {
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
      avgResponseTime,
      ticketsThisWeek,
    },
    engagementMetrics: {
      totalCourses,
      totalExhibitions,
      totalJobs,
      totalFundraisers,
      totalNews,
    },
    featureAccessAnalytics: {
      partnerFeatureUsage,
      patientFeatureUsage,
      serviceTypeUsage,
      topFeatures,
    },
    activeUsers: Number(activeNowResult?.count) || 0,
  };
}

export function generateCSV(data: any): string {
  let csv = "Mavy Partner Analytics Report\n\n";
  
  csv += "USER STATISTICS\n";
  csv += `Total Partners,${data.userStats.totalPartners}\n`;
  csv += `Total Patients,${data.userStats.totalPatients}\n`;
  csv += `New Partners This Week,${data.userStats.partnersThisWeek}\n`;
  csv += `New Patients This Week,${data.userStats.patientsThisWeek}\n`;
  csv += `Active Partners,${data.userStats.activePartners}\n`;
  csv += `Active Patients,${data.userStats.activePatients}\n\n`;
  
  csv += "PARTNERS BY PROFESSION\n";
  csv += "Profession,Count\n";
  data.partnersByProfession.forEach((p: any) => {
    csv += `${p.profession},${p.count}\n`;
  });
  csv += "\n";
  
  csv += "PARTNERS BY ACCOUNT TYPE\n";
  csv += "Account Type,Count\n";
  data.partnersByAccountType.forEach((t: any) => {
    csv += `${t.account_type},${t.count}\n`;
  });
  csv += "\n";
  
  csv += "PATIENTS BY STATE\n";
  csv += "State,Count\n";
  data.patientsByState.forEach((s: any) => {
    csv += `${s.state},${s.count}\n`;
  });
  csv += "\n";
  
  csv += "BOOKING STATISTICS\n";
  csv += `Total Bookings,${data.bookingStats.totalBookings}\n`;
  csv += `Pending,${data.bookingStats.pendingBookings}\n`;
  csv += `Accepted,${data.bookingStats.acceptedBookings}\n`;
  csv += `Completed,${data.bookingStats.completedBookings}\n`;
  csv += `Cancelled,${data.bookingStats.cancelledBookings}\n`;
  csv += `This Week,${data.bookingStats.bookingsThisWeek}\n`;
  csv += `This Month,${data.bookingStats.bookingsThisMonth}\n\n`;
  
  csv += "KYC VERIFICATIONS\n";
  csv += `Total Submissions,${data.kycStats.totalSubmissions}\n`;
  csv += `Pending Review,${data.kycStats.pendingReview}\n`;
  csv += `Approved,${data.kycStats.approved}\n`;
  csv += `Rejected,${data.kycStats.rejected}\n`;
  csv += `New This Week,${data.kycStats.pendingThisWeek}\n\n`;
  
  csv += "SUPPORT TICKETS\n";
  csv += `Total Tickets,${data.supportStats.totalTickets}\n`;
  csv += `Open,${data.supportStats.openTickets}\n`;
  csv += `In Progress,${data.supportStats.inProgressTickets}\n`;
  csv += `Closed,${data.supportStats.closedTickets}\n`;
  csv += `Avg Response Time (hours),${data.supportStats.avgResponseTime}\n`;
  csv += `New This Week,${data.supportStats.ticketsThisWeek}\n\n`;
  
  csv += "PLATFORM CONTENT\n";
  csv += `Active Courses,${data.engagementMetrics.totalCourses}\n`;
  csv += `Exhibitions,${data.engagementMetrics.totalExhibitions}\n`;
  csv += `Job Listings,${data.engagementMetrics.totalJobs}\n`;
  csv += `Active Fundraisers,${data.engagementMetrics.totalFundraisers}\n`;
  csv += `News Posts,${data.engagementMetrics.totalNews}\n`;
  
  return csv;
}
