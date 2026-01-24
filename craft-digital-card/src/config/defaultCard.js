// Default card template for new users
// This gets populated with OAuth profile data where available

export const defaultCardTemplate = {
  content: {
    name: 'Your Name',
    title: 'Your Title',
    altTitle: 'Company / Organization',
    tagline: '"Your personal tagline here"',
    altTagline: 'What drives you',
    email: 'email@example.com',
    phone: '+1 (555) 000-0000',
    location: '📍 Your City',
    linkUrl: 'yourwebsite.com',
    onlineLinks: [
      'linkedin.com/in/yourprofile',
      'github.com/yourprofile',
    ],
    
    sections: {
      front1: {
        title: 'Experience',
        items: ['Your background', 'Key achievement'],
      },
      front2: {
        title: 'Focus Areas',
        items: ['Area 1', 'Area 2', 'Area 3'],
      },
      back3: {
        title: 'Services',
        items: ['Service 1', 'Service 2'],
      },
      back4: {
        title: 'Interests',
        items: ['Interest 1', 'Interest 2'],
      },
      back5: {
        title: 'Achievements',
        items: ['Achievement 1', 'Achievement 2'],
      },
      skills1: {
        title: 'Skills',
        items: ['Skill 1', 'Skill 2', 'Skill 3'],
      },
      skills2: {
        title: 'Tools',
        items: ['Tool 1', 'Tool 2', 'Tool 3'],
      },
      skills3: {
        title: 'Expertise',
        items: ['Expert 1', 'Expert 2', 'Expert 3'],
      },
    },
  },
  
  theme: {
    mode: 'dark',
    variant: 'cyber',
  },
  
  materials: {
    frontPattern: 'grid',
    backPattern: 'waves',
    frontPatternSpacing: 40,
    backPatternSpacing: 80,
    preset: 'default',
    fontPreset: 'modern',
    layoutPreset: 'default',
  },
  
  logo: {
    source: 'glasses',
    customUrl: null,
  },
};

/**
 * Generate a default card with user-specific data
 * @param {Object} userData - User data from OAuth
 * @param {string} userData.name - User's display name
 * @param {string} userData.email - User's email
 * @returns {Object} Card data with user info merged in
 */
export function getDefaultCard(userData = {}) {
  const card = JSON.parse(JSON.stringify(defaultCardTemplate));
  
  if (userData.name) {
    card.content.name = userData.name;
  }
  if (userData.email) {
    card.content.email = userData.email;
  }
  
  return card;
}

/**
 * List of available theme variants for each mode
 */
export const themeVariants = {
  dark: [
    { id: 'cyber', name: 'Cyber', description: 'Cyan & Orange' },
    { id: 'neon', name: 'Neon', description: 'Pink & Cyan' },
    { id: 'forest', name: 'Forest', description: 'Green & Gold' },
    { id: 'ocean', name: 'Ocean', description: 'Blue & Teal' },
    { id: 'sunset', name: 'Sunset', description: 'Orange & Yellow' },
    { id: 'mono', name: 'Mono', description: 'Clean Grays' },
    { id: 'royal', name: 'Royal', description: 'Purple & Gold' },
  ],
  light: [
    { id: 'professional', name: 'Professional', description: 'Navy & Rose' },
    { id: 'warm', name: 'Warm', description: 'Cream & Tan' },
    { id: 'cool', name: 'Cool', description: 'Blue Tints' },
    { id: 'nature', name: 'Nature', description: 'Fresh Greens' },
    { id: 'rose', name: 'Rose', description: 'Soft Pinks' },
    { id: 'minimal', name: 'Minimal', description: 'Subtle Grays' },
    { id: 'lavender', name: 'Lavender', description: 'Soft Purples' },
  ],
};

/**
 * List of available patterns
 */
export const patternOptions = [
  { id: 'none', name: 'None' },
  { id: 'grid', name: 'Grid' },
  { id: 'dots', name: 'Dots' },
  { id: 'hexagons', name: 'Hexagons' },
  { id: 'waves', name: 'Waves' },
  { id: 'diagonals', name: 'Diagonals' },
  { id: 'crosshatch', name: 'Crosshatch' },
  { id: 'circuit', name: 'Circuit' },
  { id: 'squares', name: 'Squares' },
  { id: 'triangles', name: 'Triangles' },
  { id: 'noise', name: 'Noise' },
];

/**
 * List of available material presets
 */
export const materialOptions = [
  { id: 'default', name: 'Default', description: 'Balanced look' },
  { id: 'glossy', name: 'Glossy', description: 'High shine' },
  { id: 'matte', name: 'Matte', description: 'No shine, soft' },
  { id: 'metallic', name: 'Metallic', description: 'Chrome look' },
  { id: 'plastic', name: 'Plastic', description: 'Plastic card' },
  { id: 'brushed', name: 'Brushed', description: 'Brushed metal' },
  { id: 'satin', name: 'Satin', description: 'Satin finish' },
  { id: 'glass', name: 'Glass', description: 'Glass-like' },
];

/**
 * List of available logo/icon presets
 */
export const logoOptions = [
  { id: 'none', name: 'None' },
  { id: 'glasses', name: 'Glasses' },
  { id: 'laptop', name: 'Laptop' },
  { id: 'hardhat', name: 'Hard Hat' },
  { id: 'medical', name: 'Medical' },
  { id: 'building', name: 'Building' },
  { id: 'code', name: 'Code' },
  { id: 'gear', name: 'Gear' },
  { id: 'briefcase', name: 'Briefcase' },
  { id: 'custom', name: 'Custom Upload' },
];

/**
 * List of available font presets
 */
export const fontOptions = [
  { id: 'modern', name: 'Modern', description: 'Clean system fonts' },
  { id: 'classic', name: 'Classic', description: 'Elegant serif fonts' },
  { id: 'technical', name: 'Technical', description: 'Monospace accents' },
  { id: 'elegant', name: 'Elegant', description: 'Light & refined' },
  { id: 'bold', name: 'Bold', description: 'Heavy & impactful' },
  { id: 'rounded', name: 'Rounded', description: 'Friendly & approachable' },
];

/**
 * List of available layout presets
 */
/**
 * List of available layout presets
 * Update this in defaultCard.js
 */
export const layoutOptions = [
  { id: 'default', name: 'Classic', description: 'Professional & balanced' },
  { id: 'compact', name: 'Compact', description: 'Dense & detailed' },
  { id: 'spacious', name: 'Bold', description: 'Dramatic & memorable' },
  { id: 'centered', name: 'Centered', description: 'Symmetric & elegant' },
  { id: 'minimal', name: 'Minimal', description: 'Clean & essential' },
  { id: 'cards', name: 'Editorial', description: 'Layered & structured' },
];

export default defaultCardTemplate;