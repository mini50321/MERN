import { Context } from "hono";

type AppContext = {
  Bindings: Env;
  Variables: {
    adminRole?: string;
    adminId?: number;
  };
};

// Get all home hero banners (public endpoint)
export async function getHomeHeroBanners(c: Context<AppContext>) {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM home_hero_banners WHERE is_active = 1 ORDER BY display_order ASC"
  ).all();

  return c.json(results);
}

// Admin: Get all banners including inactive
export async function getAdminHeroBanners(c: Context<AppContext>) {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM home_hero_banners ORDER BY display_order ASC"
  ).all();

  return c.json(results);
}

// Admin: Create new banner
export async function createHeroBanner(c: Context<AppContext>) {
  const body = await c.req.json();

  if (!body.title || !body.subtitle || !body.image_url || !body.gradient) {
    return c.json({ error: "Title, subtitle, image URL, and gradient are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO home_hero_banners 
      (title, subtitle, image_url, gradient, display_order, is_active) 
    VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    body.title,
    body.subtitle,
    body.image_url,
    body.gradient,
    body.display_order || 0,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
}

// Admin: Update banner
export async function updateHeroBanner(c: Context<AppContext>) {
  const bannerId = c.req.param("id");
  const body = await c.req.json();

  if (!body.title || !body.subtitle || !body.image_url || !body.gradient) {
    return c.json({ error: "Title, subtitle, image URL, and gradient are required" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE home_hero_banners SET 
      title = ?, 
      subtitle = ?, 
      image_url = ?, 
      gradient = ?, 
      display_order = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
  ).bind(
    body.title,
    body.subtitle,
    body.image_url,
    body.gradient,
    body.display_order || 0,
    body.is_active ? 1 : 0,
    bannerId
  ).run();

  return c.json({ success: true });
}

// Admin: Delete banner
export async function deleteHeroBanner(c: Context<AppContext>) {
  const bannerId = c.req.param("id");

  await c.env.DB.prepare(
    "DELETE FROM home_hero_banners WHERE id = ?"
  ).bind(bannerId).run();

  return c.json({ success: true });
}

// Admin: Toggle banner active status
export async function toggleHeroBannerActive(c: Context<AppContext>) {
  const bannerId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE home_hero_banners SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, bannerId).run();

  return c.json({ success: true });
}
