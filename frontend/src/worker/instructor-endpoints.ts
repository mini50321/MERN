import { Context } from "hono";

type AppContext = {
  Bindings: Env;
  Variables: {
    user?: any;
  };
};

// Get instructor's own courses with revenue data
export async function getInstructorCourses(c: Context<AppContext>) {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT 
      lc.*,
      COUNT(DISTINCT ce.user_id) as total_enrollments,
      AVG(cr.rating) as average_rating,
      COUNT(DISTINCT cr.id) as total_reviews,
      SUM(CASE WHEN ce.user_id IS NOT NULL AND lc.price > 0 THEN lc.price ELSE 0 END) as total_revenue
    FROM learning_courses lc
    LEFT JOIN course_enrollments ce ON lc.id = ce.course_id
    LEFT JOIN course_reviews cr ON lc.id = cr.course_id
    WHERE lc.submitted_by_user_id = ?
    GROUP BY lc.id
    ORDER BY lc.created_at DESC`
  ).bind(user!.id).all();

  return c.json(results);
}

// Get instructor earnings summary
export async function getInstructorEarnings(c: Context<AppContext>) {
  const user = c.get("user");

  // Get all courses by this instructor
  const { results: courses } = await c.env.DB.prepare(
    `SELECT id, price, currency FROM learning_courses WHERE submitted_by_user_id = ?`
  ).bind(user!.id).all();

  if (courses.length === 0) {
    return c.json({
      total_earnings: 0,
      currency: "USD",
      pending_earnings: 0,
      lifetime_earnings: 0,
      this_month_earnings: 0,
    });
  }

  const currency = (courses[0] as any).currency || "USD";

  // Calculate total earnings (sum of all enrollments * course price)
  let totalEarnings = 0;
  let thisMonthEarnings = 0;

  for (const course of courses) {
    const { results: enrollments } = await c.env.DB.prepare(
      `SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN strftime('%Y-%m', enrollment_date) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END) as this_month_count
      FROM course_enrollments 
      WHERE course_id = ?`
    ).bind((course as any).id).all();

    const enrollmentCount = Number((enrollments[0] as any)?.count || 0);
    const thisMonthCount = Number((enrollments[0] as any)?.this_month_count || 0);
    const coursePrice = Number((course as any).price || 0);

    totalEarnings += enrollmentCount * coursePrice;
    thisMonthEarnings += thisMonthCount * coursePrice;
  }

  return c.json({
    total_earnings: totalEarnings,
    currency,
    pending_earnings: 0, // In a real system, this would track pending withdrawals
    lifetime_earnings: totalEarnings,
    this_month_earnings: thisMonthEarnings,
  });
}
