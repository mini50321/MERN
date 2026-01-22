import { Context } from "hono";

type AppContext = {
  Bindings: Env;
  Variables: {
    user?: any;
  };
};

// Get course modules and lessons
export async function getCourseModules(c: Context<AppContext>) {
  const courseId = c.req.param("id");
  const user = c.get("user");

  try {
    // Get all modules for this course
    const { results: modules } = await c.env.DB.prepare(
      `SELECT * FROM course_modules 
       WHERE course_id = ? AND is_published = 1 
       ORDER BY display_order ASC, module_number ASC`
    ).bind(courseId).all();

    // Get all lessons for these modules
    const modulesWithLessons = await Promise.all(
      modules.map(async (module: any) => {
        const { results: lessons } = await c.env.DB.prepare(
          `SELECT * FROM course_lessons 
           WHERE module_id = ? AND is_published = 1 
           ORDER BY display_order ASC, lesson_number ASC`
        ).bind(module.id).all();

        // Check which lessons are completed by this user
        let completedLessons: any[] = [];
        if (user) {
          const { results: completed } = await c.env.DB.prepare(
            `SELECT lesson_id FROM lesson_completions WHERE user_id = ?`
          ).bind(user.id).all();
          completedLessons = completed.map((c: any) => c.lesson_id);
        }

        const lessonsWithCompletion = lessons.map((lesson: any) => ({
          ...lesson,
          is_completed: completedLessons.includes(lesson.id),
        }));

        return {
          ...module,
          lessons: lessonsWithCompletion,
          total_lessons: lessons.length,
          completed_lessons: lessonsWithCompletion.filter((l: any) => l.is_completed).length,
        };
      })
    );

    return c.json(modulesWithLessons);
  } catch (error) {
    console.error("Error fetching course modules:", error);
    return c.json({ error: "Failed to fetch course modules" }, 500);
  }
}

// Mark lesson as completed
export async function markLessonComplete(c: Context<AppContext>) {
  const user = c.get("user");
  const lessonId = c.req.param("id");

  try {
    // Check if already completed
    const existing = await c.env.DB.prepare(
      "SELECT id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?"
    ).bind(user!.id, lessonId).first();

    if (existing) {
      return c.json({ success: true, already_completed: true });
    }

    // Mark as completed
    await c.env.DB.prepare(
      "INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)"
    ).bind(user!.id, lessonId).run();

    // Get lesson details to update course progress
    const lesson = await c.env.DB.prepare(
      `SELECT cl.*, cm.course_id 
       FROM course_lessons cl
       JOIN course_modules cm ON cl.module_id = cm.id
       WHERE cl.id = ?`
    ).bind(lessonId).first();

    if (lesson) {
      // Calculate overall course progress
      const { results: allLessons } = await c.env.DB.prepare(
        `SELECT cl.id FROM course_lessons cl
         JOIN course_modules cm ON cl.module_id = cm.id
         WHERE cm.course_id = ? AND cl.is_published = 1`
      ).bind(lesson.course_id).all();

      const { results: completedLessons } = await c.env.DB.prepare(
        `SELECT lc.lesson_id FROM lesson_completions lc
         JOIN course_lessons cl ON lc.lesson_id = cl.id
         JOIN course_modules cm ON cl.module_id = cm.id
         WHERE cm.course_id = ? AND lc.user_id = ?`
      ).bind(lesson.course_id, user!.id).all();

      const totalLessons = allLessons.length;
      const completed = completedLessons.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
      const isCompleted = progressPercentage === 100;

      // Update course progress
      await c.env.DB.prepare(
        `INSERT INTO user_course_progress (user_id, course_id, progress_percentage, is_completed, completed_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, course_id) DO UPDATE SET
           progress_percentage = excluded.progress_percentage,
           is_completed = excluded.is_completed,
           completed_at = excluded.completed_at,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(
        user!.id,
        lesson.course_id,
        progressPercentage,
        isCompleted ? 1 : 0,
        isCompleted ? new Date().toISOString() : null
      ).run();

      // If course completed, update enrollment
      if (isCompleted) {
        await c.env.DB.prepare(
          `UPDATE course_enrollments 
           SET is_completed = 1, completion_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND course_id = ?`
        ).bind(user!.id, lesson.course_id).run();

        // Award XP for course completion
        await c.env.DB.prepare(
          "INSERT INTO xp_events (user_id, xp_amount, reason, metadata) VALUES (?, ?, ?, ?)"
        ).bind(user!.id, 50, "course_completed", JSON.stringify({ course_id: lesson.course_id })).run();

        await c.env.DB.prepare(
          "UPDATE user_gamification SET xp = xp + 50, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        ).bind(user!.id).run();
      }

      return c.json({ 
        success: true, 
        progress_percentage: progressPercentage,
        is_completed: isCompleted
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return c.json({ error: "Failed to mark lesson complete" }, 500);
  }
}

// Admin: Create module for course
export async function createCourseModule(c: Context<AppContext>) {
  const body = await c.req.json();

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO course_modules 
        (course_id, module_number, title, description, duration_minutes, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      body.course_id,
      body.module_number,
      body.title,
      body.description || null,
      body.duration_minutes || null,
      body.display_order || 0
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("Error creating module:", error);
    return c.json({ error: "Failed to create module" }, 500);
  }
}

// Admin: Create lesson for module
export async function createCourseLesson(c: Context<AppContext>) {
  const body = await c.req.json();

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO course_lessons 
        (module_id, lesson_number, title, description, content_type, 
         video_url, content, duration_minutes, display_order, is_free_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.module_id,
      body.lesson_number,
      body.title,
      body.description || null,
      body.content_type,
      body.video_url || null,
      body.content || null,
      body.duration_minutes || null,
      body.display_order || 0,
      body.is_free_preview ? 1 : 0
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return c.json({ error: "Failed to create lesson" }, 500);
  }
}
