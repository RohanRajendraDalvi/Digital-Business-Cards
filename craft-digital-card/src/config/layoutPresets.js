// ============================================================================
// LAYOUT PRESETS - All configuration in one place
// ============================================================================

export const layoutPresets = {
  
  default: {
    id: 'default',
    name: 'Classic',
    description: 'Professional & balanced',
    
    // Spacing
    padding: { portrait: 30, landscape: 50 },
    sectionGap: 20,
    itemGap: 27,
    
    // Typography scales
    name: { portrait: 65, landscape: 88, min: 32 },
    title: { portrait: 30, landscape: 32 },
    tagline: { portrait: 24, landscape: 26 },
    sectionTitle: { portrait: 24, landscape: 22 },
    sectionItem: { portrait: 20, landscape: 20 },
    skillFont: { portrait: 18, landscape: 18 },
    
    // QR
    qr: {
      portrait: { size: 140, x: 510, y: 45 },
      landscape: { size: 150, x: 1190, y: 50 }
    },
    qrBack: {
      portrait: { size: 140, x: 'right', y: 'bottom' },
      landscape: { size: 160, x: 'right', y: 'bottom' }
    },
    
    // Skills
    skill: {
      style: 'boxes',
      boxWidth: 205,
      boxHeight: 32,
      columns: 3,
      gap: 215,
    },
    
    // CTA
    cta: { 
      portrait: { width: 420, height: 65 }, 
      landscape: { width: 320, height: 65 },
      radius: 32 
    },
    
    // Decorations
    corners: { inset: 15, length: 45, width: 3 },
    divider: { width: 340, height: 3 },
    
    // Layout behavior
    headerAlign: 'left',
    contentAlign: 'left',
    structure: 'flow',
    logoPosition: 'none',
    
    // Back card
    backLogoSize: { portrait: 120, landscape: 140 },
  },

  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Four corners layout',
    
    padding: { portrait: 28, landscape: 30 },
    sectionGap: 28,
    itemGap: 24,
    
    name: { portrait: 58, landscape: 56, min: 36 },
    title: { portrait: 28, landscape: 26 },
    tagline: { portrait: 20, landscape: 18 },
    sectionTitle: { portrait: 18, landscape: 17 },
    sectionItem: { portrait: 16, landscape: 15 },
    skillFont: { portrait: 14, landscape: 13 },
    
    qr: {
      portrait: { size: 100, x: 'right', y: 'bottom' },
      landscape: { size: 100, x: 'right', y: 'bottom' }
    },
    qrBack: {
      portrait: { size: 100, x: 'right', y: 'bottom' },
      landscape: { size: 100, x: 'right', y: 'bottom' }
    },
    
    skill: {
      style: 'tags',
      maxWidth: 300,
    },
    
    cta: { 
      portrait: { width: 320, height: 48 }, 
      landscape: { width: 320, height: 44 },
      radius: 24 
    },
    
    corners: { inset: 12, length: 35, width: 2 },
    divider: { width: 300, height: 2 },
    
    headerAlign: 'center',
    contentAlign: 'left',
    structure: 'corners',
    logoPosition: 'header',
    
    backLogoSize: { portrait: 75, landscape: 65 },
    cornerWidth: { portrait: 300, landscape: 380 },
  },

  spacious: {
    id: 'spacious',
    name: 'Bold',
    description: 'Dramatic & memorable',
    
    padding: { portrait: 40, landscape: 50 },
    sectionGap: 20,
    itemGap: 28,
    
    name: { portrait: 85, landscape: 100, min: 48 },
    title: { portrait: 32, landscape: 34 },
    tagline: { portrait: 24, landscape: 24 },
    sectionTitle: { portrait: 26, landscape: 24 },
    sectionItem: { portrait: 20, landscape: 20 },
    skillFont: { portrait: 17, landscape: 16 },
    
    qr: {
      portrait: { size: 115, x: 'right', y: 'bottom' },
      landscape: { size: 140, x: 'col3', y: 100 }
    },
    qrBack: {
      portrait: { size: 130, x: 'right', y: 'bottom' },
      landscape: { size: 130, x: 'right', y: 'top' }
    },
    
    skill: {
      style: 'tagsCentered',
      maxWidth: null,
    },
    
    cta: { 
      portrait: { width: 340, height: 54 }, 
      landscape: { width: 340, height: 65 },
      radius: 27 
    },
    
    corners: { inset: 20, length: 60, width: 5 },
    divider: { width: 450, height: 4 },
    
    headerAlign: 'center',
    contentAlign: 'center',
    structure: 'columns',
    logoPosition: 'backCenter',
    
    backLogoSize: { portrait: 108, landscape: 96 },
  },

  centered: {
    id: 'centered',
    name: 'Centered',
    description: 'Symmetric & elegant',
    
    padding: { portrait: 35, landscape: 40 },
    sectionGap: 18,
    itemGap: 26,
    
    name: { portrait: 62, landscape: 72, min: 38 },
    title: { portrait: 28, landscape: 30 },
    tagline: { portrait: 22, landscape: 24 },
    sectionTitle: { portrait: 24, landscape: 22 },
    sectionItem: { portrait: 20, landscape: 19 },
    skillFont: { portrait: 17, landscape: 16 },
    
    qr: {
      portrait: { size: 120, x: 'center', y: 'bottom' },
      landscape: { size: 115, x: 'center', y: 'bottom' }
    },
    qrBack: {
      portrait: { size: 120, x: 'center', y: 'bottom' },
      landscape: { size: 130, x: 'center', y: 'bottom' }
    },
    
    skill: {
      style: 'boxesCentered',
      boxWidth: 195,
      boxHeight: 30,
      columns: 3,
      gap: 210,
    },
    
    cta: { 
      portrait: { width: 360, height: 58 }, 
      landscape: { width: 300, height: 58 },
      radius: 29 
    },
    
    corners: { inset: 16, length: 50, width: 2 },
    divider: { width: 350, height: 2 },
    
    headerAlign: 'center',
    contentAlign: 'center',
    structure: 'columns',
    logoPosition: 'backCenter',
    
    backLogoSize: { portrait: 110, landscape: 120 },
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean & essential',
    
    padding: { portrait: 50, landscape: 60 },
    sectionGap: 35,
    itemGap: 30,
    
    name: { portrait: 68, landscape: 82, min: 42 },
    title: { portrait: 30, landscape: 32 },
    tagline: { portrait: 24, landscape: 24 },
    sectionTitle: { portrait: 18, landscape: 18 },
    sectionItem: { portrait: 22, landscape: 22 },
    skillFont: { portrait: 21, landscape: 20 },
    
    qr: {
      portrait: { size: 110, x: 'right', y: 'bottom' },
      landscape: { size: 110, x: 'right', y: 'bottom' }
    },
    qrBack: {
      portrait: { size: 100, x: 'right', y: 'bottom' },
      landscape: { size: 110, x: 'right', y: 'bottom' }
    },
    
    skill: {
      style: 'inline',
    },
    
    cta: { 
      portrait: { width: 340, height: 52 }, 
      landscape: { width: 260, height: 52 },
      radius: 6 
    },
    
    corners: { inset: 0, length: 0, width: 0 },
    divider: { width: 0, height: 0 },
    
    headerAlign: 'left',
    contentAlign: 'left',
    structure: 'flow',
    logoPosition: 'topRight',
    uppercaseTitles: true,
    
    backLogoSize: { portrait: 100, landscape: 80 },
  },

  cards: {
    id: 'cards',
    name: 'Editorial',
    description: 'Card-based layout',
    
    padding: { portrait: 25, landscape: 25 },
    sectionGap: 14,
    itemGap: 22,
    
    name: { portrait: 54, landscape: 52, min: 34 },
    title: { portrait: 28, landscape: 24 },
    tagline: { portrait: 22, landscape: 18 },
    sectionTitle: { portrait: 24, landscape: 22 },
    sectionItem: { portrait: 20, landscape: 19 },
    skillFont: { portrait: 17, landscape: 16 },
    
    qr: {
      portrait: { size: 95, x: 'headerRight', y: 18 },
      landscape: { size: 78, x: 'headerRight', y: 18 }
    },
    qrBack: {
      portrait: { size: 95, x: 'headerRight', y: 18 },
      landscape: { size: 78, x: 'headerRight', y: 11 }
    },
    
    skill: {
      style: 'boxesInCard',
      boxWidth: 'half',
      boxHeight: 34,
      columns: 2,
    },
    
    cta: { 
      portrait: { width: 'full', height: 75 },
      landscape: { width: 400, height: 55 },
      radius: 16 
    },
    
    corners: { inset: 12, length: 36, width: 2 },
    divider: { width: 280, height: 2 },
    
    headerAlign: 'left',
    contentAlign: 'left',
    structure: 'cards',
    logoPosition: 'none',
    
    card: {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      radius: 16,
      padding: 16,
    },
    
    backLogoSize: { portrait: 100, landscape: 90 },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getLayoutPreset(id) {
  return layoutPresets[id] || layoutPresets.default;
}

export function L(preset, key, isPortrait = true) {
  const val = preset[key];
  if (val && typeof val === 'object' && ('portrait' in val || 'landscape' in val)) {
    return isPortrait ? val.portrait : val.landscape;
  }
  return val;
}

export function getLayoutPresetOptions() {
  return Object.values(layoutPresets).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}

export default layoutPresets;