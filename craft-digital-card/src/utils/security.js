/**
 * Security utilities for input validation and sanitization
 * src/utils/security.js
 */

// ============ LIMITS ============
export const LIMITS = {
  shortText: 100,
  mediumText: 200,
  longText: 500,
  arrayItemText: 150,
  arrayMaxItems: 10,
  skillsMaxItems: 6,
  linksMaxItems: 5,
  phoneLength: 30,
  labelLength: 30,
  usernameMin: 3,
  usernameMax: 30,
  logoMaxBytes: 500000,
  pdfMaxMB: 10,
  aiTextMin: 50,
  aiTextMax: 15000,
};

// ============ XSS PREVENTION ============
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
}

export function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
}

// ============ TEXT SANITIZATION ============
export function sanitizeText(value, maxLength = LIMITS.shortText) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength)
    .trim();
}

export function sanitizeAlphanumeric(value, maxLength = LIMITS.shortText) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .slice(0, maxLength)
    .trim();
}

// ============ URL VALIDATION ============
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];
const SUSPICIOUS_PATTERNS = [
  /javascript:/i,
  /on\w+\s*=/i,
  /<script/i,
  /&#/i,
  /%3C/i,
];

export function isValidUrl(url) {
  if (typeof url !== 'string' || url.length > LIMITS.longText) return false;
  
  const lower = url.toLowerCase().trim();
  if (BLOCKED_PROTOCOLS.some(p => lower.startsWith(p))) return false;
  if (SUSPICIOUS_PATTERNS.some(p => p.test(url))) return false;
  
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    try {
      new URL(url.startsWith('//') ? 'https:' + url : url);
      return true;
    } catch {
      return false;
    }
  }
  
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/?#].*)?$/;
  return domainRegex.test(url);
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const cleaned = sanitizeText(url, LIMITS.longText);
  return isValidUrl(cleaned) ? cleaned : '';
}

// ============ EMAIL VALIDATION ============
export function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > LIMITS.shortText) return false;
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
  return emailRegex.test(email) && !SUSPICIOUS_PATTERNS.some(p => p.test(email));
}

export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const cleaned = sanitizeText(email, LIMITS.shortText).toLowerCase();
  return isValidEmail(cleaned) ? cleaned : '';
}

// ============ PHONE VALIDATION ============
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  return phone
    .replace(/[^\d\s\-().+]/g, '')
    .slice(0, LIMITS.phoneLength)
    .trim();
}

// ============ USERNAME VALIDATION ============
export function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  if (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax) return false;
  
  const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
  if (!usernameRegex.test(username)) return false;
  
  const reserved = [
    'admin', 'api', 'www', 'mail', 'ftp', 'root', 'system',
    'support', 'help', 'login', 'signup', 'edit', 'settings',
    'null', 'undefined', 'constructor', 'prototype', '__proto__',
    'dashboard', 'account', 'profile', 'user', 'users', 'card',
    'cards', 'new', 'create', 'delete', 'update', 'auth', 'oauth',
  ];
  if (reserved.includes(username.toLowerCase())) return false;
  
  return true;
}

// ============ ARRAY SANITIZATION ============
export function sanitizeArray(arr, maxItems, maxItemLength, sanitizer = sanitizeText) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map(item => sanitizer(String(item || ''), maxItemLength))
    .filter(item => item.length > 0);
}

// ============ OBJECT SANITIZATION ============
export function safeObjectMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  
  const blocked = ['__proto__', 'constructor', 'prototype'];
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (blocked.includes(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    result[key] = source[key];
  }
  
  return result;
}

// ============ RATE LIMITING ============
const rateLimiters = new Map();

export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const limiter = rateLimiters.get(key) || { count: 0, resetAt: now + windowMs };
  
  if (now > limiter.resetAt) {
    limiter.count = 0;
    limiter.resetAt = now + windowMs;
  }
  
  limiter.count++;
  rateLimiters.set(key, limiter);
  
  if (limiter.count > maxRequests) {
    return { allowed: false, retryAfter: limiter.resetAt - now };
  }
  
  return { allowed: true };
}

export function resetRateLimit(key) {
  rateLimiters.delete(key);
}

// ============ BASE64 VALIDATION ============
export function isValidBase64Image(data, maxBytes = LIMITS.logoMaxBytes) {
  if (typeof data !== 'string') return false;
  if (!data.startsWith('data:image/')) return false;
  
  const validTypes = ['data:image/png;', 'data:image/jpeg;', 'data:image/webp;', 'data:image/gif;'];
  if (!validTypes.some(t => data.startsWith(t))) return false;
  
  const base64Part = data.split(',')[1];
  if (!base64Part) return false;
  
  const estimatedBytes = (base64Part.length * 3) / 4;
  if (estimatedBytes > maxBytes) return false;
  
  return true;
}

// ============ DEEP FREEZE ============
export function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  });
  
  return Object.freeze(obj);
}

// ============ THEME VALIDATION ============
const VALID_MODES = ['dark', 'light'];
const VALID_DARK_VARIANTS = ['cyber', 'neon', 'forest', 'ocean', 'sunset', 'mono', 'royal'];
const VALID_LIGHT_VARIANTS = ['professional', 'warm', 'cool', 'nature', 'rose', 'minimal', 'lavender'];

export function sanitizeTheme(theme) {
  const t = theme || {};
  return {
    mode: VALID_MODES.includes(t.mode) ? t.mode : 'dark',
    darkVariant: VALID_DARK_VARIANTS.includes(t.darkVariant) ? t.darkVariant : 'cyber',
    lightVariant: VALID_LIGHT_VARIANTS.includes(t.lightVariant) ? t.lightVariant : 'professional',
  };
}

// ============ MATERIALS VALIDATION ============
const VALID_PATTERNS = ['grid', 'dots', 'waves', 'circuits', 'hexagons', 'none'];
const VALID_PRESETS = ['default', 'glossy', 'matte', 'metallic'];

export function sanitizeMaterials(materials) {
  const m = materials || {};
  return {
    frontPattern: VALID_PATTERNS.includes(m.frontPattern) ? m.frontPattern : 'grid',
    backPattern: VALID_PATTERNS.includes(m.backPattern) ? m.backPattern : 'waves',
    preset: VALID_PRESETS.includes(m.preset) ? m.preset : 'default',
    frontPatternSpacing: Math.max(20, Math.min(100, Number(m.frontPatternSpacing) || 40)),
    backPatternSpacing: Math.max(20, Math.min(100, Number(m.backPatternSpacing) || 80)),
  };
}

// ============ LOGO VALIDATION ============
const VALID_LOGO_SOURCES = ['glasses', 'code', 'rocket', 'star', 'heart', 'custom', 'none'];

export function sanitizeLogo(logo) {
  const l = logo || {};
  const result = {
    source: VALID_LOGO_SOURCES.includes(l.source) ? l.source : 'glasses',
    customData: null,
  };
  
  if (l.source === 'custom' && isValidBase64Image(l.customData)) {
    result.customData = l.customData;
  }
  
  return result;
}

// ============ SECTION SANITIZATION ============
export function sanitizeSection(section, maxItems = LIMITS.arrayMaxItems) {
  if (!section) return { title: '', items: [] };
  return {
    title: sanitizeText(section.title, LIMITS.mediumText),
    items: sanitizeArray(section.items, maxItems, LIMITS.arrayItemText),
  };
}

// ============ FULL CARD SANITIZATION ============
export function sanitizeCardData(data) {
  if (!data || typeof data !== 'object') return null;
  
  const content = data.content || {};
  const sections = content.sections || {};
  
  return {
    content: {
      name: sanitizeText(content.name, LIMITS.shortText),
      title: sanitizeText(content.title, LIMITS.shortText),
      altTitle: sanitizeText(content.altTitle, LIMITS.shortText),
      tagline: sanitizeText(content.tagline, LIMITS.mediumText),
      altTagline: sanitizeText(content.altTagline, LIMITS.mediumText),
      email: sanitizeEmail(content.email),
      phone: sanitizePhone(content.phone),
      location: sanitizeText(content.location, LIMITS.shortText),
      linkUrl: sanitizeUrl(content.linkUrl),
      uiTitle: sanitizeText(content.uiTitle, LIMITS.shortText),
      cardQrLabel: sanitizeText(content.cardQrLabel, LIMITS.labelLength),
      linkQrLabel: sanitizeText(content.linkQrLabel, LIMITS.labelLength),
      onlineLinks: sanitizeArray(content.onlineLinks, LIMITS.linksMaxItems, LIMITS.longText, sanitizeUrl),
      sections: {
        front1: sanitizeSection(sections.front1),
        front2: sanitizeSection(sections.front2),
        back3: sanitizeSection(sections.back3),
        back4: sanitizeSection(sections.back4),
        back5: sanitizeSection(sections.back5),
        skills1: sanitizeSection(sections.skills1, LIMITS.skillsMaxItems),
        skills2: sanitizeSection(sections.skills2, LIMITS.skillsMaxItems),
        skills3: sanitizeSection(sections.skills3, LIMITS.skillsMaxItems),
      },
    },
    theme: sanitizeTheme(data.theme),
    materials: sanitizeMaterials(data.materials),
    logo: sanitizeLogo(data.logo),
  };
}

// ============ ERROR SANITIZATION ============
export function sanitizeError(error) {
  const safeMessages = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account has been disabled',
    'auth/user-not-found': 'Account not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password is too weak',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'permission-denied': 'Access denied',
    'not-found': 'Resource not found',
    'unavailable': 'Service temporarily unavailable',
    'resource-exhausted': 'Too many requests. Please try again later.',
  };
  
  if (error?.code && safeMessages[error.code]) {
    return safeMessages[error.code];
  }
  
  return 'An error occurred. Please try again.';
}