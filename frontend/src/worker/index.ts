import { Hono, Context } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import { calculateAnalytics, generateCSV } from "@/worker/analytics-utils";
import { fetchContentWithAI, checkAndAutoFetch, fetchExhibitionsOnly } from "@/worker/content-fetcher";
import { registerBusinessEndpoints } from "@/worker/business-endpoints";
import { getOrCreateGamification, addXP, getUserBadges, getRecentXPEvents } from "@/worker/gamification-utils";
import { checkProfileFieldsAndAwardXP, getProfileCompletionStatus } from "@/worker/profile-xp-utils";
import { 
  getHomeHeroBanners, 
  getAdminHeroBanners, 
  createHeroBanner, 
  updateHeroBanner, 
  deleteHeroBanner, 
  toggleHeroBannerActive 
} from "@/worker/banner-endpoints";
import { pushToGitHub, getProjectFiles } from "@/worker/github-sync";
import { generateOTP, sendOTP, storeOTP, verifyOTP } from "@/worker/otp-utils";
import { calculateFinalQuote, getTierDescription, calculateAmbulanceFare, calculateDistance } from "@/worker/pricing-utils";
import { getInstructorCourses, getInstructorEarnings } from "@/worker/instructor-endpoints";
import { generateCertificate, getUserCertificates, getCertificateById } from "@/worker/certificate-generator";
import { getCourseModules, markLessonComplete, createCourseModule, createCourseLesson } from "@/worker/course-modules-endpoints";
import marketplaceEndpoints from "@/worker/marketplace-endpoints";
import { getContactRequests, createContactRequest, getContactRequestReplies, createContactRequestReply, deleteContactRequest } from "@/worker/contact-request-endpoints";

type AppContext = {
  Bindings: Env;
  Variables: {
    adminRole?: string;
    adminId?: number;
  };
};

const app = new Hono<AppContext>();

// Admin check middleware
const adminCheckMiddleware = async (c: Context<AppContext>, next: () => Promise<void>) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const adminCheck = await c.env.DB.prepare(
    "SELECT id, role FROM admin_users WHERE email = ?"
  ).bind(user.google_user_data.email).first();

  if (!adminCheck) {
    return c.json({ error: "Forbidden - Admin access required" }, 403);
  }

  (c as any).set("adminRole", adminCheck.role);
  (c as any).set("adminId", adminCheck.id);

  await next();
};



app.use("/*", cors());

// Register business endpoints
registerBusinessEndpoints(app);

// Mount marketplace endpoints
app.route("/api/marketplace", marketplaceEndpoints);

// OTP Authentication endpoints
app.post("/api/auth/otp/send", async (c) => {
  try {
    const body = await c.req.json();
    const { phone_number } = body;

    if (!phone_number) {
      return c.json({ success: false, message: "Phone number is required" }, 400);
    }

    // Validate Indian phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return c.json({ success: false, message: "Invalid phone number format" }, 400);
    }

    // Generate OTP
    const otp = await generateOTP();

    // Send OTP via Fast2SMS
    const apiKey = c.env.FAST2SMS_API_KEY || "";
    if (!apiKey) {
      return c.json({ 
        success: false, 
        message: "SMS service not configured. Please contact support." 
      }, 500);
    }
    
    const result = await sendOTP(phone_number, otp, apiKey);

    if (result.success) {
      // Store OTP in database
      await storeOTP(c.env.DB, phone_number, otp);
      
      return c.json({ 
        success: true, 
        message: "OTP sent successfully to your mobile number" 
      });
    } else {
      return c.json({ 
        success: false, 
        message: result.message 
      }, 500);
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return c.json({ 
      success: false, 
      message: "Failed to send OTP. Please try again." 
    }, 500);
  }
});

app.post("/api/auth/otp/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { phone_number, otp } = body;

    if (!phone_number || !otp) {
      return c.json({ success: false, message: "Phone number and OTP are required" }, 400);
    }

    // Verify OTP
    const verification = await verifyOTP(c.env.DB, phone_number, otp);

    if (!verification.valid) {
      return c.json({ success: false, message: verification.message }, 400);
    }

    // Check if user exists with this phone number
    let profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE phone = ?"
    ).bind(phone_number).first();

    if (!profile) {
      // Create new user profile
      const referralCode = `BIO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Generate a unique user_id
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      await c.env.DB.prepare(
        "INSERT INTO user_profiles (user_id, phone, referral_code, onboarding_completed) VALUES (?, ?, ?, 0)"
      ).bind(userId, phone_number, referralCode).run();

      profile = await c.env.DB.prepare(
        "SELECT * FROM user_profiles WHERE user_id = ?"
      ).bind(userId).first();
    }

    if (!profile) {
      return c.json({ 
        success: false, 
        message: "Failed to create user account. Please try again." 
      }, 500);
    }

    // Create session token (simplified - in production use proper JWT)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store session in cookie
    setCookie(c, "mavy_session", sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ 
      success: true, 
      message: "Login successful",
      user: {
        id: profile.user_id,
        phone: profile.phone,
        onboarding_completed: profile.onboarding_completed
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return c.json({ 
      success: false, 
      message: "Failed to verify OTP. Please try again." 
    }, 500);
  }
});

// OTP verification for profile phone updates (no session creation)
app.post("/api/auth/otp/verify-phone", async (c) => {
  try {
    const body = await c.req.json();
    const { phone_number, otp } = body;

    if (!phone_number || !otp) {
      return c.json({ success: false, message: "Phone number and OTP are required" }, 400);
    }

    // Verify OTP
    const verification = await verifyOTP(c.env.DB, phone_number, otp);

    if (!verification.valid) {
      return c.json({ success: false, message: verification.message }, 400);
    }

    // Just return success - don't create sessions or profiles
    return c.json({ 
      success: true, 
      message: "Phone number verified successfully"
    });
  } catch (error) {
    console.error("Verify phone OTP error:", error);
    return c.json({ 
      success: false, 
      message: "Failed to verify OTP. Please try again." 
    }, 500);
  }
});

// Ribbon cutting settings (public read, admin write)
app.get("/api/ribbon-settings", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key LIKE 'ribbon_%'"
    ).all();

    const settings: Record<string, string> = {
      ribbon_cutting_enabled: "true",
      ribbon_heading: "Grand Opening",
      ribbon_subheading: "Welcome to the Future of Healthcare",
      ribbon_instruction: "Cut the ribbon to enter",
      ribbon_button_text: "CUT",
      ribbon_badge_text: "VIP Launch",
    };

    results.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value;
    });

    return c.json(settings);
  } catch (error) {
    console.error("Error fetching ribbon settings:", error);
    return c.json({
      ribbon_cutting_enabled: "true",
      ribbon_heading: "Grand Opening",
      ribbon_subheading: "Welcome to the Future of Healthcare",
      ribbon_instruction: "Cut the ribbon to enter",
      ribbon_button_text: "CUT",
      ribbon_badge_text: "VIP Launch",
    });
  }
});

app.put("/api/admin/ribbon-settings", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update ribbon settings" }, 403);
  }

  try {
    const body = await c.req.json();
    
    const allowedKeys = [
      "ribbon_cutting_enabled",
      "ribbon_heading",
      "ribbon_subheading",
      "ribbon_instruction",
      "ribbon_button_text",
      "ribbon_badge_text",
    ];

    for (const key of allowedKeys) {
      if (key in body) {
        await c.env.DB.prepare(
          "INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)"
        ).bind(key, body[key]).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating ribbon settings:", error);
    return c.json({ error: "Failed to update ribbon settings" }, 500);
  }
});

// Reset ribbon for all users (clears localStorage tracking)
app.post("/api/admin/ribbon-settings/reset", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can reset ribbon" }, 403);
  }

  // Just return success - the actual reset happens by changing the ribbon version
  // which will be stored in app_settings and compared on frontend
  try {
    const newVersion = Date.now().toString();
    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES ('ribbon_version', ?, CURRENT_TIMESTAMP)"
    ).bind(newVersion).run();

    return c.json({ success: true, version: newVersion });
  } catch (error) {
    console.error("Error resetting ribbon:", error);
    return c.json({ error: "Failed to reset ribbon" }, 500);
  }
});

// Home hero banners endpoints
app.get("/api/home/hero-banners", getHomeHeroBanners);
app.get("/api/admin/hero-banners", authMiddleware, adminCheckMiddleware, getAdminHeroBanners);
app.post("/api/admin/hero-banners", authMiddleware, adminCheckMiddleware, createHeroBanner);
app.put("/api/admin/hero-banners/:id", authMiddleware, adminCheckMiddleware, updateHeroBanner);
app.delete("/api/admin/hero-banners/:id", authMiddleware, adminCheckMiddleware, deleteHeroBanner);
app.put("/api/admin/hero-banners/:id/toggle-active", authMiddleware, adminCheckMiddleware, toggleHeroBannerActive);

// OAuth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    let sessionToken;
    try {
      sessionToken = await exchangeCodeForSessionToken(body.code, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    } catch (exchangeError) {
      console.error("OAuth code exchange error:", exchangeError);
      
      // Return a more user-friendly error
      return c.json({ 
        error: "Authentication failed. Please try signing in again.",
        details: exchangeError instanceof Error ? exchangeError.message : "OAuth exchange failed"
      }, 401);
    }

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60,
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Session creation error:", error);
    return c.json({ 
      error: "Failed to create session", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Check if user is admin and get their permissions
app.get("/api/check-admin", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // If no user is logged in, return not admin
  if (!user) {
    return c.json({ is_admin: false });
  }
  
  const adminCheck = await c.env.DB.prepare(
    "SELECT id, role FROM admin_users WHERE email = ?"
  ).bind(user.google_user_data.email).first();

  if (!adminCheck) {
    return c.json({ is_admin: false });
  }

  // If super admin, return all permissions
  if (adminCheck.role === "super_admin") {
    return c.json({
      is_admin: true,
      role: "super_admin",
      permissions: {
        analytics: "edit",
        users: "edit",
        patients: "edit",
        kyc: "edit",
        posts: "edit",
        exhibitions: "edit",
        jobs: "edit",
        fundraising: "edit",
        system_config: "edit",
        pricing: "edit",
        hero_banners: "edit",
        advertising: "edit",
        reports: "edit",
        admins: "edit",
        learning: "edit",
        services: "edit",
        manuals: "edit",
        approvals: "edit",
        subscriptions: "edit",
      }
    });
  }

  // Otherwise, fetch specific permissions
  const { results } = await c.env.DB.prepare(
    "SELECT tab_name, permission_level FROM admin_permissions WHERE admin_user_id = ?"
  ).bind(adminCheck.id).all();

  const permissions: Record<string, string> = {};
  results.forEach((p: any) => {
    permissions[p.tab_name] = p.permission_level;
  });

  return c.json({
    is_admin: true,
    role: adminCheck.role,
    permissions
  });
});

// Get notification counts for admin tabs
app.get("/api/admin/notification-counts", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    // Count pending posts (user-generated posts)
    const postsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM news_updates WHERE is_user_post = 1"
    ).first();

    // Count pending exhibitions (user-generated)
    const exhibitionsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM medical_exhibitions WHERE is_user_post = 1"
    ).first();

    // Count pending jobs
    const jobsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'open'"
    ).first();

    // Count pending fundraisers (verification pending)
    const fundraisingCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM fundraisers WHERE verification_status = 'pending'"
    ).first();

    // Count pending learning courses
    const learningCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM learning_courses WHERE approval_status = 'pending'"
    ).first();

    // Count pending content approvals
    const approvalsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM pending_content WHERE approval_status = 'pending'"
    ).first();

    // Count pending reports (all types)
    const postReportsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM post_reports WHERE status = 'pending'"
    ).first();
    const exhibitionReportsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM exhibition_reports WHERE status = 'pending'"
    ).first();
    const profileReportsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM profile_reports WHERE status = 'pending'"
    ).first();
    
    const totalReports = Number(postReportsCount?.count || 0) + 
                        Number(exhibitionReportsCount?.count || 0) + 
                        Number(profileReportsCount?.count || 0);

    // Count pending location change requests
    const locationRequestsCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM location_change_requests WHERE status = 'pending'"
    ).first();

    // Count pending KYC submissions
    const kycCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM kyc_submissions WHERE status = 'pending'"
    ).first();

    return c.json({
      posts: postsCount?.count || 0,
      exhibitions: exhibitionsCount?.count || 0,
      jobs: jobsCount?.count || 0,
      fundraising: fundraisingCount?.count || 0,
      learning: learningCount?.count || 0,
      approvals: approvalsCount?.count || 0,
      reports: totalReports,
      users: locationRequestsCount?.count || 0,
      kyc: kycCount?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    return c.json({ error: "Failed to fetch notification counts" }, 500);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  if (!profile) {
    const referralCode = `BIO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await c.env.DB.prepare(
      "INSERT INTO user_profiles (user_id, full_name, referral_code, onboarding_completed) VALUES (?, ?, ?, 0)"
    )
      .bind(user!.id, user!.google_user_data.name || "", referralCode)
      .run();

    const newProfile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    )
      .bind(user!.id)
      .first();

    return c.json({ ...user, profile: newProfile, is_new_user: true });
  }

  // Get KYC status if user is a partner
  let kycStatus = null;
  if (profile.account_type !== "patient") {
    const kyc = await c.env.DB.prepare(
      "SELECT status FROM kyc_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user!.id).first();
    
    kycStatus = kyc?.status || null;
  }

  // Get rating stats
  let ratingStats: any = { average_rating: 5, total_ratings: 0, total_completed_orders: 0 };
  
  if (profile.account_type === "patient") {
    // For patients: get ratings given by partners (user_rating)
    const stats = await c.env.DB.prepare(
      `SELECT 
        AVG(user_rating) as avg_rating,
        COUNT(CASE WHEN user_rating IS NOT NULL THEN 1 END) as total_ratings,
        COUNT(*) as total_completed
      FROM service_orders 
      WHERE patient_user_id = ? AND status = 'completed'`
    ).bind(user!.id).first() as any;
    
    ratingStats = {
      average_rating: stats?.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 5,
      total_ratings: stats?.total_ratings || 0,
      total_completed_orders: stats?.total_completed || 0,
    };
  } else {
    // For partners: get ratings given by patients (partner_rating)
    const stats = await c.env.DB.prepare(
      `SELECT 
        AVG(partner_rating) as avg_rating,
        COUNT(CASE WHEN partner_rating IS NOT NULL THEN 1 END) as total_ratings,
        COUNT(*) as total_completed
      FROM service_orders 
      WHERE assigned_engineer_id = ? AND status = 'completed'`
    ).bind(user!.id).first() as any;
    
    ratingStats = {
      average_rating: stats?.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 5,
      total_ratings: stats?.total_ratings || 0,
      total_completed_orders: stats?.total_completed || 0,
    };
  }

  return c.json({ ...user, profile: { ...profile, kyc_status: kycStatus, rating_stats: ratingStats } });
});

// Onboarding endpoints
app.get("/api/specialities", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM specialities ORDER BY name ASC"
  ).all();

  return c.json(results);
});

app.get("/api/products", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products ORDER BY name ASC"
  ).all();

  return c.json(results);
});

app.post("/api/onboarding/upload-gst", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("document") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Only PDF, JPG, and PNG files are allowed" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "pdf";
  const key = `gst-documents/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const documentUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, document_url: documentUrl });
  } catch (error) {
    console.error("Error uploading GST document:", error);
    return c.json({ error: "Failed to upload document" }, 500);
  }
});

app.post("/api/onboarding/upload-logo", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("logo") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Only image files are allowed" }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Image size must be less than 5MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "png";
  const key = `company-logos/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const logoUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, logo_url: logoUrl });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return c.json({ error: "Failed to upload logo" }, 500);
  }
});

app.post("/api/onboarding/upload-portfolio", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "file";
  const key = `portfolio/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, file_url: fileUrl });
  } catch (error) {
    console.error("Error uploading portfolio file:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

app.post("/api/onboarding/complete", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    // Update user profile with onboarding data
    await c.env.DB.prepare(
      `UPDATE user_profiles SET 
        profession = ?,
        account_type = ?,
        business_name = ?,
        business_type = ?,
        logo_url = ?,
        country = ?,
        state = ?,
        city = ?,
        pincode = ?,
        gst_number = ?,
        gst_document_url = ?,
        workplace_type = ?,
        workplace_name = ?,
        phone = ?,
        patient_full_name = ?,
        patient_contact = ?,
        patient_email = ?,
        patient_address = ?,
        patient_city = ?,
        patient_pincode = ?,
        patient_latitude = ?,
        patient_longitude = ?,
        onboarding_completed = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
    ).bind(
      body.profession || 'Biomedical Engineer',
      body.account_type || null,
      body.business_name || null,
      body.business_type || null,
      body.logo_url || null,
      body.country || null,
      body.state || null,
      body.city || null,
      body.pincode || null,
      body.gst_number || null,
      body.gst_document_url || null,
      body.workplace_type || null,
      body.workplace_name || null,
      body.phone || null,
      body.patient_full_name || null,
      body.patient_contact || null,
      body.patient_email || null,
      body.patient_address || null,
      body.patient_city || null,
      body.patient_pincode || null,
      body.patient_latitude || null,
      body.patient_longitude || null,
      user!.id
    ).run();

    // Save specialities
    if (body.speciality_ids && Array.isArray(body.speciality_ids)) {
      for (const specialityId of body.speciality_ids) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO user_specialities (user_id, speciality_id) VALUES (?, ?)"
        ).bind(user!.id, specialityId).run();
      }
    }

    // Save products
    if (body.products && Array.isArray(body.products)) {
      for (const product of body.products) {
        const result = await c.env.DB.prepare(
          `INSERT OR REPLACE INTO user_products 
            (user_id, product_id, has_sales, has_service, hourly_rate, service_charge) 
          VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          user!.id,
          product.product_id,
          product.has_sales ? 1 : 0,
          product.has_service ? 1 : 0,
          product.hourly_rate || null,
          product.service_charge || null
        ).run();

        const userProductId = result.meta.last_row_id;

        // Save brands for this product
        if (product.brands && Array.isArray(product.brands)) {
          for (const brand of product.brands) {
            const brandResult = await c.env.DB.prepare(
              `INSERT INTO user_product_brands 
                (user_product_id, brand_name, is_authorized, authorization_certificate_url, 
                 license_type, license_number) 
              VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(
              userProductId,
              brand.brand_name,
              brand.is_authorized ? 1 : 0,
              brand.authorization_certificate_url || null,
              brand.license_type || null,
              brand.license_number || null
            ).run();

            const brandId = brandResult.meta.last_row_id;

            // Save territories for this brand
            if (brand.territories && Array.isArray(brand.territories)) {
              for (const territory of brand.territories) {
                await c.env.DB.prepare(
                  `INSERT INTO product_brand_territories 
                    (brand_id, country, state, city) 
                  VALUES (?, ?, ?, ?)`
                ).bind(
                  brandId,
                  territory.country || "India",
                  territory.state || territory,
                  territory.city || null
                ).run();
              }
            }

            // Save engineers for this brand
            if (brand.engineers && Array.isArray(brand.engineers)) {
              for (const engineer of brand.engineers) {
                await c.env.DB.prepare(
                  `INSERT INTO product_brand_engineers 
                    (brand_id, territory_id, name, email, contact, designation) 
                  VALUES (?, ?, ?, ?, ?, ?)`
                ).bind(
                  brandId,
                  engineer.territory_id || null,
                  engineer.name,
                  engineer.email || null,
                  engineer.contact,
                  engineer.designation || "Service Engineer"
                ).run();
              }
            } else if (brand.engineer_name) {
              // Legacy support - single engineer from old structure
              await c.env.DB.prepare(
                `INSERT INTO product_brand_engineers 
                  (brand_id, name, email, contact, designation) 
                VALUES (?, ?, ?, ?, ?)`
              ).bind(
                brandId,
                brand.engineer_name,
                brand.engineer_email || null,
                brand.engineer_contact,
                "Service Engineer"
              ).run();
            }
          }
        }
      }
    }

    // Save portfolio items for freelancers
    if (body.portfolio && Array.isArray(body.portfolio)) {
      for (const item of body.portfolio) {
        await c.env.DB.prepare(
          `INSERT INTO freelancer_portfolio 
            (user_id, title, description, file_url, file_type) 
          VALUES (?, ?, ?, ?, ?)`
        ).bind(
          user!.id,
          item.title || null,
          item.description || null,
          item.file_url,
          item.file_type
        ).run();
      }
    }

    // Apply referral code if provided during signup
    if (body.referral_code) {
      const referralCode = body.referral_code as string;
      
      // Check if user already has a referrer
      const existingReferral = await c.env.DB.prepare(
        "SELECT id FROM referral_tracking WHERE referred_user_id = ?"
      ).bind(user!.id).first();

      if (!existingReferral) {
        // Find referrer by code (case-insensitive)
        const referrer = await c.env.DB.prepare(
          "SELECT user_id FROM user_profiles WHERE UPPER(referral_code) = UPPER(?)"
        ).bind(referralCode).first();

        if (referrer && referrer.user_id !== user!.id) {
          // Get reward amounts from config
          const { results: configRows } = await c.env.DB.prepare(
            "SELECT config_key, config_value FROM referral_config WHERE config_key IN ('referrer_reward_amount', 'referred_reward_amount')"
          ).all();
          const configMap: Record<string, string> = {};
          configRows.forEach((row: any) => { configMap[row.config_key] = row.config_value; });

          // Create referral tracking
          await c.env.DB.prepare(`
            INSERT INTO referral_tracking (
              referrer_user_id, referred_user_id, referral_code, 
              referral_stage, referrer_reward_amount, referred_reward_amount
            ) VALUES (?, ?, ?, 'registered', ?, ?)
          `).bind(
            referrer.user_id,
            user!.id,
            referralCode.toUpperCase(),
            parseFloat(configMap.referrer_reward_amount || '100'),
            parseFloat(configMap.referred_reward_amount || '50')
          ).run();
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return c.json({ error: "Failed to complete onboarding" }, 500);
  }
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    try {
      await deleteSession(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      // Continue anyway to clear the cookie
    }
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Alias for logout at /api/auth/logout
app.get("/api/auth/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    try {
      await deleteSession(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      // Continue anyway to clear the cookie
    }
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Delete account endpoint with detailed status tracking
app.delete("/api/account", authMiddleware, async (c) => {
  const user = c.get("user");
  const deletionStatus: Record<string, number> = {};

  try {
    console.log(`[Account Deletion] Starting complete data deletion for user ${user!.id}`);
    
    // Track all deletions with detailed counts
    const executeDelete = async (table: string, query: string, ...params: any[]) => {
      const result = await c.env.DB.prepare(query).bind(...params).run();
      deletionStatus[table] = result.meta.changes || 0;
      if (result.meta.changes && result.meta.changes > 0) {
        console.log(`[Account Deletion] Deleted ${result.meta.changes} record(s) from ${table}`);
      }
    };

    // Delete profile-related data
    await executeDelete("user_specialities", "DELETE FROM user_specialities WHERE user_id = ?", user!.id);
    await executeDelete("user_products", "DELETE FROM user_products WHERE user_id = ?", user!.id);
    await executeDelete("freelancer_portfolio", "DELETE FROM freelancer_portfolio WHERE user_id = ?", user!.id);
    
    // Delete social interactions
    await executeDelete("news_likes", "DELETE FROM news_likes WHERE user_id = ?", user!.id);
    await executeDelete("news_comments", "DELETE FROM news_comments WHERE user_id = ?", user!.id);
    await executeDelete("news_shares", "DELETE FROM news_shares WHERE user_id = ?", user!.id);
    await executeDelete("news_reposts", "DELETE FROM news_reposts WHERE user_id = ?", user!.id);
    await executeDelete("saved_posts", "DELETE FROM saved_posts WHERE user_id = ?", user!.id);
    await executeDelete("user_follows", "DELETE FROM user_follows WHERE follower_user_id = ? OR following_user_id = ?", user!.id, user!.id);
    await executeDelete("comment_replies", "DELETE FROM comment_replies WHERE user_id = ?", user!.id);
    await executeDelete("comment_likes", "DELETE FROM comment_likes WHERE user_id = ?", user!.id);
    await executeDelete("post_reports", "DELETE FROM post_reports WHERE user_id = ?", user!.id);
    
    // Delete exhibition interactions
    await executeDelete("exhibition_likes", "DELETE FROM exhibition_likes WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_comments", "DELETE FROM exhibition_comments WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_shares", "DELETE FROM exhibition_shares WHERE user_id = ?", user!.id);
    await executeDelete("saved_exhibitions", "DELETE FROM saved_exhibitions WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_responses", "DELETE FROM exhibition_responses WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_views", "DELETE FROM exhibition_views WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_comment_replies", "DELETE FROM exhibition_comment_replies WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_comment_likes", "DELETE FROM exhibition_comment_likes WHERE user_id = ?", user!.id);
    await executeDelete("exhibition_reports", "DELETE FROM exhibition_reports WHERE user_id = ?", user!.id);
    
    // Delete chat and messaging
    await executeDelete("global_chat_messages", "DELETE FROM global_chat_messages WHERE user_id = ?", user!.id);
    await executeDelete("chat_message_replies", "DELETE FROM chat_message_replies WHERE user_id = ?", user!.id);
    await executeDelete("chat_message_reactions", "DELETE FROM chat_message_reactions WHERE user_id = ?", user!.id);
    await executeDelete("direct_messages", "DELETE FROM direct_messages WHERE sender_user_id = ? OR receiver_user_id = ?", user!.id, user!.id);
    
    // Delete reports and moderation
    await executeDelete("profile_reports", "DELETE FROM profile_reports WHERE reported_user_id = ? OR reporter_user_id = ?", user!.id, user!.id);
    
    // Delete activity and engagement
    await executeDelete("user_activity_logs", "DELETE FROM user_activity_logs WHERE user_id = ?", user!.id);
    await executeDelete("notification_preferences", "DELETE FROM notification_preferences WHERE user_id = ?", user!.id);
    await executeDelete("notifications", "DELETE FROM notifications WHERE user_id = ?", user!.id);
    
    // Delete support and requests
    await executeDelete("support_tickets", "DELETE FROM support_tickets WHERE user_id = ?", user!.id);
    await executeDelete("service_requests", "DELETE FROM service_requests WHERE requester_user_id = ?", user!.id);
    await executeDelete("location_change_requests", "DELETE FROM location_change_requests WHERE user_id = ?", user!.id);
    
    // Delete gamification data
    await executeDelete("daily_actions", "DELETE FROM daily_actions WHERE user_id = ?", user!.id);
    await executeDelete("completed_actions", "DELETE FROM completed_actions WHERE user_id = ?", user!.id);
    await executeDelete("user_streaks", "DELETE FROM user_streaks WHERE user_id = ?", user!.id);
    await executeDelete("weekly_reports", "DELETE FROM weekly_reports WHERE user_id = ?", user!.id);
    await executeDelete("user_gamification", "DELETE FROM user_gamification WHERE user_id = ?", user!.id);
    await executeDelete("xp_events", "DELETE FROM xp_events WHERE user_id = ?", user!.id);
    await executeDelete("profile_field_xp", "DELETE FROM profile_field_xp WHERE user_id = ?", user!.id);
    
    // Delete user-created content
    await executeDelete("news_updates", "DELETE FROM news_updates WHERE posted_by_user_id = ?", user!.id);
    await executeDelete("medical_exhibitions", "DELETE FROM medical_exhibitions WHERE posted_by_user_id = ?", user!.id);
    await executeDelete("jobs", "DELETE FROM jobs WHERE posted_by_user_id = ?", user!.id);
    await executeDelete("service_listings", "DELETE FROM service_listings WHERE provider_user_id = ?", user!.id);
    await executeDelete("fundraisers", "DELETE FROM fundraisers WHERE creator_user_id = ?", user!.id);
    await executeDelete("learning_courses", "DELETE FROM learning_courses WHERE submitted_by_user_id = ?", user!.id);
    await executeDelete("service_manuals", "DELETE FROM service_manuals WHERE uploaded_by_user_id = ?", user!.id);
    
    // Delete ALL service orders (pending, active, completed) for both patients and partners
    await executeDelete("service_orders", "DELETE FROM service_orders WHERE patient_user_id = ? OR assigned_engineer_id = ?", user!.id, user!.id);
    
    // Delete financial data
    await executeDelete("transactions", "DELETE FROM transactions WHERE user_id = ?", user!.id);
    await executeDelete("wallet_transactions", "DELETE FROM wallet_transactions WHERE user_id = ?", user!.id);
    await executeDelete("user_wallets", "DELETE FROM user_wallets WHERE user_id = ?", user!.id);
    await executeDelete("referral_tracking", "DELETE FROM referral_tracking WHERE referrer_user_id = ? OR referred_user_id = ?", user!.id, user!.id);
    await executeDelete("fundraiser_donations", "DELETE FROM fundraiser_donations WHERE donor_user_id = ?", user!.id);
    
    // Delete KYC and verification
    await executeDelete("kyc_submissions", "DELETE FROM kyc_submissions WHERE user_id = ?", user!.id);
    await executeDelete("patient_notification_settings", "DELETE FROM patient_notification_settings WHERE user_id = ?", user!.id);
    
    // Delete connections and network
    await executeDelete("user_connections", "DELETE FROM user_connections WHERE requester_user_id = ? OR receiver_user_id = ?", user!.id, user!.id);
    await executeDelete("user_followers", "DELETE FROM user_followers WHERE follower_user_id = ? OR following_user_id = ?", user!.id, user!.id);
    await executeDelete("connection_requests", "DELETE FROM connection_requests WHERE sender_user_id = ? OR receiver_user_id = ?", user!.id, user!.id);
    await executeDelete("blocked_users", "DELETE FROM blocked_users WHERE blocker_user_id = ? OR blocked_user_id = ?", user!.id, user!.id);
    
    // Delete learning and courses
    await executeDelete("course_enrollments", "DELETE FROM course_enrollments WHERE user_id = ?", user!.id);
    await executeDelete("course_reviews", "DELETE FROM course_reviews WHERE user_id = ?", user!.id);
    await executeDelete("user_course_progress", "DELETE FROM user_course_progress WHERE user_id = ?", user!.id);
    
    // Delete business/partner-specific data
    await executeDelete("product_catalog_files", "DELETE FROM product_catalog_files WHERE product_id IN (SELECT id FROM business_products WHERE business_user_id = ?)", user!.id);
    await executeDelete("product_images", "DELETE FROM product_images WHERE product_id IN (SELECT id FROM business_products WHERE business_user_id = ?)", user!.id);
    await executeDelete("business_products", "DELETE FROM business_products WHERE business_user_id = ?", user!.id);
    await executeDelete("authorized_dealers", "DELETE FROM authorized_dealers WHERE business_user_id = ?", user!.id);
    await executeDelete("business_territories", "DELETE FROM business_territories WHERE business_user_id = ?", user!.id);
    await executeDelete("service_engineers", "DELETE FROM service_engineers WHERE business_user_id = ?", user!.id);
    
    // Finally delete the user profile
    await executeDelete("user_profiles", "DELETE FROM user_profiles WHERE user_id = ?", user!.id);
    
    // Calculate total records deleted
    const totalDeleted = Object.values(deletionStatus).reduce((sum, count) => sum + count, 0);
    console.log(`[Account Deletion] Total records deleted: ${totalDeleted} across ${Object.keys(deletionStatus).length} tables`);

    // Invalidate and delete the user's Mocha session
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (typeof sessionToken === "string") {
      try {
        await deleteSession(sessionToken, {
          apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
          apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
        });
        console.log(`[Account Deletion] Mocha session invalidated for user ${user!.id}`);
      } catch (error) {
        console.error("[Account Deletion] Error deleting Mocha session:", error);
      }
    }

    // Clear session cookie
    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 0,
    });

    console.log(`[Account Deletion] Complete. User ${user!.id} data permanently removed from database.`);
    
    return c.json({ 
      success: true,
      deletion_status: {
        total_records_deleted: totalDeleted,
        tables_affected: Object.keys(deletionStatus).length,
        details: deletionStatus,
        session_invalidated: true,
        message: "Account and all associated data permanently deleted"
      }
    });
  } catch (error) {
    console.error("[Account Deletion] Error during deletion process:", error);
    return c.json({ 
      error: "Failed to delete account",
      details: error instanceof Error ? error.message : "Unknown error",
      deletion_status: deletionStatus
    }, 500);
  }
});

// Get user's specialities
app.get("/api/user/specialities", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_specialities WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

// Get user's products
app.get("/api/user/products", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_products WHERE user_id = ?"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

// Get brands for a user product
app.get("/api/user/products/:id/brands", authMiddleware, async (c) => {
  const user = c.get("user");
  const userProductId = c.req.param("id");
  
  // Verify the product belongs to this user
  const product = await c.env.DB.prepare(
    "SELECT * FROM user_products WHERE id = ? AND user_id = ?"
  ).bind(userProductId, user!.id).first();

  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_product_brands WHERE user_product_id = ?"
  ).bind(userProductId).all();

  return c.json(results);
});

// Update onboarding details
app.put("/api/profile/onboarding-details", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    // Update user profile with onboarding data
    await c.env.DB.prepare(
      `UPDATE user_profiles SET 
        business_name = ?,
        business_type = ?,
        logo_url = COALESCE(?, logo_url),
        country = ?,
        state = ?,
        city = ?,
        pincode = ?,
        gst_number = ?,
        gst_document_url = COALESCE(?, gst_document_url),
        workplace_type = ?,
        workplace_name = ?,
        full_name = ?,
        phone = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
    ).bind(
      body.business_name || null,
      body.business_type || null,
      body.logo_url || null,
      body.country || null,
      body.state || null,
      body.city || null,
      body.pincode || null,
      body.gst_number || null,
      body.gst_document_url || null,
      body.workplace_type || null,
      body.workplace_name || null,
      body.full_name || null,
      body.phone || null,
      user!.id
    ).run();

    // Update specialities
    if (body.speciality_ids && Array.isArray(body.speciality_ids)) {
      // Delete existing specialities
      await c.env.DB.prepare(
        "DELETE FROM user_specialities WHERE user_id = ?"
      ).bind(user!.id).run();

      // Insert new specialities
      for (const specialityId of body.speciality_ids) {
        await c.env.DB.prepare(
          "INSERT INTO user_specialities (user_id, speciality_id) VALUES (?, ?)"
        ).bind(user!.id, specialityId).run();
      }
    }

    // Update products
    if (body.products && Array.isArray(body.products)) {
      // Delete existing products (this will cascade delete brands due to foreign key)
      await c.env.DB.prepare(
        "DELETE FROM user_products WHERE user_id = ?"
      ).bind(user!.id).run();

      // Insert new products
      for (const product of body.products) {
        const result = await c.env.DB.prepare(
          `INSERT INTO user_products 
            (user_id, product_id, has_sales, has_service, hourly_rate, service_charge) 
          VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          user!.id,
          product.product_id,
          product.has_sales ? 1 : 0,
          product.has_service ? 1 : 0,
          product.hourly_rate || null,
          product.service_charge || null
        ).run();

        const userProductId = result.meta.last_row_id;

        // Save brands for this product
        if (product.brands && Array.isArray(product.brands)) {
          for (const brand of product.brands) {
            const brandResult = await c.env.DB.prepare(
              `INSERT INTO user_product_brands 
                (user_product_id, brand_name, is_authorized, authorization_certificate_url, 
                 license_type, license_number) 
              VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(
              userProductId,
              brand.brand_name,
              brand.is_authorized ? 1 : 0,
              brand.authorization_certificate_url || null,
              brand.license_type || null,
              brand.license_number || null
            ).run();

            const brandId = brandResult.meta.last_row_id;

            // Save territories for this brand
            if (brand.territories && Array.isArray(brand.territories)) {
              for (const territory of brand.territories) {
                await c.env.DB.prepare(
                  `INSERT INTO product_brand_territories 
                    (brand_id, country, state, city) 
                  VALUES (?, ?, ?, ?)`
                ).bind(
                  brandId,
                  territory.country || "India",
                  territory.state || territory,
                  territory.city || null
                ).run();
              }
            }

            // Save engineers for this brand
            if (brand.engineers && Array.isArray(brand.engineers)) {
              for (const engineer of brand.engineers) {
                await c.env.DB.prepare(
                  `INSERT INTO product_brand_engineers 
                    (brand_id, territory_id, name, email, contact, designation) 
                  VALUES (?, ?, ?, ?, ?, ?)`
                ).bind(
                  brandId,
                  engineer.territory_id || null,
                  engineer.name,
                  engineer.email || null,
                  engineer.contact,
                  engineer.designation || "Service Engineer"
                ).run();
              }
            } else if (brand.engineer_name) {
              // Legacy support - single engineer from old structure
              await c.env.DB.prepare(
                `INSERT INTO product_brand_engineers 
                  (brand_id, name, email, contact, designation) 
                VALUES (?, ?, ?, ?, ?)`
              ).bind(
                brandId,
                brand.engineer_name,
                brand.engineer_email || null,
                brand.engineer_contact,
                "Service Engineer"
              ).run();
            }
          }
        }
      }
    }

    // Award XP for filled fields
    const fieldsToCheck: Record<string, any> = {};
    if (body.business_name) fieldsToCheck.business_name = body.business_name;
    if (body.logo_url) fieldsToCheck.logo_url = body.logo_url;
    if (body.country) fieldsToCheck.country = body.country;
    if (body.state) fieldsToCheck.state = body.state;
    if (body.city) fieldsToCheck.city = body.city;
    if (body.pincode) fieldsToCheck.pincode = body.pincode;
    if (body.gst_number) fieldsToCheck.gst_number = body.gst_number;
    if (body.gst_document_url) fieldsToCheck.gst_document_url = body.gst_document_url;
    if (body.workplace_type) fieldsToCheck.workplace_type = body.workplace_type;
    if (body.workplace_name) fieldsToCheck.workplace_name = body.workplace_name;
    if (body.full_name) fieldsToCheck.full_name = body.full_name;
    if (body.phone) fieldsToCheck.phone = body.phone;
    if (body.speciality_ids && body.speciality_ids.length > 0) fieldsToCheck.specialities = body.speciality_ids;
    if (body.products && body.products.length > 0) fieldsToCheck.products = body.products;

    const xpResult = await checkProfileFieldsAndAwardXP(c.env.DB, user!.id, fieldsToCheck);

    return c.json({ 
      success: true,
      xp_awarded: xpResult.totalXP,
      fields_awarded: xpResult.fieldsAwarded
    });
  } catch (error) {
    console.error("Error updating onboarding details:", error);
    return c.json({ error: "Failed to update details" }, 500);
  }
});

// Get profile completion status
app.get("/api/profile/completion-status", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const status = await getProfileCompletionStatus(c.env.DB, user!.id);
    return c.json(status);
  } catch (error) {
    console.error("Error fetching profile completion status:", error);
    return c.json({ error: "Failed to fetch profile completion status" }, 500);
  }
});

// Patient profile endpoint
app.put("/api/patient/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    await c.env.DB.prepare(
      `UPDATE user_profiles SET 
        patient_full_name = ?,
        patient_contact = ?,
        patient_email = ?,
        patient_address = ?,
        patient_city = ?,
        patient_pincode = ?,
        patient_latitude = ?,
        patient_longitude = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
    ).bind(
      body.patient_full_name || null,
      body.patient_contact || null,
      body.patient_email || null,
      body.patient_address || null,
      body.patient_city || null,
      body.patient_pincode || null,
      body.patient_latitude || null,
      body.patient_longitude || null,
      user!.id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Profile endpoints
app.post("/api/profile/set-location", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  try {
    // Check if location is already set
    const profile = await c.env.DB.prepare(
      "SELECT state, country FROM user_profiles WHERE user_id = ?"
    )
      .bind(user!.id)
      .first();

    // Only set location if not already set
    if (!profile?.state || !profile?.country) {
      // Use reverse geocoding API to get location details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${body.latitude}&lon=${body.longitude}&format=json`,
        {
          headers: {
            "User-Agent": "MavyPartner/1.0",
          },
        }
      );

      const data = await response.json() as { address?: { state?: string; region?: string; country?: string } };
      const state = data.address?.state || data.address?.region || null;
      const country = data.address?.country || null;

      await c.env.DB.prepare(
        "UPDATE user_profiles SET state = ?, country = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
      )
        .bind(state, country, user!.id)
        .run();

      return c.json({ success: true, state, country });
    }

    return c.json({ success: true, message: "Location already set" });
  } catch (error) {
    console.error("Error setting location:", error);
    return c.json({ error: "Failed to set location" }, 500);
  }
});

app.put("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const body = await c.req.json();

    // Convert undefined to null for database compatibility
    const toDbValue = (value: any) => value === undefined ? null : value;

    await c.env.DB.prepare(
      "UPDATE user_profiles SET full_name = ?, last_name = ?, specialisation = ?, bio = ?, phone = ?, country_code = ?, location = ?, experience = ?, skills = ?, education = ?, experience_json = ?, education_json = ?, instagram_url = ?, facebook_url = ?, linkedin_url = ?, instagram_visibility = ?, facebook_visibility = ?, linkedin_visibility = ?, is_open_to_work = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    )
      .bind(
        toDbValue(body.full_name),
        toDbValue(body.last_name),
        toDbValue(body.specialisation),
        toDbValue(body.bio),
        toDbValue(body.phone),
        toDbValue(body.country_code),
        toDbValue(body.location),
        toDbValue(body.experience),
        toDbValue(body.skills),
        toDbValue(body.education),
        body.experience_json ? JSON.stringify(body.experience_json) : null,
        body.education_json ? JSON.stringify(body.education_json) : null,
        toDbValue(body.instagram_url),
        toDbValue(body.facebook_url),
        toDbValue(body.linkedin_url),
        toDbValue(body.instagram_visibility) || "everyone",
        toDbValue(body.facebook_visibility) || "everyone",
        toDbValue(body.linkedin_visibility) || "everyone",
        body.is_open_to_work ? 1 : 0,
        user!.id
      )
      .run();

    // Award XP for filled fields
    const xpResult = await checkProfileFieldsAndAwardXP(c.env.DB, user!.id, body);

    return c.json({ 
      success: true, 
      xp_awarded: xpResult.totalXP,
      fields_awarded: xpResult.fieldsAwarded 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return c.json({ 
      error: "Failed to save profile", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

app.post("/api/profile/resume", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("resume") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (file.type !== "application/pdf") {
    return c.json({ error: "Only PDF files are allowed" }, 400);
  }

  const key = `resumes/${user!.id}/${file.name}`;
  
  await c.env.R2_BUCKET.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  await c.env.DB.prepare(
    "UPDATE user_profiles SET resume_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(key, user!.id)
    .run();

  // Award XP for uploading resume
  const xpResult = await checkProfileFieldsAndAwardXP(c.env.DB, user!.id, { resume_url: key });

  return c.json({ 
    success: true, 
    resume_url: key,
    xp_awarded: xpResult.totalXP 
  });
});

app.get("/api/profile/resume", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT resume_url FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  if (!profile?.resume_url) {
    return c.json({ error: "No resume found" }, 404);
  }

  const object = await c.env.R2_BUCKET.get(profile.resume_url as string);
  
  if (!object) {
    return c.json({ error: "Resume file not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return c.body(object.body, { headers });
});

app.delete("/api/profile/resume", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT resume_url FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  if (profile?.resume_url) {
    await c.env.R2_BUCKET.delete(profile.resume_url as string);
  }

  await c.env.DB.prepare(
    "UPDATE user_profiles SET resume_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(user!.id)
    .run();

  return c.json({ success: true });
});

app.post("/api/profile/profile-picture", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("profile_picture") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Only image files are allowed" }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Image size must be less than 5MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "jpg";
  const key = `profile-pictures/${user!.id}/${timestamp}.${fileExtension}`;
  
  await c.env.R2_BUCKET.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  const imageUrl = `https://r2.mocha.com/${key}`;

  await c.env.DB.prepare(
    "UPDATE user_profiles SET profile_picture_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(imageUrl, user!.id)
    .run();

  // Award XP for uploading profile picture
  const xpResult = await checkProfileFieldsAndAwardXP(c.env.DB, user!.id, { profile_picture_url: imageUrl });

  return c.json({ 
    success: true, 
    profile_picture_url: imageUrl,
    xp_awarded: xpResult.totalXP 
  });
});

// Service manuals endpoints
app.get("/api/manuals", async (c) => {
  const search = c.req.query("search") || "";
  const type = c.req.query("type") || "";

  let query = `SELECT sm.*, up.full_name as uploader_name, up.profile_picture_url as uploader_picture 
               FROM service_manuals sm 
               LEFT JOIN user_profiles up ON sm.uploaded_by_user_id = up.user_id`;
  const params: string[] = [];
  const conditions: string[] = [];

  if (search) {
    conditions.push("(sm.title LIKE ? OR sm.manufacturer LIKE ? OR sm.model_number LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (type) {
    conditions.push("sm.equipment_type = ?");
    params.push(type);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY sm.created_at DESC LIMIT 100";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.post("/api/manuals/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const modelNumber = formData.get("model_number") as string;
  const equipmentType = formData.get("equipment_type") as string;
  const description = formData.get("description") as string;

  if (!file || !title) {
    return c.json({ error: "File and title are required" }, 400);
  }

  const allowedTypes = ["application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Only PDF files are allowed" }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: "File size must be less than 50MB" }, 400);
  }

  const timestamp = Date.now();
  const key = `service-manuals/${user!.id}/${timestamp}.pdf`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    const result = await c.env.DB.prepare(
      `INSERT INTO service_manuals 
        (title, manufacturer, model_number, equipment_type, description, file_url, uploaded_by_user_id, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(
      title,
      manufacturer || null,
      modelNumber || null,
      equipmentType || null,
      description || null,
      fileUrl,
      user!.id
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true, file_url: fileUrl }, 201);
  } catch (error) {
    console.error("Error uploading manual:", error);
    return c.json({ error: "Failed to upload manual" }, 500);
  }
});

app.delete("/api/manuals/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const manualId = c.req.param("id");

  const manual = await c.env.DB.prepare(
    "SELECT uploaded_by_user_id, file_url FROM service_manuals WHERE id = ?"
  ).bind(manualId).first();

  if (!manual) {
    return c.json({ error: "Manual not found" }, 404);
  }

  if (manual.uploaded_by_user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  if (manual.file_url) {
    const key = (manual.file_url as string).replace("https://r2.mocha.com/", "");
    await c.env.R2_BUCKET.delete(key);
  }

  await c.env.DB.prepare("DELETE FROM service_manuals WHERE id = ?").bind(manualId).run();

  return c.json({ success: true });
});

app.get("/api/manuals/:id", async (c) => {
  const id = c.req.param("id");
  
  const manual = await c.env.DB.prepare(
    "SELECT * FROM service_manuals WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!manual) {
    return c.json({ error: "Manual not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE service_manuals SET download_count = download_count + 1 WHERE id = ?"
  )
    .bind(id)
    .run();

  return c.json(manual);
});

// Manual request endpoints
app.get("/api/manual-requests", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT mr.*, up.full_name as requester_name, up.profile_picture_url as requester_picture,
      (SELECT COUNT(*) FROM manual_request_replies WHERE request_id = mr.id) as replies_count
     FROM manual_requests mr
     LEFT JOIN user_profiles up ON mr.user_id = up.user_id
     ORDER BY mr.created_at DESC
     LIMIT 100`
  ).all();

  return c.json(results);
});

app.post("/api/manual-requests", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.equipment_name) {
    return c.json({ error: "Equipment name is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO manual_requests 
      (user_id, equipment_name, manufacturer, model_number, description) 
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    user!.id,
    body.equipment_name,
    body.manufacturer || null,
    body.model_number || null,
    body.description || null
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.get("/api/manual-requests/:id/replies", async (c) => {
  const requestId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT mrr.*, up.full_name as replier_name, up.profile_picture_url as replier_picture
     FROM manual_request_replies mrr
     LEFT JOIN user_profiles up ON mrr.user_id = up.user_id
     WHERE mrr.request_id = ?
     ORDER BY mrr.created_at ASC`
  ).bind(requestId).all();

  return c.json(results);
});

app.post("/api/manual-requests/:id/reply", authMiddleware, async (c) => {
  const user = c.get("user");
  const requestId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const message = formData.get("message") as string;
  const manualTitle = formData.get("manual_title") as string;

  if (!file || !manualTitle) {
    return c.json({ error: "File and manual title are required" }, 400);
  }

  const allowedTypes = ["application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Only PDF files are allowed" }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: "File size must be less than 50MB" }, 400);
  }

  const timestamp = Date.now();
  const key = `manual-replies/${user!.id}/${timestamp}.pdf`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    const result = await c.env.DB.prepare(
      `INSERT INTO manual_request_replies 
        (request_id, user_id, message, manual_file_url, manual_title, file_type) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      requestId,
      user!.id,
      message || null,
      fileUrl,
      manualTitle,
      "pdf"
    ).run();

    // Mark request as resolved if it was open
    await c.env.DB.prepare(
      "UPDATE manual_requests SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'open'"
    ).bind(requestId).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("Error replying to manual request:", error);
    return c.json({ error: "Failed to reply to request" }, 500);
  }
});

app.delete("/api/manual-requests/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const requestId = c.req.param("id");

  const request = await c.env.DB.prepare(
    "SELECT user_id FROM manual_requests WHERE id = ?"
  ).bind(requestId).first();

  if (!request) {
    return c.json({ error: "Request not found" }, 404);
  }

  if (request.user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Delete all replies to this request
  const { results: replies } = await c.env.DB.prepare(
    "SELECT manual_file_url FROM manual_request_replies WHERE request_id = ?"
  ).bind(requestId).all();

  for (const reply of replies) {
    if (reply.manual_file_url) {
      const key = (reply.manual_file_url as string).replace("https://r2.mocha.com/", "");
      await c.env.R2_BUCKET.delete(key);
    }
  }

  await c.env.DB.prepare("DELETE FROM manual_request_replies WHERE request_id = ?").bind(requestId).run();
  await c.env.DB.prepare("DELETE FROM manual_requests WHERE id = ?").bind(requestId).run();

  return c.json({ success: true });
});

// Jobs endpoints
app.get("/api/jobs", async (c) => {
  const type = c.req.query("type") || "";
  const country = c.req.query("country") || "";
  const user = c.get("user");
  
  let query = "SELECT * FROM jobs WHERE status = 'open'";
  const params: string[] = [];

  // Filter by user's profession if authenticated
  if (user) {
    const profile = await c.env.DB.prepare(
      "SELECT profession FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();

    if (profile?.profession) {
      query += " AND (target_profession = ? OR target_profession IS NULL OR target_profession = 'all')";
      params.push(profile.profession as string);
    }
  }

  if (type) {
    query += " AND job_type = ?";
    params.push(type);
  }

  if (country) {
    query += " AND country = ?";
    params.push(country);
  }

  query += " ORDER BY created_at DESC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.post("/api/jobs/ai-autofill", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: "Job posting message is required" }, 400);
    }

    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
    });

    const prompt = `You are a job posting parser specializing in biomedical engineering positions. Extract structured information from job posting messages.

Parse the following job posting message and extract all relevant information:

${message}

Extract and provide:
1. Job title
2. Company name
3. Job type (Full-time, Contract, Gig, or On-site Service)
4. Job description (comprehensive summary)
5. Experience level required
6. Location
7. Compensation/salary range
8. Contact email
9. Contact phone number

If any information is not provided in the message, use your best judgment to provide a reasonable default or leave it as an empty string. Return ONLY a valid JSON object with these exact keys: title, company_name, job_type, description, experience, location, compensation, contact_email, contact_number. Do not include any other text or formatting.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    return c.json(parsed);
  } catch (error) {
    console.error("AI autofill error:", error);
    return c.json({ error: "Failed to parse job details" }, 500);
  }
});

app.post("/api/jobs", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  // Get user's profession to set target_profession
  const profile = await c.env.DB.prepare(
    "SELECT profession FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const result = await c.env.DB.prepare(
    `INSERT INTO jobs (
      title, description, job_type, location, compensation, experience,
      company_name, contact_email, contact_number, posted_by_user_id, target_profession,
      country, state, city, is_remote, remote_type,
      salary_min, salary_max, salary_currency, salary_period,
      education_required, skills_required, responsibilities, benefits,
      number_of_openings, application_url, company_website, deadline_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.title,
      body.description,
      body.job_type,
      body.location,
      body.compensation || null,
      body.experience,
      body.company_name,
      body.contact_email,
      body.contact_number || null,
      user!.id,
      body.target_profession || profile?.profession || null,
      body.country || null,
      body.state || null,
      body.city || null,
      body.is_remote ? 1 : 0,
      body.remote_type || null,
      body.salary_min || null,
      body.salary_max || null,
      body.salary_currency || 'USD',
      body.salary_period || 'yearly',
      body.education_required || null,
      body.skills_required || null,
      body.responsibilities || null,
      body.benefits || null,
      body.number_of_openings || 1,
      body.application_url || null,
      body.company_website || null,
      body.deadline_date || null
    )
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.post("/api/jobs/:id/apply", authMiddleware, async (c) => {
  const user = c.get("user");
  const jobId = c.req.param("id");

  try {
    // Get job details
    const job = await c.env.DB.prepare(
      "SELECT * FROM jobs WHERE id = ?"
    ).bind(jobId).first();

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Get user profile with complete details
    const profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user!.id).first();

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const resend = new Resend(c.env.RESEND_API_KEY);

    // Prepare email content with complete profile details
    const userName = String(profile.full_name || user!.google_user_data.name || "A user");
    const userEmail = String(user!.google_user_data.email || "Not provided");
    const phone = String(profile.phone || "Not provided");
    const state = String(profile.state || "Not specified");
    const country = String(profile.country || "Not specified");
    const city = String(profile.city || "");
    const locationString = city ? `${city}, ${state}, ${country}` : `${state}, ${country}`;
    const bio = String(profile.bio || "Not provided");
    const experience = String(profile.experience || "Not specified");
    const education = String(profile.education || "Not specified");

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Job Application</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0;">Mavy Partner - Professional Hub for Biomedical Engineers</p>
        </div>
        
        <!-- Job Info -->
        <div style="padding: 30px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151; margin: 0;">
            <strong>${userName}</strong> has applied for the following position at your organization:
          </p>
          <h2 style="color: #1f2937; margin: 10px 0 0 0; font-size: 24px;">${job.title}</h2>
          <div style="margin-top: 15px; padding: 15px; background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="color: #1e40af; margin: 0; font-weight: 600;">
              📋 Please review the applicant's details below and contact them directly to proceed with the recruitment process.
            </p>
          </div>
        </div>
        
        <!-- Applicant Details -->
        <div style="padding: 30px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Applicant Information
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; width: 180px;">
                <strong style="color: #374151;">Full Name:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                ${userName}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Email:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="mailto:${userEmail}" style="color: #2563eb; text-decoration: none;">${userEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Contact Number:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">Location:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                ${locationString}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #374151;">State:</strong>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                ${state}
              </td>
            </tr>
          </table>
          
          <!-- Bio Section -->
          ${bio !== "Not provided" ? `
          <div style="margin-top: 30px;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Professional Bio</h4>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-wrap;">${bio}</p>
            </div>
          </div>
          ` : ''}
          
          <!-- Work Experience Section -->
          <div style="margin-top: 30px;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Work Experience</h4>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-wrap;">${experience}</p>
            </div>
          </div>
          
          <!-- Education Section -->
          <div style="margin-top: 30px;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Education</h4>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
              <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-wrap;">${education}</p>
            </div>
          </div>
          
          <!-- Resume Attachment Notice -->
          ${profile.resume_url ? `
          <div style="margin-top: 30px; background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px;">
            <p style="color: #047857; margin: 0; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 10px;">📎</span>
              <strong>The applicant's resume is attached to this email.</strong>
            </p>
          </div>
          ` : `
          <div style="margin-top: 30px; background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px;">
            <p style="color: #92400e; margin: 0; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
              <strong>No resume was provided by the applicant.</strong>
            </p>
          </div>
          `}
        </div>
        
        <!-- Call to Action -->
        <div style="padding: 20px 30px; background-color: #ecfdf5; border-top: 2px solid #10b981;">
          <p style="color: #047857; font-size: 15px; margin: 0; font-weight: 600;">
            ✉️ Next Steps:
          </p>
          <p style="color: #065f46; font-size: 14px; margin: 10px 0 0 0; line-height: 1.6;">
            Please contact <strong>${userName}</strong> directly at <a href="mailto:${userEmail}" style="color: #2563eb;">${userEmail}</a> 
            ${phone !== "Not provided" ? `or call <a href="tel:${phone}" style="color: #2563eb;">${phone}</a>` : ""} 
            to proceed with the official recruitment process.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
            This application was sent through <strong>Mavy Partner</strong>, the professional hub for biomedical engineers and healthcare technology professionals.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
            For support or questions, contact us at 
            <a href="mailto:mavytechsolutions@gmail.com" style="color: #2563eb; text-decoration: none;">mavytechsolutions@gmail.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
            You can reply directly to this email to contact the applicant at ${userEmail}
          </p>
        </div>
      </div>
    `;

    const emailData: any = {
      from: "Mavy Careers <careers@themavy.com>",
      replyTo: userEmail,
      to: job.contact_email as string,
      subject: `Job Application: ${job.title} - ${userName}`,
      html: emailHtml,
    };

    // Attach resume if available
    if (profile.resume_url) {
      try {
        const resumeObject = await c.env.R2_BUCKET.get(profile.resume_url as string);
        if (resumeObject) {
          const resumeBuffer = await resumeObject.arrayBuffer();
          const resumeBase64 = btoa(String.fromCharCode(...new Uint8Array(resumeBuffer)));
          
          emailData.attachments = [
            {
              filename: `${userName.replace(/\s+/g, '_')}_Resume.pdf`,
              content: resumeBase64,
            },
          ];
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      }
    }

    await resend.emails.send(emailData);

    return c.json({ success: true, message: "Application sent successfully" });
  } catch (error) {
    console.error("Error sending application email:", error);
    return c.json({ error: "Failed to send application" }, 500);
  }
});

// News endpoints
app.get("/api/news/:id", async (c) => {
  const newsId = c.req.param("id");
  const user = c.get("user");

  const news = await c.env.DB.prepare(
    `SELECT nu.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
     FROM news_updates nu 
     LEFT JOIN user_profiles up ON nu.posted_by_user_id = up.user_id 
     WHERE nu.id = ?`
  ).bind(newsId).first();

  if (!news) {
    return c.json({ error: "News not found" }, 404);
  }

  const likesCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM news_likes WHERE news_id = ?"
  ).bind(newsId).first();

  const commentsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM news_comments WHERE news_id = ?"
  ).bind(newsId).first();

  let userLiked = false;
  let userSaved = false;

  if (user) {
    const likeCheck = await c.env.DB.prepare(
      "SELECT id FROM news_likes WHERE news_id = ? AND user_id = ?"
    ).bind(newsId, user.id).first();
    userLiked = !!likeCheck;

    const saveCheck = await c.env.DB.prepare(
      "SELECT id FROM saved_posts WHERE news_id = ? AND user_id = ?"
    ).bind(newsId, user.id).first();
    userSaved = !!saveCheck;
  }

  return c.json({
    ...news,
    likes_count: likesCount?.count || 0,
    comments_count: commentsCount?.count || 0,
    user_liked: userLiked,
    user_saved: userSaved,
  });
});

app.get("/api/news", async (c) => {
  const category = c.req.query("category") || "";
  const user = c.get("user");
  
  let query = `SELECT nu.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
               FROM news_updates nu 
               LEFT JOIN user_profiles up ON nu.posted_by_user_id = up.user_id`;
  const params: string[] = [];
  const conditions: string[] = [];

  // Filter by user's profession if authenticated
  if (user) {
    const profile = await c.env.DB.prepare(
      "SELECT profession FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();

    if (profile?.profession) {
      conditions.push("(nu.target_profession = ? OR nu.target_profession IS NULL)");
      params.push(profile.profession as string);
    }
  }

  if (category) {
    conditions.push("nu.category = ?");
    params.push(category);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY nu.published_date DESC, nu.created_at DESC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const newsWithCounts = await Promise.all(
    results.map(async (news: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_likes WHERE news_id = ?"
      ).bind(news.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_comments WHERE news_id = ?"
      ).bind(news.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_shares WHERE news_id = ?"
      ).bind(news.id).first();

      const repostsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_reposts WHERE news_id = ?"
      ).bind(news.id).first();

      let userLiked = false;
      let userSaved = false;
      let userReposted = false;
      let userFollowingAuthor = false;

      if (user) {
        const likeCheck = await c.env.DB.prepare(
          "SELECT id FROM news_likes WHERE news_id = ? AND user_id = ?"
        ).bind(news.id, user.id).first();
        userLiked = !!likeCheck;

        const saveCheck = await c.env.DB.prepare(
          "SELECT id FROM saved_posts WHERE news_id = ? AND user_id = ?"
        ).bind(news.id, user.id).first();
        userSaved = !!saveCheck;

        const repostCheck = await c.env.DB.prepare(
          "SELECT id FROM news_reposts WHERE news_id = ? AND user_id = ?"
        ).bind(news.id, user.id).first();
        userReposted = !!repostCheck;

        if (news.posted_by_user_id && news.posted_by_user_id !== user.id) {
          const followCheck = await c.env.DB.prepare(
            "SELECT id FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?"
          ).bind(user.id, news.posted_by_user_id).first();
          userFollowingAuthor = !!followCheck;
        }
      }

      return {
        ...news,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        reposts_count: repostsCount?.count || 0,
        user_liked: userLiked,
        user_saved: userSaved,
        user_reposted: userReposted,
        user_following_author: userFollowingAuthor,
      };
    })
  );

  return c.json(newsWithCounts);
});

app.post("/api/news/fetch", async (c) => {
  try {
    await fetchAndStoreNews(c.env);
    return c.json({ success: true, message: "News updates fetched successfully" });
  } catch (error) {
    console.error("Manual news fetch error:", error);
    return c.json({ error: "Failed to fetch news updates" }, 500);
  }
});

app.post("/api/news/upload-image", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return c.json({ error: "No image file provided" }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return c.json({ error: "File must be an image" }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Image size must be less than 5MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "jpg";
  const key = `news-images/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const imageUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, image_url: imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

app.post("/api/news", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.title || !body.content) {
    return c.json({ error: "Title and content are required" }, 400);
  }

  // Get user's profession
  const profile = await c.env.DB.prepare(
    "SELECT profession FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const result = await c.env.DB.prepare(
    "INSERT INTO news_updates (title, content, category, image_url, source_url, hashtags, posted_by_user_id, is_user_post, published_date, target_profession) VALUES (?, ?, ?, ?, ?, ?, ?, 1, DATE('now'), ?)"
  )
    .bind(
      body.title,
      body.content,
      body.category || "Technology",
      body.image_url || null,
      body.source_url || null,
      body.hashtags || null,
      user!.id,
      body.target_profession || profile?.profession || null
    )
    .run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.get("/api/news/my-posts", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT nu.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
     FROM news_updates nu 
     LEFT JOIN user_profiles up ON nu.posted_by_user_id = up.user_id 
     WHERE nu.posted_by_user_id = ? 
     ORDER BY nu.created_at DESC`
  ).bind(user!.id).all();

  const newsWithCounts = await Promise.all(
    results.map(async (news: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_likes WHERE news_id = ?"
      ).bind(news.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_comments WHERE news_id = ?"
      ).bind(news.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_shares WHERE news_id = ?"
      ).bind(news.id).first();

      const repostsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_reposts WHERE news_id = ?"
      ).bind(news.id).first();

      const likeCheck = await c.env.DB.prepare(
        "SELECT id FROM news_likes WHERE news_id = ? AND user_id = ?"
      ).bind(news.id, user!.id).first();

      const saveCheck = await c.env.DB.prepare(
        "SELECT id FROM saved_posts WHERE news_id = ? AND user_id = ?"
      ).bind(news.id, user!.id).first();

      const repostCheck = await c.env.DB.prepare(
        "SELECT id FROM news_reposts WHERE news_id = ? AND user_id = ?"
      ).bind(news.id, user!.id).first();

      return {
        ...news,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        reposts_count: repostsCount?.count || 0,
        user_liked: !!likeCheck,
        user_saved: !!saveCheck,
        user_reposted: !!repostCheck,
        user_following_author: false,
      };
    })
  );

  return c.json(newsWithCounts);
});

app.get("/api/news/saved", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT nu.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
     FROM news_updates nu 
     INNER JOIN saved_posts sp ON nu.id = sp.news_id
     LEFT JOIN user_profiles up ON nu.posted_by_user_id = up.user_id 
     WHERE sp.user_id = ? 
     ORDER BY sp.created_at DESC`
  ).bind(user!.id).all();

  const newsWithCounts = await Promise.all(
    results.map(async (news: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_likes WHERE news_id = ?"
      ).bind(news.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_comments WHERE news_id = ?"
      ).bind(news.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_shares WHERE news_id = ?"
      ).bind(news.id).first();

      const repostsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM news_reposts WHERE news_id = ?"
      ).bind(news.id).first();

      const likeCheck = await c.env.DB.prepare(
        "SELECT id FROM news_likes WHERE news_id = ? AND user_id = ?"
      ).bind(news.id, user!.id).first();

      const repostCheck = await c.env.DB.prepare(
        "SELECT id FROM news_reposts WHERE news_id = ? AND user_id = ?"
      ).bind(news.id, user!.id).first();

      let userFollowingAuthor = false;
      if (news.posted_by_user_id && news.posted_by_user_id !== user!.id) {
        const followCheck = await c.env.DB.prepare(
          "SELECT id FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?"
        ).bind(user!.id, news.posted_by_user_id).first();
        userFollowingAuthor = !!followCheck;
      }

      return {
        ...news,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        reposts_count: repostsCount?.count || 0,
        user_liked: !!likeCheck,
        user_saved: true,
        user_reposted: !!repostCheck,
        user_following_author: userFollowingAuthor,
      };
    })
  );

  return c.json(newsWithCounts);
});

app.put("/api/news/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");
  const body = await c.req.json();

  const post = await c.env.DB.prepare(
    "SELECT posted_by_user_id FROM news_updates WHERE id = ?"
  ).bind(newsId).first();

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (post.posted_by_user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare(
    "UPDATE news_updates SET title = ?, content = ?, category = ?, image_url = ?, source_url = ?, hashtags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(
      body.title,
      body.content,
      body.category,
      body.image_url || null,
      body.source_url || null,
      body.hashtags || null,
      newsId
    )
    .run();

  return c.json({ success: true });
});

app.delete("/api/news/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");

  const post = await c.env.DB.prepare(
    "SELECT posted_by_user_id FROM news_updates WHERE id = ?"
  ).bind(newsId).first();

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (post.posted_by_user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM news_likes WHERE news_id = ?").bind(newsId).run();
  await c.env.DB.prepare("DELETE FROM news_comments WHERE news_id = ?").bind(newsId).run();
  await c.env.DB.prepare("DELETE FROM news_shares WHERE news_id = ?").bind(newsId).run();
  await c.env.DB.prepare("DELETE FROM news_reposts WHERE news_id = ?").bind(newsId).run();
  await c.env.DB.prepare("DELETE FROM saved_posts WHERE news_id = ?").bind(newsId).run();
  await c.env.DB.prepare("DELETE FROM post_reports WHERE news_id = ?").bind(newsId).run();

  await c.env.DB.prepare("DELETE FROM news_updates WHERE id = ?").bind(newsId).run();

  return c.json({ success: true });
});

app.post("/api/news/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM news_likes WHERE news_id = ? AND user_id = ?"
  ).bind(newsId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM news_likes WHERE news_id = ? AND user_id = ?"
    ).bind(newsId, user!.id).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO news_likes (news_id, user_id) VALUES (?, ?)"
    ).bind(newsId, user!.id).run();
    return c.json({ liked: true });
  }
});

app.get("/api/news/:id/comments", async (c) => {
  const newsId = c.req.param("id");
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT nc.*, up.full_name, up.profile_picture_url 
     FROM news_comments nc 
     LEFT JOIN user_profiles up ON nc.user_id = up.user_id 
     WHERE nc.news_id = ? 
     ORDER BY nc.created_at DESC`
  ).bind(newsId).all();

  const commentsWithCounts = await Promise.all(
    results.map(async (comment: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?"
      ).bind(comment.id).first();

      const repliesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM comment_replies WHERE comment_id = ?"
      ).bind(comment.id).first();

      let userLiked = false;
      if (user) {
        const likeCheck = await c.env.DB.prepare(
          "SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?"
        ).bind(comment.id, user.id).first();
        userLiked = !!likeCheck;
      }

      return {
        ...comment,
        likes_count: likesCount?.count || 0,
        replies_count: repliesCount?.count || 0,
        user_liked: userLiked,
      };
    })
  );

  return c.json(commentsWithCounts);
});

app.post("/api/news/:id/comment", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO news_comments (news_id, user_id, comment) VALUES (?, ?, ?)"
  ).bind(newsId, user!.id, body.comment).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.post("/api/news/:id/share", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");

  await c.env.DB.prepare(
    "INSERT INTO news_shares (news_id, user_id) VALUES (?, ?)"
  ).bind(newsId, user!.id).run();

  return c.json({ success: true });
});

app.post("/api/news/:id/repost", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM news_reposts WHERE news_id = ? AND user_id = ?"
  ).bind(newsId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM news_reposts WHERE news_id = ? AND user_id = ?"
    ).bind(newsId, user!.id).run();
    return c.json({ reposted: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO news_reposts (news_id, user_id) VALUES (?, ?)"
    ).bind(newsId, user!.id).run();
    return c.json({ reposted: true });
  }
});

app.post("/api/news/:id/save", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM saved_posts WHERE news_id = ? AND user_id = ?"
  ).bind(newsId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM saved_posts WHERE news_id = ? AND user_id = ?"
    ).bind(newsId, user!.id).run();
    return c.json({ saved: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO saved_posts (news_id, user_id) VALUES (?, ?)"
    ).bind(newsId, user!.id).run();
    return c.json({ saved: true });
  }
});

app.post("/api/users/:userId/follow", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");

  if (userId === user!.id) {
    return c.json({ error: "Cannot follow yourself" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?"
  ).bind(user!.id, userId).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?"
    ).bind(user!.id, userId).run();
    return c.json({ following: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO user_follows (follower_user_id, following_user_id) VALUES (?, ?)"
    ).bind(user!.id, userId).run();
    return c.json({ following: true });
  }
});

app.post("/api/news/:id/report", authMiddleware, async (c) => {
  const user = c.get("user");
  const newsId = c.req.param("id");
  const body = await c.req.json();

  if (!body.reason) {
    return c.json({ error: "Reason is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO post_reports (news_id, user_id, reason, description) VALUES (?, ?, ?, ?)"
  ).bind(newsId, user!.id, body.reason, body.description || null).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Comment like endpoints
app.post("/api/comments/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?"
  ).bind(commentId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?"
    ).bind(commentId, user!.id).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)"
    ).bind(commentId, user!.id).run();
    return c.json({ liked: true });
  }
});

// Comment reply endpoints
app.get("/api/comments/:id/replies", async (c) => {
  const commentId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT cr.*, up.full_name, up.profile_picture_url 
     FROM comment_replies cr 
     LEFT JOIN user_profiles up ON cr.user_id = up.user_id 
     WHERE cr.comment_id = ? 
     ORDER BY cr.created_at ASC`
  ).bind(commentId).all();

  return c.json(results);
});

app.post("/api/comments/:id/reply", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO comment_replies (comment_id, user_id, reply) VALUES (?, ?, ?)"
  ).bind(commentId, user!.id, body.reply).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Subscription endpoints
app.get("/api/subscription", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT subscription_tier FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  return c.json({ tier: profile?.subscription_tier || "free" });
});

app.put("/api/subscription", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE user_profiles SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(body.tier, user!.id)
    .run();

  await c.env.DB.prepare(
    "INSERT INTO transactions (user_id, amount, transaction_type, description, payment_method) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      user!.id,
      body.amount || 0,
      "subscription",
      `Upgraded to ${body.tier} tier`,
      body.payment_method || "card"
    )
    .run();

  return c.json({ success: true });
});

// Transaction endpoints
app.get("/api/transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

// Referral endpoints
app.get("/api/referrals", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    "SELECT referral_code FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  const { results: referrals } = await c.env.DB.prepare(
    "SELECT * FROM referral_tracking WHERE referrer_user_id = ? ORDER BY created_at DESC"
  )
    .bind(user!.id)
    .all();

  const totalRewards = referrals.reduce((sum: number, ref: any) => {
    return sum + (ref.reward_status === "paid" ? ref.reward_amount : 0);
  }, 0);

  return c.json({
    referral_code: profile?.referral_code,
    referrals,
    total_rewards: totalRewards,
    pending_rewards: referrals.filter((r: any) => r.reward_status === "pending").length,
  });
});

// Enhanced referrals endpoint with wallet and config
app.get("/api/referrals/dashboard", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get user profile with referral code
  const profile = await c.env.DB.prepare(
    "SELECT referral_code, created_at FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  // Get or create wallet
  let wallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ?"
  ).bind(user!.id).first();
  
  if (!wallet) {
    await c.env.DB.prepare(
      "INSERT INTO user_wallets (user_id) VALUES (?)"
    ).bind(user!.id).run();
    wallet = { balance: 0, total_earned: 0, total_redeemed: 0, currency: 'INR' };
  }

  // Get referrals with stages
  const { results: referrals } = await c.env.DB.prepare(`
    SELECT rt.*, up.full_name as referred_name 
    FROM referral_tracking rt
    LEFT JOIN user_profiles up ON rt.referred_user_id = up.user_id
    WHERE rt.referrer_user_id = ? 
    ORDER BY rt.created_at DESC
  `).bind(user!.id).all();

  // Get referral config
  const { results: configRows } = await c.env.DB.prepare(
    "SELECT config_key, config_value FROM referral_config"
  ).all();
  const config: Record<string, string> = {};
  configRows.forEach((row: any) => { config[row.config_key] = row.config_value; });

  // Stats
  const stats = {
    total_referrals: referrals.length,
    successful: referrals.filter((r: any) => r.referral_stage === 'completed' || r.reward_status === 'paid').length,
    pending: referrals.filter((r: any) => r.referral_stage === 'registered' || r.referral_stage === 'verified').length,
    fraud_flagged: referrals.filter((r: any) => r.is_fraud_flagged).length,
  };

  return c.json({
    referral_code: profile?.referral_code,
    wallet: {
      balance: wallet.balance,
      total_earned: wallet.total_earned,
      total_redeemed: wallet.total_redeemed,
      currency: wallet.currency,
    },
    referrals,
    stats,
    config: {
      referrer_reward: parseFloat(config.referrer_reward_amount || '100'),
      referred_reward: parseFloat(config.referred_reward_amount || '50'),
      is_enabled: config.is_referral_enabled === 'true',
    },
    user_created_at: profile?.created_at,
  });
});

// Validate referral code (public endpoint for signup flow)
app.get("/api/referrals/validate", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ valid: false, error: "No code provided" }, 400);
  }

  // Find referrer by code (case-insensitive)
  const referrer = await c.env.DB.prepare(
    "SELECT user_id, display_name FROM user_profiles WHERE UPPER(referral_code) = UPPER(?)"
  ).bind(code).first();

  if (!referrer) {
    return c.json({ valid: false, error: "Invalid referral code" });
  }

  // Get referred reward amount from config
  const config = await c.env.DB.prepare(
    "SELECT config_value FROM referral_config WHERE config_key = 'referred_reward_amount'"
  ).first();
  const reward = parseFloat(config?.config_value as string || '50');

  return c.json({ 
    valid: true, 
    reward,
    referrer_name: referrer.display_name ? (referrer.display_name as string).split(' ')[0] : 'A friend'
  });
});

// Apply referral code
app.post("/api/referrals/apply", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { referral_code } = body;

  if (!referral_code) {
    return c.json({ error: "Referral code is required" }, 400);
  }

  // Check if user already has a referrer
  const existingReferral = await c.env.DB.prepare(
    "SELECT id FROM referral_tracking WHERE referred_user_id = ?"
  ).bind(user!.id).first();

  if (existingReferral) {
    return c.json({ error: "You have already used a referral code" }, 400);
  }

  // Check apply window (configurable hours after signup)
  const config = await c.env.DB.prepare(
    "SELECT config_value FROM referral_config WHERE config_key = 'apply_code_hours'"
  ).first();
  const applyHours = parseInt(config?.config_value as string || '48');

  const userProfile = await c.env.DB.prepare(
    "SELECT created_at FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const createdAt = new Date(userProfile?.created_at as string);
  const hoursSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceSignup > applyHours) {
    return c.json({ error: `Referral code can only be applied within ${applyHours} hours of signup` }, 400);
  }

  // Find referrer by code (case-insensitive)
  const referrer = await c.env.DB.prepare(
    "SELECT user_id FROM user_profiles WHERE UPPER(referral_code) = UPPER(?)"
  ).bind(referral_code).first();

  if (!referrer) {
    return c.json({ error: "Invalid referral code" }, 400);
  }

  // Prevent self-referral
  if (referrer.user_id === user!.id) {
    return c.json({ error: "You cannot use your own referral code" }, 400);
  }

  // Get reward amounts from config
  const { results: configRows } = await c.env.DB.prepare(
    "SELECT config_key, config_value FROM referral_config WHERE config_key IN ('referrer_reward_amount', 'referred_reward_amount')"
  ).all();
  const configMap: Record<string, string> = {};
  configRows.forEach((row: any) => { configMap[row.config_key] = row.config_value; });

  // Create referral tracking
  await c.env.DB.prepare(`
    INSERT INTO referral_tracking (
      referrer_user_id, referred_user_id, referral_code, 
      referral_stage, referrer_reward_amount, referred_reward_amount
    ) VALUES (?, ?, ?, 'registered', ?, ?)
  `).bind(
    referrer.user_id,
    user!.id,
    referral_code.toUpperCase(),
    parseFloat(configMap.referrer_reward_amount || '100'),
    parseFloat(configMap.referred_reward_amount || '50')
  ).run();

  return c.json({ 
    success: true, 
    message: "Referral code applied successfully! Rewards will be credited after your first transaction." 
  });
});

// Get wallet details and transactions
app.get("/api/wallet", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get or create wallet
  let wallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!wallet) {
    await c.env.DB.prepare(
      "INSERT INTO user_wallets (user_id) VALUES (?)"
    ).bind(user!.id).run();
    wallet = { balance: 0, total_earned: 0, total_redeemed: 0, currency: 'INR' };
  }

  // Get recent transactions
  const { results: transactions } = await c.env.DB.prepare(`
    SELECT * FROM wallet_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).bind(user!.id).all();

  return c.json({ wallet, transactions });
});

// Process referral reward (called when first transaction completes)
app.post("/api/referrals/process-reward", authMiddleware, async (c) => {
  const user = c.get("user");

  // Check if user was referred
  const referral = await c.env.DB.prepare(`
    SELECT * FROM referral_tracking 
    WHERE referred_user_id = ? AND referral_stage = 'registered'
  `).bind(user!.id).first();

  if (!referral) {
    return c.json({ message: "No pending referral reward" });
  }

  // Get cooloff period
  const cooloffConfig = await c.env.DB.prepare(
    "SELECT config_value FROM referral_config WHERE config_key = 'reward_cooloff_days'"
  ).first();
  const cooloffDays = parseInt(cooloffConfig?.config_value as string || '7');

  // Check if enough time has passed since registration
  const referralDate = new Date(referral.created_at as string);
  const daysSinceReferral = (Date.now() - referralDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReferral < cooloffDays) {
    return c.json({ message: "Cooloff period not yet passed", days_remaining: Math.ceil(cooloffDays - daysSinceReferral) });
  }

  // Get expiry days
  const expiryConfig = await c.env.DB.prepare(
    "SELECT config_value FROM referral_config WHERE config_key = 'reward_expiry_days'"
  ).first();
  const expiryDays = parseInt(expiryConfig?.config_value as string || '90');
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  // Credit referrer wallet
  const referrerWallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ?"
  ).bind(referral.referrer_user_id).first();

  if (!referrerWallet) {
    await c.env.DB.prepare("INSERT INTO user_wallets (user_id) VALUES (?)").bind(referral.referrer_user_id).run();
  }

  const referrerNewBalance = ((referrerWallet?.balance as number) || 0) + (referral.referrer_reward_amount as number);
  await c.env.DB.prepare(`
    UPDATE user_wallets 
    SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(referrerNewBalance, referral.referrer_reward_amount, referral.referrer_user_id).run();

  // Log referrer transaction
  await c.env.DB.prepare(`
    INSERT INTO wallet_transactions (user_id, amount, transaction_type, reference_type, reference_id, description, balance_after, expires_at)
    VALUES (?, ?, 'credit', 'referral', ?, 'Referral reward', ?, ?)
  `).bind(referral.referrer_user_id, referral.referrer_reward_amount, referral.id, referrerNewBalance, expiresAt).run();

  // Credit referred user wallet
  let userWallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!userWallet) {
    await c.env.DB.prepare("INSERT INTO user_wallets (user_id) VALUES (?)").bind(user!.id).run();
    userWallet = { balance: 0 };
  }

  const userNewBalance = ((userWallet.balance as number) || 0) + (referral.referred_reward_amount as number);
  await c.env.DB.prepare(`
    UPDATE user_wallets 
    SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(userNewBalance, referral.referred_reward_amount, user!.id).run();

  // Log user transaction
  await c.env.DB.prepare(`
    INSERT INTO wallet_transactions (user_id, amount, transaction_type, reference_type, reference_id, description, balance_after, expires_at)
    VALUES (?, ?, 'credit', 'referral_bonus', ?, 'Welcome bonus', ?, ?)
  `).bind(user!.id, referral.referred_reward_amount, referral.id, userNewBalance, expiresAt).run();

  // Update referral tracking
  await c.env.DB.prepare(`
    UPDATE referral_tracking 
    SET referral_stage = 'completed', reward_status = 'paid', first_transaction_at = CURRENT_TIMESTAMP, reward_unlocked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(referral.id).run();

  return c.json({ 
    success: true, 
    referrer_rewarded: referral.referrer_reward_amount,
    user_rewarded: referral.referred_reward_amount 
  });
});

// Get referral config (for admin)
app.get("/api/admin/referral-config", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM referral_config ORDER BY config_key"
  ).all();
  return c.json(results);
});

// Update referral config (admin)
app.put("/api/admin/referral-config", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { config_key, config_value } = body;

  await c.env.DB.prepare(`
    UPDATE referral_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?
  `).bind(config_value, config_key).run();

  return c.json({ success: true });
});

// Admin: Get all referrals
app.get("/api/admin/referrals", authMiddleware, async (c) => {
  const url = new URL(c.req.url);
  const status = url.searchParams.get("status");
  const fraudOnly = url.searchParams.get("fraud") === "true";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  if (status) whereClause += ` AND rt.referral_stage = '${status}'`;
  if (fraudOnly) whereClause += " AND rt.is_fraud_flagged = 1";

  const { results } = await c.env.DB.prepare(`
    SELECT rt.*, 
           referrer.full_name as referrer_name, referrer.phone as referrer_phone,
           referred.full_name as referred_name, referred.phone as referred_phone
    FROM referral_tracking rt
    LEFT JOIN user_profiles referrer ON rt.referrer_user_id = referrer.user_id
    LEFT JOIN user_profiles referred ON rt.referred_user_id = referred.user_id
    WHERE ${whereClause}
    ORDER BY rt.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM referral_tracking rt WHERE ${whereClause}`
  ).first();

  return c.json({ referrals: results, total: countResult?.total || 0, page, limit });
});

// Admin: Flag/unflag referral as fraud
app.post("/api/admin/referrals/:id/fraud", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { is_fraud, reason } = body;

  await c.env.DB.prepare(`
    UPDATE referral_tracking 
    SET is_fraud_flagged = ?, fraud_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(is_fraud ? 1 : 0, reason || null, id).run();

  return c.json({ success: true });
});

// Notification preferences endpoints
app.get("/api/notifications/preferences", authMiddleware, async (c) => {
  const user = c.get("user");
  
  let prefs = await c.env.DB.prepare(
    "SELECT * FROM notification_preferences WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  if (!prefs) {
    await c.env.DB.prepare(
      "INSERT INTO notification_preferences (user_id) VALUES (?)"
    )
      .bind(user!.id)
      .run();

    prefs = await c.env.DB.prepare(
      "SELECT * FROM notification_preferences WHERE user_id = ?"
    )
      .bind(user!.id)
      .first();
  }

  return c.json(prefs);
});

app.put("/api/notifications/preferences", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE notification_preferences SET email_notifications = ?, push_notifications = ?, sms_notifications = ?, job_alerts = ?, news_updates = ?, community_messages = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(
      body.email_notifications ? 1 : 0,
      body.push_notifications ? 1 : 0,
      body.sms_notifications ? 1 : 0,
      body.job_alerts ? 1 : 0,
      body.news_updates ? 1 : 0,
      body.community_messages ? 1 : 0,
      user!.id
    )
    .run();

  return c.json({ success: true });
});

// Support ticket endpoints
app.get("/api/support/tickets", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

app.post("/api/support/tickets", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO support_tickets (user_id, booking_id, subject, message) VALUES (?, ?, ?, ?)"
  )
    .bind(user!.id, body.booking_id || null, body.subject, body.message)
    .run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Contact form endpoint (public, no auth required)
app.post("/api/support/contact", async (c) => {
  const body = await c.req.json();

  if (!body.name || !body.email || !body.subject || !body.message) {
    return c.json({ error: "Name, email, subject, and message are required" }, 400);
  }

  // Store in database
  const result = await c.env.DB.prepare(
    "INSERT INTO contact_inquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      body.name,
      body.email,
      body.phone || null,
      body.subject,
      body.message
    )
    .run();

  // Send email notification to support team
  try {
    const resend = new Resend(c.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Mavy Partner <noreply@getmocha.com>",
      to: "info@themavy.com",
      subject: `Contact Form: ${body.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> ${body.email}</p>
            ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
            
            <h3>Subject</h3>
            <p>${body.subject}</p>
            
            <h3>Message</h3>
            <p style="white-space: pre-wrap;">${body.message}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This inquiry was submitted through the Mavy Partner contact form.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending contact email:", error);
    // Don't fail the request if email fails
  }

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Location change request endpoints
app.post("/api/profile/location-change-request", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  console.log(`[Location Change Request] User ${user!.id} (${user!.google_user_data.email}) requesting location change`);

  if (!body.requested_state || !body.requested_country) {
    return c.json({ error: "State and country are required" }, 400);
  }

  // Get current location
  const profile = await c.env.DB.prepare(
    "SELECT state, country FROM user_profiles WHERE user_id = ?"
  )
    .bind(user!.id)
    .first();

  console.log(`[Location Change Request] Current location: ${profile?.state}, ${profile?.country}`);
  console.log(`[Location Change Request] Requested location: ${body.requested_state}, ${body.requested_country}`);

  const result = await c.env.DB.prepare(
    "INSERT INTO location_change_requests (user_id, current_state, current_country, requested_state, requested_country, reason) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      user!.id,
      profile?.state || null,
      profile?.country || null,
      body.requested_state,
      body.requested_country,
      body.reason || null
    )
    .run();

  console.log(`[Location Change Request] Created request ID: ${result.meta.last_row_id}`);

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.get("/api/profile/location-change-requests", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM location_change_requests WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user!.id)
    .all();

  return c.json(results);
});

// Exhibitions endpoints
app.get("/api/exhibitions", async (c) => {
  const category = c.req.query("category") || "";
  const user = c.get("user");
  
  // Clean up old exhibitions in the background (non-blocking)
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `DELETE FROM medical_exhibitions 
       WHERE event_end_date IS NOT NULL 
       AND event_end_date < DATE('now', '-1 day')`
    ).run().catch((error) => {
      console.error("Error cleaning up old exhibitions:", error);
    })
  );
  
  let query = `SELECT me.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
               FROM medical_exhibitions me 
               LEFT JOIN user_profiles up ON me.posted_by_user_id = up.user_id`;
  const params: string[] = [];
  const conditions: string[] = [];

  // Filter by user's profession if authenticated
  if (user) {
    const profile = await c.env.DB.prepare(
      "SELECT profession FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();

    if (profile?.profession) {
      conditions.push("(me.target_profession = ? OR me.target_profession IS NULL)");
      params.push(profile.profession as string);
    }
  }

  if (category && category !== "All") {
    conditions.push("me.category = ?");
    params.push(category);
  }

  // Only show exhibitions that haven't ended yet or are ongoing
  conditions.push("(me.event_end_date IS NULL OR me.event_end_date >= DATE('now'))");
  
  // Also prioritize exhibitions starting from today onwards
  conditions.push("(me.event_start_date IS NULL OR me.event_start_date >= DATE('now', '-7 days'))");

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY me.event_start_date ASC, me.created_at ASC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const exhibitionsWithCounts = await Promise.all(
    results.map(async (exhibition: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_likes WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_comments WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_shares WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const viewsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_views WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const goingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'going'"
      ).bind(exhibition.id).first();

      const notGoingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'not_going'"
      ).bind(exhibition.id).first();

      let userLiked = false;
      let userSaved = false;
      let userResponse = null;
      let attendingFriends: any[] = [];

      if (user) {
        const likeCheck = await c.env.DB.prepare(
          "SELECT id FROM exhibition_likes WHERE exhibition_id = ? AND user_id = ?"
        ).bind(exhibition.id, user.id).first();
        userLiked = !!likeCheck;

        const saveCheck = await c.env.DB.prepare(
          "SELECT id FROM saved_exhibitions WHERE exhibition_id = ? AND user_id = ?"
        ).bind(exhibition.id, user.id).first();
        userSaved = !!saveCheck;

        const responseCheck = await c.env.DB.prepare(
          "SELECT response_type FROM exhibition_responses WHERE exhibition_id = ? AND user_id = ?"
        ).bind(exhibition.id, user.id).first();
        userResponse = responseCheck?.response_type || null;

        // Get friends who are attending
        const { results: friends } = await c.env.DB.prepare(
          `SELECT DISTINCT up.user_id, up.full_name, up.profile_picture_url
           FROM exhibition_responses er
           JOIN user_profiles up ON er.user_id = up.user_id
           JOIN user_followers uf ON (uf.following_user_id = er.user_id AND uf.follower_user_id = ?)
           WHERE er.exhibition_id = ? AND er.response_type = 'going'
           LIMIT 5`
        ).bind(user.id, exhibition.id).all();
        attendingFriends = friends;
      }

      return {
        ...exhibition,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        views_count: viewsCount?.count || 0,
        going_count: goingCount?.count || 0,
        not_going_count: notGoingCount?.count || 0,
        user_liked: userLiked,
        user_saved: userSaved,
        user_response: userResponse,
        attending_friends: attendingFriends,
      };
    })
  );

  return c.json(exhibitionsWithCounts);
});

app.post("/api/exhibitions", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.title || !body.description) {
    return c.json({ error: "Title and description are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO medical_exhibitions (
      title, description, category, image_url, website_url, contact_number, 
      location, event_start_date, event_end_date, organizer_name, 
      posted_by_user_id, is_user_post, hashtags, google_maps_url, 
      registration_url, venue_name, city, state, country
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.title,
    body.description,
    body.category || "Other",
    body.image_url || null,
    body.website_url || null,
    body.contact_number || null,
    body.location || null,
    body.event_start_date || null,
    body.event_end_date || null,
    body.organizer_name || null,
    user!.id,
    body.hashtags || null,
    body.google_maps_url || null,
    body.registration_url || null,
    body.venue_name || null,
    body.city || null,
    body.state || null,
    body.country || null
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.get("/api/exhibitions/my-posts", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT me.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
     FROM medical_exhibitions me 
     LEFT JOIN user_profiles up ON me.posted_by_user_id = up.user_id 
     WHERE me.posted_by_user_id = ? 
     ORDER BY me.created_at DESC`
  ).bind(user!.id).all();

  const exhibitionsWithCounts = await Promise.all(
    results.map(async (exhibition: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_likes WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_comments WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_shares WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const viewsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_views WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const goingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'going'"
      ).bind(exhibition.id).first();

      const notGoingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'not_going'"
      ).bind(exhibition.id).first();

      const likeCheck = await c.env.DB.prepare(
        "SELECT id FROM exhibition_likes WHERE exhibition_id = ? AND user_id = ?"
      ).bind(exhibition.id, user!.id).first();

      const saveCheck = await c.env.DB.prepare(
        "SELECT id FROM saved_exhibitions WHERE exhibition_id = ? AND user_id = ?"
      ).bind(exhibition.id, user!.id).first();

      const responseCheck = await c.env.DB.prepare(
        "SELECT response_type FROM exhibition_responses WHERE exhibition_id = ? AND user_id = ?"
      ).bind(exhibition.id, user!.id).first();

      // Get friends who are attending
      const { results: friends } = await c.env.DB.prepare(
        `SELECT DISTINCT up.user_id, up.full_name, up.profile_picture_url
         FROM exhibition_responses er
         JOIN user_profiles up ON er.user_id = up.user_id
         JOIN user_followers uf ON (uf.following_user_id = er.user_id AND uf.follower_user_id = ?)
         WHERE er.exhibition_id = ? AND er.response_type = 'going'
         LIMIT 5`
      ).bind(user!.id, exhibition.id).all();

      return {
        ...exhibition,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        views_count: viewsCount?.count || 0,
        going_count: goingCount?.count || 0,
        not_going_count: notGoingCount?.count || 0,
        user_liked: !!likeCheck,
        user_saved: !!saveCheck,
        user_response: responseCheck?.response_type || null,
        attending_friends: friends,
      };
    })
  );

  return c.json(exhibitionsWithCounts);
});

app.get("/api/exhibitions/saved", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT me.*, up.full_name as author_name, up.profile_picture_url as author_profile_picture_url 
     FROM medical_exhibitions me 
     INNER JOIN saved_exhibitions se ON me.id = se.exhibition_id
     LEFT JOIN user_profiles up ON me.posted_by_user_id = up.user_id 
     WHERE se.user_id = ? 
     ORDER BY se.created_at DESC`
  ).bind(user!.id).all();

  const exhibitionsWithCounts = await Promise.all(
    results.map(async (exhibition: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_likes WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const commentsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_comments WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const sharesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_shares WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const viewsCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_views WHERE exhibition_id = ?"
      ).bind(exhibition.id).first();

      const goingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'going'"
      ).bind(exhibition.id).first();

      const notGoingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_responses WHERE exhibition_id = ? AND response_type = 'not_going'"
      ).bind(exhibition.id).first();

      const likeCheck = await c.env.DB.prepare(
        "SELECT id FROM exhibition_likes WHERE exhibition_id = ? AND user_id = ?"
      ).bind(exhibition.id, user!.id).first();

      const responseCheck = await c.env.DB.prepare(
        "SELECT response_type FROM exhibition_responses WHERE exhibition_id = ? AND user_id = ?"
      ).bind(exhibition.id, user!.id).first();

      // Get friends who are attending
      const { results: friends } = await c.env.DB.prepare(
        `SELECT DISTINCT up.user_id, up.full_name, up.profile_picture_url
         FROM exhibition_responses er
         JOIN user_profiles up ON er.user_id = up.user_id
         JOIN user_followers uf ON (uf.following_user_id = er.user_id AND uf.follower_user_id = ?)
         WHERE er.exhibition_id = ? AND er.response_type = 'going'
         LIMIT 5`
      ).bind(user!.id, exhibition.id).all();

      return {
        ...exhibition,
        likes_count: likesCount?.count || 0,
        comments_count: commentsCount?.count || 0,
        shares_count: sharesCount?.count || 0,
        views_count: viewsCount?.count || 0,
        going_count: goingCount?.count || 0,
        not_going_count: notGoingCount?.count || 0,
        user_liked: !!likeCheck,
        user_saved: true,
        user_response: responseCheck?.response_type || null,
        attending_friends: friends,
      };
    })
  );

  return c.json(exhibitionsWithCounts);
});

app.put("/api/exhibitions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");
  const body = await c.req.json();

  const exhibition = await c.env.DB.prepare(
    "SELECT posted_by_user_id FROM medical_exhibitions WHERE id = ?"
  ).bind(exhibitionId).first();

  if (!exhibition) {
    return c.json({ error: "Exhibition not found" }, 404);
  }

  if (exhibition.posted_by_user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare(
    `UPDATE medical_exhibitions SET 
      title = ?, description = ?, category = ?, image_url = ?, 
      website_url = ?, contact_number = ?, location = ?, 
      event_start_date = ?, event_end_date = ?, organizer_name = ?, 
      hashtags = ?, google_maps_url = ?, registration_url = ?, 
      venue_name = ?, city = ?, state = ?, country = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
  ).bind(
    body.title,
    body.description,
    body.category,
    body.image_url || null,
    body.website_url || null,
    body.contact_number || null,
    body.location || null,
    body.event_start_date || null,
    body.event_end_date || null,
    body.organizer_name || null,
    body.hashtags || null,
    body.google_maps_url || null,
    body.registration_url || null,
    body.venue_name || null,
    body.city || null,
    body.state || null,
    body.country || null,
    exhibitionId
  ).run();

  return c.json({ success: true });
});

app.delete("/api/exhibitions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");

  const exhibition = await c.env.DB.prepare(
    "SELECT posted_by_user_id FROM medical_exhibitions WHERE id = ?"
  ).bind(exhibitionId).first();

  if (!exhibition) {
    return c.json({ error: "Exhibition not found" }, 404);
  }

  if (exhibition.posted_by_user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM exhibition_likes WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_comments WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_shares WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM saved_exhibitions WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_responses WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_views WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_reports WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM medical_exhibitions WHERE id = ?").bind(exhibitionId).run();

  return c.json({ success: true });
});

app.post("/api/exhibitions/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM exhibition_likes WHERE exhibition_id = ? AND user_id = ?"
  ).bind(exhibitionId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM exhibition_likes WHERE exhibition_id = ? AND user_id = ?"
    ).bind(exhibitionId, user!.id).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO exhibition_likes (exhibition_id, user_id) VALUES (?, ?)"
    ).bind(exhibitionId, user!.id).run();
    return c.json({ liked: true });
  }
});

app.get("/api/exhibitions/:id/comments", async (c) => {
  const exhibitionId = c.req.param("id");
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT ec.*, up.full_name, up.profile_picture_url 
     FROM exhibition_comments ec 
     LEFT JOIN user_profiles up ON ec.user_id = up.user_id 
     WHERE ec.exhibition_id = ? 
     ORDER BY ec.created_at DESC`
  ).bind(exhibitionId).all();

  const commentsWithCounts = await Promise.all(
    results.map(async (comment: any) => {
      const likesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_comment_likes WHERE comment_id = ?"
      ).bind(comment.id).first();

      const repliesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM exhibition_comment_replies WHERE comment_id = ?"
      ).bind(comment.id).first();

      let userLiked = false;
      if (user) {
        const likeCheck = await c.env.DB.prepare(
          "SELECT id FROM exhibition_comment_likes WHERE comment_id = ? AND user_id = ?"
        ).bind(comment.id, user.id).first();
        userLiked = !!likeCheck;
      }

      return {
        ...comment,
        likes_count: likesCount?.count || 0,
        replies_count: repliesCount?.count || 0,
        user_liked: userLiked,
      };
    })
  );

  return c.json(commentsWithCounts);
});

app.post("/api/exhibitions/:id/comment", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO exhibition_comments (exhibition_id, user_id, comment) VALUES (?, ?, ?)"
  ).bind(exhibitionId, user!.id, body.comment).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.post("/api/exhibitions/comments/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM exhibition_comment_likes WHERE comment_id = ? AND user_id = ?"
  ).bind(commentId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM exhibition_comment_likes WHERE comment_id = ? AND user_id = ?"
    ).bind(commentId, user!.id).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO exhibition_comment_likes (comment_id, user_id) VALUES (?, ?)"
    ).bind(commentId, user!.id).run();
    return c.json({ liked: true });
  }
});

app.get("/api/exhibitions/comments/:id/replies", async (c) => {
  const commentId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT ecr.*, up.full_name, up.profile_picture_url 
     FROM exhibition_comment_replies ecr 
     LEFT JOIN user_profiles up ON ecr.user_id = up.user_id 
     WHERE ecr.comment_id = ? 
     ORDER BY ecr.created_at ASC`
  ).bind(commentId).all();

  return c.json(results);
});

app.post("/api/exhibitions/comments/:id/reply", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("id");
  const body = await c.req.json();

  if (!body.reply) {
    return c.json({ error: "Reply is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO exhibition_comment_replies (comment_id, user_id, reply) VALUES (?, ?, ?)"
  ).bind(commentId, user!.id, body.reply).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.post("/api/exhibitions/:id/share", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");

  await c.env.DB.prepare(
    "INSERT INTO exhibition_shares (exhibition_id, user_id) VALUES (?, ?)"
  ).bind(exhibitionId, user!.id).run();

  return c.json({ success: true });
});

app.post("/api/exhibitions/:id/view", async (c) => {
  const exhibitionId = c.req.param("id");
  const user = c.get("user");

  try {
    await c.env.DB.prepare(
      "INSERT INTO exhibition_views (exhibition_id, user_id) VALUES (?, ?)"
    ).bind(exhibitionId, user?.id || null).run();

    return c.json({ success: true });
  } catch (error) {
    // Ignore duplicate view tracking errors
    return c.json({ success: true });
  }
});

app.post("/api/exhibitions/:id/save", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM saved_exhibitions WHERE exhibition_id = ? AND user_id = ?"
  ).bind(exhibitionId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM saved_exhibitions WHERE exhibition_id = ? AND user_id = ?"
    ).bind(exhibitionId, user!.id).run();
    return c.json({ saved: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO saved_exhibitions (exhibition_id, user_id) VALUES (?, ?)"
    ).bind(exhibitionId, user!.id).run();
    return c.json({ saved: true });
  }
});

app.post("/api/exhibitions/:id/response", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");
  const body = await c.req.json();

  if (!body.response_type) {
    return c.json({ error: "Response type is required" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM exhibition_responses WHERE exhibition_id = ? AND user_id = ?"
  ).bind(exhibitionId, user!.id).first();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE exhibition_responses SET response_type = ?, updated_at = CURRENT_TIMESTAMP WHERE exhibition_id = ? AND user_id = ?"
    ).bind(body.response_type, exhibitionId, user!.id).run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO exhibition_responses (exhibition_id, user_id, response_type) VALUES (?, ?, ?)"
    ).bind(exhibitionId, user!.id, body.response_type).run();
  }

  return c.json({ success: true });
});

app.post("/api/exhibitions/:id/report", authMiddleware, async (c) => {
  const user = c.get("user");
  const exhibitionId = c.req.param("id");
  const body = await c.req.json();

  if (!body.reason) {
    return c.json({ error: "Reason is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO exhibition_reports (exhibition_id, user_id, reason, description) VALUES (?, ?, ?, ?)"
  ).bind(exhibitionId, user!.id, body.reason, body.description || null).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Services endpoints
app.get("/api/services", async (c) => {
  const type = c.req.query("type") || "";
  const user = c.get("user");
  
  let query = `SELECT sl.*, up.full_name as provider_name, up.profile_picture_url as provider_picture 
               FROM service_listings sl 
               LEFT JOIN user_profiles up ON sl.provider_user_id = up.user_id 
               WHERE sl.status = 'active'`;
  const params: string[] = [];

  // Filter by user's profession if authenticated
  if (user) {
    const profile = await c.env.DB.prepare(
      "SELECT profession FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();

    if (profile?.profession) {
      query += " AND (sl.target_profession = ? OR sl.target_profession IS NULL)";
      params.push(profile.profession as string);
    }
  }

  if (type) {
    query += " AND sl.service_type = ?";
    params.push(type);
  }

  query += " ORDER BY sl.created_at DESC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.post("/api/services", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.title || !body.description || !body.service_type) {
    return c.json({ error: "Title, description, and service type are required" }, 400);
  }

  // Get user's profession
  const profile = await c.env.DB.prepare(
    "SELECT profession FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const result = await c.env.DB.prepare(
    `INSERT INTO service_listings (
      title, description, service_type, provider_user_id, 
      price_range, location, availability, contact_email, 
      contact_phone, image_url, status, target_profession
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
  ).bind(
    body.title,
    body.description,
    body.service_type,
    user!.id,
    body.price_range || null,
    body.location || null,
    body.availability || null,
    body.contact_email || null,
    body.contact_phone || null,
    body.image_url || null,
    body.target_profession || profile?.profession || null
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.post("/api/services/:id/request", authMiddleware, async (c) => {
  const user = c.get("user");
  const serviceId = c.req.param("id");
  const body = await c.req.json();

  if (!body.message) {
    return c.json({ error: "Message is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO service_requests (service_id, requester_user_id, message, contact_preference) VALUES (?, ?, ?, ?)"
  ).bind(
    serviceId,
    user!.id,
    body.message,
    body.contact_preference || "email"
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Fundraising endpoints
app.get("/api/fundraisers", async (c) => {
  const category = c.req.query("category") || "";
  const caseType = c.req.query("case_type") || "";
  
  let query = `SELECT f.*, up.full_name as creator_name, up.profile_picture_url as creator_picture,
               (SELECT COUNT(*) FROM fundraiser_donations WHERE fundraiser_id = f.id) as donations_count
               FROM fundraisers f 
               LEFT JOIN user_profiles up ON f.creator_user_id = up.user_id 
               WHERE f.status = 'active' AND f.verification_status = 'verified'`;
  const params: string[] = [];

  if (category) {
    query += " AND f.category = ?";
    params.push(category);
  }

  if (caseType) {
    query += " AND f.case_type = ?";
    params.push(caseType);
  }

  query += " ORDER BY f.created_at DESC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const fundraisersWithProgress = results.map((f: any) => ({
    ...f,
    progress_percentage: f.goal_amount > 0 ? Math.round((f.current_amount / f.goal_amount) * 100) : 0
  }));

  return c.json(fundraisersWithProgress);
});

app.post("/api/fundraisers/upload-image", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return c.json({ error: "No image file provided" }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return c.json({ error: "File must be an image" }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Image size must be less than 5MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "jpg";
  const key = `fundraiser-images/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const imageUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, image_url: imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

app.post("/api/fundraisers/upload-document", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("document") as File;
  const documentType = formData.get("document_type") as string;

  if (!file) {
    return c.json({ error: "No document file provided" }, 400);
  }

  if (!documentType) {
    return c.json({ error: "Document type is required" }, 400);
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];

  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Only PDF and image files are allowed" }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "File size must be less than 10MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "pdf";
  const key = `fundraiser-documents/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    return c.json({ 
      success: true, 
      file_url: fileUrl,
      file_name: file.name
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Failed to upload document" }, 500);
  }
});

app.post("/api/fundraisers", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.title || !body.description || !body.category || 
      !body.case_type || !body.goal_amount || !body.beneficiary_name) {
    return c.json({ error: "All required fields must be filled" }, 400);
  }

  if (!body.documents || body.documents.length === 0) {
    return c.json({ error: "At least one supporting document is required" }, 400);
  }

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO fundraisers (
        title, description, category, case_type, goal_amount, currency,
        beneficiary_name, beneficiary_contact, creator_user_id,
        verification_status, status, end_date, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'active', ?, ?)`
    ).bind(
      body.title,
      body.description,
      body.category,
      body.case_type,
      body.goal_amount,
      body.currency || "USD",
      body.beneficiary_name,
      body.beneficiary_contact || null,
      user!.id,
      body.end_date || null,
      body.image_url || null
    ).run();

    const fundraiserId = result.meta.last_row_id;

    // Store supporting documents
    for (const doc of body.documents) {
      await c.env.DB.prepare(
        "INSERT INTO fundraiser_documents (fundraiser_id, document_type, file_url, file_name) VALUES (?, ?, ?, ?)"
      ).bind(
        fundraiserId,
        doc.document_type,
        doc.file_url,
        doc.file_name
      ).run();
    }

    return c.json({ id: fundraiserId, success: true }, 201);
  } catch (error) {
    console.error("Error creating fundraiser:", error);
    return c.json({ error: "Failed to create fundraiser" }, 500);
  }
});

app.post("/api/fundraisers/:id/donate", authMiddleware, async (c) => {
  const user = c.get("user");
  const fundraiserId = c.req.param("id");
  const body = await c.req.json();

  if (!body.amount || body.amount <= 0) {
    return c.json({ error: "Valid donation amount is required" }, 400);
  }

  try {
    // Check if fundraiser exists and is active
    const fundraiser = await c.env.DB.prepare(
      "SELECT * FROM fundraisers WHERE id = ? AND status = 'active' AND verification_status = 'verified'"
    ).bind(fundraiserId).first();

    if (!fundraiser) {
      return c.json({ error: "Fundraiser not found or not active" }, 404);
    }

    // Create donation record
    await c.env.DB.prepare(
      `INSERT INTO fundraiser_donations (
        fundraiser_id, donor_user_id, amount, currency, 
        is_anonymous, message, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed')`
    ).bind(
      fundraiserId,
      user!.id,
      body.amount,
      body.currency || "USD",
      body.is_anonymous ? 1 : 0,
      body.message || null
    ).run();

    // Update fundraiser current amount
    await c.env.DB.prepare(
      "UPDATE fundraisers SET current_amount = current_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.amount, fundraiserId).run();

    // Create transaction record
    await c.env.DB.prepare(
      `INSERT INTO transactions (
        user_id, amount, currency, transaction_type, 
        description, status, payment_method
      ) VALUES (?, ?, ?, 'donation', ?, 'completed', ?)`
    ).bind(
      user!.id,
      body.amount,
      body.currency || "USD",
      `Donation to: ${fundraiser.title}`,
      body.payment_method || "card"
    ).run();

    return c.json({ success: true, message: "Donation successful" });
  } catch (error) {
    console.error("Error processing donation:", error);
    return c.json({ error: "Failed to process donation" }, 500);
  }
});

// Learning courses endpoints
app.get("/api/courses", async (c) => {
  const category = c.req.query("category") || "";
  const user = c.get("user");
  
  let query = "SELECT * FROM learning_courses WHERE is_active = 1 AND approval_status = 'approved'";
  const params: string[] = [];

  // Filter by user's profession if authenticated
  if (user) {
    const profile = await c.env.DB.prepare(
      "SELECT profession FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();

    if (profile?.profession) {
      query += " AND (target_profession = ? OR target_profession IS NULL)";
      params.push(profile.profession as string);
    }
  }

  if (category && category !== "All") {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY created_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.post("/api/courses/upload-video", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("video") as File;

  if (!file) {
    return c.json({ error: "No video file provided" }, 400);
  }

  if (!file.type.startsWith("video/")) {
    return c.json({ error: "File must be a video" }, 400);
  }

  if (file.size > 500 * 1024 * 1024) {
    return c.json({ error: "Video size must be less than 500MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "mp4";
  const key = `course-videos/${user!.id}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const videoUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, video_url: videoUrl });
  } catch (error) {
    console.error("Error uploading video:", error);
    return c.json({ error: "Failed to upload video" }, 500);
  }
});

app.post("/api/courses/submit", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.title || !body.category || !body.video_url) {
    return c.json({ error: "Title, category, and video URL are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO learning_courses (title, description, category, duration_hours, modules_count, video_url, content, instructor_name, price, currency, submitted_by_user_id, approval_status, is_active, equipment_name, equipment_model, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)"
  ).bind(
    body.title,
    body.description || null,
    body.category,
    body.duration_hours || null,
    body.modules_count || 0,
    body.video_url,
    body.content || null,
    body.instructor_name || null,
    body.price || 0,
    body.currency || "USD",
    user!.id,
    body.equipment_name || null,
    body.equipment_model || null,
    body.image_url || null
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.get("/api/courses/my-submissions", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM learning_courses WHERE submitted_by_user_id = ? ORDER BY created_at DESC"
  ).bind(user!.id).all();

  return c.json(results);
});

// Instructor dashboard endpoints
app.get("/api/courses/instructor/my-courses", authMiddleware, getInstructorCourses);
app.get("/api/courses/instructor/earnings", authMiddleware, getInstructorEarnings);

// Course modules and lessons endpoints
app.get("/api/courses/:id/modules", getCourseModules);
app.post("/api/lessons/:id/complete", authMiddleware, markLessonComplete);

// Certificate endpoints
app.post("/api/courses/:id/certificate", authMiddleware, generateCertificate);
app.get("/api/certificates", authMiddleware, getUserCertificates);
app.get("/api/certificates/:number/verify", getCertificateById);

// Admin: Create modules and lessons
app.post("/api/admin/course-modules", authMiddleware, adminCheckMiddleware, createCourseModule);
app.post("/api/admin/course-lessons", authMiddleware, adminCheckMiddleware, createCourseLesson);

app.get("/api/courses/:id/progress", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");

  const progress = await c.env.DB.prepare(
    "SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?"
  ).bind(user!.id, courseId).first();

  return c.json(progress || { progress_percentage: 0, is_completed: false });
});

app.post("/api/courses/:id/progress", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");
  const body = await c.req.json();

  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_course_progress WHERE user_id = ? AND course_id = ?"
  ).bind(user!.id, courseId).first();

  if (existing) {
    await c.env.DB.prepare(
      "UPDATE user_course_progress SET progress_percentage = ?, completed_modules = ?, is_completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?"
    ).bind(
      body.progress_percentage,
      body.completed_modules ? JSON.stringify(body.completed_modules) : null,
      body.is_completed ? 1 : 0,
      body.is_completed ? new Date().toISOString() : null,
      user!.id,
      courseId
    ).run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO user_course_progress (user_id, course_id, progress_percentage, completed_modules, is_completed, completed_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      user!.id,
      courseId,
      body.progress_percentage,
      body.completed_modules ? JSON.stringify(body.completed_modules) : null,
      body.is_completed ? 1 : 0,
      body.is_completed ? new Date().toISOString() : null
    ).run();
  }

  return c.json({ success: true });
});

// Course details endpoint
app.get("/api/courses/:id/details", async (c) => {
  const courseId = c.req.param("id");

  const course = await c.env.DB.prepare(
    "SELECT * FROM learning_courses WHERE id = ? AND is_active = 1 AND approval_status = 'approved'"
  ).bind(courseId).first();

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  return c.json(course);
});

// Course reviews endpoints
app.get("/api/courses/:id/reviews", async (c) => {
  const courseId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT cr.*, up.full_name, up.profile_picture_url 
     FROM course_reviews cr 
     LEFT JOIN user_profiles up ON cr.user_id = up.user_id 
     WHERE cr.course_id = ? 
     ORDER BY cr.created_at DESC`
  ).bind(courseId).all();

  return c.json(results);
});

app.post("/api/courses/:id/reviews", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");
  const body = await c.req.json();

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }

  // Check if user has already reviewed
  const existing = await c.env.DB.prepare(
    "SELECT id FROM course_reviews WHERE course_id = ? AND user_id = ?"
  ).bind(courseId, user!.id).first();

  if (existing) {
    return c.json({ error: "You have already reviewed this course" }, 400);
  }

  // Check if user is enrolled
  const enrollment = await c.env.DB.prepare(
    "SELECT id FROM course_enrollments WHERE course_id = ? AND user_id = ?"
  ).bind(courseId, user!.id).first();

  // Insert review
  await c.env.DB.prepare(
    "INSERT INTO course_reviews (course_id, user_id, rating, review_text, is_verified_purchase) VALUES (?, ?, ?, ?, ?)"
  ).bind(
    courseId,
    user!.id,
    body.rating,
    body.review_text || null,
    enrollment ? 1 : 0
  ).run();

  // Update course average rating and review count
  const { results: allReviews } = await c.env.DB.prepare(
    "SELECT rating FROM course_reviews WHERE course_id = ?"
  ).bind(courseId).all();

  const totalRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  const averageRating = totalRating / allReviews.length;

  await c.env.DB.prepare(
    "UPDATE learning_courses SET average_rating = ?, total_reviews = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(averageRating, allReviews.length, courseId).run();

  return c.json({ success: true });
});

app.get("/api/courses/:id/my-review", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");

  const review = await c.env.DB.prepare(
    "SELECT id FROM course_reviews WHERE course_id = ? AND user_id = ?"
  ).bind(courseId, user!.id).first();

  return c.json({ has_reviewed: !!review });
});

// Course enrollment endpoints
app.post("/api/courses/:id/enroll", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");

  // Check if already enrolled
  const existing = await c.env.DB.prepare(
    "SELECT id FROM course_enrollments WHERE course_id = ? AND user_id = ?"
  ).bind(courseId, user!.id).first();

  if (existing) {
    return c.json({ error: "Already enrolled in this course" }, 400);
  }

  // Enroll user
  await c.env.DB.prepare(
    "INSERT INTO course_enrollments (course_id, user_id) VALUES (?, ?)"
  ).bind(courseId, user!.id).run();

  // Update course enrollment count
  await c.env.DB.prepare(
    "UPDATE learning_courses SET total_enrollments = total_enrollments + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(courseId).run();

  return c.json({ success: true });
});

app.get("/api/courses/:id/enrollment", authMiddleware, async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id");

  const enrollment = await c.env.DB.prepare(
    "SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?"
  ).bind(courseId, user!.id).first();

  return c.json({ 
    is_enrolled: !!enrollment,
    enrollment: enrollment || null
  });
});

app.get("/api/courses/my-enrollments", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    "SELECT course_id FROM course_enrollments WHERE user_id = ?"
  ).bind(user!.id).all();

  return c.json(results);
});

// Public endpoint to get nursing service prices
app.get("/api/nursing-prices", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM nursing_service_prices WHERE is_active = 1 ORDER BY id ASC"
  ).all();

  return c.json(results);
});

// Public endpoint to get physiotherapy service prices
app.get("/api/physiotherapy-prices", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM physiotherapy_service_prices WHERE is_active = 1 ORDER BY id ASC"
  ).all();

  return c.json(results);
});

// Public endpoint to get ambulance service prices
app.get("/api/ambulance-prices", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM ambulance_service_prices WHERE is_active = 1 ORDER BY id ASC"
  ).all();

  return c.json(results);
});

// Public endpoint to receive booking requests from patient app
app.post("/api/bookings/submit", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.patient_name || !body.patient_contact || !body.issue_description) {
      return c.json({ error: "Patient name, contact, and issue description are required" }, 400);
    }

    // Build location string from address components
    const locationParts = [
      body.address,
      body.city,
      body.state,
      body.pincode
    ].filter(Boolean);
    const fullLocation = locationParts.join(", ");

    let quotedPrice = null;
    let engineerNotes = null;
    let bookingStatus = 'pending';
    
    // For nursing, physiotherapy, and ambulance services, calculate price upfront using database prices
    const isNursingService = body.service_category && 
      body.service_category.toLowerCase().includes('nursing');
    const isPhysiotherapyService = body.service_category && 
      (body.service_category.toLowerCase().includes('physiotherapy') || 
       body.service_category.toLowerCase().includes('physio'));
    const isAmbulanceService = body.service_category &&
      body.service_category.toLowerCase().includes('ambulance');
    
    // Get dynamic pricing percentages from database settings
    const nightDutySetting = await c.env.DB.prepare(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'night_duty_percentage'"
    ).first();
    const emergencySetting = await c.env.DB.prepare(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'emergency_percentage'"
    ).first();
    
    const nightDutyPercentage = nightDutySetting?.setting_value ? parseInt(nightDutySetting.setting_value as string) : 20;
    const emergencyPercentage = emergencySetting?.setting_value ? parseInt(emergencySetting.setting_value as string) : 15;

    if (isNursingService && body.service_type) {
      // Get base price from database
      const priceRecord = await c.env.DB.prepare(
        "SELECT * FROM nursing_service_prices WHERE service_name = ? AND is_active = 1"
      ).bind(body.service_type).first();

      if (priceRecord) {
        // Determine base price based on billing frequency
        let basePrice = priceRecord.per_visit_price as number;
        if (body.billing_frequency === 'monthly' && priceRecord.monthly_price) {
          basePrice = priceRecord.monthly_price as number;
        }

        // Check if night duty (6 PM to 7 AM)
        let isNightDuty = false;
        if (body.preferred_time) {
          const hour = parseInt(body.preferred_time.split(':')[0]);
          isNightDuty = hour >= 18 || hour < 7;
        }

        // Emergency is when urgency is 'emergency' or 'urgent'
        const isEmergency = body.urgency === 'emergency' || body.urgency === 'urgent';
        
        // Calculate city-adjusted price with add-ons
        const priceCalculation = calculateFinalQuote(
          basePrice,
          body.city || null,
          body.address || null,
          {
            isNightDuty,
            isEmergency,
            consumablesCost: 0,
            nightDutyPercentage,
            emergencyPercentage,
          }
        );
        
        quotedPrice = priceCalculation.finalPrice;
        
        // Build pricing breakdown for engineer notes
        const tierDesc = getTierDescription(priceCalculation.cityTier);
        const billingNote = body.billing_frequency === 'monthly' 
          ? `Monthly Package (${body.monthly_visits_count || 30} visits/month)`
          : 'Per Visit';
        
        const breakdown = [
          `${billingNote}`,
          `Base Rate: ₹${basePrice}`,
          priceCalculation.cityAdjustment > 0 
            ? `${tierDesc} Adjustment: +${priceCalculation.cityAdjustment}% (₹${priceCalculation.breakdown.afterCityAdjustment - basePrice})`
            : null,
          priceCalculation.breakdown.nightDutyCharge 
            ? `Night Duty (6 PM - 7 AM): +${priceCalculation.breakdown.nightDutyPercentage}% (₹${priceCalculation.breakdown.nightDutyCharge})` 
            : null,
          priceCalculation.breakdown.emergencyCharge 
            ? `Emergency/Urgent Visit: +${priceCalculation.breakdown.emergencyPercentage}% (₹${priceCalculation.breakdown.emergencyCharge})` 
            : null,
          'Consumables: Billed separately'
        ].filter(Boolean).join('\n');
        
        engineerNotes = `Pricing Breakdown:\n${breakdown}`;
        
        console.log(`[Booking] Nursing service: ${body.service_type} | Base ₹${basePrice} → Final ₹${quotedPrice} (${priceCalculation.cityTier}, night=${isNightDuty}, emergency=${isEmergency})`);
      }
    } else if (isPhysiotherapyService && body.service_type) {
      // Get base price from database for physiotherapy
      const priceRecord = await c.env.DB.prepare(
        "SELECT * FROM physiotherapy_service_prices WHERE service_name = ? AND is_active = 1"
      ).bind(body.service_type).first();

      if (priceRecord) {
        // Determine base price based on billing frequency
        let basePrice = priceRecord.per_session_price as number;
        if (body.billing_frequency === 'monthly' && priceRecord.monthly_price) {
          basePrice = priceRecord.monthly_price as number;
        }

        // Check if it's Sunday or public holiday
        const isSundayHoliday = body.is_sunday_holiday || false;
        
        // Check if extended session
        const isExtendedSession = body.is_extended_session || false;

        // Emergency is when urgency is 'emergency' or 'urgent'
        const isEmergency = body.urgency === 'emergency' || body.urgency === 'urgent';
        
        // Calculate city-adjusted price with add-ons
        const priceCalculation = calculateFinalQuote(
          basePrice,
          body.city || null,
          body.address || null,
          {
            isNightDuty: false, // Not applicable for physiotherapy
            isEmergency,
            consumablesCost: 0,
            isSundayHoliday,
            isExtendedSession,
            nightDutyPercentage,
            emergencyPercentage,
          }
        );
        
        quotedPrice = priceCalculation.finalPrice;
        
        // Build pricing breakdown for engineer notes
        const tierDesc = getTierDescription(priceCalculation.cityTier);
        const billingNote = body.billing_frequency === 'monthly' 
          ? `Monthly Package (${body.monthly_visits_count || 30} sessions/month)`
          : 'Per Session';
        
        const breakdown = [
          `${billingNote}`,
          `Base Rate: ₹${basePrice}`,
          priceCalculation.cityAdjustment > 0 
            ? `${tierDesc} Adjustment: +${priceCalculation.cityAdjustment}% (₹${priceCalculation.breakdown.afterCityAdjustment - basePrice})`
            : null,
          priceCalculation.breakdown.sundayHolidayCharge 
            ? `Sunday/Holiday: +₹${priceCalculation.breakdown.sundayHolidayCharge}` 
            : null,
          priceCalculation.breakdown.extendedSessionCharge
            ? `Extended Session: +₹${priceCalculation.breakdown.extendedSessionCharge}`
            : null,
          priceCalculation.breakdown.emergencyCharge 
            ? `Emergency/Urgent Same-Day: +${priceCalculation.breakdown.emergencyPercentage}% (₹${priceCalculation.breakdown.emergencyCharge})` 
            : null,
        ].filter(Boolean).join('\n');
        
        engineerNotes = `Pricing Breakdown:\n${breakdown}`;
        
        console.log(`[Booking] Physiotherapy service: ${body.service_type} | Base ₹${basePrice} → Final ₹${quotedPrice} (${priceCalculation.cityTier}, sunday=${isSundayHoliday}, extended=${isExtendedSession}, emergency=${isEmergency})`);
      }
    } else if (isAmbulanceService && body.service_type) {
      // Get base price from database for ambulance
      const priceRecord = await c.env.DB.prepare(
        "SELECT * FROM ambulance_service_prices WHERE service_name = ? AND is_active = 1"
      ).bind(body.service_type).first();

      if (priceRecord && body.pickup_latitude && body.pickup_longitude && 
          body.dropoff_latitude && body.dropoff_longitude) {
        
        // Calculate distance (Haversine formula)
        const R = 6371; // Earth's radius in kilometers
        const dLat = (body.dropoff_latitude - body.pickup_latitude) * Math.PI / 180;
        const dLon = (body.dropoff_longitude - body.pickup_longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(body.pickup_latitude * Math.PI / 180) * Math.cos(body.dropoff_latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // Check if night service (6 PM - 7 AM)
        let isNightService = false;
        if (body.preferred_time) {
          const hour = parseInt(body.preferred_time.split(':')[0]);
          isNightService = hour >= 18 || hour < 7;
        }

        // Emergency is when urgency is 'emergency' or 'urgent'
        const isEmergencyDispatch = body.urgency === 'emergency' || body.urgency === 'urgent';
        
        // Calculate ambulance fare with all adjustments
        const fareCalculation = calculateAmbulanceFare(
          priceRecord.minimum_fare as number,
          priceRecord.minimum_km as number,
          priceRecord.per_km_charge as number,
          distanceKm,
          body.pickup_address ? body.pickup_address.split(',')[0] : null, // Extract city from address
          body.pickup_address,
          {
            isNightDuty: isNightService,
            isEmergency: isEmergencyDispatch,
            nightDutyPercentage,
            emergencyPercentage,
          }
        );
        
        quotedPrice = fareCalculation.finalPrice;
        bookingStatus = 'pending'; // Ambulance bookings need partner acceptance
        
        // Build pricing breakdown for engineer notes
        const tierDesc = getTierDescription(fareCalculation.cityTier);
        
        const breakdown = [
          `Ambulance Service: ${body.service_type}`,
          `Distance: ${distanceKm.toFixed(1)} km (one-way)`,
          `Minimum Fare (${priceRecord.minimum_km} km): ₹${priceRecord.minimum_fare}`,
          fareCalculation.breakdown.extraKm > 0
            ? `Extra Distance (${fareCalculation.breakdown.extraKm.toFixed(1)} km × ₹${priceRecord.per_km_charge}): ₹${fareCalculation.breakdown.extraKmCharge}`
            : null,
          `Subtotal: ₹${fareCalculation.breakdown.subtotal}`,
          fareCalculation.cityAdjustment > 0
            ? `${tierDesc} Adjustment: +${fareCalculation.cityAdjustment}% (₹${fareCalculation.breakdown.afterCityAdjustment - fareCalculation.breakdown.subtotal})`
            : null,
          fareCalculation.breakdown.nightDutyCharge
            ? `Night Service (6 PM - 7 AM): +${fareCalculation.breakdown.nightDutyPercentage}% (₹${fareCalculation.breakdown.nightDutyCharge})`
            : null,
          fareCalculation.breakdown.emergencyCharge
            ? `Emergency/Urgent Dispatch: +${fareCalculation.breakdown.emergencyPercentage}% (₹${fareCalculation.breakdown.emergencyCharge})`
            : null,
          'Additional: Toll/parking billed separately if applicable'
        ].filter(Boolean).join('\n');
        
        engineerNotes = `Fare Breakdown:\n${breakdown}`;
        
        console.log(`[Booking] Ambulance service: ${body.service_type} | Distance ${distanceKm.toFixed(1)}km → Final ₹${quotedPrice} (${fareCalculation.cityTier}, night=${isNightService}, emergency=${isEmergencyDispatch})`);
      }
    }

    // Insert booking as service order with patient_user_id
    // For ambulance services, also store pickup/dropoff locations
    const result = await c.env.DB.prepare(
      `INSERT INTO service_orders 
        (patient_user_id, patient_name, patient_contact, patient_email, patient_location, 
         service_type, service_category, equipment_name, equipment_model, issue_description, 
         urgency_level, preferred_date, preferred_time, patient_address, patient_city, 
         patient_state, patient_pincode, patient_latitude, patient_longitude, 
         pickup_latitude, pickup_longitude, pickup_address, dropoff_latitude, dropoff_longitude, dropoff_address,
         quoted_price, quoted_currency, engineer_notes, billing_frequency, monthly_visits_count, 
         patient_condition, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      body.patient_name,
      body.patient_contact,
      body.patient_email || null,
      fullLocation || null,
      body.service_type || "Service",
      body.service_category || null,
      body.equipment_name || null,
      body.equipment_model || null,
      body.issue_description,
      body.urgency || "normal",
      body.preferred_date || null,
      body.preferred_time || null,
      body.address || null,
      body.city || null,
      body.state || null,
      body.pincode || null,
      body.latitude || null,
      body.longitude || null,
      body.pickup_latitude || null,
      body.pickup_longitude || null,
      body.pickup_address || null,
      body.dropoff_latitude || null,
      body.dropoff_longitude || null,
      body.dropoff_address || null,
      quotedPrice,
      (isNursingService || isPhysiotherapyService || isAmbulanceService) ? "INR" : null,
      engineerNotes,
      body.billing_frequency || "per_visit",
      body.monthly_visits_count || null,
      body.patient_condition || null,
      bookingStatus
    ).run();

    const orderId = result.meta.last_row_id;
    
    console.log(`[Booking] New service order from user ${user!.id} (Order ID: ${orderId})`);

    // Create notification for ALL partners in the relevant category
    // Get all partners who match the service category
    let professionFilter = "";
    if (isNursingService) {
      professionFilter = "AND (LOWER(profession) LIKE '%nursing%' OR LOWER(profession) LIKE '%nurse%')";
    } else if (isPhysiotherapyService) {
      professionFilter = "AND (LOWER(profession) LIKE '%physio%' OR LOWER(profession) LIKE '%therapy%')";
    } else if (isAmbulanceService) {
      professionFilter = "AND (LOWER(profession) LIKE '%ambulance%' OR LOWER(profession) LIKE '%emergency%' OR LOWER(profession) LIKE '%ems%')";
    } else {
      // Biomedical engineers
      professionFilter = `AND (
        LOWER(profession) LIKE '%biomedical%' 
        OR LOWER(profession) LIKE '%engineer%'
        OR profession IS NULL
      )`;
    }

    const { results: partners } = await c.env.DB.prepare(
      `SELECT user_id, profession FROM user_profiles 
       WHERE account_type != 'patient' ${professionFilter}`
    ).all();
    
    console.log(`[Booking] Found ${partners.length} partner(s) matching ${isAmbulanceService ? 'ambulance' : isNursingService ? 'nursing' : isPhysiotherapyService ? 'physiotherapy' : 'biomedical'} service. Professions: ${partners.map((p: any) => p.profession).join(', ')}`);

    // Create notification for each partner
    const notificationTitle = isAmbulanceService 
      ? "🚑 New Ambulance Request"
      : isNursingService
      ? "👨‍⚕️ New Nursing Service Request"
      : isPhysiotherapyService
      ? "💪 New Physiotherapy Request"
      : "🔧 New Service Request";
    
    const notificationMessage = `${body.service_category || "Service"}: ${body.service_type || "New request"} in ${body.city || "your area"}`;

    for (const partner of partners) {
      await createNotification(
        c.env.DB,
        partner.user_id as string,
        "new_order",
        notificationTitle,
        notificationMessage,
        orderId
      );
    }

    const message = (isNursingService || isPhysiotherapyService)
      ? `Booking request submitted successfully. Service price: ₹${quotedPrice}${body.billing_frequency === 'monthly' ? '/month' : isPhysiotherapyService ? '/session' : '/visit'}. An available partner will accept your request soon.`
      : isAmbulanceService
      ? `Ambulance request submitted. Total fare: ₹${quotedPrice} (one-way). An ambulance partner will accept and arrive at pickup location soon.`
      : "Booking request submitted successfully. A professional will review and send you a quote.";

    return c.json({ 
      success: true, 
      order_id: result.meta.last_row_id,
      quoted_price: quotedPrice,
      status: bookingStatus,
      message
    }, 201);
  } catch (error) {
    console.error("Error processing booking request:", error);
    return c.json({ 
      error: "Failed to submit booking request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Patient notification settings endpoints
app.get("/api/patient/notification-settings", authMiddleware, async (c) => {
  const user = c.get("user");

  const settings = await c.env.DB.prepare(
    "SELECT * FROM patient_notification_settings WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!settings) {
    // Create default settings
    await c.env.DB.prepare(
      "INSERT INTO patient_notification_settings (user_id) VALUES (?)"
    ).bind(user!.id).run();

    const newSettings = await c.env.DB.prepare(
      "SELECT * FROM patient_notification_settings WHERE user_id = ?"
    ).bind(user!.id).first();

    return c.json(newSettings);
  }

  return c.json(settings);
});

app.put("/api/patient/notification-settings", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  // Ensure settings exist
  const existing = await c.env.DB.prepare(
    "SELECT id FROM patient_notification_settings WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!existing) {
    await c.env.DB.prepare(
      "INSERT INTO patient_notification_settings (user_id) VALUES (?)"
    ).bind(user!.id).run();
  }

  // Update specific setting
  const updates: string[] = [];
  const values: any[] = [];

  if ('push_notifications' in body) {
    updates.push("push_notifications = ?");
    values.push(body.push_notifications ? 1 : 0);
  }
  if ('email_alerts' in body) {
    updates.push("email_alerts = ?");
    values.push(body.email_alerts ? 1 : 0);
  }
  if ('sms_alerts' in body) {
    updates.push("sms_alerts = ?");
    values.push(body.sms_alerts ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(user!.id);

    await c.env.DB.prepare(
      `UPDATE patient_notification_settings SET ${updates.join(", ")} WHERE user_id = ?`
    ).bind(...values).run();
  }

  return c.json({ success: true });
});

// Patient transactions endpoint - returns completed service orders as transactions
app.get("/api/patient/transactions", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get completed service orders as transactions for patients
  const { results } = await c.env.DB.prepare(
    `SELECT 
      id,
      service_type,
      service_category,
      equipment_name,
      quoted_price as amount,
      'INR' as currency,
      'service_payment' as transaction_type,
      CASE 
        WHEN service_category IS NOT NULL THEN service_category || ' - ' || service_type
        ELSE 'Service: ' || service_type
      END as description,
      'completed' as status,
      'service' as payment_method,
      completed_at as created_at,
      updated_at
     FROM service_orders 
     WHERE patient_user_id = ? 
     AND status = 'completed'
     AND quoted_price IS NOT NULL
     ORDER BY completed_at DESC 
     LIMIT 50`
  ).bind(user!.id).all();

  return c.json(results);
});

// Real-time partner search status endpoint (for live matching UI)
app.get("/api/patient/bookings/:id/search-status", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  try {
    // Get the booking details
    const booking = await c.env.DB.prepare(
      "SELECT * FROM service_orders WHERE id = ? AND patient_user_id = ?"
    ).bind(orderId, user!.id).first();

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    // Calculate search duration
    const createdAt = new Date(booking.created_at as string);
    const searchDurationSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000);
    const searchDurationMinutes = Math.floor(searchDurationSeconds / 60);

    // If partner has been assigned
    if (booking.assigned_engineer_id) {
      // Get partner details
      const partner = await c.env.DB.prepare(
        `SELECT user_id, full_name, business_name, phone, profile_picture_url, 
                patient_latitude, patient_longitude, city, state 
         FROM user_profiles 
         WHERE user_id = ?`
      ).bind(booking.assigned_engineer_id).first();

      // Get partner ratings
      const ratingStats = await c.env.DB.prepare(
        `SELECT 
          AVG(partner_rating) as avg_rating,
          COUNT(CASE WHEN partner_rating IS NOT NULL THEN 1 END) as total_ratings,
          COUNT(*) as total_completed
        FROM service_orders 
        WHERE assigned_engineer_id = ? AND status = 'completed'`
      ).bind(booking.assigned_engineer_id).first() as any;

      return c.json({
        status: 'found',
        search_status: 'partner_found',
        message: 'Partner found! Preparing for service...',
        search_duration_seconds: searchDurationSeconds,
        search_duration_minutes: searchDurationMinutes,
        booking: {
          id: booking.id,
          service_type: booking.service_type,
          service_category: booking.service_category,
          quoted_price: booking.quoted_price,
          booking_status: booking.status,
        },
        partner: partner ? {
          id: partner.user_id,
          name: partner.business_name || partner.full_name,
          phone: partner.phone,
          profile_picture: partner.profile_picture_url,
          latitude: partner.patient_latitude,
          longitude: partner.patient_longitude,
          city: partner.city,
          state: partner.state,
          average_rating: ratingStats?.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : null,
          total_ratings: ratingStats?.total_ratings || 0,
          completed_orders: ratingStats?.total_completed || 0,
        } : null,
      });
    }

    // Still searching - no partner assigned yet
    // Count how many partners might be available for this service
    const serviceCategory = (booking.service_category as string || "").toLowerCase();
    let professionFilter = "";
    
    if (serviceCategory.includes('nursing')) {
      professionFilter = "AND (LOWER(profession) LIKE '%nursing%' OR LOWER(profession) LIKE '%nurse%')";
    } else if (serviceCategory.includes('physio')) {
      professionFilter = "AND (LOWER(profession) LIKE '%physio%' OR LOWER(profession) LIKE '%therapy%')";
    } else if (serviceCategory.includes('ambulance')) {
      professionFilter = "AND (LOWER(profession) LIKE '%ambulance%' OR LOWER(profession) LIKE '%emergency%')";
    } else {
      professionFilter = "AND (LOWER(profession) LIKE '%biomedical%' OR LOWER(profession) LIKE '%engineer%')";
    }

    const nearbyPartners = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM user_profiles 
       WHERE account_type != 'patient' 
       AND is_blocked = 0 
       ${professionFilter}`
    ).first();

    const availablePartners = Number(nearbyPartners?.count || 0);

    // Generate dynamic search messages based on duration
    let searchMessage = 'Searching for available partner nearby...';
    if (searchDurationSeconds > 120) {
      searchMessage = 'Still searching for the best partner for you...';
    } else if (searchDurationSeconds > 60) {
      searchMessage = 'Looking for qualified partners in your area...';
    } else if (searchDurationSeconds > 30) {
      searchMessage = 'Checking partner availability...';
    }

    return c.json({
      status: 'searching',
      search_status: 'searching_for_partner',
      message: searchMessage,
      search_duration_seconds: searchDurationSeconds,
      search_duration_minutes: searchDurationMinutes,
      available_partners_count: availablePartners,
      booking: {
        id: booking.id,
        service_type: booking.service_type,
        service_category: booking.service_category,
        quoted_price: booking.quoted_price,
        urgency_level: booking.urgency_level,
        booking_status: booking.status,
      },
      estimated_wait_time: 'Partners typically respond within 5-10 minutes',
    });
  } catch (error) {
    console.error("Error checking search status:", error);
    return c.json({ error: "Failed to check search status" }, 500);
  }
});

// Patient bookings endpoints
app.get("/api/patient/bookings", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM service_orders 
     WHERE patient_user_id = ?
     ORDER BY created_at DESC`
  ).bind(user!.id).all();

  // Add partner contact details and rating stats for accepted bookings
  const bookingsWithPartner = await Promise.all(
    results.map(async (booking: any) => {
      if (booking.status === 'accepted' && booking.assigned_engineer_id) {
        const partner = await c.env.DB.prepare(
          "SELECT user_id, full_name, business_name, phone, patient_email, patient_latitude, patient_longitude, location, city, state FROM user_profiles WHERE user_id = ?"
        ).bind(booking.assigned_engineer_id).first();

        // Get partner's rating stats and completed orders count
        const ratingStats = await c.env.DB.prepare(
          `SELECT 
            AVG(partner_rating) as avg_rating,
            COUNT(CASE WHEN partner_rating IS NOT NULL THEN 1 END) as total_ratings,
            COUNT(*) as total_completed
          FROM service_orders 
          WHERE assigned_engineer_id = ? AND status = 'completed'`
        ).bind(booking.assigned_engineer_id).first() as any;

        if (partner) {
          return {
            ...booking,
            partner_name: partner.business_name || partner.full_name,
            partner_phone: partner.phone,
            partner_email: partner.patient_email,
            partner_latitude: partner.patient_latitude,
            partner_longitude: partner.patient_longitude,
            partner_location: partner.location,
            partner_city: partner.city,
            partner_state: partner.state,
            partner_avg_rating: ratingStats?.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : null,
            partner_total_ratings: ratingStats?.total_ratings || 0,
            partner_completed_orders: ratingStats?.total_completed || 0,
          };
        }
      }
      return booking;
    })
  );

  return c.json(bookingsWithPartner);
});

app.post("/api/patient/bookings/:id/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  // Verify the booking belongs to this user
  const booking = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND patient_user_id = ?"
  ).bind(orderId, user!.id).first();

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  if (booking.status !== "quote_sent") {
    return c.json({ error: "No quote available to accept" }, 400);
  }

  // Get patient profile to share contact details with partner
  const patientProfile = await c.env.DB.prepare(
    "SELECT patient_full_name, patient_contact, patient_email, patient_address, patient_city, state, patient_pincode, patient_latitude, patient_longitude FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  // Build full patient location
  const locationParts = [
    patientProfile?.patient_address,
    patientProfile?.patient_city,
    patientProfile?.state,
    patientProfile?.patient_pincode
  ].filter(Boolean);
  const fullLocation = locationParts.join(", ");

  // Update booking with patient details and mark as accepted
  await c.env.DB.prepare(
    `UPDATE service_orders SET 
      status = 'accepted',
      patient_name = ?,
      patient_contact = ?,
      patient_email = ?,
      patient_location = ?,
      patient_address = ?,
      patient_city = ?,
      patient_state = ?,
      patient_pincode = ?,
      patient_latitude = ?,
      patient_longitude = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
  ).bind(
    patientProfile?.patient_full_name || booking.patient_name,
    patientProfile?.patient_contact || booking.patient_contact,
    patientProfile?.patient_email || booking.patient_email,
    fullLocation || booking.patient_location,
    patientProfile?.patient_address,
    patientProfile?.patient_city,
    patientProfile?.state,
    patientProfile?.patient_pincode,
    patientProfile?.patient_latitude,
    patientProfile?.patient_longitude,
    orderId
  ).run();

  // Notify partner that patient accepted the quote
  if (booking.assigned_engineer_id) {
    await createNotification(
      c.env.DB,
      booking.assigned_engineer_id as string,
      "quote_accepted",
      "🎉 Quote Accepted",
      `Patient accepted your quote of ₹${booking.quoted_price} for Order #${orderId}`,
      parseInt(orderId)
    );
  }

  return c.json({ success: true });
});

app.post("/api/patient/bookings/:id/decline", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  // Verify the booking belongs to this user
  const booking = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND patient_user_id = ?"
  ).bind(orderId, user!.id).first();

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE service_orders SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(orderId).run();

  // Notify partner that patient declined their quote
  if (booking.assigned_engineer_id) {
    await createNotification(
      c.env.DB,
      booking.assigned_engineer_id as string,
      "quote_declined",
      "❌ Quote Declined",
      `Patient declined your quote for Order #${orderId}`,
      parseInt(orderId)
    );
  }

  return c.json({ success: true });
});

app.post("/api/patient/bookings/:id/rate", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");
  const body = await c.req.json();

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }

  // Verify the booking belongs to this user and is completed
  const booking = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND patient_user_id = ? AND status = 'completed'"
  ).bind(orderId, user!.id).first();

  if (!booking) {
    return c.json({ error: "Booking not found or not completed" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE service_orders SET partner_rating = ?, partner_review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.rating, body.review || null, orderId).run();

  // Notify partner that they received a rating
  if (booking.assigned_engineer_id) {
    const stars = "⭐".repeat(body.rating);
    await createNotification(
      c.env.DB,
      booking.assigned_engineer_id as string,
      "rating_received",
      "⭐ New Rating Received",
      `You received ${stars} (${body.rating}/5) for Order #${orderId}`,
      parseInt(orderId)
    );
  }

  return c.json({ success: true });
});

// Partner rates user after completing an order
app.post("/api/service-orders/:id/rate-user", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");
  const body = await c.req.json();

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }

  // Verify the order belongs to this partner and is completed
  const order = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND assigned_engineer_id = ? AND status = 'completed'"
  ).bind(orderId, user!.id).first();

  if (!order) {
    return c.json({ error: "Order not found or not completed" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE service_orders SET user_rating = ?, user_review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.rating, body.review || null, orderId).run();

  return c.json({ success: true });
});

app.post("/api/patient/bookings/:id/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  // Verify the booking belongs to this user
  const booking = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND patient_user_id = ?"
  ).bind(orderId, user!.id).first();

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  // Check if booking can be cancelled - allow all active statuses
  const cancellableStatuses = ["pending", "quote_sent", "accepted", "confirmed", "in_progress"];
  if (!cancellableStatuses.includes(booking.status as string)) {
    return c.json({ error: "This booking cannot be cancelled" }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE service_orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(orderId).run();

  // Notify partner if order was already accepted by them
  if (booking.assigned_engineer_id) {
    await createNotification(
      c.env.DB,
      booking.assigned_engineer_id as string,
      "order_cancelled",
      "❌ Order Cancelled",
      `Patient cancelled Order #${orderId} for ${booking.service_type || "service"}`,
      parseInt(orderId)
    );
  }

  return c.json({ success: true });
});

// Admin endpoint to sync/import bookings from patient app
app.post("/api/admin/bookings/sync", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const bookings = body.bookings || [];

    let imported = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        await c.env.DB.prepare(
          `INSERT INTO service_orders 
            (patient_name, patient_contact, patient_email, patient_location, 
             service_type, equipment_name, equipment_model, issue_description, 
             urgency_level, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
        ).bind(
          booking.patient_name,
          booking.patient_contact,
          booking.patient_email || null,
          booking.patient_location || null,
          booking.service_type || "Repair",
          booking.equipment_name || null,
          booking.equipment_model || null,
          booking.issue_description,
          booking.urgency_level || "normal",
          booking.created_at || new Date().toISOString()
        ).run();
        
        imported++;
      } catch (error) {
        console.error("Failed to import booking:", error);
        failed++;
      }
    }

    return c.json({ 
      success: true, 
      imported, 
      failed,
      message: `Successfully imported ${imported} booking(s). ${failed} failed.`
    });
  } catch (error) {
    console.error("Error syncing bookings:", error);
    return c.json({ error: "Failed to sync bookings" }, 500);
  }
});

// Partner ratings endpoint
app.get("/api/partner/ratings", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    // Get individual ratings with details (patient name removed for privacy)
    const { results: ratings } = await c.env.DB.prepare(
      `SELECT id, partner_rating, partner_review, service_type, 
              equipment_name, completed_at as created_at
       FROM service_orders 
       WHERE assigned_engineer_id = ? 
       AND status = 'completed' 
       AND partner_rating IS NOT NULL
       ORDER BY completed_at DESC`
    ).bind(user!.id).all();

    // Calculate average rating
    const totalRatings = ratings.length;
    let averageRating = 0;

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc: number, order: any) => acc + (order.partner_rating || 0), 0);
      averageRating = Math.round((sum / totalRatings) * 10) / 10; // Round to 1 decimal
    }

    // Get total completed orders count
    const completedOrders = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM service_orders WHERE assigned_engineer_id = ? AND status = 'completed'`
    ).bind(user!.id).first();

    return c.json({
      ratings: ratings,
      average_rating: averageRating,
      total_ratings: totalRatings,
      total_completed_orders: (completedOrders as any)?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching partner ratings:", error);
    return c.json({ error: "Failed to fetch ratings" }, 500);
  }
});

// Get partner profile with ratings (for patients viewing quotes)
// Get partner transaction history (completed orders with earnings)
app.get("/api/partner/transactions", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const userId = user!.id;
    
    // Get all completed orders for this partner
    const { results: transactions } = await c.env.DB.prepare(`
      SELECT 
        id,
        patient_name,
        service_type,
        service_category,
        equipment_name,
        quoted_price,
        quoted_currency,
        completed_at,
        created_at,
        partner_rating
      FROM service_orders 
      WHERE assigned_engineer_id = ? AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 100
    `).bind(userId).all();
    
    // Calculate total earnings
    const totalEarnings = transactions.reduce((sum: number, t: any) => sum + (t.quoted_price || 0), 0);
    
    return c.json({
      transactions,
      total_earnings: totalEarnings,
      total_transactions: transactions.length
    });
  } catch (error) {
    console.error("Error fetching partner transactions:", error);
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }
});

app.get("/api/partner/:userId/profile-with-ratings", async (c) => {
  const userId = c.req.param("userId");

  try {
    // Get partner profile
    const profile = await c.env.DB.prepare(
      "SELECT user_id, full_name, business_name, profile_picture_url, specialisation, bio, account_type FROM user_profiles WHERE user_id = ?"
    ).bind(userId).first();

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Get ratings
    const { results: ratings } = await c.env.DB.prepare(
      `SELECT partner_rating, partner_review, service_type, created_at
       FROM service_orders 
       WHERE assigned_engineer_id = ? 
       AND status = 'completed' 
       AND partner_rating IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 10`
    ).bind(userId).all();

    // Calculate average rating
    let averageRating = 0;
    const totalRatings = ratings.length;

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc: number, order: any) => acc + (order.partner_rating || 0), 0);
      averageRating = sum / totalRatings;
    }

    return c.json({
      ...profile,
      average_rating: averageRating,
      total_ratings: totalRatings,
      recent_ratings: ratings.slice(0, 5), // Only show 5 most recent
    });
  } catch (error) {
    console.error("Error fetching partner profile with ratings:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Partner pending orders endpoint (for real-time notifications)
app.get("/api/partner/pending-orders", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get partner's location and profession to filter orders and calculate distances
  const profile = await c.env.DB.prepare(
    "SELECT profession, patient_latitude, patient_longitude, city FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const profession = (profile?.profession as string || "").toLowerCase();
  const partnerLat = profile?.patient_latitude as number | null;
  const partnerLon = profile?.patient_longitude as number | null;

  // Build filter based on profession
  let categoryFilter = "";
  
  if (profession.includes("nursing") || profession.includes("nurse")) {
    categoryFilter = "AND (LOWER(service_category) LIKE '%nursing%')";
  } else if (profession.includes("physio") || profession.includes("therapy")) {
    categoryFilter = "AND (LOWER(service_category) LIKE '%physio%')";
  } else if (profession.includes("ambulance") || profession.includes("emergency") || profession.includes("ems")) {
    categoryFilter = "AND (LOWER(service_category) LIKE '%ambulance%')";
  } else {
    // Biomedical engineers see biomedical and equipment orders (not nursing/physio/ambulance)
    categoryFilter = `AND (
      LOWER(service_category) LIKE '%biomedical%' 
      OR LOWER(service_category) LIKE '%equipment%' 
      OR LOWER(service_category) LIKE '%repair%'
      OR LOWER(service_category) LIKE '%maintenance%'
      OR LOWER(service_category) LIKE '%rental%'
      OR service_category IS NULL
      OR (
        LOWER(service_category) NOT LIKE '%nursing%' 
        AND LOWER(service_category) NOT LIKE '%physio%'
        AND LOWER(service_category) NOT LIKE '%ambulance%'
      )
    )`;
  }

  // Only return pending orders that haven't been assigned yet
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM service_orders 
     WHERE assigned_engineer_id IS NULL
     AND status = 'pending'
     ${categoryFilter}
     ORDER BY 
       CASE urgency_level 
         WHEN 'emergency' THEN 1 
         WHEN 'urgent' THEN 2 
         ELSE 3 
       END,
       created_at DESC
     LIMIT 10`
  ).bind().all();

  console.log(`[Partner Pending Orders] Partner ${user!.id} (profession: ${profession}) found ${results.length} pending order(s)`);

  // Add distance calculation for each order if partner has location set
  const ordersWithDistance = results.map((order: any) => {
    let distanceKm: number | null = null;
    
    if (partnerLat && partnerLon && order.patient_latitude && order.patient_longitude) {
      distanceKm = calculateDistance(
        partnerLat,
        partnerLon,
        order.patient_latitude as number,
        order.patient_longitude as number
      );
    }
    
    return {
      ...order,
      distance_km: distanceKm,
    };
  });

  return c.json(ordersWithDistance);
});

// Service orders (Earn) endpoints
app.get("/api/service-orders", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get partner's location and profession to filter orders and calculate distances
  const profile = await c.env.DB.prepare(
    "SELECT profession, patient_latitude, patient_longitude, city FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  const profession = (profile?.profession as string || "").toLowerCase();
  const partnerLat = profile?.patient_latitude as number | null;
  const partnerLon = profile?.patient_longitude as number | null;

  // Build filter based on profession
  let categoryFilter = "";
  
  if (profession.includes("nursing") || profession.includes("nurse")) {
    // Nursing professionals only see nursing orders
    categoryFilter = "AND (LOWER(service_category) LIKE '%nursing%')";
  } else if (profession.includes("physio") || profession.includes("therapy")) {
    // Physiotherapy professionals only see physiotherapy orders
    categoryFilter = "AND (LOWER(service_category) LIKE '%physio%')";
  } else if (profession.includes("ambulance") || profession.includes("emergency") || profession.includes("ems")) {
    // Ambulance providers only see ambulance orders
    categoryFilter = "AND (LOWER(service_category) LIKE '%ambulance%')";
  } else {
    // Biomedical engineers see biomedical and equipment orders (not nursing/physio/ambulance)
    categoryFilter = `AND (
      LOWER(service_category) LIKE '%biomedical%' 
      OR LOWER(service_category) LIKE '%equipment%' 
      OR LOWER(service_category) LIKE '%repair%'
      OR LOWER(service_category) LIKE '%maintenance%'
      OR LOWER(service_category) LIKE '%rental%'
      OR service_category IS NULL
      OR (
        LOWER(service_category) NOT LIKE '%nursing%' 
        AND LOWER(service_category) NOT LIKE '%physio%'
        AND LOWER(service_category) NOT LIKE '%ambulance%'
      )
    )`;
  }
  
  console.log(`[Service Orders] Partner profession: ${profession}, Category filter: ${categoryFilter.substring(0, 100)}...`);

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM service_orders 
     WHERE (assigned_engineer_id = ? OR assigned_engineer_id IS NULL)
     ${categoryFilter}
     ORDER BY 
       CASE status 
         WHEN 'pending' THEN 1 
         WHEN 'confirmed' THEN 1 
         WHEN 'accepted' THEN 2 
         WHEN 'completed' THEN 3 
         ELSE 4 
       END,
       CASE urgency_level 
         WHEN 'urgent' THEN 1 
         WHEN 'high' THEN 2 
         ELSE 3 
       END,
       created_at DESC`
  ).bind(user!.id).all();

  console.log(`[Service Orders] Query returned ${results.length} order(s) for partner with profession: ${profession}`);
  
  // Add distance calculation for each order if partner has location set
  const ordersWithDistance = results.map((order: any) => {
    let distanceKm: number | null = null;
    
    if (partnerLat && partnerLon && order.patient_latitude && order.patient_longitude) {
      distanceKm = calculateDistance(
        partnerLat,
        partnerLon,
        order.patient_latitude as number,
        order.patient_longitude as number
      );
    }
    
    return {
      ...order,
      distance_km: distanceKm,
    };
  });
  
  // Debug: Show first few orders with their service categories and distances
  if (ordersWithDistance.length > 0) {
    console.log(`[Service Orders] Sample orders (first 3) with distances:`);
    ordersWithDistance.slice(0, 3).forEach((order: any) => {
      console.log(`  - Order #${order.id}: category="${order.service_category}", type="${order.service_type}", distance=${order.distance_km ? order.distance_km + 'km' : 'unknown'}`);
    });
  } else {
    // If no results, check what orders exist in the database
    const { results: allOrders } = await c.env.DB.prepare(
      `SELECT id, service_category, service_type, status, assigned_engineer_id 
       FROM service_orders 
       WHERE assigned_engineer_id IS NULL OR assigned_engineer_id = ?
       ORDER BY created_at DESC LIMIT 10`
    ).bind(user!.id).all();
    
    console.log(`[Service Orders] DEBUG - Total unassigned/my orders in DB: ${allOrders.length}`);
    allOrders.forEach((order: any) => {
      console.log(`  - Order #${order.id}: category="${order.service_category}", assigned=${order.assigned_engineer_id}, status="${order.status}"`);
    });
  }

  return c.json(ordersWithDistance);
});

// Partner accepts/rejects pending orders
app.post("/api/partner/orders/:id/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  try {
    // Get order details
    const order = await c.env.DB.prepare(
      "SELECT * FROM service_orders WHERE id = ?"
    ).bind(orderId).first();

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Check if order already has an assigned partner
    if (order.assigned_engineer_id) {
      return c.json({ error: "This order has already been accepted by another partner" }, 409);
    }

    // Assign the order to this partner
    await c.env.DB.prepare(
      `UPDATE service_orders SET 
        status = 'accepted',
        assigned_engineer_id = ?,
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND assigned_engineer_id IS NULL`
    ).bind(user!.id, orderId).run();

    // Verify the update was successful (in case of race condition)
    const updatedOrder = await c.env.DB.prepare(
      "SELECT assigned_engineer_id FROM service_orders WHERE id = ?"
    ).bind(orderId).first();

    if (updatedOrder?.assigned_engineer_id !== user!.id) {
      return c.json({ error: "This order was just accepted by another partner" }, 409);
    }

    // Award XP for accepting order
    await addXP(c.env.DB, user!.id, 25, "order_accepted", { order_id: orderId });

    // Notify patient that their order has been accepted
    if (order.patient_user_id) {
      await createNotification(
        c.env.DB,
        order.patient_user_id as string,
        "order_accepted",
        "✅ Order Accepted",
        `Your ${order.service_type || "service"} request has been accepted by a partner`,
        parseInt(orderId)
      );
    }

    return c.json({ 
      success: true,
      message: "Order accepted successfully"
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    return c.json({ error: "Failed to accept order" }, 500);
  }
});

app.post("/api/partner/orders/:id/reject", authMiddleware, async (c) => {
  try {
    // Simply acknowledge that this partner won't take the order
    // Don't change the order status - let it remain available for other partners
    return c.json({ 
      success: true,
      message: "Order rejected. It will remain available for other partners."
    });
  } catch (error) {
    console.error("Error rejecting order:", error);
    return c.json({ error: "Failed to reject order" }, 500);
  }
});

// Legacy endpoint - keeping for backward compatibility
app.post("/api/service-orders/:id/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");
  const body = await c.req.json();

  try {
    // Get order details
    const order = await c.env.DB.prepare(
      "SELECT * FROM service_orders WHERE id = ?"
    ).bind(orderId).first();

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Check if order already has an assigned engineer
    if (order.assigned_engineer_id) {
      return c.json({ error: "This order has already been accepted by another partner" }, 400);
    }

    const serviceCategory = (order.service_category as string || "").toLowerCase();
    const isNonBiomedicalService = serviceCategory.includes('nursing') || 
      serviceCategory.includes('physio') || 
      serviceCategory.includes('ambulance');

    // For nursing, physio, ambulance services - price is pre-calculated, partner just accepts
    if (isNonBiomedicalService) {
      if (!order.quoted_price) {
        return c.json({ error: "Price not available for this order" }, 400);
      }

      // Directly accept the order - both parties are confirmed for non-biomedical services
      await c.env.DB.prepare(
        `UPDATE service_orders SET 
          status = 'accepted',
          assigned_engineer_id = ?,
          service_type = ?,
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND assigned_engineer_id IS NULL`
      ).bind(
        user!.id,
        body.service_type || order.service_type || "Nursing",
        orderId
      ).run();

      // Check if update was successful (row was modified)
      const updatedOrder = await c.env.DB.prepare(
        "SELECT assigned_engineer_id FROM service_orders WHERE id = ?"
      ).bind(orderId).first();

      if (updatedOrder?.assigned_engineer_id !== user!.id) {
        return c.json({ error: "This order was just accepted by another partner" }, 409);
      }

      // Award XP for accepting order
      await addXP(c.env.DB, user!.id, 25, "service_order_accepted", { order_id: orderId });

      // Notify patient that their order has been accepted
      if (order.patient_user_id) {
        await createNotification(
          c.env.DB,
          order.patient_user_id as string,
          "order_accepted",
          "✅ Order Accepted",
          `Your ${order.service_type || "service"} request has been accepted by a partner`,
          parseInt(orderId)
        );
      }

      return c.json({ 
        success: true,
        quoted_price: order.quoted_price,
        message: "Order accepted! Patient contact details are now available. Both parties can contact each other."
      });
    } else {
      // For non-nursing services, partner sends a custom quote
      if (!body.service_type || !body.quoted_price) {
        return c.json({ error: "Service type and quoted price are required" }, 400);
      }

      await c.env.DB.prepare(
        `UPDATE service_orders SET 
          status = 'quote_sent',
          assigned_engineer_id = ?,
          service_type = ?,
          quoted_price = ?,
          quoted_currency = 'INR',
          engineer_notes = ?,
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).bind(
        user!.id,
        body.service_type,
        body.quoted_price,
        body.engineer_notes || null,
        orderId
      ).run();

      // Award XP for sending quote
      await addXP(c.env.DB, user!.id, 25, "service_quote_sent", { order_id: orderId });

      // Notify patient that quote has been received
      if (order.patient_user_id) {
        await createNotification(
          c.env.DB,
          order.patient_user_id as string,
          "quote_received",
          "💰 Quote Received",
          `You received a quote of ₹${body.quoted_price} for ${body.service_type}`,
          parseInt(orderId)
        );
      }

      return c.json({ 
        success: true,
        quoted_price: body.quoted_price,
      });
    }
  } catch (error) {
    console.error("Error accepting service order:", error);
    return c.json({ error: "Failed to accept order" }, 500);
  }
});

app.post("/api/service-orders/:id/decline", authMiddleware, async (c) => {
  const orderId = c.req.param("id");

  await c.env.DB.prepare(
    "UPDATE service_orders SET status = 'declined', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(orderId).run();

  return c.json({ success: true });
});

// Partner cancels/releases an accepted order back to the pool
app.post("/api/service-orders/:id/release", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  try {
    // Get order details
    const order = await c.env.DB.prepare(
      "SELECT * FROM service_orders WHERE id = ?"
    ).bind(orderId).first();

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Check if this partner is assigned to the order
    if (order.assigned_engineer_id !== user!.id) {
      return c.json({ error: "You are not assigned to this order" }, 403);
    }

    // Can only release orders that are 'quote_sent' or 'accepted' (not completed)
    if (order.status !== 'quote_sent' && order.status !== 'accepted') {
      return c.json({ error: "This order cannot be released" }, 400);
    }

    const serviceCategory = (order.service_category as string || "").toLowerCase();
    const isNonBiomedicalService = serviceCategory.includes('nursing') || 
      serviceCategory.includes('physio') || 
      serviceCategory.includes('ambulance');

    // Reset order back to pending state
    // For non-biomedical services, keep the pre-calculated price
    // For biomedical services, clear the quoted price and notes
    if (isNonBiomedicalService) {
      await c.env.DB.prepare(
        `UPDATE service_orders SET 
          status = 'pending',
          assigned_engineer_id = NULL,
          responded_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).bind(orderId).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE service_orders SET 
          status = 'pending',
          assigned_engineer_id = NULL,
          quoted_price = NULL,
          engineer_notes = NULL,
          responded_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).bind(orderId).run();
    }

    return c.json({ 
      success: true,
      message: "Order released. It is now available for other partners."
    });
  } catch (error) {
    console.error("Error releasing service order:", error);
    return c.json({ error: "Failed to release order" }, 500);
  }
});

app.post("/api/service-orders/:id/complete", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");

  // Get order details before updating
  const order = await c.env.DB.prepare(
    "SELECT * FROM service_orders WHERE id = ? AND assigned_engineer_id = ?"
  ).bind(orderId, user!.id).first();

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE service_orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND assigned_engineer_id = ?"
  ).bind(orderId, user!.id).run();

  // Award XP for completing order
  await addXP(c.env.DB, user!.id, 50, "service_order_completed", { order_id: orderId });

  // Notify patient that service is completed and they can rate
  if (order.patient_user_id) {
    await createNotification(
      c.env.DB,
      order.patient_user_id as string,
      "order_completed",
      "⭐ Service Completed - Rate Now",
      `Your ${order.service_type || "service"} has been completed. Please rate your experience!`,
      parseInt(orderId)
    );
  }

  return c.json({ success: true });
});

// Direct messaging endpoints
app.get("/api/users/:userId/profile", authMiddleware, async (c) => {
  const userId = c.req.param("userId");

  const profile = await c.env.DB.prepare(
    "SELECT user_id, full_name, last_name, profile_picture_url, specialisation FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first();

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json(profile);
});

app.get("/api/direct-messages/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const otherUserId = c.req.param("userId");

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM direct_messages 
     WHERE (sender_user_id = ? AND receiver_user_id = ?) 
        OR (sender_user_id = ? AND receiver_user_id = ?)
     ORDER BY created_at ASC`
  ).bind(user!.id, otherUserId, otherUserId, user!.id).all();

  // Mark messages as read
  await c.env.DB.prepare(
    "UPDATE direct_messages SET is_read = 1 WHERE receiver_user_id = ? AND sender_user_id = ?"
  ).bind(user!.id, otherUserId).run();

  return c.json(results);
});

app.post("/api/direct-messages/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const receiverUserId = c.req.param("userId");
  const body = await c.req.json();

  if (!body.message || !body.message.trim()) {
    return c.json({ error: "Message is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO direct_messages (sender_user_id, receiver_user_id, message) VALUES (?, ?, ?)"
  ).bind(user!.id, receiverUserId, body.message).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// C-Connect endpoints
app.get("/api/connect/users", authMiddleware, async (c) => {
  const user = c.get("user");
  const search = c.req.query("search") || "";
  const professionFilter = c.req.query("profession") || "";

  // Check blocked users
  const { results: blockedIds } = await c.env.DB.prepare(
    "SELECT blocked_user_id FROM blocked_users WHERE blocker_user_id = ?"
  ).bind(user!.id).all();

  const blocked = blockedIds.map((b: any) => b.blocked_user_id);

  let query = `SELECT up.*, 
    (SELECT COUNT(*) FROM user_followers WHERE following_user_id = up.user_id) as followers_count,
    (SELECT COUNT(*) FROM user_followers WHERE follower_user_id = up.user_id) as following_count
    FROM user_profiles up 
    WHERE up.user_id != ? AND up.is_blocked = 0`;
  
  const params: any[] = [user!.id];

  if (blocked.length > 0) {
    query += ` AND up.user_id NOT IN (${blocked.map(() => '?').join(',')})`;
    params.push(...blocked);
  }

  if (professionFilter) {
    query += " AND up.profession = ?";
    params.push(professionFilter);
  }

  if (search) {
    query += " AND (up.full_name LIKE ? OR up.specialisation LIKE ? OR up.location LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const usersWithStatus = await Promise.all(
    results.map(async (profile: any) => {
      const isFollowing = await c.env.DB.prepare(
        "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
      ).bind(user!.id, profile.user_id).first();

      const followsMe = await c.env.DB.prepare(
        "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
      ).bind(profile.user_id, user!.id).first();

      const requestSent = await c.env.DB.prepare(
        "SELECT id FROM connection_requests WHERE sender_user_id = ? AND receiver_user_id = ? AND status = 'pending'"
      ).bind(user!.id, profile.user_id).first();

      const requestReceived = await c.env.DB.prepare(
        "SELECT id FROM connection_requests WHERE sender_user_id = ? AND receiver_user_id = ? AND status = 'pending'"
      ).bind(profile.user_id, user!.id).first();

      return {
        ...profile,
        is_following: !!isFollowing,
        follows_me: !!followsMe,
        request_sent: !!requestSent,
        request_received: !!requestReceived,
      };
    })
  );

  return c.json(usersWithStatus);
});

app.get("/api/connect/followers", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT up.*, 
      (SELECT COUNT(*) FROM user_followers WHERE following_user_id = up.user_id) as followers_count,
      (SELECT COUNT(*) FROM user_followers WHERE follower_user_id = up.user_id) as following_count
    FROM user_followers uf
    JOIN user_profiles up ON uf.follower_user_id = up.user_id
    WHERE uf.following_user_id = ?
    ORDER BY uf.created_at DESC`
  ).bind(user!.id).all();

  const followersWithStatus = await Promise.all(
    results.map(async (profile: any) => {
      const isFollowing = await c.env.DB.prepare(
        "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
      ).bind(user!.id, profile.user_id).first();

      return {
        ...profile,
        is_following: !!isFollowing,
        follows_me: true,
      };
    })
  );

  return c.json(followersWithStatus);
});

app.get("/api/connect/following", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT up.*,
      (SELECT COUNT(*) FROM user_followers WHERE following_user_id = up.user_id) as followers_count,
      (SELECT COUNT(*) FROM user_followers WHERE follower_user_id = up.user_id) as following_count
    FROM user_followers uf
    JOIN user_profiles up ON uf.following_user_id = up.user_id
    WHERE uf.follower_user_id = ?
    ORDER BY uf.created_at DESC`
  ).bind(user!.id).all();

  const followingWithStatus = await Promise.all(
    results.map(async (profile: any) => {
      const followsMe = await c.env.DB.prepare(
        "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
      ).bind(profile.user_id, user!.id).first();

      return {
        ...profile,
        is_following: true,
        follows_me: !!followsMe,
      };
    })
  );

  return c.json(followingWithStatus);
});

app.get("/api/connect/requests", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT cr.*, up.*,
      (SELECT COUNT(*) FROM user_followers WHERE following_user_id = up.user_id) as followers_count,
      (SELECT COUNT(*) FROM user_followers WHERE follower_user_id = up.user_id) as following_count
    FROM connection_requests cr
    JOIN user_profiles up ON cr.sender_user_id = up.user_id
    WHERE cr.receiver_user_id = ? AND cr.status = 'pending'
    ORDER BY cr.created_at DESC`
  ).bind(user!.id).all();

  return c.json(results);
});

app.get("/api/connect/blocked", authMiddleware, async (c) => {
  const user = c.get("user");

  const { results } = await c.env.DB.prepare(
    `SELECT bu.*, up.*
    FROM blocked_users bu
    JOIN user_profiles up ON bu.blocked_user_id = up.user_id
    WHERE bu.blocker_user_id = ?
    ORDER BY bu.created_at DESC`
  ).bind(user!.id).all();

  return c.json(results);
});

app.post("/api/connect/follow/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");

  if (userId === user!.id) {
    return c.json({ error: "Cannot follow yourself" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
  ).bind(user!.id, userId).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
    ).bind(user!.id, userId).run();
    return c.json({ following: false });
  } else {
    await c.env.DB.prepare(
      "INSERT INTO user_followers (follower_user_id, following_user_id) VALUES (?, ?)"
    ).bind(user!.id, userId).run();
    return c.json({ following: true });
  }
});

app.post("/api/connect/request/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");

  if (userId === user!.id) {
    return c.json({ error: "Cannot send request to yourself" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM connection_requests WHERE sender_user_id = ? AND receiver_user_id = ?"
  ).bind(user!.id, userId).first();

  if (existing) {
    if (existing.status === 'pending') {
      await c.env.DB.prepare(
        "DELETE FROM connection_requests WHERE sender_user_id = ? AND receiver_user_id = ?"
      ).bind(user!.id, userId).run();
      return c.json({ request_sent: false });
    }
  } else {
    await c.env.DB.prepare(
      "INSERT INTO connection_requests (sender_user_id, receiver_user_id) VALUES (?, ?)"
    ).bind(user!.id, userId).run();
    return c.json({ request_sent: true });
  }

  return c.json({ success: true });
});

app.post("/api/connect/request/:requestId/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const requestId = c.req.param("requestId");

  const request = await c.env.DB.prepare(
    "SELECT * FROM connection_requests WHERE id = ? AND receiver_user_id = ?"
  ).bind(requestId, user!.id).first();

  if (!request) {
    return c.json({ error: "Request not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE connection_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(requestId).run();

  const existingFollow = await c.env.DB.prepare(
    "SELECT id FROM user_followers WHERE follower_user_id = ? AND following_user_id = ?"
  ).bind(request.sender_user_id, user!.id).first();

  if (!existingFollow) {
    await c.env.DB.prepare(
      "INSERT INTO user_followers (follower_user_id, following_user_id) VALUES (?, ?)"
    ).bind(request.sender_user_id, user!.id).run();
  }

  return c.json({ success: true });
});

app.post("/api/connect/request/:requestId/reject", authMiddleware, async (c) => {
  const user = c.get("user");
  const requestId = c.req.param("requestId");

  const request = await c.env.DB.prepare(
    "SELECT * FROM connection_requests WHERE id = ? AND receiver_user_id = ?"
  ).bind(requestId, user!.id).first();

  if (!request) {
    return c.json({ error: "Request not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE connection_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(requestId).run();

  return c.json({ success: true });
});

app.post("/api/connect/block/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");

  if (userId === user!.id) {
    return c.json({ error: "Cannot block yourself" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM blocked_users WHERE blocker_user_id = ? AND blocked_user_id = ?"
  ).bind(user!.id, userId).first();

  if (existing) {
    return c.json({ error: "User already blocked" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT INTO blocked_users (blocker_user_id, blocked_user_id) VALUES (?, ?)"
  ).bind(user!.id, userId).run();

  await c.env.DB.prepare(
    "DELETE FROM user_followers WHERE (follower_user_id = ? AND following_user_id = ?) OR (follower_user_id = ? AND following_user_id = ?)"
  ).bind(user!.id, userId, userId, user!.id).run();

  await c.env.DB.prepare(
    "DELETE FROM connection_requests WHERE (sender_user_id = ? AND receiver_user_id = ?) OR (sender_user_id = ? AND receiver_user_id = ?)"
  ).bind(user!.id, userId, userId, user!.id).run();

  return c.json({ blocked: true });
});

app.post("/api/connect/unblock/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const userId = c.req.param("userId");

  await c.env.DB.prepare(
    "DELETE FROM blocked_users WHERE blocker_user_id = ? AND blocked_user_id = ?"
  ).bind(user!.id, userId).run();

  return c.json({ blocked: false });
});

app.get("/api/connect/stats", authMiddleware, async (c) => {
  const user = c.get("user");

  const followersCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_followers WHERE following_user_id = ?"
  ).bind(user!.id).first();

  const followingCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM user_followers WHERE follower_user_id = ?"
  ).bind(user!.id).first();

  const requestsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM connection_requests WHERE receiver_user_id = ? AND status = 'pending'"
  ).bind(user!.id).first();

  return c.json({
    followers: followersCount?.count || 0,
    following: followingCount?.count || 0,
    pending_requests: requestsCount?.count || 0,
  });
});

// Admin Learning courses management
app.get("/api/admin/courses", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT lc.*, up.full_name as submitter_name 
     FROM learning_courses lc 
     LEFT JOIN user_profiles up ON lc.submitted_by_user_id = up.user_id 
     ORDER BY lc.created_at DESC`
  ).all();

  return c.json(results);
});

app.post("/api/admin/courses", authMiddleware, adminCheckMiddleware, async (c) => {
  const body = await c.req.json();

  if (!body.title || !body.category) {
    return c.json({ error: "Title and category are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO learning_courses (title, description, category, duration_hours, modules_count, thumbnail_gradient, video_url, content, instructor_name, price, currency, approval_status, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)"
  ).bind(
    body.title,
    body.description || null,
    body.category,
    body.duration_hours || null,
    body.modules_count || 0,
    body.thumbnail_gradient || "from-blue-500 to-cyan-500",
    body.video_url || null,
    body.content || null,
    body.instructor_name || null,
    body.price || 0,
    body.currency || "USD",
    body.is_active !== undefined ? body.is_active : 1
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.put("/api/admin/courses/:id/approve", authMiddleware, adminCheckMiddleware, async (c) => {
  const courseId = c.req.param("id");

  await c.env.DB.prepare(
    "UPDATE learning_courses SET approval_status = 'approved', is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(courseId).run();

  return c.json({ success: true });
});

app.put("/api/admin/courses/:id/reject", authMiddleware, adminCheckMiddleware, async (c) => {
  const courseId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE learning_courses SET approval_status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.rejection_reason || "Does not meet quality standards", courseId).run();

  return c.json({ success: true });
});

app.put("/api/admin/courses/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const courseId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE learning_courses SET 
      title = ?, 
      description = ?, 
      category = ?, 
      duration_hours = ?, 
      modules_count = ?, 
      video_url = ?, 
      content = ?, 
      instructor_name = ?, 
      instructor_bio = ?,
      instructor_credentials = ?,
      instructor_image_url = ?,
      learning_objectives = ?,
      prerequisites = ?,
      equipment_name = ?,
      equipment_model = ?,
      image_url = ?,
      price = ?, 
      currency = ?, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
  ).bind(
    body.title,
    body.description || null,
    body.category,
    body.duration_hours || null,
    body.modules_count || 0,
    body.video_url || null,
    body.content || null,
    body.instructor_name || null,
    body.instructor_bio || null,
    body.instructor_credentials || null,
    body.instructor_image_url || null,
    body.learning_objectives || null,
    body.prerequisites || null,
    body.equipment_name || null,
    body.equipment_model || null,
    body.image_url || null,
    body.price || 0,
    body.currency || "USD",
    courseId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/courses/:id/toggle-active", authMiddleware, adminCheckMiddleware, async (c) => {
  const courseId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE learning_courses SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, courseId).run();

  return c.json({ success: true });
});

app.delete("/api/admin/courses/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const courseId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM user_course_progress WHERE course_id = ?").bind(courseId).run();
  await c.env.DB.prepare("DELETE FROM learning_courses WHERE id = ?").bind(courseId).run();

  return c.json({ success: true });
});

// Admin reports management
app.get("/api/admin/reports", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results: postReports } = await c.env.DB.prepare(
    `SELECT pr.*, nu.title as item_title, up.full_name as reporter_name,
            'post' as report_type
     FROM post_reports pr
     LEFT JOIN news_updates nu ON pr.news_id = nu.id
     LEFT JOIN user_profiles up ON pr.user_id = up.user_id
     ORDER BY pr.created_at DESC`
  ).all();

  const { results: exhibitionReports } = await c.env.DB.prepare(
    `SELECT er.*, me.title as item_title, up.full_name as reporter_name,
            'exhibition' as report_type
     FROM exhibition_reports er
     LEFT JOIN medical_exhibitions me ON er.exhibition_id = me.id
     LEFT JOIN user_profiles up ON er.user_id = up.user_id
     ORDER BY er.created_at DESC`
  ).all();

  const { results: profileReports } = await c.env.DB.prepare(
    `SELECT pr.*, up1.full_name as item_title, up2.full_name as reporter_name,
            'profile' as report_type
     FROM profile_reports pr
     LEFT JOIN user_profiles up1 ON pr.reported_user_id = up1.user_id
     LEFT JOIN user_profiles up2 ON pr.reporter_user_id = up2.user_id
     ORDER BY pr.created_at DESC`
  ).all();

  const allReports = [
    ...postReports.map((r: any) => ({ ...r, report_type: 'post' })),
    ...exhibitionReports.map((r: any) => ({ ...r, report_type: 'exhibition' })),
    ...profileReports.map((r: any) => ({ ...r, report_type: 'profile' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return c.json(allReports);
});

app.put("/api/admin/reports/:id/resolve", authMiddleware, adminCheckMiddleware, async (c) => {
  const reportId = c.req.param("id");
  const body = await c.req.json();
  const reportType = body.report_type;

  if (!reportType) {
    return c.json({ error: "Report type is required" }, 400);
  }

  try {
    if (reportType === 'post') {
      await c.env.DB.prepare(
        "UPDATE post_reports SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(reportId).run();
    } else if (reportType === 'exhibition') {
      await c.env.DB.prepare(
        "UPDATE exhibition_reports SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(reportId).run();
    } else if (reportType === 'profile') {
      await c.env.DB.prepare(
        "UPDATE profile_reports SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(reportId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error resolving report:", error);
    return c.json({ error: "Failed to resolve report" }, 500);
  }
});

app.delete("/api/admin/reports/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const reportId = c.req.param("id");
  const reportType = c.req.query("type");

  if (!reportType) {
    return c.json({ error: "Report type is required" }, 400);
  }

  try {
    if (reportType === 'post') {
      await c.env.DB.prepare("DELETE FROM post_reports WHERE id = ?").bind(reportId).run();
    } else if (reportType === 'exhibition') {
      await c.env.DB.prepare("DELETE FROM exhibition_reports WHERE id = ?").bind(reportId).run();
    } else if (reportType === 'profile') {
      await c.env.DB.prepare("DELETE FROM profile_reports WHERE id = ?").bind(reportId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return c.json({ error: "Failed to delete report" }, 500);
  }
});

// Admin posts management
app.get("/api/admin/posts", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT nu.*, up.full_name as author_name 
     FROM news_updates nu 
     LEFT JOIN user_profiles up ON nu.posted_by_user_id = up.user_id 
     ORDER BY nu.created_at DESC`
  ).all();

  return c.json(results);
});

app.delete("/api/admin/posts/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const postId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM news_likes WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM news_comments WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM news_shares WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM news_reposts WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM saved_posts WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM post_reports WHERE news_id = ?").bind(postId).run();
  await c.env.DB.prepare("DELETE FROM news_updates WHERE id = ?").bind(postId).run();

  return c.json({ success: true });
});

// Admin exhibitions management
app.get("/api/admin/exhibitions", authMiddleware, adminCheckMiddleware, async (c) => {
  // Clean up old exhibitions in the background (non-blocking)
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `DELETE FROM medical_exhibitions 
       WHERE event_end_date IS NOT NULL 
       AND event_end_date < DATE('now', '-1 day')`
    ).run().then((result) => {
      if (result.meta.changes && result.meta.changes > 0) {
        console.log(`Cleaned up ${result.meta.changes} old exhibition(s)`);
      }
    }).catch((error) => {
      console.error("Error cleaning up old exhibitions:", error);
    })
  );
  
  const { results } = await c.env.DB.prepare(
    `SELECT me.*, up.full_name as organizer_name 
     FROM medical_exhibitions me 
     LEFT JOIN user_profiles up ON me.posted_by_user_id = up.user_id 
     ORDER BY 
       CASE 
         WHEN me.event_start_date IS NULL THEN 1
         ELSE 0
       END,
       me.event_start_date ASC,
       me.created_at DESC`
  ).all();

  return c.json(results);
});

app.delete("/api/admin/exhibitions/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const exhibitionId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM exhibition_likes WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_comments WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_shares WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM saved_exhibitions WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_responses WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_views WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM exhibition_reports WHERE exhibition_id = ?").bind(exhibitionId).run();
  await c.env.DB.prepare("DELETE FROM medical_exhibitions WHERE id = ?").bind(exhibitionId).run();

  return c.json({ success: true });
});

// Admin jobs management
app.get("/api/admin/jobs", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM jobs ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.delete("/api/admin/jobs/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const jobId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(jobId).run();

  return c.json({ success: true });
});

// Admin fundraisers management
app.get("/api/admin/fundraisers", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT f.*, up.full_name as creator_name 
     FROM fundraisers f 
     LEFT JOIN user_profiles up ON f.creator_user_id = up.user_id 
     ORDER BY f.created_at DESC`
  ).all();

  return c.json(results);
});

app.delete("/api/admin/fundraisers/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const fundraiserId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM fundraiser_documents WHERE fundraiser_id = ?").bind(fundraiserId).run();
  await c.env.DB.prepare("DELETE FROM fundraiser_donations WHERE fundraiser_id = ?").bind(fundraiserId).run();
  await c.env.DB.prepare("DELETE FROM fundraisers WHERE id = ?").bind(fundraiserId).run();

  return c.json({ success: true });
});

app.put("/api/admin/fundraisers/:id/verify", authMiddleware, adminCheckMiddleware, async (c) => {
  const fundraiserId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE fundraisers SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.status, fundraiserId).run();

  return c.json({ success: true });
});

app.get("/api/admin/fundraisers/:id/documents", authMiddleware, adminCheckMiddleware, async (c) => {
  const fundraiserId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM fundraiser_documents WHERE fundraiser_id = ? ORDER BY created_at DESC"
  ).bind(fundraiserId).all();

  return c.json(results);
});

// Admin partners management (all non-patient users who offer services)
app.get("/api/admin/partners", authMiddleware, adminCheckMiddleware, async (c) => {
  // Get super admin emails to exclude from partner list
  const { results: superAdmins } = await c.env.DB.prepare(
    "SELECT email FROM admin_users WHERE role = 'super_admin'"
  ).all();
  
  const superAdminEmails = superAdmins.map((admin: any) => admin.email);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE account_type != 'patient' OR account_type IS NULL ORDER BY created_at DESC LIMIT 1000"
  ).all();

  // Filter out super admin accounts (matched by email)
  const filteredResults = results.filter((partner: any) => 
    !superAdminEmails.includes(partner.email)
  );

  // Add pending location request counts for each partner
  const partnersWithRequests = await Promise.all(
    filteredResults.map(async (partner: any) => {
      const requestCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM location_change_requests WHERE user_id = ? AND status = 'pending'"
      ).bind(partner.user_id).first();

      return {
        ...partner,
        pending_location_requests: requestCount?.count || 0,
      };
    })
  );

  return c.json(partnersWithRequests);
});

// Admin update partner subscription
app.put("/api/admin/users/:userId/subscription", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update subscriptions" }, 403);
  }

  const userId = c.req.param("userId");
  const body = await c.req.json();

  if (!body.subscription_tier) {
    return c.json({ error: "Subscription tier is required" }, 400);
  }

  try {
    await c.env.DB.prepare(
      "UPDATE user_profiles SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(body.subscription_tier, userId).run();

    console.log(`[Admin] Updated partner ${userId} subscription to ${body.subscription_tier}, reason=${body.reason || 'none'}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return c.json({ error: "Failed to update subscription" }, 500);
  }
});

// Admin get partner orders
app.get("/api/admin/partner-orders/:userId", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM service_orders 
       WHERE assigned_engineer_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    ).bind(userId).all();

    return c.json(results);
  } catch (error) {
    console.error("Error fetching partner orders:", error);
    return c.json({ error: "Failed to fetch partner orders" }, 500);
  }
});

// Admin update partner profile (profession and account_type)
app.put("/api/admin/partners/:userId/profile", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update partner profiles" }, 403);
  }

  const userId = c.req.param("userId");
  const body = await c.req.json();

  if (!body.profession && !body.account_type) {
    return c.json({ error: "At least one field (profession or account_type) is required" }, 400);
  }

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (body.profession) {
      updates.push("profession = ?");
      values.push(body.profession);
    }

    if (body.account_type) {
      updates.push("account_type = ?");
      values.push(body.account_type);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    await c.env.DB.prepare(
      `UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`
    ).bind(...values).run();

    console.log(`[Admin] Updated partner ${userId} profile: profession=${body.profession}, account_type=${body.account_type}, reason=${body.reason || 'none'}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating partner profile:", error);
    return c.json({ error: "Failed to update partner profile" }, 500);
  }
});

// Keep original users endpoint for backward compatibility
app.get("/api/admin/users", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1000"
  ).all();

  // Add pending location request counts for each user
  const usersWithRequests = await Promise.all(
    results.map(async (user: any) => {
      const requestCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM location_change_requests WHERE user_id = ? AND status = 'pending'"
      ).bind(user.user_id).first();

      if (requestCount && (requestCount as any).count > 0) {
        console.log(`[Admin Users] User ${user.user_id} has ${(requestCount as any).count} pending location request(s)`);
      }

      return {
        ...user,
        pending_location_requests: requestCount?.count || 0,
      };
    })
  );

  return c.json(usersWithRequests);
});

app.put("/api/admin/users/:userId/block", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  await c.env.DB.prepare(
    "UPDATE user_profiles SET is_blocked = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).bind(userId).run();

  return c.json({ success: true });
});

app.put("/api/admin/users/:userId/unblock", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  await c.env.DB.prepare(
    "UPDATE user_profiles SET is_blocked = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).bind(userId).run();

  return c.json({ success: true });
});

// Admin delete user endpoint (complete data deletion)
app.delete("/api/admin/users/:userId", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can delete users" }, 403);
  }

  const userId = c.req.param("userId");
  const currentUser = c.get("user");

  // Prevent admin from deleting their own account
  if (userId === currentUser!.id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  const deletionStatus: Record<string, number> = {};

  try {
    console.log(`[Admin User Deletion] Starting complete data deletion for user ${userId}`);
    
    // Track all deletions with detailed counts
    const executeDelete = async (table: string, query: string, ...params: any[]) => {
      const result = await c.env.DB.prepare(query).bind(...params).run();
      deletionStatus[table] = result.meta.changes || 0;
      if (result.meta.changes && result.meta.changes > 0) {
        console.log(`[Admin User Deletion] Deleted ${result.meta.changes} record(s) from ${table}`);
      }
    };

    // Delete profile-related data
    await executeDelete("user_specialities", "DELETE FROM user_specialities WHERE user_id = ?", userId);
    await executeDelete("user_products", "DELETE FROM user_products WHERE user_id = ?", userId);
    await executeDelete("freelancer_portfolio", "DELETE FROM freelancer_portfolio WHERE user_id = ?", userId);
    
    // Delete social interactions
    await executeDelete("news_likes", "DELETE FROM news_likes WHERE user_id = ?", userId);
    await executeDelete("news_comments", "DELETE FROM news_comments WHERE user_id = ?", userId);
    await executeDelete("news_shares", "DELETE FROM news_shares WHERE user_id = ?", userId);
    await executeDelete("news_reposts", "DELETE FROM news_reposts WHERE user_id = ?", userId);
    await executeDelete("saved_posts", "DELETE FROM saved_posts WHERE user_id = ?", userId);
    await executeDelete("user_follows", "DELETE FROM user_follows WHERE follower_user_id = ? OR following_user_id = ?", userId, userId);
    await executeDelete("comment_replies", "DELETE FROM comment_replies WHERE user_id = ?", userId);
    await executeDelete("comment_likes", "DELETE FROM comment_likes WHERE user_id = ?", userId);
    await executeDelete("post_reports", "DELETE FROM post_reports WHERE user_id = ?", userId);
    
    // Delete exhibition interactions
    await executeDelete("exhibition_likes", "DELETE FROM exhibition_likes WHERE user_id = ?", userId);
    await executeDelete("exhibition_comments", "DELETE FROM exhibition_comments WHERE user_id = ?", userId);
    await executeDelete("exhibition_shares", "DELETE FROM exhibition_shares WHERE user_id = ?", userId);
    await executeDelete("saved_exhibitions", "DELETE FROM saved_exhibitions WHERE user_id = ?", userId);
    await executeDelete("exhibition_responses", "DELETE FROM exhibition_responses WHERE user_id = ?", userId);
    await executeDelete("exhibition_views", "DELETE FROM exhibition_views WHERE user_id = ?", userId);
    await executeDelete("exhibition_comment_replies", "DELETE FROM exhibition_comment_replies WHERE user_id = ?", userId);
    await executeDelete("exhibition_comment_likes", "DELETE FROM exhibition_comment_likes WHERE user_id = ?", userId);
    await executeDelete("exhibition_reports", "DELETE FROM exhibition_reports WHERE user_id = ?", userId);
    
    // Delete chat and messaging
    await executeDelete("global_chat_messages", "DELETE FROM global_chat_messages WHERE user_id = ?", userId);
    await executeDelete("chat_message_replies", "DELETE FROM chat_message_replies WHERE user_id = ?", userId);
    await executeDelete("chat_message_reactions", "DELETE FROM chat_message_reactions WHERE user_id = ?", userId);
    await executeDelete("direct_messages", "DELETE FROM direct_messages WHERE sender_user_id = ? OR receiver_user_id = ?", userId, userId);
    
    // Delete reports and moderation
    await executeDelete("profile_reports", "DELETE FROM profile_reports WHERE reported_user_id = ? OR reporter_user_id = ?", userId, userId);
    
    // Delete activity and engagement
    await executeDelete("user_activity_logs", "DELETE FROM user_activity_logs WHERE user_id = ?", userId);
    await executeDelete("notification_preferences", "DELETE FROM notification_preferences WHERE user_id = ?", userId);
    await executeDelete("notifications", "DELETE FROM notifications WHERE user_id = ?", userId);
    
    // Delete support and requests
    await executeDelete("support_tickets", "DELETE FROM support_tickets WHERE user_id = ?", userId);
    await executeDelete("service_requests", "DELETE FROM service_requests WHERE requester_user_id = ?", userId);
    await executeDelete("location_change_requests", "DELETE FROM location_change_requests WHERE user_id = ?", userId);
    
    // Delete gamification data
    await executeDelete("daily_actions", "DELETE FROM daily_actions WHERE user_id = ?", userId);
    await executeDelete("completed_actions", "DELETE FROM completed_actions WHERE user_id = ?", userId);
    await executeDelete("user_streaks", "DELETE FROM user_streaks WHERE user_id = ?", userId);
    await executeDelete("weekly_reports", "DELETE FROM weekly_reports WHERE user_id = ?", userId);
    await executeDelete("user_gamification", "DELETE FROM user_gamification WHERE user_id = ?", userId);
    await executeDelete("xp_events", "DELETE FROM xp_events WHERE user_id = ?", userId);
    await executeDelete("profile_field_xp", "DELETE FROM profile_field_xp WHERE user_id = ?", userId);
    
    // Delete user-created content
    await executeDelete("news_updates", "DELETE FROM news_updates WHERE posted_by_user_id = ?", userId);
    await executeDelete("medical_exhibitions", "DELETE FROM medical_exhibitions WHERE posted_by_user_id = ?", userId);
    await executeDelete("jobs", "DELETE FROM jobs WHERE posted_by_user_id = ?", userId);
    await executeDelete("service_listings", "DELETE FROM service_listings WHERE provider_user_id = ?", userId);
    await executeDelete("fundraisers", "DELETE FROM fundraisers WHERE creator_user_id = ?", userId);
    await executeDelete("learning_courses", "DELETE FROM learning_courses WHERE submitted_by_user_id = ?", userId);
    await executeDelete("service_manuals", "DELETE FROM service_manuals WHERE uploaded_by_user_id = ?", userId);
    
    // Delete ALL service orders (pending, active, completed) for both patients and partners
    await executeDelete("service_orders", "DELETE FROM service_orders WHERE patient_user_id = ? OR assigned_engineer_id = ?", userId, userId);
    
    // Delete financial data
    await executeDelete("transactions", "DELETE FROM transactions WHERE user_id = ?", userId);
    await executeDelete("wallet_transactions", "DELETE FROM wallet_transactions WHERE user_id = ?", userId);
    await executeDelete("user_wallets", "DELETE FROM user_wallets WHERE user_id = ?", userId);
    await executeDelete("referral_tracking", "DELETE FROM referral_tracking WHERE referrer_user_id = ? OR referred_user_id = ?", userId, userId);
    await executeDelete("fundraiser_donations", "DELETE FROM fundraiser_donations WHERE donor_user_id = ?", userId);
    
    // Delete KYC and verification
    await executeDelete("kyc_submissions", "DELETE FROM kyc_submissions WHERE user_id = ?", userId);
    await executeDelete("patient_notification_settings", "DELETE FROM patient_notification_settings WHERE user_id = ?", userId);
    
    // Delete connections and network
    await executeDelete("user_connections", "DELETE FROM user_connections WHERE requester_user_id = ? OR receiver_user_id = ?", userId, userId);
    await executeDelete("user_followers", "DELETE FROM user_followers WHERE follower_user_id = ? OR following_user_id = ?", userId, userId);
    await executeDelete("connection_requests", "DELETE FROM connection_requests WHERE sender_user_id = ? OR receiver_user_id = ?", userId, userId);
    await executeDelete("blocked_users", "DELETE FROM blocked_users WHERE blocker_user_id = ? OR blocked_user_id = ?", userId, userId);
    
    // Delete learning and courses
    await executeDelete("course_enrollments", "DELETE FROM course_enrollments WHERE user_id = ?", userId);
    await executeDelete("course_reviews", "DELETE FROM course_reviews WHERE user_id = ?", userId);
    await executeDelete("user_course_progress", "DELETE FROM user_course_progress WHERE user_id = ?", userId);
    
    // Delete business/partner-specific data
    await executeDelete("product_catalog_files", "DELETE FROM product_catalog_files WHERE product_id IN (SELECT id FROM business_products WHERE business_user_id = ?)", userId);
    await executeDelete("product_images", "DELETE FROM product_images WHERE product_id IN (SELECT id FROM business_products WHERE business_user_id = ?)", userId);
    await executeDelete("business_products", "DELETE FROM business_products WHERE business_user_id = ?", userId);
    await executeDelete("authorized_dealers", "DELETE FROM authorized_dealers WHERE business_user_id = ?", userId);
    await executeDelete("business_territories", "DELETE FROM business_territories WHERE business_user_id = ?", userId);
    await executeDelete("service_engineers", "DELETE FROM service_engineers WHERE business_user_id = ?", userId);
    
    // Finally delete the user profile
    await executeDelete("user_profiles", "DELETE FROM user_profiles WHERE user_id = ?", userId);
    
    // Calculate total records deleted
    const totalDeleted = Object.values(deletionStatus).reduce((sum, count) => sum + count, 0);
    console.log(`[Admin User Deletion] Total records deleted: ${totalDeleted} across ${Object.keys(deletionStatus).length} tables`);
    console.log(`[Admin User Deletion] Complete. User ${userId} data permanently removed from database.`);
    
    return c.json({ 
      success: true,
      deletion_status: {
        total_records_deleted: totalDeleted,
        tables_affected: Object.keys(deletionStatus).length,
        details: deletionStatus,
        message: "User and all associated data permanently deleted"
      }
    });
  } catch (error) {
    console.error("[Admin User Deletion] Error during deletion process:", error);
    return c.json({ 
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : "Unknown error",
      deletion_status: deletionStatus
    }, 500);
  }
});

// Admin location change requests
app.get("/api/admin/users/:userId/location-requests", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  console.log(`[Admin] Fetching location requests for user: ${userId}`);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM location_change_requests WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();

  console.log(`[Admin] Found ${results.length} location request(s) for user ${userId}`);

  return c.json(results);
});

app.put("/api/admin/location-requests/:id/approve", authMiddleware, adminCheckMiddleware, async (c) => {
  const requestId = c.req.param("id");
  const body = await c.req.json();

  try {
    // Get the request details
    const request = await c.env.DB.prepare(
      "SELECT * FROM location_change_requests WHERE id = ?"
    ).bind(requestId).first();

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Update the user's location
    await c.env.DB.prepare(
      "UPDATE user_profiles SET state = ?, country = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(request.requested_state, request.requested_country, request.user_id).run();

    // Mark request as approved
    await c.env.DB.prepare(
      "UPDATE location_change_requests SET status = 'approved', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.admin_notes || null, requestId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error approving location request:", error);
    return c.json({ error: "Failed to approve request" }, 500);
  }
});

app.put("/api/admin/location-requests/:id/reject", authMiddleware, adminCheckMiddleware, async (c) => {
  const requestId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE location_change_requests SET status = 'rejected', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.reason || null, requestId).run();

  return c.json({ success: true });
});

// System configuration endpoints (super admin only)
app.get("/api/admin/system-config", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can access system configuration" }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, config_key, config_value, config_category, is_sensitive, description FROM system_configurations ORDER BY config_category, config_key"
    ).all();

    // Mask sensitive values for security
    const maskedResults = results.map((config: any) => ({
      ...config,
      config_value: config.is_sensitive && config.config_value ? '••••••••' : config.config_value,
      has_value: !!(config.config_value && config.config_value.trim()),
    }));

    return c.json(maskedResults);
  } catch (error) {
    console.error("Error fetching system config:", error);
    return c.json({ error: "Failed to fetch configuration" }, 500);
  }
});

app.put("/api/admin/system-config/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update system configuration" }, 403);
  }

  const configId = c.req.param("id");
  const body = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE system_configurations SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.config_value || '', configId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating system config:", error);
    return c.json({ error: "Failed to update configuration" }, 500);
  }
});

app.post("/api/admin/system-config/test", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can test configurations" }, 403);
  }

  const body = await c.req.json();
  const { config_key, config_value } = body;

  try {
    let testResult = { success: false, message: "Configuration test not implemented for this service" };

    // Test different services based on config_key
    if (config_key === 'GEMINI_API_KEY' && config_value) {
      try {
        const genAI = new GoogleGenerativeAI(config_value);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model.generateContent("Test");
        testResult = { success: true, message: "Gemini API key is valid and working" };
      } catch (error) {
        testResult = { success: false, message: `Gemini API test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    } else if (config_key === 'RESEND_API_KEY' && config_value) {
      try {
        new Resend(config_value);
        testResult = { success: true, message: "Resend API key format is valid" };
      } catch (error) {
        testResult = { success: false, message: "Invalid Resend API key format" };
      }
    } else if (config_key.includes('URL') || config_key.includes('ENDPOINT')) {
      // Test URL validity
      try {
        new URL(config_value);
        testResult = { success: true, message: "URL format is valid" };
      } catch (error) {
        testResult = { success: false, message: "Invalid URL format" };
      }
    }

    return c.json(testResult);
  } catch (error) {
    console.error("Error testing configuration:", error);
    return c.json({ 
      success: false, 
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// Admin admins management
app.get("/api/admin/admins", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results: admins } = await c.env.DB.prepare(
    "SELECT id, email, role, created_at, updated_at FROM admin_users ORDER BY created_at DESC"
  ).all();

  const adminsWithPermissions = await Promise.all(
    admins.map(async (admin: any) => {
      if (admin.role === 'super_admin') {
        return { ...admin, permissions: null };
      }

      const { results: permissions } = await c.env.DB.prepare(
        "SELECT tab_name, permission_level FROM admin_permissions WHERE admin_user_id = ?"
      ).bind(admin.id).all();

      return { ...admin, permissions };
    })
  );

  return c.json(adminsWithPermissions);
});

app.post("/api/admin/admins", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can add new admins" }, 403);
  }

  const body = await c.req.json();

  if (!body.email || !body.role) {
    return c.json({ error: "Email and role are required" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM admin_users WHERE email = ?"
  ).bind(body.email).first();

  if (existing) {
    return c.json({ error: "Admin already exists" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO admin_users (email, password_hash, role) VALUES (?, '', ?)"
  ).bind(body.email, body.role).run();

  const adminId = result.meta.last_row_id;

  if (body.role === 'admin' && body.permissions && Array.isArray(body.permissions)) {
    for (const perm of body.permissions) {
      await c.env.DB.prepare(
        "INSERT INTO admin_permissions (admin_user_id, tab_name, permission_level) VALUES (?, ?, ?)"
      ).bind(adminId, perm.tab_name, perm.permission_level).run();
    }
  }

  return c.json({ id: adminId, success: true }, 201);
});

app.delete("/api/admin/admins/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can delete admins" }, 403);
  }

  const adminId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM admin_permissions WHERE admin_user_id = ?").bind(adminId).run();
  await c.env.DB.prepare("DELETE FROM admin_users WHERE id = ?").bind(adminId).run();

  return c.json({ success: true });
});

app.put("/api/admin/admins/:id/permissions", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can manage permissions" }, 403);
  }

  const adminId = c.req.param("id");
  const body = await c.req.json();

  if (!body.permissions || !Array.isArray(body.permissions)) {
    return c.json({ error: "Permissions array is required" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM admin_permissions WHERE admin_user_id = ?").bind(adminId).run();

  for (const perm of body.permissions) {
    await c.env.DB.prepare(
      "INSERT INTO admin_permissions (admin_user_id, tab_name, permission_level) VALUES (?, ?, ?)"
    ).bind(adminId, perm.tab_name, perm.permission_level).run();
  }

  return c.json({ success: true });
});

// Public subscription plans endpoint
app.get("/api/subscription-plans", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY display_order ASC"
  ).all();

  return c.json(results);
});

// Weekly Report endpoint
app.get("/api/weekly-report", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    // Calculate current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];
    
    // Check if report exists for this week
    const existingReport = await c.env.DB.prepare(
      "SELECT * FROM weekly_reports WHERE user_id = ? AND week_start = ?"
    ).bind(user!.id, weekStart).first();
    
    if (existingReport) {
      return c.json(existingReport);
    }
    
    // Generate new report
    const profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user!.id).first();
    
    // Calculate completed actions for this week
    const actionsResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count 
       FROM completed_actions ca 
       JOIN daily_actions da ON ca.action_id = da.id 
       WHERE ca.user_id = ? AND da.action_date >= ? AND da.action_date <= ?`
    ).bind(user!.id, weekStart, weekEnd).first();
    
    const completedActions = Number(actionsResult?.count || 0);
    
    // Get streak data
    const streak = await c.env.DB.prepare(
      "SELECT * FROM user_streaks WHERE user_id = ?"
    ).bind(user!.id).first();
    
    const streakEnd = Number(streak?.current_streak || 0);
    const streakStart = Math.max(0, streakEnd - 7); // Approximate start of week
    
    // Calculate skills added (simplified - count profile updates)
    const skillsAdded = 0; // Could be enhanced to track actual skill additions
    
    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (completedActions * 10) + 
      (streakEnd * 5) + 
      (skillsAdded * 10)
    ));
    
    // Generate AI insights
    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const accountType = profile?.account_type || "individual";
    const specialization = profile?.specialisation || "biomedical engineering";
    
    const prompt = `Generate a weekly insights report for a ${accountType} biomedical engineer specializing in ${specialization}.

User activity summary:
- Completed actions: ${completedActions}
- Streak change: ${streakStart} → ${streakEnd}
- Skills added: ${skillsAdded}
- Engagement score: ${engagementScore}/100

Please generate:
1. A concise weekly summary (max 120 words) - be encouraging and specific
2. 3-5 personalized recommendations for next week
3. 1-2 predictive insights based on their pattern

Return ONLY a valid JSON object with these keys:
- summary (string)
- recommendations (array of strings)
- predictions (array of strings)

Keep the tone professional, encouraging, and actionable.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    
    // Store the report
    await c.env.DB.prepare(
      `INSERT INTO weekly_reports 
        (user_id, week_start, week_end, completed_actions_count, new_skills_added, 
         streak_start, streak_end, engagement_score, ai_summary, ai_recommendations, ai_predictions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id,
      weekStart,
      weekEnd,
      completedActions,
      skillsAdded,
      streakStart,
      streakEnd,
      engagementScore,
      parsed.summary || "Keep up the great work!",
      JSON.stringify(parsed.recommendations || []),
      JSON.stringify(parsed.predictions || [])
    ).run();
    
    // Award XP for generating new weekly report
    await addXP(c.env.DB, user!.id, 20, "weekly_report_generated", { week_start: weekStart });

    // Fetch and return the created report
    const newReport = await c.env.DB.prepare(
      "SELECT * FROM weekly_reports WHERE user_id = ? AND week_start = ?"
    ).bind(user!.id, weekStart).first();
    
    return c.json(newReport);
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return c.json({ error: "Failed to generate weekly report" }, 500);
  }
});

// Daily Actions endpoints
app.get("/api/daily-actions", authMiddleware, async (c) => {
  const user = c.get("user");
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if actions exist for today
    const { results: existingActions } = await c.env.DB.prepare(
      "SELECT * FROM daily_actions WHERE user_id = ? AND action_date = ?"
    ).bind(user!.id, today).all();

    let actions = existingActions;

    // Generate new actions if none exist for today
    if (existingActions.length === 0) {
      // Get user profile for personalization
      const profile = await c.env.DB.prepare(
        "SELECT * FROM user_profiles WHERE user_id = ?"
      ).bind(user!.id).first();

      const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const accountType = profile?.account_type || "individual";
      const specialization = profile?.specialisation || "biomedical engineering";
      const isBusiness = accountType === "business";

      const prompt = isBusiness 
        ? `Generate 4-6 personalized daily business action items for a biomedical engineering company specializing in ${specialization}.

Each action should be:
- Quick and achievable (5-30 minutes)
- Valuable for business growth and operations
- Specific to medical device/biomedical equipment business
- Actionable today

REQUIRED: Include at least 2-3 of these specific business-focused actions (vary the mix each day):
- "Add new products to your Business Dashboard" (action_type: add_products)
- "Update product pricing and availability" (action_type: update_products)
- "Add service territories in Business Dashboard" (action_type: add_territories)
- "Add service engineer contacts for your products" (action_type: add_engineers)
- "Post about your products/services in News Feed" (action_type: post_news)
- "Share an upcoming medical exhibition" (action_type: post_exhibition)
- "Post a job opening in Jobs section" (action_type: post_job)
- "Update your business profile and GST details" (action_type: update_profile)
- "Connect with hospitals and clinics in C-Connect" (action_type: connect_users)
- "Update your product portfolio with images and catalogs" (action_type: update_portfolio)
- "Add authorized dealer information" (action_type: add_dealers)
- "Review and respond to service requests" (action_type: review_requests)

Other categories for remaining actions: marketing, sales, operations, networking, compliance

Return ONLY a valid JSON object with an "actions" array. Each action needs: title (max 60 chars), description (max 120 chars), action_type.

Example format:
{
  "actions": [
    {
      "title": "Add new products to Business Dashboard",
      "description": "Expand your product catalog with new medical devices or equipment",
      "action_type": "add_products"
    },
    {
      "title": "Update product pricing",
      "description": "Review and adjust dealer and customer pricing for your products",
      "action_type": "update_products"
    },
    {
      "title": "Connect with 5 hospitals in C-Connect",
      "description": "Build relationships with potential clients in the healthcare sector",
      "action_type": "connect_users"
    }
  ]
}`
        : `Generate 4-6 personalized daily action items for an individual biomedical engineer specializing in ${specialization}.

Each action should be:
- Quick and achievable (5-30 minutes)
- Professionally valuable
- Specific to biomedical engineering career
- Actionable today

REQUIRED: Include at least 2-3 of these specific measurable actions (vary the mix each day):
- "Post a job opportunity in the Jobs section" (action_type: post_job)
- "Share industry news in the News Feed" (action_type: post_news)
- "Post about an upcoming medical exhibition" (action_type: post_exhibition)
- "Connect with 5 professionals in C-Connect" (action_type: connect_users)
- "Send 3 messages in Global Chat" (action_type: global_chat)
- "Complete your experience section in Edit Profile" (action_type: profile_experience)
- "Add your education details in Edit Profile" (action_type: profile_education)
- "Upload your professional resume in Edit Profile" (action_type: profile_resume)
- "Update your skills and specialization in Edit Profile" (action_type: profile_skills)
- "Add your bio and professional summary in Edit Profile" (action_type: profile_bio)
- "Connect your social media profiles (LinkedIn, Instagram, Facebook)" (action_type: profile_social)
- "Update your profile picture" (action_type: profile_picture)
- "Complete your location and contact information" (action_type: profile_contact)

Other categories for remaining actions: networking, learning, job_search, skill_building, content_creation

Return ONLY a valid JSON object with an "actions" array. Each action needs: title (max 60 chars), description (max 120 chars), action_type.

Example format:
{
  "actions": [
    {
      "title": "Share industry news in the News Feed",
      "description": "Post about a recent development or insight in biomedical engineering",
      "action_type": "post_news"
    },
    {
      "title": "Connect with 5 professionals in C-Connect",
      "description": "Expand your network by following 5 biomedical engineering professionals",
      "action_type": "connect_users"
    },
    {
      "title": "Post a job opportunity",
      "description": "Share an open position or opportunity in the Jobs section",
      "action_type": "post_job"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      const generatedActions = parsed.actions || [];

      // Store generated actions
      for (const action of generatedActions) {
        await c.env.DB.prepare(
          "INSERT OR IGNORE INTO daily_actions (user_id, action_date, title, description, action_type) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          user!.id,
          today,
          action.title,
          action.description,
          action.action_type
        ).run();
      }

      // Fetch the newly created actions
      const { results: newActions } = await c.env.DB.prepare(
        "SELECT * FROM daily_actions WHERE user_id = ? AND action_date = ?"
      ).bind(user!.id, today).all();
      
      actions = newActions;
    }

    // Check which actions are completed
    const { results: completed } = await c.env.DB.prepare(
      "SELECT action_id FROM completed_actions WHERE user_id = ?"
    ).bind(user!.id).all();

    const completedIds = new Set(completed.map((c: any) => c.action_id));

    const actionsWithStatus = actions.map((action: any) => ({
      ...action,
      is_completed: completedIds.has(action.id)
    }));

    return c.json({ actions: actionsWithStatus });
  } catch (error) {
    console.error("Error fetching daily actions:", error);
    return c.json({ actions: [] });
  }
});

app.get("/api/daily-actions/streak", authMiddleware, async (c) => {
  const user = c.get("user");

  let streak = await c.env.DB.prepare(
    "SELECT * FROM user_streaks WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!streak) {
    await c.env.DB.prepare(
      "INSERT INTO user_streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)"
    ).bind(user!.id).run();

    streak = await c.env.DB.prepare(
      "SELECT * FROM user_streaks WHERE user_id = ?"
    ).bind(user!.id).first();
  }

  return c.json({
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0
  });
});

app.post("/api/daily-actions/:id/complete", authMiddleware, async (c) => {
  const user = c.get("user");
  const actionId = c.req.param("id");
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if already completed
    const alreadyCompleted = await c.env.DB.prepare(
      "SELECT id FROM completed_actions WHERE user_id = ? AND action_id = ?"
    ).bind(user!.id, actionId).first();

    if (alreadyCompleted) {
      return c.json({ error: "Action already completed" }, 400);
    }

    // Mark action as completed
    await c.env.DB.prepare(
      "INSERT INTO completed_actions (user_id, action_id) VALUES (?, ?)"
    ).bind(user!.id, actionId).run();

    // Award XP for completing action
    await addXP(c.env.DB, user!.id, 10, "daily_action_completed", { action_id: actionId });

    // Get user's streak
    let streak = await c.env.DB.prepare(
      "SELECT * FROM user_streaks WHERE user_id = ?"
    ).bind(user!.id).first();

    if (!streak) {
      await c.env.DB.prepare(
        "INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_action_date) VALUES (?, 1, 1, ?)"
      ).bind(user!.id, today).run();

      streak = { current_streak: 1, longest_streak: 1 };
    } else {
      const lastActionDate = streak.last_action_date as string;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = streak.current_streak as number;

      if (lastActionDate === yesterdayStr) {
        // Streak continues
        newStreak += 1;
      } else if (lastActionDate !== today) {
        // Streak broken, start over
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, streak.longest_streak as number);

      await c.env.DB.prepare(
        "UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_action_date = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
      ).bind(newStreak, newLongest, today, user!.id).run();

      streak = {
        current_streak: newStreak,
        longest_streak: newLongest
      };

      // Award bonus XP for maintaining streak
      if (lastActionDate === yesterdayStr) {
        await addXP(c.env.DB, user!.id, 15, "streak_maintained", { streak: newStreak });
      }
    }

    // Check if all daily actions are completed
    const { results: allActions } = await c.env.DB.prepare(
      "SELECT id FROM daily_actions WHERE user_id = ? AND action_date = ?"
    ).bind(user!.id, today).all();

    const { results: completedActions } = await c.env.DB.prepare(
      "SELECT action_id FROM completed_actions WHERE user_id = ? AND action_id IN (SELECT id FROM daily_actions WHERE action_date = ?)"
    ).bind(user!.id, today).all();

    if (allActions.length > 0 && completedActions.length === allActions.length) {
      // All actions completed - bonus XP
      await addXP(c.env.DB, user!.id, 20, "all_daily_actions_completed", { date: today });
    }

    return c.json({ 
      success: true,
      streak: {
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak
      }
    });
  } catch (error) {
    console.error("Error completing action:", error);
    return c.json({ error: "Failed to complete action" }, 500);
  }
});

// Push to GitHub endpoint
app.post("/api/admin/system-config/github-push", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can push to GitHub" }, 403);
  }

  try {
    // Get GitHub configuration
    const repoUrlConfig = await c.env.DB.prepare(
      "SELECT config_value FROM system_configurations WHERE config_key = 'GITHUB_REPO_URL'"
    ).first();

    const accessTokenConfig = await c.env.DB.prepare(
      "SELECT config_value FROM system_configurations WHERE config_key = 'GITHUB_ACCESS_TOKEN'"
    ).first();

    if (!repoUrlConfig?.config_value || !accessTokenConfig?.config_value) {
      return c.json({
        success: false,
        message: "GitHub repository URL and access token must be configured first"
      }, 400);
    }

    const repoUrl = repoUrlConfig.config_value as string;
    const accessToken = accessTokenConfig.config_value as string;

    // Get project files to push
    const files = await getProjectFiles();

    // Push to GitHub
    const result = await pushToGitHub(repoUrl, accessToken, files);

    return c.json(result);
  } catch (error) {
    console.error("GitHub push error:", error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to push to GitHub"
    }, 500);
  }
});

// Admin subscription plans management
app.get("/api/admin/subscription-plans", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM subscription_plans ORDER BY display_order ASC"
  ).all();

  return c.json(results);
});

app.get("/api/admin/subscription-settings", authMiddleware, adminCheckMiddleware, async (c) => {
  const discountSetting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'yearly_discount_percentage'"
  ).first();

  return c.json({
    yearly_discount_percentage: discountSetting?.setting_value ? parseInt(discountSetting.setting_value as string) : 17
  });
});

app.put("/api/admin/subscription-settings", authMiddleware, adminCheckMiddleware, async (c) => {
  const body = await c.req.json();

  if (!body.yearly_discount_percentage || body.yearly_discount_percentage < 0 || body.yearly_discount_percentage > 100) {
    return c.json({ error: "Discount percentage must be between 0 and 100" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES ('yearly_discount_percentage', ?, CURRENT_TIMESTAMP)"
  ).bind(body.yearly_discount_percentage.toString()).run();

  return c.json({ success: true });
});

app.put("/api/admin/subscription-plans/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const planId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE subscription_plans SET 
      monthly_price = ?, 
      yearly_price = ?,
      currency = ?, 
      benefits = ?, 
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
  ).bind(
    body.monthly_price,
    body.yearly_price,
    body.currency,
    body.benefits,
    body.display_order,
    planId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/subscription-plans/:id/toggle-active", authMiddleware, adminCheckMiddleware, async (c) => {
  const planId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE subscription_plans SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, planId).run();

  return c.json({ success: true });
});

// Public endpoint to get subscription settings
app.get("/api/subscription-settings", async (c) => {
  const discountSetting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'yearly_discount_percentage'"
  ).first();

  return c.json({
    yearly_discount_percentage: discountSetting?.setting_value ? parseInt(discountSetting.setting_value as string) : 17
  });
});

// Admin nursing prices management (super admin only)
app.get("/api/admin/nursing-prices", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM nursing_service_prices ORDER BY id ASC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/nursing-prices/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update nursing prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE nursing_service_prices SET 
      per_visit_price = ?,
      monthly_price = ?,
      description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).bind(
    body.per_visit_price,
    body.monthly_price || null,
    body.description || null,
    priceId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/nursing-prices/:id/toggle-active", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can manage nursing prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE nursing_service_prices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, priceId).run();

  return c.json({ success: true });
});

// Admin physiotherapy prices management (super admin only)
app.get("/api/admin/physiotherapy-prices", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM physiotherapy_service_prices ORDER BY id ASC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/physiotherapy-prices/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update physiotherapy prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE physiotherapy_service_prices SET 
      per_session_price = ?,
      monthly_price = ?,
      description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).bind(
    body.per_session_price,
    body.monthly_price || null,
    body.description || null,
    priceId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/physiotherapy-prices/:id/toggle-active", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can manage physiotherapy prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE physiotherapy_service_prices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, priceId).run();

  return c.json({ success: true });
});

// Admin dynamic pricing settings
app.get("/api/admin/dynamic-pricing/night-duty", authMiddleware, adminCheckMiddleware, async (c) => {
  const setting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'night_duty_percentage'"
  ).first();

  return c.json({
    percentage: setting?.setting_value ? parseInt(setting.setting_value as string) : 20
  });
});

app.put("/api/admin/dynamic-pricing/night-duty", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update dynamic pricing" }, 403);
  }

  const body = await c.req.json();

  if (body.percentage < 0 || body.percentage > 100) {
    return c.json({ error: "Percentage must be between 0 and 100" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES ('night_duty_percentage', ?, CURRENT_TIMESTAMP)"
  ).bind(body.percentage.toString()).run();

  return c.json({ success: true });
});

app.get("/api/admin/dynamic-pricing/emergency", authMiddleware, adminCheckMiddleware, async (c) => {
  const setting = await c.env.DB.prepare(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'emergency_percentage'"
  ).first();

  return c.json({
    percentage: setting?.setting_value ? parseInt(setting.setting_value as string) : 15
  });
});

app.put("/api/admin/dynamic-pricing/emergency", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update dynamic pricing" }, 403);
  }

  const body = await c.req.json();

  if (body.percentage < 0 || body.percentage > 100) {
    return c.json({ error: "Percentage must be between 0 and 100" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES ('emergency_percentage', ?, CURRENT_TIMESTAMP)"
  ).bind(body.percentage.toString()).run();

  return c.json({ success: true });
});

// Admin ambulance prices management (super admin only)
app.get("/api/admin/ambulance-prices", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM ambulance_service_prices ORDER BY id ASC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/ambulance-prices/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can update ambulance prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE ambulance_service_prices SET 
      minimum_fare = ?,
      minimum_km = ?,
      per_km_charge = ?,
      description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).bind(
    body.minimum_fare,
    body.minimum_km || 5,
    body.per_km_charge,
    body.description || null,
    priceId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/ambulance-prices/:id/toggle-active", authMiddleware, adminCheckMiddleware, async (c) => {
  const adminRole = (c as any).get("adminRole");
  
  if (adminRole !== "super_admin") {
    return c.json({ error: "Only super admins can manage ambulance prices" }, 403);
  }

  const priceId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE ambulance_service_prices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.is_active ? 1 : 0, priceId).run();

  return c.json({ success: true });
});

// Admin services management
app.get("/api/admin/services", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT sl.*, up.full_name as provider_name 
     FROM service_listings sl 
     LEFT JOIN user_profiles up ON sl.provider_user_id = up.user_id 
     ORDER BY sl.created_at DESC`
  ).all();

  return c.json(results);
});

// Admin manuals management
app.get("/api/admin/manuals", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM service_manuals ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Admin patient management endpoints
app.get("/api/admin/patients", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM user_profiles 
     WHERE account_type = 'patient' 
     ORDER BY created_at DESC 
     LIMIT 1000`
  ).all();

  // Add booking counts for each patient
  const patientsWithBookings = await Promise.all(
    results.map(async (patient: any) => {
      const bookingCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM service_orders WHERE patient_user_id = ?"
      ).bind(patient.user_id).first();

      return {
        ...patient,
        total_bookings: bookingCount?.count || 0,
      };
    })
  );

  return c.json(patientsWithBookings);
});

app.get("/api/admin/patients/:userId/bookings", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  const { results } = await c.env.DB.prepare(
    `SELECT so.*, up.full_name as partner_name, up.business_name as partner_business
     FROM service_orders so
     LEFT JOIN user_profiles up ON so.assigned_engineer_id = up.user_id
     WHERE so.patient_user_id = ?
     ORDER BY so.created_at DESC`
  ).bind(userId).all();

  return c.json(results);
});

app.put("/api/admin/patients/:userId/block", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  await c.env.DB.prepare(
    "UPDATE user_profiles SET is_blocked = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND account_type = 'patient'"
  ).bind(userId).run();

  return c.json({ success: true });
});

app.put("/api/admin/patients/:userId/unblock", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  await c.env.DB.prepare(
    "UPDATE user_profiles SET is_blocked = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND account_type = 'patient'"
  ).bind(userId).run();

  return c.json({ success: true });
});

app.put("/api/admin/patients/:userId/profile", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE user_profiles SET 
      patient_full_name = ?,
      patient_contact = ?,
      patient_email = ?,
      patient_address = ?,
      patient_city = ?,
      patient_pincode = ?,
      patient_latitude = ?,
      patient_longitude = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND account_type = 'patient'`
  ).bind(
    body.patient_full_name,
    body.patient_contact,
    body.patient_email,
    body.patient_address,
    body.patient_city,
    body.patient_pincode,
    body.patient_latitude,
    body.patient_longitude,
    userId
  ).run();

  return c.json({ success: true });
});

app.put("/api/admin/service-orders/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const orderId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE service_orders SET 
      status = ?,
      service_type = ?,
      service_category = ?,
      equipment_name = ?,
      equipment_model = ?,
      issue_description = ?,
      urgency_level = ?,
      quoted_price = ?,
      engineer_notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).bind(
    body.status,
    body.service_type,
    body.service_category,
    body.equipment_name,
    body.equipment_model,
    body.issue_description,
    body.urgency_level,
    body.quoted_price,
    body.engineer_notes,
    orderId
  ).run();

  return c.json({ success: true });
});

app.delete("/api/admin/service-orders/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const orderId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM service_orders WHERE id = ?").bind(orderId).run();

  return c.json({ success: true });
});

app.delete("/api/admin/patients/:userId", authMiddleware, adminCheckMiddleware, async (c) => {
  const userId = c.req.param("userId");

  try {
    // Delete all patient bookings first
    await c.env.DB.prepare("DELETE FROM service_orders WHERE patient_user_id = ?").bind(userId).run();
    
    // Delete notification settings
    await c.env.DB.prepare("DELETE FROM patient_notification_settings WHERE user_id = ?").bind(userId).run();
    
    // Delete the patient profile
    await c.env.DB.prepare("DELETE FROM user_profiles WHERE user_id = ? AND account_type = 'patient'").bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return c.json({ error: "Failed to delete patient" }, 500);
  }
});

// Get all patient orders (across all patients)
app.get("/api/admin/all-patient-orders", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT so.*, 
      up_patient.patient_full_name as patient_name,
      up_patient.patient_contact,
      up_patient.patient_email,
      up_patient.state as patient_state,
      up_partner.full_name as partner_name,
      up_partner.business_name as partner_business
     FROM service_orders so
     LEFT JOIN user_profiles up_patient ON so.patient_user_id = up_patient.user_id
     LEFT JOIN user_profiles up_partner ON so.assigned_engineer_id = up_partner.user_id
     ORDER BY so.created_at DESC
     LIMIT 500`
  ).all();

  return c.json(results);
});

// KYC verification endpoints
app.post("/api/kyc/upload-document", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("document") as File;
  const documentType = formData.get("document_type") as string;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!documentType) {
    return c.json({ error: "Document type is required" }, 400);
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Only PDF, JPG, and PNG files are allowed" }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "File size must be less than 10MB" }, 400);
  }

  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "pdf";
  const key = `kyc-documents/${user!.id}/${documentType}/${timestamp}.${fileExtension}`;

  try {
    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://r2.mocha.com/${key}`;

    return c.json({ success: true, file_url: fileUrl });
  } catch (error) {
    console.error("Error uploading KYC document:", error);
    return c.json({ error: "Failed to upload document" }, 500);
  }
});

app.post("/api/kyc/submit", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.full_name || !body.id_proof_url || !body.pan_card_url || !body.experience_certificate_url) {
    return c.json({ error: "Full name and all KYC documents are required" }, 400);
  }

  try {
    // Check if user already has a pending or approved KYC
    const existing = await c.env.DB.prepare(
      "SELECT id, status FROM kyc_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user!.id).first();

    if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
      return c.json({ 
        error: existing.status === 'approved' 
          ? "KYC already approved" 
          : "You already have a pending KYC submission" 
      }, 400);
    }

    // Insert new KYC submission
    const result = await c.env.DB.prepare(
      `INSERT INTO kyc_submissions 
        (user_id, full_name, id_proof_url, pan_card_url, experience_certificate_url, status, submitted_at) 
       VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
    ).bind(
      user!.id,
      body.full_name,
      body.id_proof_url,
      body.pan_card_url,
      body.experience_certificate_url
    ).run();

    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("Error submitting KYC:", error);
    return c.json({ error: "Failed to submit KYC" }, 500);
  }
});

app.get("/api/kyc/status", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get KYC verified status from user profile
  const profile = await c.env.DB.prepare(
    "SELECT kyc_verified FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  // Get latest KYC submission
  const kyc = await c.env.DB.prepare(
    "SELECT status, rejection_reason, submitted_at, reviewed_at FROM kyc_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(user!.id).first();

  return c.json({
    kyc_verified: profile?.kyc_verified === 1,
    kyc_submission: kyc || null
  });
});

// Admin KYC management endpoints
app.get("/api/admin/kyc", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT ks.*, 
        COALESCE(up.business_name, up.full_name, 'Unknown User') as user_name,
        up.phone as user_phone
       FROM kyc_submissions ks
       LEFT JOIN user_profiles up ON ks.user_id = up.user_id
       ORDER BY 
         CASE ks.status 
           WHEN 'pending' THEN 1 
           WHEN 'approved' THEN 2 
           WHEN 'rejected' THEN 3 
           ELSE 4 
         END,
         ks.submitted_at DESC`
    ).all();

    console.log(`[Admin KYC] Found ${results.length} KYC submission(s)`);

    return c.json(results);
  } catch (error) {
    console.error("Error fetching KYC submissions:", error);
    return c.json({ error: "Failed to fetch KYC submissions" }, 500);
  }
});

app.put("/api/admin/kyc/:id/approve", authMiddleware, adminCheckMiddleware, async (c) => {
  const kycId = c.req.param("id");
  const adminId = (c as any).get("adminId");

  try {
    const kyc = await c.env.DB.prepare(
      "SELECT user_id FROM kyc_submissions WHERE id = ?"
    ).bind(kycId).first();

    if (!kyc) {
      return c.json({ error: "KYC submission not found" }, 404);
    }

    // Update KYC status to approved
    await c.env.DB.prepare(
      "UPDATE kyc_submissions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = ? WHERE id = ?"
    ).bind(adminId, kycId).run();

    // Update user profile to mark as KYC verified
    await c.env.DB.prepare(
      "UPDATE user_profiles SET kyc_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(kyc.user_id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error approving KYC:", error);
    return c.json({ error: "Failed to approve KYC" }, 500);
  }
});

app.put("/api/admin/kyc/:id/reject", authMiddleware, adminCheckMiddleware, async (c) => {
  const kycId = c.req.param("id");
  const body = await c.req.json();
  const adminId = (c as any).get("adminId");

  if (!body.rejection_reason) {
    return c.json({ error: "Rejection reason is required" }, 400);
  }

  try {
    const kyc = await c.env.DB.prepare(
      "SELECT user_id FROM kyc_submissions WHERE id = ?"
    ).bind(kycId).first();

    if (!kyc) {
      return c.json({ error: "KYC submission not found" }, 404);
    }

    // Update KYC status to rejected
    await c.env.DB.prepare(
      "UPDATE kyc_submissions SET status = 'rejected', rejection_reason = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = ? WHERE id = ?"
    ).bind(body.rejection_reason, adminId, kycId).run();

    // Update user profile to mark as NOT KYC verified
    await c.env.DB.prepare(
      "UPDATE user_profiles SET kyc_verified = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(kyc.user_id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    return c.json({ error: "Failed to reject KYC" }, 500);
  }
});

// Admin support tickets management
app.get("/api/admin/support-tickets", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT st.*, 
        up.full_name as user_name, 
        up.patient_full_name,
        up.business_name,
        COALESCE(up.patient_contact, up.phone) as user_email,
        so.service_category as booking_service_category,
        so.service_type as booking_service_type,
        so.status as booking_status
       FROM support_tickets st
       LEFT JOIN user_profiles up ON st.user_id = up.user_id
       LEFT JOIN service_orders so ON st.booking_id = so.id
       ORDER BY 
         CASE st.status 
           WHEN 'open' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'resolved' THEN 3
           ELSE 4
         END,
         st.created_at DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return c.json({ error: "Failed to fetch support tickets" }, 500);
  }
});

app.post("/api/admin/support-tickets/:id/respond", authMiddleware, adminCheckMiddleware, async (c) => {
  const ticketId = c.req.param("id");
  const body = await c.req.json();

  if (!body.response) {
    return c.json({ error: "Response is required" }, 400);
  }

  try {
    // Update ticket with admin response and set status to in_progress
    await c.env.DB.prepare(
      "UPDATE support_tickets SET admin_response = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.response, ticketId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error responding to ticket:", error);
    return c.json({ error: "Failed to respond to ticket" }, 500);
  }
});

app.post("/api/admin/support-tickets/:id/resolve", authMiddleware, adminCheckMiddleware, async (c) => {
  const ticketId = c.req.param("id");
  const adminId = (c as any).get("adminId");

  try {
    await c.env.DB.prepare(
      "UPDATE support_tickets SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by_admin_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(adminId, ticketId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error resolving ticket:", error);
    return c.json({ error: "Failed to resolve ticket" }, 500);
  }
});

app.post("/api/admin/support-tickets/:id/reopen", authMiddleware, adminCheckMiddleware, async (c) => {
  const ticketId = c.req.param("id");

  try {
    await c.env.DB.prepare(
      "UPDATE support_tickets SET status = 'open', resolved_at = NULL, resolved_by_admin_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(ticketId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error reopening ticket:", error);
    return c.json({ error: "Failed to reopen ticket" }, 500);
  }
});

// Admin contact inquiries management
app.get("/api/admin/contact-inquiries", authMiddleware, adminCheckMiddleware, async (c) => {
  const status = c.req.query("status") || "";
  
  let query = "SELECT * FROM contact_inquiries";
  const params: string[] = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT 500";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.put("/api/admin/contact-inquiries/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const inquiryId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE contact_inquiries SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.status || "pending", body.admin_notes || null, inquiryId).run();

  return c.json({ success: true });
});

app.delete("/api/admin/contact-inquiries/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const inquiryId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM contact_inquiries WHERE id = ?").bind(inquiryId).run();

  return c.json({ success: true });
});

// Contact request endpoints
app.get("/api/contact-requests", authMiddleware, getContactRequests);
app.post("/api/contact-requests", authMiddleware, createContactRequest);
app.get("/api/contact-requests/:requestId/replies", authMiddleware, getContactRequestReplies);
app.post("/api/contact-requests/:requestId/reply", authMiddleware, createContactRequestReply);
app.delete("/api/contact-requests/:requestId", authMiddleware, deleteContactRequest);

// Global chat endpoints
app.get("/api/chat/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const scope = c.req.query("scope") || "global";

  const profile = await c.env.DB.prepare(
    "SELECT state, country, profession FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  // Get user's profession - restrict chat access to same profession only
  const userProfession = profile?.profession || "biomedical_engineer";

  let query = `SELECT gcm.*, up.full_name, up.profile_picture_url, up.country, up.state, up.email 
               FROM global_chat_messages gcm 
               LEFT JOIN user_profiles up ON gcm.user_id = up.user_id 
               WHERE gcm.chat_scope = ? AND (gcm.profession = ? OR gcm.profession IS NULL)`;
  const params: any[] = [scope, userProfession];

  if (scope === "state" && profile?.state) {
    query += " AND gcm.scope_value = ?";
    params.push(profile.state);
  } else if (scope === "country" && profile?.country) {
    query += " AND gcm.scope_value = ?";
    params.push(profile.country);
  }

  query += " ORDER BY gcm.created_at ASC LIMIT 100";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const messagesWithMetadata = await Promise.all(
    results.map(async (msg: any) => {
      const { results: reactions } = await c.env.DB.prepare(
        `SELECT emoji, COUNT(*) as count 
         FROM chat_message_reactions 
         WHERE message_id = ? 
         GROUP BY emoji`
      ).bind(msg.id).all();

      const { results: userReactions } = await c.env.DB.prepare(
        "SELECT emoji FROM chat_message_reactions WHERE message_id = ? AND user_id = ?"
      ).bind(msg.id, user!.id).all();

      const repliesCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM chat_message_replies WHERE parent_message_id = ?"
      ).bind(msg.id).first();

      return {
        ...msg,
        reactions: reactions,
        user_reactions: userReactions.map((r: any) => r.emoji),
        replies_count: repliesCount?.count || 0,
      };
    })
  );

  return c.json(messagesWithMetadata);
});

app.post("/api/chat/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const message = formData.get("message") as string;
  const chatScope = formData.get("chat_scope") as string;
  const file = formData.get("file") as File | null;

  if (!message && !file) {
    return c.json({ error: "Message or file is required" }, 400);
  }

  const profile = await c.env.DB.prepare(
    "SELECT state, country, profession FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  // Get user's profession - messages are tagged with profession
  const userProfession = profile?.profession || "biomedical_engineer";

  let scopeValue = null;
  if (chatScope === "state" && profile?.state) {
    scopeValue = profile.state;
  } else if (chatScope === "country" && profile?.country) {
    scopeValue = profile.country;
  }

  let attachmentUrl = null;
  let attachmentType = null;
  let attachmentName = null;

  if (file) {
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "file";
    const key = `chat-attachments/${user!.id}/${timestamp}.${fileExtension}`;

    await c.env.R2_BUCKET.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    attachmentUrl = `https://r2.mocha.com/${key}`;
    attachmentName = file.name;

    if (file.type.startsWith("image/")) {
      attachmentType = "image";
    } else if (file.type.startsWith("video/")) {
      attachmentType = "video";
    } else {
      attachmentType = "document";
    }
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO global_chat_messages (user_id, message, chat_scope, scope_value, attachment_url, attachment_type, attachment_name, profession) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    user!.id,
    message || " ",
    chatScope,
    scopeValue,
    attachmentUrl,
    attachmentType,
    attachmentName,
    userProfession
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

app.delete("/api/chat/messages/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const messageId = c.req.param("id");

  const message = await c.env.DB.prepare(
    "SELECT user_id, attachment_url FROM global_chat_messages WHERE id = ?"
  ).bind(messageId).first();

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  if (message.user_id !== user!.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  if (message.attachment_url) {
    const key = (message.attachment_url as string).replace("https://r2.mocha.com/", "");
    await c.env.R2_BUCKET.delete(key);
  }

  await c.env.DB.prepare("DELETE FROM chat_message_reactions WHERE message_id = ?").bind(messageId).run();
  await c.env.DB.prepare("DELETE FROM chat_message_replies WHERE parent_message_id = ?").bind(messageId).run();
  await c.env.DB.prepare("DELETE FROM global_chat_messages WHERE id = ?").bind(messageId).run();

  return c.json({ success: true });
});

app.post("/api/chat/messages/:id/react", authMiddleware, async (c) => {
  const user = c.get("user");
  const messageId = c.req.param("id");
  const body = await c.req.json();

  if (!body.emoji) {
    return c.json({ error: "Emoji is required" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM chat_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?"
  ).bind(messageId, user!.id, body.emoji).first();

  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM chat_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?"
    ).bind(messageId, user!.id, body.emoji).run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)"
    ).bind(messageId, user!.id, body.emoji).run();
  }

  return c.json({ success: true });
});

app.get("/api/chat/messages/:id/replies", authMiddleware, async (c) => {
  const messageId = c.req.param("id");

  const { results } = await c.env.DB.prepare(
    `SELECT cmr.*, up.full_name, up.profile_picture_url 
     FROM chat_message_replies cmr 
     LEFT JOIN user_profiles up ON cmr.user_id = up.user_id 
     WHERE cmr.parent_message_id = ? 
     ORDER BY cmr.created_at ASC`
  ).bind(messageId).all();

  return c.json(results);
});

app.post("/api/chat/messages/:id/reply", authMiddleware, async (c) => {
  const user = c.get("user");
  const messageId = c.req.param("id");
  const body = await c.req.json();

  if (!body.message) {
    return c.json({ error: "Message is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO chat_message_replies (parent_message_id, user_id, message) VALUES (?, ?, ?)"
  ).bind(messageId, user!.id, body.message).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Admin content approval endpoints
app.post("/api/admin/content/fetch", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    const itemsFetched = await fetchContentWithAI(c.env, "manual");
    return c.json({ success: true, items_fetched: itemsFetched });
  } catch (error) {
    console.error("Error fetching content:", error);
    return c.json({ error: "Failed to fetch content" }, 500);
  }
});

app.post("/api/admin/content/fetch-exhibitions", authMiddleware, adminCheckMiddleware, async (c) => {
  try {
    const itemsFetched = await fetchExhibitionsOnly(c.env, "manual");
    return c.json({ success: true, items_fetched: itemsFetched });
  } catch (error) {
    console.error("Error fetching exhibitions:", error);
    return c.json({ error: "Failed to fetch exhibitions" }, 500);
  }
});

app.get("/api/admin/content/pending", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM pending_content WHERE approval_status = 'pending' ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Get pending news for approval (with thumbnails)
app.get("/api/admin/content/pending-news", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM pending_content WHERE content_type = 'news' AND approval_status = 'pending' ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Get pending exhibitions for approval (with thumbnails)
app.get("/api/admin/content/pending-exhibitions", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM pending_content WHERE content_type = 'exhibition' AND approval_status = 'pending' ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/content/:id/approve", authMiddleware, adminCheckMiddleware, async (c) => {
  const contentId = c.req.param("id");

  try {
    const content = await c.env.DB.prepare(
      "SELECT * FROM pending_content WHERE id = ?"
    ).bind(contentId).first();

    if (!content) {
      return c.json({ error: "Content not found" }, 404);
    }

    if (content.content_type === "news") {
      await c.env.DB.prepare(
        "INSERT INTO news_updates (title, content, category, image_url, source_url, hashtags, published_date) VALUES (?, ?, ?, ?, ?, ?, DATE('now'))"
      ).bind(
        content.title,
        content.content,
        content.category,
        content.image_url,
        content.source_url,
        content.hashtags
      ).run();
    } else if (content.content_type === "exhibition") {
      await c.env.DB.prepare(
        "INSERT INTO medical_exhibitions (title, description, category, image_url, location, event_start_date, event_end_date, contact_number, website_url, hashtags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        content.title,
        content.description,
        content.category,
        content.image_url,
        content.location,
        content.event_start_date,
        content.event_end_date,
        content.contact_number,
        content.website_url,
        content.hashtags
      ).run();
    }

    await c.env.DB.prepare(
      "UPDATE pending_content SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(contentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error approving content:", error);
    return c.json({ error: "Failed to approve content" }, 500);
  }
});

app.put("/api/admin/content/:id/reject", authMiddleware, adminCheckMiddleware, async (c) => {
  const contentId = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE pending_content SET approval_status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.rejection_reason || "Does not meet quality standards", contentId).run();

  return c.json({ success: true });
});

app.delete("/api/admin/content/:id", authMiddleware, adminCheckMiddleware, async (c) => {
  const contentId = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM pending_content WHERE id = ?").bind(contentId).run();

  return c.json({ success: true });
});

app.get("/api/admin/content/logs", authMiddleware, adminCheckMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM content_fetch_logs ORDER BY created_at DESC LIMIT 50"
  ).all();

  return c.json(results);
});

// Dashboard stats endpoint
app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    // Get connections count (followers + following)
    const followersCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_followers WHERE following_user_id = ?"
    ).bind(user!.id).first();

    const followingCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_followers WHERE follower_user_id = ?"
    ).bind(user!.id).first();

    const connections = Number(followersCount?.count || 0) + Number(followingCount?.count || 0);

    // Get certificates count (completed courses)
    const certificatesCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM course_enrollments WHERE user_id = ? AND is_completed = 1"
    ).bind(user!.id).first();

    // Get gamification data (XP and badges)
    const gamification = await getOrCreateGamification(c.env.DB, user!.id);
    
    // Parse badges array to get count
    let badgesCount = 0;
    if (gamification.badges) {
      try {
        const badgesArray = typeof gamification.badges === 'string' 
          ? JSON.parse(gamification.badges) 
          : gamification.badges;
        badgesCount = Array.isArray(badgesArray) ? badgesArray.length : 0;
      } catch (e) {
        badgesCount = 0;
      }
    }

    return c.json({
      connections,
      certificates: certificatesCount?.count || 0,
      xp: gamification.xp || 0,
      badges: badgesCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return c.json({ 
      connections: 0,
      certificates: 0,
      xp: 0,
      badges: 0,
    }, 200);
  }
});

// Gamification endpoints
app.get("/api/gamification", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const data = await getOrCreateGamification(c.env.DB, user!.id);
    return c.json(data);
  } catch (error) {
    console.error("Error fetching gamification data:", error);
    return c.json({ error: "Failed to fetch gamification data" }, 500);
  }
});

app.post("/api/gamification/add-xp", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.amount || body.amount <= 0) {
    return c.json({ error: "Valid XP amount is required" }, 400);
  }

  if (!body.reason) {
    return c.json({ error: "Reason is required" }, 400);
  }

  try {
    const result = await addXP(c.env.DB, user!.id, body.amount, body.reason, body.metadata);
    return c.json(result);
  } catch (error) {
    console.error("Error adding XP:", error);
    return c.json({ error: "Failed to add XP" }, 500);
  }
});

app.get("/api/gamification/badges", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const badges = await getUserBadges(c.env.DB, user!.id);
    return c.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return c.json({ error: "Failed to fetch badges" }, 500);
  }
});

app.get("/api/gamification/recent-xp", authMiddleware, async (c) => {
  const user = c.get("user");
  const limit = parseInt(c.req.query("limit") || "10");

  try {
    const events = await getRecentXPEvents(c.env.DB, user!.id, limit);
    return c.json({ events });
  } catch (error) {
    console.error("Error fetching XP events:", error);
    return c.json({ error: "Failed to fetch XP events" }, 500);
  }
});

// Chatbot endpoint - Career Advisor
app.post("/api/chatbot/message", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.message) {
    return c.json({ error: "Message is required" }, 400);
  }

  try {
    // Gather user context for personalized career advice
    const profile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user!.id).first();

    // Get user's specialities
    const { results: specialities } = await c.env.DB.prepare(
      `SELECT s.name FROM user_specialities us
       JOIN specialities s ON us.speciality_id = s.id
       WHERE us.user_id = ?`
    ).bind(user!.id).all();

    // Get current streak
    const streak = await c.env.DB.prepare(
      "SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?"
    ).bind(user!.id).first();

    // Get latest weekly report
    const weeklyReport = await c.env.DB.prepare(
      "SELECT * FROM weekly_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user!.id).first();

    // Get course enrollments and progress
    const { results: courses } = await c.env.DB.prepare(
      `SELECT lc.title, lc.category, ucp.progress_percentage, ucp.is_completed
       FROM course_enrollments ce
       JOIN learning_courses lc ON ce.course_id = lc.id
       LEFT JOIN user_course_progress ucp ON ce.course_id = ucp.course_id AND ucp.user_id = ce.user_id
       WHERE ce.user_id = ?
       ORDER BY ce.enrollment_date DESC LIMIT 5`
    ).bind(user!.id).all();

    // Get today's pending actions
    const today = new Date().toISOString().split('T')[0];
    const { results: todaysActions } = await c.env.DB.prepare(
      `SELECT da.title, da.action_type, 
       CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
       FROM daily_actions da
       LEFT JOIN completed_actions ca ON da.id = ca.action_id AND ca.user_id = da.user_id
       WHERE da.user_id = ? AND da.action_date = ?`
    ).bind(user!.id, today).all();

    // Get network stats
    const followersCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_followers WHERE following_user_id = ?"
    ).bind(user!.id).first();

    const followingCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_followers WHERE follower_user_id = ?"
    ).bind(user!.id).first();

    // Build user context
    const userContext = {
      account_type: profile?.account_type || "individual",
      specialization: profile?.specialisation || specialities.map((s: any) => s.name).join(", ") || "biomedical engineering",
      experience: profile?.experience || "Not specified",
      location: `${profile?.city || ""}${profile?.city && profile?.country ? ", " : ""}${profile?.country || ""}`.trim() || "Not specified",
      is_open_to_work: profile?.is_open_to_work,
      current_streak: streak?.current_streak || 0,
      longest_streak: streak?.longest_streak || 0,
      engagement_score: weeklyReport?.engagement_score || 0,
      completed_courses: courses.filter((c: any) => c.is_completed).length,
      in_progress_courses: courses.filter((c: any) => !c.is_completed).length,
      todays_actions_completed: todaysActions.filter((a: any) => a.is_completed).length,
      todays_actions_total: todaysActions.length,
      network_followers: followersCount?.count || 0,
      network_following: followingCount?.count || 0,
    };

    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Different advisor roles for business vs individual users
    const isBusiness = userContext.account_type === "business";
    
    const systemPrompt = isBusiness ? `You are a highly skilled Business Advisor for biomedical engineering companies on the Mavy platform. Your role is to provide strategic business guidance, growth strategies, market insights, and operational recommendations.

## COMPANY PROFILE CONTEXT
- Business Type: ${userContext.account_type}
- Specialization: ${userContext.specialization}
- Location: ${userContext.location}

## BUSINESS ACTIVITY & ENGAGEMENT
- Current Streak: ${userContext.current_streak} days (Best: ${userContext.longest_streak} days)
- Engagement Score: ${userContext.engagement_score}/100
- Network: ${userContext.network_followers} followers, ${userContext.network_following} following

${weeklyReport ? `
## RECENT WEEKLY INSIGHTS
${weeklyReport.ai_summary}

Recommendations:
${weeklyReport.ai_recommendations ? JSON.parse(weeklyReport.ai_recommendations as string).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') : 'None available'}
` : ''}

## YOUR EXPERTISE AREAS

### Business Growth & Strategy
- Analyze market opportunities and expansion potential
- Identify target customer segments and market positioning
- Provide competitive analysis and differentiation strategies
- Help develop business development plans
- Guide on pricing strategies and revenue models

### Operations & Management
- Recommend process optimization strategies
- Advise on supply chain and inventory management
- Suggest technology adoption for business efficiency
- Guide on quality management and compliance
- Help with resource allocation and capacity planning

### Sales & Marketing
- Develop lead generation strategies
- Recommend marketing channels for biomedical products
- Guide on trade show and exhibition participation
- Advise on digital marketing and online presence
- Help build brand awareness in the medical device industry

### Industry Insights & Trends
- Explain regulatory landscape (FDA, CE, CDSCO, etc.)
- Discuss emerging technologies and market trends
- Provide insights on healthcare industry developments
- Share knowledge about procurement processes
- Advise on partnerships and collaborations

### Financial Planning
- Guide on investment priorities and capital allocation
- Advise on cost optimization strategies
- Help with pricing and margin analysis
- Recommend financial planning approaches
- Discuss funding and investment opportunities

### Networking & Partnerships
- Suggest strategic partnerships and alliances
- Recommend industry events and exhibitions
- Guide on building relationships with hospitals and clinics
- Advise on distributor and dealer networks
- Help expand market reach

## COMMUNICATION STYLE
- Be professional and results-oriented
- Use specific examples relevant to biomedical device businesses
- Provide actionable business strategies, not generic advice
- Reference actual business metrics when available
- Ask clarifying questions about business goals
- Keep responses concise (under 300 words) unless detailed analysis is requested

## SPECIAL FOCUS AREAS
- Focus on revenue growth and market expansion strategies
- Emphasize relationship building with key stakeholders
- Connect advice to their specific product specialization
- Recommend leveraging the platform for business development
- Guide on regulatory compliance and quality standards

Remember: You're advising a business entity, not an individual professional. Focus on company growth, market position, operational efficiency, and revenue generation.` 
    : `You are a highly skilled Career Advisor for biomedical engineering professionals on the Mavy platform. Your role is to provide personalized career guidance, skill development recommendations, and professional growth strategies.

## USER PROFILE CONTEXT
- Account Type: ${userContext.account_type}
- Specialization: ${userContext.specialization}
- Experience: ${userContext.experience}
- Location: ${userContext.location}
- Open to Work: ${userContext.is_open_to_work ? "Yes" : "No"}

## USER ACTIVITY & PROGRESS
- Current Streak: ${userContext.current_streak} days (Best: ${userContext.longest_streak} days)
- Engagement Score: ${userContext.engagement_score}/100
- Completed Courses: ${userContext.completed_courses}
- In-Progress Courses: ${userContext.in_progress_courses}
- Today's Actions: ${userContext.todays_actions_completed}/${userContext.todays_actions_total} completed
- Network: ${userContext.network_followers} followers, ${userContext.network_following} following

${weeklyReport ? `
## RECENT WEEKLY INSIGHTS
${weeklyReport.ai_summary}

Recommendations:
${weeklyReport.ai_recommendations ? JSON.parse(weeklyReport.ai_recommendations as string).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') : 'None available'}
` : ''}

## YOUR EXPERTISE AREAS

### Career Development
- Analyze user's career trajectory and suggest next steps
- Identify skill gaps and recommend learning paths
- Provide job search strategies based on specialization
- Suggest networking opportunities and connections
- Help set realistic career goals and milestones

### Skill Enhancement
- Recommend specific courses from the Learning Center
- Suggest certifications relevant to their field
- Identify trending skills in biomedical engineering
- Advise on technical vs soft skill development balance

### Industry Insights
- Explain current trends in medical devices and healthcare technology
- Discuss emerging technologies (AI in healthcare, IoT medical devices, etc.)
- Provide insights on market demand for specific specializations
- Share knowledge about regulatory requirements and standards

### Professional Growth
- Help build personal brand and online presence
- Suggest content creation ideas for the News Feed
- Recommend professional development activities
- Guide on attending relevant exhibitions and conferences

### Action Planning
- Break down career goals into actionable daily tasks
- Connect recommendations with the daily action feed
- Provide specific, measurable, achievable steps
- Help prioritize activities based on career objectives

## COMMUNICATION STYLE
- Be encouraging and supportive, but realistic
- Use specific examples relevant to biomedical engineering
- Provide actionable advice, not generic platitudes
- Reference the user's actual data and progress
- Ask clarifying questions when needed
- Keep responses concise (under 300 words) unless detailed explanation is requested

## SPECIAL FOCUS AREAS
- If user is "open to work", emphasize job search strategies
- If streak is low, encourage consistent engagement
- If few courses enrolled, suggest relevant learning paths
- If small network, recommend networking strategies
- Connect advice to their specific specialization

Remember: You have access to their real data. Use it to provide genuinely personalized, relevant guidance that helps them advance their biomedical engineering career.`;

    const conversationHistory = (body.conversation_history || [])
      .slice(-8)
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

    const result = await model.generateContent({
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: body.message }]
        }
      ],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
      }
    });

    const response = result.response.text();

    // Award XP for meaningful question (more than 6 words)
    if (body.message.split(/\s+/).length > 6) {
      await addXP(c.env.DB, user!.id, 5, "advisor_question", { question: body.message.substring(0, 100) });
    }

    return c.json({ response });
  } catch (error) {
    console.error("Chatbot error:", error);
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

// Admin analytics endpoints
app.get("/api/admin/analytics", authMiddleware, adminCheckMiddleware, async (c) => {
  const range = c.req.query("range") || "30d";
  
  try {
    const analytics = await calculateAnalytics(c.env.DB, range);
    return c.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

app.get("/api/admin/analytics/export", authMiddleware, adminCheckMiddleware, async (c) => {
  const format = c.req.query("format") || "csv";
  const range = c.req.query("range") || "30d";
  
  try {
    const analytics = await calculateAnalytics(c.env.DB, range);
    
    if (format === "csv") {
      const csv = generateCSV(analytics);
      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().split("T")[0]}.csv"`,
      });
    } else {
      // For PDF, just return CSV for now (can be enhanced later)
      const csv = generateCSV(analytics);
      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().split("T")[0]}.csv"`,
      });
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return c.json({ error: "Failed to export analytics" }, 500);
  }
});

async function fetchAndStoreNews(env: Env) {
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
    });

    const prompt = `You are a news curator specializing in biomedical engineering and clinical engineering. Generate 5 current, relevant news updates about recent developments, innovations, research, or industry trends in these fields.

Generate 5 diverse news updates for biomedical engineering and clinical engineering professionals. Each update should:
1. Have a compelling, informative title
2. Include detailed content (2-3 paragraphs)
3. Be categorized appropriately (Technology, Healthcare, Industry, Events, or Research)
4. Include a realistic source URL from reputable sources
5. Have today's date (2025-11-21) as the published date

Focus on topics like: medical device innovations, FDA approvals, hospital technology upgrades, AI in healthcare, telemedicine advances, surgical robotics, patient monitoring systems, imaging technologies, regulatory updates, and professional development opportunities.

Return ONLY a valid JSON object with a "news" array containing news objects with these exact keys: title, content, category, source_url, published_date (YYYY-MM-DD format). Do not include any other text, markdown formatting, or code blocks.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Validate and parse JSON
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error("No JSON object found in response:", responseText.substring(0, 200));
        throw new Error("AI returned invalid response format");
      }
    } catch (parseError) {
      console.error("Failed to parse news response:", responseText.substring(0, 200));
      throw new Error("AI returned invalid JSON format");
    }
    
    const newsItems = parsed.news || [];

    for (const item of newsItems) {
      await env.DB.prepare(
        "INSERT INTO news_updates (title, content, category, source_url, published_date) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(
          item.title,
          item.content,
          item.category,
          item.source_url,
          item.published_date
        )
        .run();
    }

    console.log(`Successfully added ${newsItems.length} news updates`);
  } catch (error) {
    console.error("Error fetching and storing news:", error);
  }
}

async function cleanupOldExhibitions(env: Env): Promise<void> {
  try {
    // Delete exhibitions that ended more than 1 day ago
    const result = await env.DB.prepare(
      `DELETE FROM medical_exhibitions 
       WHERE event_end_date IS NOT NULL 
       AND event_end_date < DATE('now', '-1 day')`
    ).run();
    
    if (result.meta.changes && result.meta.changes > 0) {
      console.log(`[Scheduled Cleanup] Deleted ${result.meta.changes} old exhibition(s)`);
    }
  } catch (error) {
    console.error("[Scheduled Cleanup] Error cleaning up old exhibitions:", error);
  }
}

// Notification endpoints
app.get("/api/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  const unreadOnly = c.req.query("unread") === "true";

  let query = `SELECT * FROM notifications WHERE user_id = ?`;
  if (unreadOnly) {
    query += " AND is_read = 0";
  }
  query += " ORDER BY created_at DESC LIMIT 50";

  const { results } = await c.env.DB.prepare(query).bind(user!.id).all();

  return c.json(results);
});

app.get("/api/notifications/unread-count", authMiddleware, async (c) => {
  const user = c.get("user");

  const result = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
  ).bind(user!.id).first();

  return c.json({ count: result?.count || 0 });
});

app.post("/api/notifications/:id/read", authMiddleware, async (c) => {
  const user = c.get("user");
  const notificationId = c.req.param("id");

  await c.env.DB.prepare(
    "UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
  ).bind(notificationId, user!.id).run();

  return c.json({ success: true });
});

app.post("/api/notifications/read-all", authMiddleware, async (c) => {
  const user = c.get("user");

  await c.env.DB.prepare(
    "UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0"
  ).bind(user!.id).run();

  return c.json({ success: true });
});

// Helper function to create notifications (used internally)
async function createNotification(
  db: D1Database,
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedOrderId?: number
) {
  await db.prepare(
    "INSERT INTO notifications (user_id, type, title, message, related_order_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(userId, type, title, message, relatedOrderId || null).run();
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Check and auto-fetch content every 6 hours if no manual fetch
    ctx.waitUntil(checkAndAutoFetch(env));
    
    // Clean up old exhibitions daily
    ctx.waitUntil(cleanupOldExhibitions(env));
  },
};
