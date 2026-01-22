import { Hono } from "hono";

interface Env {
  DB: D1Database;
}

const marketplace = new Hono<{ Bindings: Env }>();

// Get all marketplace products (products with has_sales = true)
marketplace.get("/products", async (c) => {
  try {
    const query = `
      SELECT 
        up.product_id,
        p.name as product_name,
        s.name as speciality_name,
        upb.brand_name,
        upb.sales_relationship,
        upb.territories,
        upb.product_image_url,
        upb.catalog_url,
        upb.authorization_certificate_url,
        prof.business_name,
        prof.logo_url as business_logo_url,
        prof.user_id as business_user_id,
        prof.city,
        prof.state,
        prof.country
      FROM user_products up
      INNER JOIN products p ON up.product_id = p.id
      INNER JOIN specialities s ON p.speciality_id = s.id
      INNER JOIN user_profiles prof ON up.user_id = prof.user_id
      LEFT JOIN user_product_brands upb ON up.id = upb.user_product_id
      WHERE up.has_sales = 1
        AND prof.onboarding_completed = 1
        AND prof.is_blocked = 0
      ORDER BY prof.business_name, p.name, upb.brand_name
    `;

    const result = await c.env.DB.prepare(query).all();

    // Parse territories JSON for each product
    const products = result.results.map((row: any) => ({
      ...row,
      territories: row.territories ? JSON.parse(row.territories) : [],
    }));

    return c.json(products);
  } catch (error) {
    console.error("Error fetching marketplace products:", error);
    return c.json({ error: "Failed to fetch marketplace products" }, 500);
  }
});

// Get products by specific business
marketplace.get("/business/:userId/products", async (c) => {
  const userId = c.req.param("userId");

  try {
    const query = `
      SELECT 
        up.product_id,
        p.name as product_name,
        s.name as speciality_name,
        upb.brand_name,
        upb.sales_relationship,
        upb.territories,
        upb.product_image_url,
        upb.catalog_url,
        upb.authorization_certificate_url
      FROM user_products up
      INNER JOIN products p ON up.product_id = p.id
      INNER JOIN specialities s ON p.speciality_id = s.id
      LEFT JOIN user_product_brands upb ON up.id = upb.user_product_id
      WHERE up.user_id = ?
        AND up.has_sales = 1
      ORDER BY p.name, upb.brand_name
    `;

    const result = await c.env.DB.prepare(query).bind(userId).all();

    const products = result.results.map((row: any) => ({
      ...row,
      territories: row.territories ? JSON.parse(row.territories) : [],
    }));

    return c.json(products);
  } catch (error) {
    console.error("Error fetching business products:", error);
    return c.json({ error: "Failed to fetch business products" }, 500);
  }
});

export default marketplace;
