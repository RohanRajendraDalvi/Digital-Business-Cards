/**
 * Transform stored card data to the format expected by BusinessCard component
 * This bridges Firestore data structure with the component's constants
 */
export function transformCardData(cardData, username) {
  if (!cardData) return null;

  const { content, theme, materials, logo } = cardData;
  const sections = content?.sections || {};

  return {
    // Profile info
    NAME: content?.name || 'Your Name',
    TITLE: content?.title || 'Your Title',
    ALT_TITLE: content?.altTitle || 'Company',
    TAGLINE: content?.tagline || '"Your tagline"',
    ALT_TAGLINE: content?.altTagline || 'What drives you',
    
    // Contact
    EMAIL: content?.email || '',
    PHONE: content?.phone || '',
    LOCATION: content?.location || '📍 Location',
    LINK_URL: content?.linkUrl || '',
    ONLINE_LINKS: content?.onlineLinks || [],
    
    // Front sections
    FRONT_SECTION_1_TITLE: sections.front1?.title || 'Experience',
    FRONT_SECTION_1_ITEMS: sections.front1?.items || [],
    FRONT_SECTION_2_TITLE: sections.front2?.title || 'Focus Areas',
    FRONT_SECTION_2_ITEMS: sections.front2?.items || [],
    
    // Back sections
    BACK_SECTION_1_TITLE: sections.back1?.title || 'Contact',
    BACK_SECTION_2_TITLE: sections.back2?.title || 'Online',
    BACK_SECTION_3_TITLE: sections.back3?.title || 'Services',
    BACK_SECTION_3_ITEMS: sections.back3?.items || [],
    BACK_SECTION_4_TITLE: sections.back4?.title || 'Interests',
    BACK_SECTION_4_ITEMS: sections.back4?.items || [],
    BACK_SECTION_5_TITLE: sections.back5?.title || 'Achievements',
    BACK_SECTION_5_ITEMS: sections.back5?.items || [],
    
    // Skills
    SKILL_SET_1_TITLE: sections.skills1?.title || 'Skills',
    SKILL_SET_1: sections.skills1?.items || [],
    SKILL_SET_2_TITLE: sections.skills2?.title || 'Tools',
    SKILL_SET_2: sections.skills2?.items || [],
    SKILL_SET_3_TITLE: sections.skills3?.title || 'Expertise',
    SKILL_SET_3: sections.skills3?.items || [],
    
    // QR Codes - dynamic based on username
    LINK_QR_URL: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${content?.linkUrl || 'example.com'}`,
    LINK_QR_LABEL: 'Portfolio',
    BUSINESS_CARD_QR_URL: username 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}`
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}`,
    BUSINESS_CARD_QR_LABEL: 'Save Contact',
    
    // UI text
    UI_TITLE: 'Interactive Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom',
    UI_HINT: '✨ Click the card to see more',
    
    // Theme settings
    themeMode: theme?.mode || 'dark',
    themeVariant: theme?.variant || 'cyber',
    
    // Material settings
    frontPattern: materials?.frontPattern || 'grid',
    backPattern: materials?.backPattern || 'waves',
    frontPatternSpacing: materials?.frontPatternSpacing || 40,
    backPatternSpacing: materials?.backPatternSpacing || 80,
    materialPreset: materials?.preset || 'default',
    
    // Logo settings
    logoSource: logo?.source || 'glasses',
    logoCustomUrl: logo?.customUrl || null,
  };
}

/**
 * Generate vCard string from card data
 */
export function generateVCard(cardData) {
  const content = cardData?.content;
  if (!content) return '';

  const name = content.name || 'Contact';
  const nameParts = name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');

  const cleanStr = (str) => {
    if (!str) return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
  };

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${lastName};${firstName};;;`,
  ];

  if (content.title) lines.push(`TITLE:${content.title}`);
  if (content.altTitle) lines.push(`ORG:${content.altTitle}`);
  if (content.email) lines.push(`EMAIL;TYPE=WORK:${cleanStr(content.email)}`);
  if (content.phone) lines.push(`TEL;TYPE=CELL:${cleanStr(content.phone)}`);
  if (content.linkUrl) lines.push(`URL;TYPE=WORK:https://${cleanStr(content.linkUrl)}`);
  
  const links = content.onlineLinks || [];
  if (links[0]) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:https://${cleanStr(links[0])}`);
  if (links[1]) lines.push(`X-SOCIALPROFILE;TYPE=github:https://${cleanStr(links[1])}`);
  
  if (content.tagline) {
    const note = content.tagline.replace(/"/g, '');
    lines.push(`NOTE:${note}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Download vCard file
 */
export function downloadVCard(cardData) {
  const vcard = generateVCard(cardData);
  if (!vcard) return;

  const name = cardData?.content?.name || 'contact';
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy card URL to clipboard
 */
export async function copyCardUrl(username) {
  const url = `${window.location.origin}/${username}`;
  try {
    await navigator.clipboard.writeText(url);
    return { success: true, url };
  } catch (err) {
    console.error('Failed to copy:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get theme object based on mode and variant
 */
export function getThemeByName(mode, variant) {
  // These will be imported from your theme files
  const darkThemes = {
    cyber: 'darkCyber',
    neon: 'darkNeon',
    forest: 'darkForest',
    ocean: 'darkOcean',
    sunset: 'darkSunset',
    mono: 'darkMono',
    royal: 'darkRoyal',
  };

  const lightThemes = {
    professional: 'lightProfessional',
    warm: 'lightWarm',
    cool: 'lightCool',
    nature: 'lightNature',
    rose: 'lightRose',
    minimal: 'lightMinimal',
    lavender: 'lightLavender',
  };

  const themeMap = mode === 'dark' ? darkThemes : lightThemes;
  return themeMap[variant] || (mode === 'dark' ? 'darkCyber' : 'lightProfessional');
}a