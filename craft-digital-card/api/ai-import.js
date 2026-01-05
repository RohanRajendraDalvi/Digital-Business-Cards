// Use Node.js runtime (not Edge) for Firebase Admin
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

import admin from 'firebase-admin';

// ==================== CONFIGURATION ====================
const CONFIG = {
  allowedOrigins: [
    'https://digital-business-cards-lilac.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  rateLimit: {
    maxRequests: 10,
    windowHours: 24,
  },
  input: {
    minLength: 50,
    maxLength: 15000,
  },
  defaults: {
    website: 'craftdigitalcards.space',
  },
};

// ==================== FIREBASE INIT ====================
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// ==================== HELPER FUNCTIONS ====================
function getCorsOrigin(req) {
  const origin = req.headers.origin;
  return CONFIG.allowedOrigins.includes(origin) ? origin : CONFIG.allowedOrigins[0];
}

function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

async function checkRateLimit(userId) {
  const rateLimitRef = db.collection('rateLimits').doc(userId);
  const now = Date.now();
  const windowMs = CONFIG.rateLimit.windowHours * 60 * 60 * 1000;
  
  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        transaction.set(rateLimitRef, { count: 1, windowStart: now, lastRequest: now });
        return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - 1 };
      }
      
      const data = doc.data();
      if (now - data.windowStart > windowMs) {
        transaction.update(rateLimitRef, { count: 1, windowStart: now, lastRequest: now });
        return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - 1 };
      }
      
      if (data.count >= CONFIG.rateLimit.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: new Date(data.windowStart + windowMs).toISOString() };
      }
      
      transaction.update(rateLimitRef, { count: data.count + 1, lastRequest: now });
      return { allowed: true, remaining: CONFIG.rateLimit.maxRequests - data.count - 1 };
    });
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: false, remaining: 0, error: true };
  }
}

async function logRequest(userId, status, metadata = {}) {
  try {
    await db.collection('aiImportLogs').add({
      userId, status, timestamp: admin.firestore.FieldValue.serverTimestamp(), ...metadata,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

function sanitizeInput(text) {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONFIG.input.maxLength);
}

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `You are an expert at creating professional digital business cards. Extract and enhance information into meaningful, descriptive phrases.

CRITICAL RULES:
1. Each item should be 4-5 words that are descriptive and professional (except for skills which should be 1-2 words)
2. Section titles should match the person's INDUSTRY (medical, legal, creative, tech, finance, etc.)
3. If a field cannot be found, use empty string "" or empty array []
4. If a section doesn't have enough meaningful data (less than 2 items), set title to "" and items to []
5. For website/linkUrl: if not found in the text, use "craftdigitalcards.space"
6. Remove "https://" and "www." from all URLs
7. Be INDUSTRY ADAPTIVE - a doctor needs "Specializations", "Procedures", "Certifications" not "Languages", "Frameworks"

Return ONLY valid JSON with no markdown, no backticks, no explanation:
{
  "name": "Full Name",
  "title": "Professional Title or Role",
  "altTitle": "Company or Organization Name",
  "tagline": "\"Compelling professional motto or mission\"",
  "altTagline": "What drives or defines them",
  "email": "email@example.com",
  "phone": "+1 555 000 0000",
  "location": "City, State or Country",
  "linkUrl": "website.com or craftdigitalcards.space if not found",
  "onlineLinks": ["linkedin.com/in/xxx", "other-relevant-profile.com"],
  "sections": {
    "front1": { 
      "title": "INDUSTRY-RELEVANT (e.g., Experience, Background, Practice Areas)", 
      "items": ["4-5 word descriptive item", "Another meaningful phrase here", "Third relevant experience item"] 
    },
    "front2": { 
      "title": "INDUSTRY-RELEVANT (e.g., Specializations, Focus Areas, Expertise)", 
      "items": ["Specific area of focus here", "Another specialization or skill", "Third focus area listed"] 
    },
    "back3": { 
      "title": "INDUSTRY-RELEVANT (e.g., Services, Offerings, Solutions, Procedures)", 
      "items": ["Service or offering described well", "Another service they provide", "Third service or solution"] 
    },
    "back4": { 
      "title": "INDUSTRY-RELEVANT (e.g., Interests, Passions, Research Areas)", 
      "items": ["Personal or professional interest", "Another passion or hobby", "Third interest area listed"] 
    },
    "back5": { 
      "title": "INDUSTRY-RELEVANT (e.g., Achievements, Awards, Publications, Certifications)", 
      "items": ["Notable achievement or award here", "Another recognition or milestone", "Third accomplishment listed here"] 
    },
    "skills1": { 
      "title": "INDUSTRY-RELEVANT (e.g., Core Skills, Technical Skills, Clinical Skills, Legal Expertise)", 
      "items": ["Skill one here", "Skill two here", "Skill three", "Skill four", "Skill five"] 
    },
    "skills2": { 
      "title": "INDUSTRY-RELEVANT (e.g., Tools, Technologies, Software, Equipment, Methodologies)", 
      "items": ["Tool or method one", "Tool two here", "Tool three", "Tool four"] 
    },
    "skills3": { 
      "title": "INDUSTRY-RELEVANT (e.g., Domain Knowledge, Industries, Specialties)", 
      "items": ["Domain one here", "Domain two here", "Domain three"] 
    }
  }
}

INDUSTRY EXAMPLES:
- Medical: "Clinical Expertise", "Procedures", "Certifications", "Research", "Patient Care Philosophy"
- Legal: "Practice Areas", "Case Types", "Bar Admissions", "Legal Skills"
- Creative: "Creative Services", "Portfolio Highlights", "Design Tools", "Artistic Style"
- Finance: "Financial Services", "Investment Strategies", "Certifications", "Market Expertise"
- Education: "Teaching Areas", "Curriculum Development", "Educational Philosophy"
- Engineering: "Engineering Disciplines", "Technical Skills", "Project Types"

Remember: 
- Adapt ALL section titles to the person's actual profession
- Each item should be 4-5 words, descriptive and meaningful
- Empty sections should have "" for title and [] for items
- Website defaults to "craftdigitalcards.space" if not found`;

// ==================== MAIN HANDLER ====================
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth verification
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  let userId;
  try {
    const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    userId = decodedToken.uid;
  } catch (error) {
    await logRequest('unknown', 'auth_failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(userId);
  res.setHeader('X-RateLimit-Limit', CONFIG.rateLimit.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, rateCheck.remaining));
  
  if (!rateCheck.allowed) {
    await logRequest(userId, 'rate_limited');
    return res.status(429).json({ 
      error: `Rate limit exceeded. ${CONFIG.rateLimit.maxRequests} requests per ${CONFIG.rateLimit.windowHours} hours.`,
      resetAt: rateCheck.resetAt,
    });
  }

  // Input validation
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    await logRequest(userId, 'invalid_input', { reason: 'missing_text' });
    return res.status(400).json({ error: 'Text content is required' });
  }
  if (text.length < CONFIG.input.minLength) {
    await logRequest(userId, 'invalid_input', { reason: 'too_short' });
    return res.status(400).json({ error: `Please provide at least ${CONFIG.input.minLength} characters` });
  }
  if (text.length > CONFIG.input.maxLength) {
    await logRequest(userId, 'invalid_input', { reason: 'too_long' });
    return res.status(400).json({ error: `Content too long (max ${CONFIG.input.maxLength} characters)` });
  }

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
          { role: 'user', content: `Extract and create a professional business card from this resume/profile. Identify their industry and adapt section titles accordingly:\n\n${cleanText}` },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      await logRequest(userId, 'ai_error', { statusCode: response.status, processingTime });
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      await logRequest(userId, 'ai_empty_response', { processingTime });
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await logRequest(userId, 'ai_parse_error', { processingTime });
      return res.status(502).json({ error: 'Could not parse AI response' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Apply default website if not found
    if (!parsed.linkUrl || parsed.linkUrl.trim() === '') {
      parsed.linkUrl = CONFIG.defaults.website;
    }
    
    // Clean up empty sections
    if (parsed.sections) {
      for (const key of Object.keys(parsed.sections)) {
        const section = parsed.sections[key];
        if (!section.items || section.items.length < 2) {
          parsed.sections[key] = { title: '', items: [] };
        }
      }
    }

    if (!parsed.name && !parsed.title && !parsed.email) {
      await logRequest(userId, 'ai_insufficient_data', { processingTime });
      return res.status(400).json({ error: 'Could not extract meaningful information. Please provide more details.' });
    }

    await logRequest(userId, 'success', { processingTime, inputLength: cleanText.length, tokensUsed: data.usage?.total_tokens });
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