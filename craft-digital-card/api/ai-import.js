// Use Node.js runtime (not Edge) for Firebase Admin
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

import admin from 'firebase-admin';

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Allowed origins (add your domains)
  allowedOrigins: [
    'https://digital-business-cards-lilac.vercel.app',
    'http://localhost:5173',  // Local dev - remove in production if not needed
    'http://localhost:3000',
  ],
  
  // Rate limiting
  rateLimit: {
    maxRequests: 10,      // Max requests per window
    windowHours: 24,      // Time window in hours
  },
  
  // Input limits
  input: {
    minLength: 50,
    maxLength: 15000,
  },
};

// ==================== FIREBASE INIT ====================
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,  // Uses existing env var
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// ==================== HELPER FUNCTIONS ====================

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (CONFIG.allowedOrigins.includes(origin)) {
    return origin;
  }
  return CONFIG.allowedOrigins[0]; // Default to primary domain
}

function setCorsHeaders(req, res) {
  const origin = getCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
}

async function checkRateLimit(userId) {
  const rateLimitRef = db.collection('rateLimits').doc(userId);
  const now = Date.now();
  const windowMs = CONFIG.rateLimit.windowHours * 60 * 60 * 1000;
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // First request ever
        transaction.set(rateLimitRef, {
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - 1 };
      }
      
      const data = doc.data();
      const windowStart = data.windowStart;
      
      // Check if window has expired
      if (now - windowStart > windowMs) {
        // Reset window
        transaction.update(rateLimitRef, {
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - 1 };
      }
      
      // Within current window
      if (data.count >= CONFIG.rateLimit.maxRequests) {
        const resetTime = new Date(windowStart + windowMs);
        return { 
          allowed: false, 
          remaining: 0,
          resetAt: resetTime.toISOString(),
        };
      }
      
      // Increment counter
      transaction.update(rateLimitRef, {
        count: data.count + 1,
        lastRequest: now,
      });
      
      return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - data.count - 1 };
    });
    
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail CLOSED - deny request if we can't verify rate limit
    return { allowed: false, remaining: 0, error: true };
  }
}

async function logRequest(userId, status, metadata = {}) {
  try {
    await db.collection('aiImportLogs').add({
      userId,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

function sanitizeInput(text) {
  return text
    .replace(/<[^>]*>/g, ' ')                         // Remove HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/\s+/g, ' ')                             // Normalize whitespace
    .trim()
    .slice(0, CONFIG.input.maxLength);
}

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `You are creating a digital business card. Extract info into SHORT phrases (3-5 words max).

Return ONLY valid JSON with no markdown, no backticks, no explanation:
{
  "name": "Full Name",
  "title": "Job Title",
  "altTitle": "Company",
  "tagline": "Short tagline in quotes",
  "altTagline": "Secondary phrase",
  "email": "email@example.com",
  "phone": "+1 555 000 0000",
  "location": "City, Country",
  "linkUrl": "website.com",
  "onlineLinks": ["linkedin.com/in/xxx", "github.com/xxx"],
  "sections": {
    "front1": { "title": "Experience", "items": ["Role at Company", "Role at Company"] },
    "front2": { "title": "Focus", "items": ["Area 1", "Area 2", "Area 3"] },
    "back3": { "title": "Services", "items": ["Service 1", "Service 2"] },
    "back4": { "title": "Interests", "items": ["Interest 1", "Interest 2"] },
    "back5": { "title": "Achievements", "items": ["Award 1", "Award 2"] },
    "skills1": { "title": "Languages", "items": ["Skill1", "Skill2", "Skill3"] },
    "skills2": { "title": "Frameworks", "items": ["Tool1", "Tool2", "Tool3"] },
    "skills3": { "title": "Expertise", "items": ["Domain1", "Domain2"] }
  }
}

Rules:
- Keep all items SHORT (3-5 words max)
- Max 3 items per section for front sections
- Max 4 items per section for back sections  
- Max 6 items per skill set
- Remove "https://" and "www." from URLs
- If info is missing, use empty string "" or empty array []
- Return ONLY the JSON object, nothing else`;

// ==================== MAIN HANDLER ====================
export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ========== 1. Verify Auth Token ==========
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const token = authHeader.split('Bearer ')[1];
  let userId;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Auth error:', error.message);
    await logRequest('unknown', 'auth_failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  // ========== 2. Check Rate Limit ==========
  const rateCheck = await checkRateLimit(userId);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', CONFIG.rateLimit.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, rateCheck.remaining));
  
  if (!rateCheck.allowed) {
    await logRequest(userId, 'rate_limited');
    return res.status(429).json({ 
      error: `Rate limit exceeded. You can make ${CONFIG.rateLimit.maxRequests} requests per ${CONFIG.rateLimit.windowHours} hours.`,
      resetAt: rateCheck.resetAt,
    });
  }

  // ========== 3. Validate Input ==========
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    await logRequest(userId, 'invalid_input', { reason: 'missing_text' });
    return res.status(400).json({ error: 'Text content is required' });
  }

  if (text.length < CONFIG.input.minLength) {
    await logRequest(userId, 'invalid_input', { reason: 'too_short', length: text.length });
    return res.status(400).json({ error: `Please provide more content (at least ${CONFIG.input.minLength} characters)` });
  }

  if (text.length > CONFIG.input.maxLength) {
    await logRequest(userId, 'invalid_input', { reason: 'too_long', length: text.length });
    return res.status(400).json({ error: `Content too long (max ${CONFIG.input.maxLength} characters)` });
  }

  // ========== 4. Process with AI ==========
  const cleanText = sanitizeInput(text);

  try {
    const startTime = Date.now();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract business card info from this resume/profile:\n\n${cleanText}` },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      await logRequest(userId, 'ai_error', { 
        statusCode: response.status, 
        processingTime,
      });
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      await logRequest(userId, 'ai_empty_response', { processingTime });
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Extract JSON from response
    let jsonStr = content.trim();
    
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      await logRequest(userId, 'ai_parse_error', { processingTime });
      return res.status(502).json({ error: 'Could not parse AI response' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.name && !parsed.title && !parsed.email) {
      await logRequest(userId, 'ai_insufficient_data', { processingTime });
      return res.status(400).json({ error: 'Could not extract meaningful information. Please provide more details.' });
    }

    // Success!
    await logRequest(userId, 'success', { 
      processingTime,
      inputLength: cleanText.length,
      tokensUsed: data.usage?.total_tokens,
    });

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Handler error:', error);
    await logRequest(userId, 'server_error', { error: error.message });
    
    if (error instanceof SyntaxError) {
      return res.status(502).json({ error: 'AI returned invalid format. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}