// Business Products endpoints
import { Context } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

export function registerBusinessEndpoints(app: any) {
  // Get business products
  app.get("/api/business/products", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    
    const { results: products } = await c.env.DB.prepare(
      "SELECT * FROM business_products WHERE business_user_id = ? ORDER BY created_at DESC"
    ).bind(user!.id).all();

    // Get images for each product
    const productsWithImages = await Promise.all(
      products.map(async (product: any) => {
        const { results: images } = await c.env.DB.prepare(
          "SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC"
        ).bind(product.id).all();

        const { results: catalogs } = await c.env.DB.prepare(
          "SELECT * FROM product_catalog_files WHERE product_id = ?"
        ).bind(product.id).all();

        return { ...product, images, catalogs };
      })
    );

    return c.json(productsWithImages);
  });

  // Create product
  app.post("/api/business/products", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO business_products 
        (business_user_id, name, description, category, manufacturer, model_number, 
         specifications, dealer_price, customer_price, currency, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      body.name,
      body.description || null,
      body.category || null,
      body.manufacturer || null,
      body.model_number || null,
      body.specifications || null,
      body.dealer_price || null,
      body.customer_price || null,
      body.currency || "INR",
      1
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Update product
  app.put("/api/business/products/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const productId = c.req.param("id");
    const body = await c.req.json();

    const product = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_products WHERE id = ?"
    ).bind(productId).first();

    if (!product || product.business_user_id !== user!.id) {
      return c.json({ error: "Product not found or unauthorized" }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE business_products SET 
        name = ?, description = ?, category = ?, manufacturer = ?, 
        model_number = ?, specifications = ?, dealer_price = ?, 
        customer_price = ?, currency = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.name,
      body.description || null,
      body.category || null,
      body.manufacturer || null,
      body.model_number || null,
      body.specifications || null,
      body.dealer_price || null,
      body.customer_price || null,
      body.currency || "INR",
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      productId
    ).run();

    return c.json({ success: true });
  });

  // Delete product
  app.delete("/api/business/products/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const productId = c.req.param("id");

    const product = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_products WHERE id = ?"
    ).bind(productId).first();

    if (!product || product.business_user_id !== user!.id) {
      return c.json({ error: "Product not found or unauthorized" }, 404);
    }

    await c.env.DB.prepare("DELETE FROM product_images WHERE product_id = ?").bind(productId).run();
    await c.env.DB.prepare("DELETE FROM product_catalog_files WHERE product_id = ?").bind(productId).run();
    await c.env.DB.prepare("DELETE FROM business_products WHERE id = ?").bind(productId).run();

    return c.json({ success: true });
  });

  // Upload product image
  app.post("/api/business/products/:id/images", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const productId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("image") as File;

    if (!file || !file.type.startsWith("image/")) {
      return c.json({ error: "Valid image file required" }, 400);
    }

    const product = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_products WHERE id = ?"
    ).bind(productId).first();

    if (!product || product.business_user_id !== user!.id) {
      return c.json({ error: "Product not found or unauthorized" }, 404);
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const key = `product-images/${user!.id}/${productId}/${timestamp}.${fileExtension}`;

    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: { contentType: file.type },
    });

    const imageUrl = `https://r2.mocha.com/${key}`;
    const isPrimary = formData.get("is_primary") === "true";

    if (isPrimary) {
      await c.env.DB.prepare(
        "UPDATE product_images SET is_primary = 0 WHERE product_id = ?"
      ).bind(productId).run();
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)"
    ).bind(productId, imageUrl, isPrimary ? 1 : 0).run();

    return c.json({ id: result.meta.last_row_id, image_url: imageUrl, success: true });
  });

  // Delete product image
  app.delete("/api/business/products/:productId/images/:imageId", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const productId = c.req.param("productId");
    const imageId = c.req.param("imageId");

    const product = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_products WHERE id = ?"
    ).bind(productId).first();

    if (!product || product.business_user_id !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await c.env.DB.prepare("DELETE FROM product_images WHERE id = ?").bind(imageId).run();
    return c.json({ success: true });
  });

  // Upload catalog file
  app.post("/api/business/products/:id/catalogs", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const productId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("catalog") as File;

    if (!file) {
      return c.json({ error: "File required" }, 400);
    }

    const product = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_products WHERE id = ?"
    ).bind(productId).first();

    if (!product || product.business_user_id !== user!.id) {
      return c.json({ error: "Product not found or unauthorized" }, 404);
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "pdf";
    const key = `product-catalogs/${user!.id}/${productId}/${timestamp}.${fileExtension}`;

    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: { contentType: file.type },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    const result = await c.env.DB.prepare(
      "INSERT INTO product_catalog_files (product_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)"
    ).bind(productId, file.name, fileUrl, file.type).run();

    return c.json({ id: result.meta.last_row_id, file_url: fileUrl, success: true });
  });

  // Get product brand territories with engineers
  app.get("/api/business/brands/:brandId/territories", authMiddleware, async (c: Context) => {
    const brandId = c.req.param("brandId");
    
    const { results: territories } = await c.env.DB.prepare(
      "SELECT * FROM product_brand_territories WHERE brand_id = ? ORDER BY created_at DESC"
    ).bind(brandId).all();

    return c.json(territories);
  });

  // Add territory to brand
  app.post("/api/business/brands/:brandId/territories", authMiddleware, async (c: Context) => {
    const brandId = c.req.param("brandId");
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO product_brand_territories (brand_id, country, state, city) VALUES (?, ?, ?, ?)`
    ).bind(
      brandId,
      body.country,
      body.state || null,
      body.city || null
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Delete territory
  app.delete("/api/business/territories/:id", authMiddleware, async (c: Context) => {
    const territoryId = c.req.param("id");

    await c.env.DB.prepare("DELETE FROM product_brand_territories WHERE id = ?").bind(territoryId).run();
    return c.json({ success: true });
  });

  // Get brand engineers
  app.get("/api/business/brands/:brandId/engineers", authMiddleware, async (c: Context) => {
    const brandId = c.req.param("brandId");
    
    const { results } = await c.env.DB.prepare(
      `SELECT pbe.*, pbt.country, pbt.state, pbt.city
       FROM product_brand_engineers pbe
       LEFT JOIN product_brand_territories pbt ON pbe.territory_id = pbt.id
       WHERE pbe.brand_id = ? 
       ORDER BY pbe.created_at DESC`
    ).bind(brandId).all();

    return c.json(results);
  });

  // Add engineer to brand
  app.post("/api/business/brands/:brandId/engineers", authMiddleware, async (c: Context) => {
    const brandId = c.req.param("brandId");
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO product_brand_engineers 
        (brand_id, territory_id, name, email, contact, designation) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      brandId,
      body.territory_id || null,
      body.name,
      body.email || null,
      body.contact,
      body.designation || "Service Engineer"
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Update brand engineer
  app.put("/api/business/brand-engineers/:id", authMiddleware, async (c: Context) => {
    const engineerId = c.req.param("id");
    const body = await c.req.json();

    await c.env.DB.prepare(
      `UPDATE product_brand_engineers SET 
        territory_id = ?, name = ?, email = ?, contact = ?, designation = ?, 
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.territory_id || null,
      body.name,
      body.email || null,
      body.contact,
      body.designation || "Service Engineer",
      engineerId
    ).run();

    return c.json({ success: true });
  });

  // Delete brand engineer
  app.delete("/api/business/brand-engineers/:id", authMiddleware, async (c: Context) => {
    const engineerId = c.req.param("id");

    await c.env.DB.prepare("DELETE FROM product_brand_engineers WHERE id = ?").bind(engineerId).run();
    return c.json({ success: true });
  });

  // Get territories (legacy - keep for compatibility)
  app.get("/api/business/territories", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM business_territories WHERE business_user_id = ? ORDER BY is_primary DESC, created_at DESC"
    ).bind(user!.id).all();

    return c.json(results);
  });

  // Add territory
  app.post("/api/business/territories", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json();

    if (body.is_primary) {
      await c.env.DB.prepare(
        "UPDATE business_territories SET is_primary = 0 WHERE business_user_id = ?"
      ).bind(user!.id).run();
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO business_territories 
        (business_user_id, country, state, city, pincode, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      body.country,
      body.state || null,
      body.city || null,
      body.pincode || null,
      body.is_primary ? 1 : 0
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Delete territory
  app.delete("/api/business/territories/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const territoryId = c.req.param("id");

    const territory = await c.env.DB.prepare(
      "SELECT business_user_id FROM business_territories WHERE id = ?"
    ).bind(territoryId).first();

    if (!territory || territory.business_user_id !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await c.env.DB.prepare("DELETE FROM business_territories WHERE id = ?").bind(territoryId).run();
    return c.json({ success: true });
  });

  // Get service engineers (legacy - keep for compatibility with business dashboard)
  app.get("/api/business/engineers", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM service_engineers WHERE business_user_id = ? ORDER BY created_at DESC"
    ).bind(user!.id).all();

    return c.json(results);
  });

  // Add service engineer (legacy)
  app.post("/api/business/engineers", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO service_engineers 
        (business_user_id, name, email, phone, role, specialization, country, state, city, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      body.name,
      body.email || null,
      body.phone,
      body.role || null,
      body.specialization || null,
      body.country || null,
      body.state || null,
      body.city || null,
      1
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Update service engineer (legacy)
  app.put("/api/business/engineers/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const engineerId = c.req.param("id");
    const body = await c.req.json();

    const engineer = await c.env.DB.prepare(
      "SELECT business_user_id FROM service_engineers WHERE id = ?"
    ).bind(engineerId).first();

    if (!engineer || engineer.business_user_id !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await c.env.DB.prepare(
      `UPDATE service_engineers SET 
        name = ?, email = ?, phone = ?, role = ?, specialization = ?, 
        country = ?, state = ?, city = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.name ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.role ?? null,
      body.specialization ?? null,
      body.country ?? null,
      body.state ?? null,
      body.city ?? null,
      engineerId
    ).run();

    return c.json({ success: true });
  });

  // Delete service engineer (legacy)
  app.delete("/api/business/engineers/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const engineerId = c.req.param("id");

    const engineer = await c.env.DB.prepare(
      "SELECT business_user_id FROM service_engineers WHERE id = ?"
    ).bind(engineerId).first();

    if (!engineer || engineer.business_user_id !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await c.env.DB.prepare("DELETE FROM service_engineers WHERE id = ?").bind(engineerId).run();
    return c.json({ success: true });
  });

  // Get authorized dealers
  app.get("/api/business/dealers", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM authorized_dealers WHERE business_user_id = ? ORDER BY created_at DESC"
    ).bind(user!.id).all();

    return c.json(results);
  });

  // Add authorized dealer
  app.post("/api/business/dealers", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO authorized_dealers 
        (business_user_id, company_name, product_category, authorization_certificate_url, 
         valid_from, valid_until, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      body.company_name,
      body.product_category || null,
      body.authorization_certificate_url || null,
      body.valid_from || null,
      body.valid_until || null,
      0
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  });

  // Upload authorization certificate
  app.post("/api/business/dealers/upload-certificate", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const formData = await c.req.formData();
    const file = formData.get("certificate") as File;

    if (!file) {
      return c.json({ error: "File required" }, 400);
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "pdf";
    const key = `dealer-certificates/${user!.id}/${timestamp}.${fileExtension}`;

    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: { contentType: file.type },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;
    return c.json({ certificate_url: fileUrl, success: true });
  });

  // Delete authorized dealer
  app.delete("/api/business/dealers/:id", authMiddleware, async (c: Context) => {
    const user = c.get("user");
    const dealerId = c.req.param("id");

    const dealer = await c.env.DB.prepare(
      "SELECT business_user_id FROM authorized_dealers WHERE id = ?"
    ).bind(dealerId).first();

    if (!dealer || dealer.business_user_id !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await c.env.DB.prepare("DELETE FROM authorized_dealers WHERE id = ?").bind(dealerId).run();
    return c.json({ success: true });
  });
}
