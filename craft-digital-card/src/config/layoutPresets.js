// ============================================================================
// LAYOUT PRESETS - Creative Collection
// ============================================================================
// Canvas: Portrait 700x1100, Landscape 1400x820
// Each preset creates a DISTINCT visual identity
// ============================================================================

export const layoutPresets = {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLASSIC - The reliable standard (ORIGINAL - DO NOT MODIFY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  default: {
    id: 'default',
    name: 'Classic',
    description: 'Professional & balanced',
    
    padding: 30,
    sectionGap: 20,
    itemGap: 27,
    
    headerScale: 1.0,
    bodyScale: 1.0,
    skillBoxScale: 1.0,
    
    qrSize: { portrait: 140, landscape: 150 },
    qrPosition: { 
      portrait: { x: 510, y: 45 },
      landscape: { x: 1190, y: 50 }
    },
    
    skillBoxWidth: 205,
    skillBoxHeight: 32,
    skillColumns: 3,
    skillGap: 215,
    
    ctaWidth: { portrait: 420, landscape: 320 },
    ctaHeight: 65,
    ctaRadius: 32,
    
    cornerInset: 15,
    cornerLength: 45,
    cornerWidth: 3,
    
    dividerWidth: 340,
    dividerHeight: 3,
    
    headerAlign: 'left',
    contentAlign: 'left',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPACT - Four corners layout with centered title
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Four corners layout',
    
    padding: 28,
    sectionGap: 18,
    itemGap: 24,
    
    headerScale: 0.85,
    bodyScale: 0.85,
    skillBoxScale: 0.80,
    
    qrSize: { portrait: 110, landscape: 110 },
    qrPosition: { 
      portrait: { x: 562, y: 920 },
      landscape: { x: 1260, y: 685 }
    },
    
    skillBoxWidth: 170,
    skillBoxHeight: 28,
    skillColumns: 3,
    skillGap: 180,
    
    ctaWidth: { portrait: 320, landscape: 340 },
    ctaHeight: 52,
    ctaRadius: 26,
    
    cornerInset: 12,
    cornerLength: 35,
    cornerWidth: 2,
    
    dividerWidth: 300,
    dividerHeight: 2,
    
    headerAlign: 'center',
    contentAlign: 'left',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BOLD - Hero name, centered skills with spacing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  spacious: {
    id: 'spacious',
    name: 'Bold',
    description: 'Dramatic & memorable',
    
    padding: 40,
    sectionGap: 20,
    itemGap: 28,
    
    headerScale: 1.3,
    bodyScale: 0.95,
    skillBoxScale: 0.95,
    
    qrSize: { portrait: 115, landscape: 140 },
    qrPosition: { 
      portrait: { x: 545, y: 935 },
      landscape: { x: 1210, y: 55 }
    },
    
    // Larger skill boxes with more vertical gap
    skillBoxWidth: 190,
    skillBoxHeight: 32,
    skillColumns: 3,
    skillGap: 205,
    
    ctaWidth: { portrait: 380, landscape: 340 },
    ctaHeight: 62,
    ctaRadius: 31,
    
    cornerInset: 20,
    cornerLength: 60,
    cornerWidth: 5,
    
    dividerWidth: 450,
    dividerHeight: 4,
    
    headerAlign: 'center',
    contentAlign: 'center',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CENTERED - Symmetric, personal brand focused
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  centered: {
    id: 'centered',
    name: 'Centered',
    description: 'Symmetric & elegant',
    
    padding: 35,
    sectionGap: 18,
    itemGap: 26,
    
    headerScale: 1.0,
    bodyScale: 0.95,
    skillBoxScale: 0.95,
    
    // QR at bottom center with more padding
    qrSize: { portrait: 130, landscape: 130 },
    qrPosition: { 
      portrait: { x: 285, y: 890 },     // Centered: (700-130)/2 = 285, higher up
      landscape: { x: 635, y: 620 }     // Centered for landscape
    },
    
    skillBoxWidth: 195,
    skillBoxHeight: 30,
    skillColumns: 3,
    skillGap: 210,
    
    ctaWidth: { portrait: 360, landscape: 300 },
    ctaHeight: 58,
    ctaRadius: 29,
    
    cornerInset: 16,
    cornerLength: 50,
    cornerWidth: 2,
    
    dividerWidth: 350,
    dividerHeight: 2,
    
    headerAlign: 'center',
    contentAlign: 'left',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MINIMAL - Swiss design, larger fonts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean & essential',
    
    padding: 50,
    sectionGap: 35,
    itemGap: 30,
    
    headerScale: 1.0,
    bodyScale: 1.0,
    skillBoxScale: 0.90,
    
    qrSize: { portrait: 110, landscape: 110 },
    qrPosition: { 
      portrait: { x: 540, y: 940 },
      landscape: { x: 1230, y: 650 }
    },
    
    skillBoxWidth: 180,
    skillBoxHeight: 28,
    skillColumns: 3,
    skillGap: 190,
    
    ctaWidth: { portrait: 340, landscape: 260 },
    ctaHeight: 52,
    ctaRadius: 6,
    
    cornerInset: 0,
    cornerLength: 0,
    cornerWidth: 0,
    
    dividerWidth: 0,
    dividerHeight: 0,
    
    headerAlign: 'left',
    contentAlign: 'left',
    
    hideSkillBorders: true,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDITORIAL - Magazine-style with card sections (front & back)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cards: {
    id: 'cards',
    name: 'Editorial',
    description: 'Card-based layout',
    
    padding: 25,
    sectionGap: 14,
    itemGap: 22,
    
    headerScale: 0.85,
    bodyScale: 0.85,
    skillBoxScale: 0.85,
    
    qrSize: { portrait: 100, landscape: 100 },
    qrPosition: { 
      portrait: { x: 590, y: 32 },
      landscape: { x: 690, y: 36 }
    },
    
    skillBoxWidth: 190,
    skillBoxHeight: 30,
    skillColumns: 2,
    skillGap: 200,
    
    ctaWidth: { portrait: 350, landscape: 380 },
    ctaHeight: 65,
    ctaRadius: 16,
    
    cornerInset: 12,
    cornerLength: 36,
    cornerWidth: 2,
    
    dividerWidth: 280,
    dividerHeight: 2,
    
    headerAlign: 'left',
    contentAlign: 'left',
    
    sectionBoxes: true,
    sectionBoxPadding: 14,
    sectionBoxRadius: 16,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getLayoutPreset(id) {
  return layoutPresets[id] || layoutPresets.default;
}

export function getLayoutPresetOptions() {
  return Object.values(layoutPresets).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}

// ============================================================================
// LAYOUT CALCULATORS
// ============================================================================

export function getQRSize(preset, isPortrait) {
  const p = typeof preset === 'string' ? getLayoutPreset(preset) : preset;
  return isPortrait ? p.qrSize.portrait : p.qrSize.landscape;
}

export function getQRPosition(preset, isPortrait) {
  const p = typeof preset === 'string' ? getLayoutPreset(preset) : preset;
  return isPortrait ? p.qrPosition.portrait : p.qrPosition.landscape;
}

export function getCTAWidth(preset, isPortrait) {
  const p = typeof preset === 'string' ? getLayoutPreset(preset) : preset;
  return isPortrait ? p.ctaWidth.portrait : p.ctaWidth.landscape;
}

export function scaleSize(baseSize, preset, scaleType = 'body') {
  const p = typeof preset === 'string' ? getLayoutPreset(preset) : preset;
  const scale = scaleType === 'header' ? p.headerScale : 
                scaleType === 'skill' ? p.skillBoxScale : p.bodyScale;
  return Math.round(baseSize * scale);
}

export function getHeaderAlign(preset, isPortrait) {
  const p = typeof preset === 'string' ? getLayoutPreset(preset) : preset;
  if (!isPortrait && p.landscapeHeaderAlign) {
    return p.landscapeHeaderAlign;
  }
  return p.headerAlign || 'left';
}

export default layoutPresets;