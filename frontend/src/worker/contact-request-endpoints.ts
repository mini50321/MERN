import { Context } from "hono";

export async function getContactRequests(c: Context) {
  const db = c.env.DB;
  const scope = c.req.query("scope") || "global";
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let profile;
  try {
    const profileResult = await db
      .prepare("SELECT state, country, profession FROM user_profiles WHERE user_id = ?")
      .bind(user.id)
      .first();
    profile = profileResult;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }

  let query = `
    SELECT 
      cr.*,
      up.full_name,
      up.profile_picture_url,
      (SELECT COUNT(*) FROM contact_request_replies WHERE request_id = cr.id) as replies_count
    FROM contact_requests cr
    LEFT JOIN user_profiles up ON cr.user_id = up.user_id
    WHERE cr.chat_scope = ?
  `;

  const params: any[] = [scope];

  if (scope === "state" && profile?.state) {
    query += " AND cr.scope_value = ?";
    params.push(profile.state);
  } else if (scope === "country" && profile?.country) {
    query += " AND cr.scope_value = ?";
    params.push(profile.country);
  }

  if (profile?.profession) {
    query += " AND EXISTS (SELECT 1 FROM user_profiles WHERE user_id = cr.user_id AND profession = ?)";
    params.push(profile.profession);
  }

  query += " ORDER BY cr.created_at DESC LIMIT 100";

  try {
    const result = await db.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching contact requests:", error);
    return c.json({ error: "Failed to fetch contact requests" }, 500);
  }
}

export async function createContactRequest(c: Context) {
  const db = c.env.DB;
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { company_name, hospital_name, location, description, chat_scope } = body;

  if (!company_name || !chat_scope) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  let scopeValue = null;
  if (chat_scope !== "global") {
    try {
      const profile = await db
        .prepare("SELECT state, country FROM user_profiles WHERE user_id = ?")
        .bind(user.id)
        .first();

      if (chat_scope === "state") {
        scopeValue = profile?.state;
      } else if (chat_scope === "country") {
        scopeValue = profile?.country;
      }
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  }

  try {
    await db
      .prepare(`
        INSERT INTO contact_requests (
          user_id, company_name, hospital_name, location, description,
          chat_scope, scope_value, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
      `)
      .bind(
        user.id,
        company_name,
        hospital_name || null,
        location || null,
        description || null,
        chat_scope,
        scopeValue
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error creating contact request:", error);
    return c.json({ error: "Failed to create contact request" }, 500);
  }
}

export async function getContactRequestReplies(c: Context) {
  const db = c.env.DB;
  const requestId = c.req.param("requestId");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await db
      .prepare(`
        SELECT 
          crr.*,
          up.full_name,
          up.profile_picture_url
        FROM contact_request_replies crr
        LEFT JOIN user_profiles up ON crr.user_id = up.user_id
        WHERE crr.request_id = ?
        ORDER BY crr.created_at ASC
      `)
      .bind(requestId)
      .all();

    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return c.json({ error: "Failed to fetch replies" }, 500);
  }
}

export async function createContactRequestReply(c: Context) {
  const db = c.env.DB;
  const requestId = c.req.param("requestId");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { contact_name, contact_phone, contact_email, contact_designation, additional_notes } = body;

  if (!contact_name || (!contact_phone && !contact_email)) {
    return c.json({ error: "Contact name and at least one contact method required" }, 400);
  }

  try {
    await db
      .prepare(`
        INSERT INTO contact_request_replies (
          request_id, user_id, contact_name, contact_phone, contact_email,
          contact_designation, additional_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        requestId,
        user.id,
        contact_name,
        contact_phone || null,
        contact_email || null,
        contact_designation || null,
        additional_notes || null
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error creating reply:", error);
    return c.json({ error: "Failed to create reply" }, 500);
  }
}

export async function deleteContactRequest(c: Context) {
  const db = c.env.DB;
  const requestId = c.req.param("requestId");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Verify ownership
    const request = await db
      .prepare("SELECT user_id FROM contact_requests WHERE id = ?")
      .bind(requestId)
      .first();

    if (!request || request.user_id !== user.id) {
      return c.json({ error: "Not authorized to delete this request" }, 403);
    }

    // Delete replies first
    await db
      .prepare("DELETE FROM contact_request_replies WHERE request_id = ?")
      .bind(requestId)
      .run();

    // Delete request
    await db
      .prepare("DELETE FROM contact_requests WHERE id = ?")
      .bind(requestId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting request:", error);
    return c.json({ error: "Failed to delete request" }, 500);
  }
}
