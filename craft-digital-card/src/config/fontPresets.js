// ============================================================================
// FONT PRESETS
// ============================================================================

export const fontPresets = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean system fonts',
    fontStack: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    sizeScale: 1.0,
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
    },
  },
  
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Elegant serif fonts',
    fontStack: "Georgia, 'Times New Roman', Times, serif",
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    sizeScale: 1.05,
    letterSpacing: {
      tight: '0',
      normal: '0.01em',
      wide: '0.08em',
    },
  },
  
  technical: {
    id: 'technical',
    name: 'Technical',
    description: 'Monospace accents',
    fontStack: "'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    sizeScale: 0.92,
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.02em',
    },
  },
  
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Light & refined',
    fontStack: "'Helvetica Neue', 'Arial Nova', Helvetica, Arial, sans-serif",
    weights: {
      normal: '300',
      medium: '400',
      semibold: '500',
      bold: '600',
    },
    sizeScale: 1.02,
    letterSpacing: {
      tight: '0',
      normal: '0.02em',
      wide: '0.1em',
    },
  },
  
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Heavy & impactful',
    fontStack: "'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    weights: {
      normal: '600',
      medium: '700',
      semibold: '800',
      bold: '900',
    },
    sizeScale: 0.95,
    letterSpacing: {
      tight: '-0.03em',
      normal: '-0.01em',
      wide: '0.02em',
    },
  },
  
  rounded: {
    id: 'rounded',
    name: 'Rounded',
    description: 'Friendly & approachable',
    fontStack: "'SF Pro Rounded', 'Nunito', 'Varela Round', -apple-system, BlinkMacSystemFont, sans-serif",
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    sizeScale: 1.0,
    letterSpacing: {
      tight: '0',
      normal: '0.01em',
      wide: '0.05em',
    },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getFontPreset(id) {
  return fontPresets[id] || fontPresets.modern;
}

export function getFontStack(presetId) {
  const preset = getFontPreset(presetId);
  return preset.fontStack;
}

export function getFontPresetOptions() {
  return Object.values(fontPresets).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}

// ============================================================================
// FONT STYLE GENERATORS
// ============================================================================

export function createFontStyle(preset, size, weight = 'bold', italic = false) {
  const p = typeof preset === 'string' ? getFontPreset(preset) : preset;
  const scaledSize = Math.round(size * p.sizeScale);
  const fontWeight = p.weights[weight] || p.weights.bold;
  const style = italic ? 'italic' : 'normal';
  return `${style} ${fontWeight} ${scaledSize}px ${p.fontStack}`;
}

export function createTitleFont(preset, size) {
  return createFontStyle(preset, size, 'bold', false);
}

export function createBodyFont(preset, size) {
  return createFontStyle(preset, size, 'medium', false);
}

export function createAccentFont(preset, size) {
  return createFontStyle(preset, size, 'semibold', true);
}

export default fontPresets;