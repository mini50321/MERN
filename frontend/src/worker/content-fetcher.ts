import { GoogleGenerativeAI } from "@google/generative-ai";

interface FetchedContent {
  type: "news" | "exhibition";
  title: string;
  description?: string;
  content?: string;
  category?: string;
  location?: string;
  event_start_date?: string;
  event_end_date?: string;
  contact_number?: string;
  website_url?: string;
  hashtags?: string;
  source_url?: string;
}

async function safeGenerateContent(model: any, prompt: string, contentType: string): Promise<string | null> {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const text = result.response.text();
    
    // Check if response starts with HTML
    if (text.trim().startsWith('<') || text.trim().startsWith('<!')) {
      console.error(`AI returned HTML instead of JSON for ${contentType}:`, text.substring(0, 200));
      return null;
    }
    
    // Try to extract JSON if it's wrapped in markdown
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Validate it's actually JSON
    JSON.parse(jsonText);
    return jsonText;
  } catch (error) {
    console.error(`Error generating ${contentType}:`, error);
    return null;
  }
}

export async function fetchContentWithAI(env: Env, triggerType: "manual" | "auto"): Promise<number> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let itemsFetched = 0;

  try {
    // Fetch News using Gemini (defaults to Biomedical Engineering, but can be customized)
    const newsPrompt = `You are a news curator for healthcare professionals including biomedical engineers, doctors, nurses, pharmacists, and physiotherapists. Generate 3 current, relevant news updates about recent developments in healthcare and medical technology.

CRITICAL: Today's date is ${new Date().toISOString().split('T')[0]}. Generate ONLY RECENT news from the last 7 days. NO old news from 2024 or earlier.

Each news item should:
1. Have a compelling, specific title about RECENT developments
2. Include detailed content (2-3 paragraphs, 200-300 words) about current/recent events
3. Be categorized (Technology, Healthcare, Industry, Events, or Research)
4. Include a realistic source URL from reputable sources
5. Include 2-3 relevant hashtags (comma-separated, no # symbol)
6. Have recent published_date (within last 7 days, formatted YYYY-MM-DD)
7. Focus on news from ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}

Focus on topics relevant to multiple healthcare professions: medical device innovations, FDA approvals, hospital technology, AI in healthcare, surgical robotics, patient monitoring, imaging technologies, regulatory updates, pharmaceutical advances, nursing technology, rehabilitation equipment, and clinical best practices.

Return ONLY a valid JSON object with a "news" array. Each news object must have: title, content, category, source_url, hashtags.`;

    const newsText = await safeGenerateContent(model, newsPrompt, "news");
    
    if (!newsText) {
      console.log("Failed to generate news content, skipping news fetch");
      // Continue to exhibitions instead of failing completely
    }
    
    let newsItems: FetchedContent[] = [];
    if (newsText) {
      try {
        const newsData = JSON.parse(newsText);
        newsItems = newsData.news || [];
      } catch (parseError) {
        console.error("Failed to parse news data:", parseError);
      }
    }

    // Fetch Exhibitions using Gemini
    const exhibitionsPrompt = `You are an events curator for healthcare professionals including biomedical engineers, doctors, nurses, pharmacists, and physiotherapists. Generate 2 upcoming medical/healthcare exhibitions, conferences, or trade shows.

CRITICAL: ALL exhibitions MUST be UPCOMING events. Today's date is ${new Date().toISOString().split('T')[0]}. Generate ONLY future events.

Each exhibition should:
1. Have a professional title
2. Include detailed description (2-3 paragraphs)
3. Be categorized (Conference, Trade Show, Medical Exhibition, or Workshop)
4. Include realistic location (city, country)
5. Include FUTURE dates ONLY (start and end date in YYYY-MM-DD format, between ${new Date().toISOString().split('T')[0]} and ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})
6. event_start_date MUST be >= ${new Date().toISOString().split('T')[0]}
7. Include contact number (format: +1-XXX-XXX-XXXX)
8. Include website URL
9. Include 2-3 relevant hashtags (comma-separated, no # symbol)

Focus on: biomedical engineering conferences, medical device exhibitions, healthcare technology shows, clinical engineering events, nursing conferences, pharmaceutical summits, physiotherapy workshops, and medical education events.

Return ONLY a valid JSON object with an "exhibitions" array. Each exhibition object must have: title, description, category, location, event_start_date, event_end_date, contact_number, website_url, hashtags.`;

    const exhibitionsText = await safeGenerateContent(model, exhibitionsPrompt, "exhibitions");
    
    if (!exhibitionsText) {
      console.log("Failed to generate exhibitions content, skipping exhibitions fetch");
    }
    
    let exhibitionItems: FetchedContent[] = [];
    if (exhibitionsText) {
      try {
        const exhibitionsData = JSON.parse(exhibitionsText);
        exhibitionItems = exhibitionsData.exhibitions || [];
      } catch (parseError) {
        console.error("Failed to parse exhibitions data:", parseError);
      }
    }

    // Process and store news items
    for (const item of newsItems) {
      try {
        // Check if title already exists in news_updates or pending_content
        const existingNews = await env.DB.prepare(
          `SELECT id FROM news_updates WHERE title = ? LIMIT 1`
        ).bind(item.title).first();

        const pendingNews = await env.DB.prepare(
          `SELECT id FROM pending_content WHERE content_type = 'news' AND title = ? LIMIT 1`
        ).bind(item.title).first();

        if (existingNews || pendingNews) {
          console.log(`Skipping duplicate news: ${item.title}`);
          continue;
        }

        // Use a placeholder image URL or generate one (Gemini doesn't have built-in image generation in the same way)
        const imageUrl = `https://source.unsplash.com/1024x1024/?medical,technology,${encodeURIComponent(item.category || 'healthcare')}`;

        // Store in pending_content
        await env.DB.prepare(
          `INSERT INTO pending_content 
          (content_type, title, content, category, image_url, source_url, hashtags, fetched_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          "news",
          item.title,
          item.content,
          item.category,
          imageUrl,
          item.source_url,
          item.hashtags,
          triggerType
        ).run();

        itemsFetched++;
      } catch (error) {
        console.error("Error processing news item:", error);
      }
    }

    // Process and store exhibition items
    for (const item of exhibitionItems) {
      try {
        // Check if title already exists in medical_exhibitions or pending_content
        const existingExhibition = await env.DB.prepare(
          `SELECT id FROM medical_exhibitions WHERE title = ? LIMIT 1`
        ).bind(item.title).first();

        const pendingExhibition = await env.DB.prepare(
          `SELECT id FROM pending_content WHERE content_type = 'exhibition' AND title = ? LIMIT 1`
        ).bind(item.title).first();

        if (existingExhibition || pendingExhibition) {
          console.log(`Skipping duplicate exhibition: ${item.title}`);
          continue;
        }

        // Use a placeholder image URL for exhibitions
        const imageUrl = `https://source.unsplash.com/1024x1024/?conference,medical,exhibition`;

        // Store in pending_content
        await env.DB.prepare(
          `INSERT INTO pending_content 
          (content_type, title, description, category, image_url, location, event_start_date, event_end_date, contact_number, website_url, hashtags, fetched_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          "exhibition",
          item.title,
          item.description,
          item.category,
          imageUrl,
          item.location,
          item.event_start_date,
          item.event_end_date,
          item.contact_number,
          item.website_url,
          item.hashtags,
          triggerType
        ).run();

        itemsFetched++;
      } catch (error) {
        console.error("Error processing exhibition item:", error);
      }
    }

    // Log the fetch
    await env.DB.prepare(
      `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status) 
      VALUES (?, ?, ?, ?)`
    ).bind("both", triggerType, itemsFetched, "success").run();

    return itemsFetched;
  } catch (error: any) {
    console.error("Error in fetchContentWithAI:", error);
    
    // Check if it's a quota error
    const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests');
    const errorMessage = isQuotaError 
      ? "API quota exceeded. Please try again later or upgrade your API plan." 
      : (error instanceof Error ? error.message : "Unknown error");
    
    await env.DB.prepare(
      `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status, error_message) 
      VALUES (?, ?, ?, ?, ?)`
    ).bind("both", triggerType, 0, "error", errorMessage).run();

    throw new Error(errorMessage);
  }
}

export async function fetchExhibitionsOnly(env: Env, triggerType: "manual" | "auto"): Promise<number> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let itemsFetched = 0;

  try {
    // Fetch Exhibitions using Gemini - focused on global healthcare/medical events
    const exhibitionsPrompt = `You are an international events curator specializing in healthcare and medical technology. Generate 5 upcoming medical exhibitions, conferences, and trade shows from around the globe that would interest biomedical engineers, doctors, nurses, pharmacists, and physiotherapists.

CRITICAL REQUIREMENT: Today's date is ${new Date().toISOString().split('T')[0]}. Generate ONLY UPCOMING events with dates in the FUTURE. DO NOT generate any events from the past or 2024.

IMPORTANT: Focus on REAL, well-known biomedical/medical device events. Include major international exhibitions from different continents.

Each exhibition should:
1. Have a professional, realistic title (use actual event names when possible)
2. Include detailed description (2-3 paragraphs, 150-200 words) covering:
   - Event focus and themes
   - Expected attendees and exhibitors
   - Key topics and technologies featured
3. Be categorized as one of: Medical Devices Exhibition, Biomedical Conference, Healthcare Technology Show, Clinical Engineering Summit, or Medical Trade Fair
4. Include realistic location with full details: "City, State/Province, Country" (ensure geographic diversity - cover Asia, Europe, Americas, Middle East)
5. Include FUTURE dates ONLY (start date between ${new Date().toISOString().split('T')[0]} and ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})
6. event_start_date MUST be >= ${new Date().toISOString().split('T')[0]} (no past events!)
7. Include international phone format: +[country code]-XXX-XXX-XXXX
8. Include realistic website URL (use .com, .org, or country-specific domains)
9. Include venue name (e.g., "Las Vegas Convention Center", "NEC Birmingham", "Dubai World Trade Centre")
10. Include organizer name (make it sound professional and realistic)
11. Include 3-5 relevant hashtags (comma-separated, no # symbol) like: Medtech, BiomedicalEngineering, HealthcareTechnology, MedicalDevices, etc.

Focus on major themes: Medical device innovations, surgical equipment, diagnostic technology, patient monitoring systems, imaging equipment, hospital technology, regulatory compliance, AI in healthcare, telemedicine, wearable devices.

Return ONLY a valid JSON object with an "exhibitions" array. Each exhibition object must have: title, description, category, city, state, country, location (full formatted), event_start_date, event_end_date, venue_name, organizer_name, contact_number, website_url, hashtags.`;

    const exhibitionsText = await safeGenerateContent(model, exhibitionsPrompt, "exhibitions");
    
    if (!exhibitionsText) {
      console.log("Failed to generate exhibitions content");
      await env.DB.prepare(
        `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status, error_message) 
        VALUES (?, ?, ?, ?, ?)`
      ).bind("exhibitions", triggerType, 0, "error", "AI returned invalid response format").run();
      return 0;
    }
    
    let exhibitionItems: any[] = [];
    try {
      const exhibitionsData = JSON.parse(exhibitionsText);
      exhibitionItems = exhibitionsData.exhibitions || [];
    } catch (parseError) {
      console.error("Failed to parse exhibitions data:", parseError);
      await env.DB.prepare(
        `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status, error_message) 
        VALUES (?, ?, ?, ?, ?)`
      ).bind("exhibitions", triggerType, 0, "error", "Failed to parse AI response").run();
      return 0;
    }

    // Process and store exhibition items
    for (const item of exhibitionItems) {
      try {
        // Check if title already exists in medical_exhibitions or pending_content
        const existingExhibition = await env.DB.prepare(
          `SELECT id FROM medical_exhibitions WHERE title = ? LIMIT 1`
        ).bind(item.title).first();

        const pendingExhibition = await env.DB.prepare(
          `SELECT id FROM pending_content WHERE content_type = 'exhibition' AND title = ? LIMIT 1`
        ).bind(item.title).first();

        if (existingExhibition || pendingExhibition) {
          console.log(`Skipping duplicate exhibition: ${item.title}`);
          continue;
        }

        // Use a themed placeholder image for exhibitions
        const imageUrl = `https://source.unsplash.com/1024x1024/?medical,conference,exhibition,technology`;

        // Format location properly
        const location = item.location || `${item.city || ''}, ${item.state || ''}, ${item.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');

        // Store in pending_content
        await env.DB.prepare(
          `INSERT INTO pending_content 
          (content_type, title, description, category, image_url, location, event_start_date, event_end_date, contact_number, website_url, hashtags, fetched_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          "exhibition",
          item.title,
          item.description,
          item.category,
          imageUrl,
          location,
          item.event_start_date,
          item.event_end_date,
          item.contact_number,
          item.website_url,
          item.hashtags,
          triggerType
        ).run();

        itemsFetched++;
      } catch (error) {
        console.error("Error processing exhibition item:", error);
      }
    }

    // Log the fetch
    await env.DB.prepare(
      `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status) 
      VALUES (?, ?, ?, ?)`
    ).bind("exhibitions", triggerType, itemsFetched, "success").run();

    return itemsFetched;
  } catch (error: any) {
    console.error("Error in fetchExhibitionsOnly:", error);
    
    // Check if it's a quota error
    const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests');
    const errorMessage = isQuotaError 
      ? "API quota exceeded. Please try again later or upgrade your API plan." 
      : (error instanceof Error ? error.message : "Unknown error");
    
    await env.DB.prepare(
      `INSERT INTO content_fetch_logs (fetch_type, trigger_type, items_fetched, status, error_message) 
      VALUES (?, ?, ?, ?, ?)`
    ).bind("exhibitions", triggerType, 0, "error", errorMessage).run();

    throw new Error(errorMessage);
  }
}

export async function checkAndAutoFetch(env: Env): Promise<boolean> {
  // Check if there has been a fetch in the last 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  const recentFetch = await env.DB.prepare(
    "SELECT id FROM content_fetch_logs WHERE created_at > ? ORDER BY created_at DESC LIMIT 1"
  ).bind(sixHoursAgo).first();

  if (!recentFetch) {
    // No recent fetch, trigger auto-fetch
    try {
      await fetchContentWithAI(env, "auto");
      return true;
    } catch (error) {
      console.error("Auto-fetch failed:", error);
      return false;
    }
  }

  return false;
}
