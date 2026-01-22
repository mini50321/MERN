import { Context } from "hono";

type AppContext = {
  Bindings: Env;
  Variables: {
    user?: any;
  };
};

// Generate a unique certificate number
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

// Generate certificate for completed course
export async function generateCertificate(c: Context<AppContext>) {
  const user = c.get("user");
  const courseId = c.req.param("id");

  try {
    // Check if course is completed
    const enrollment = await c.env.DB.prepare(
      `SELECT ce.*, lc.title, lc.instructor_name, lc.duration_hours
       FROM course_enrollments ce
       JOIN learning_courses lc ON ce.course_id = lc.id
       WHERE ce.user_id = ? AND ce.course_id = ? AND ce.is_completed = 1`
    ).bind(user!.id, courseId).first();

    if (!enrollment) {
      return c.json({ error: "Course not completed" }, 400);
    }

    // Check if certificate already exists
    const existingCert = await c.env.DB.prepare(
      "SELECT * FROM course_certificates WHERE user_id = ? AND course_id = ?"
    ).bind(user!.id, courseId).first();

    if (existingCert) {
      return c.json(existingCert);
    }

    // Get user profile for full name
    const profile = await c.env.DB.prepare(
      "SELECT full_name FROM user_profiles WHERE user_id = ?"
    ).bind(user!.id).first();

    const studentName = profile?.full_name || "Student";
    const certificateNumber = generateCertificateNumber();

    // Create certificate record
    const result = await c.env.DB.prepare(
      `INSERT INTO course_certificates 
        (user_id, course_id, enrollment_id, certificate_number, 
         instructor_name, course_title, student_name, completion_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      courseId,
      enrollment.id,
      certificateNumber,
      enrollment.instructor_name || "Course Instructor",
      enrollment.title,
      studentName,
      enrollment.completion_date
    ).run();

    const certificate = await c.env.DB.prepare(
      "SELECT * FROM course_certificates WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    // Award XP for certificate earned
    await c.env.DB.prepare(
      "INSERT INTO xp_events (user_id, xp_amount, reason, metadata) VALUES (?, ?, ?, ?)"
    ).bind(user!.id, 100, "certificate_earned", JSON.stringify({ course_id: courseId })).run();

    // Update user gamification
    await c.env.DB.prepare(
      "UPDATE user_gamification SET xp = xp + 100, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(user!.id).run();

    return c.json(certificate);
  } catch (error) {
    console.error("Error generating certificate:", error);
    return c.json({ error: "Failed to generate certificate" }, 500);
  }
}

// Get user's certificates
export async function getUserCertificates(c: Context<AppContext>) {
  const user = c.get("user");

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT cc.*, lc.category, lc.duration_hours
       FROM course_certificates cc
       JOIN learning_courses lc ON cc.course_id = lc.id
       WHERE cc.user_id = ?
       ORDER BY cc.issued_date DESC`
    ).bind(user!.id).all();

    return c.json(results);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return c.json({ error: "Failed to fetch certificates" }, 500);
  }
}

// Get certificate by ID (for sharing/verification)
export async function getCertificateById(c: Context<AppContext>) {
  const certificateNumber = c.req.param("number");

  try {
    const certificate = await c.env.DB.prepare(
      `SELECT cc.*, lc.category, lc.duration_hours
       FROM course_certificates cc
       JOIN learning_courses lc ON cc.course_id = lc.id
       WHERE cc.certificate_number = ?`
    ).bind(certificateNumber).first();

    if (!certificate) {
      return c.json({ error: "Certificate not found" }, 404);
    }

    return c.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return c.json({ error: "Failed to fetch certificate" }, 500);
  }
}
