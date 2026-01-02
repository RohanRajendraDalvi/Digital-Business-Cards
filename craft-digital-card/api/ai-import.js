// Use Node.js runtime (not Edge) for Firebase Admin
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

import admin from 'firebase-admin';

// Initialize Firebase Admin with full credentials (only once)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key comes with escaped newlines from env var
      privateKey: privateKey?.replace(/\\n/g, '\n'),
    }),
  });
}

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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ========== Verify Firebase Auth Token ==========
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log(`AI Import used by: ${decodedToken.uid}`);
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  // ========== Process AI Request ==========
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required' });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: 'Please provide more content (at least 50 characters)' });
    }

    if (text.length > 15000) {
      return res.status(400).json({ error: 'Content too long (max 15000 characters)' });
    }

    // Clean the input text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')                    // Remove HTML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .replace(/\s+/g, ' ')                        // Normalize whitespace
      .trim()
      .slice(0, 12000);

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract business card info from this resume/profile:\n\n${cleanText}` },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    // Find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return res.status(502).json({ error: 'Could not parse AI response' });
    }

    // Parse and validate
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Basic validation
    if (!parsed.name && !parsed.title && !parsed.email) {
      return res.status(400).json({ error: 'Could not extract meaningful information. Please provide more details.' });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Handler error:', error);
    
    if (error instanceof SyntaxError) {
      return res.status(502).json({ error: 'AI returned invalid format. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}