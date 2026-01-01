// ============================================================================
// POLYFILL for roundRect
// ============================================================================
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    else if (Array.isArray(r)) r = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
    else r = { tl: 0, tr: 0, br: 0, bl: 0, ...r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

// ============================================================================
// PATTERNS
// ============================================================================
export const patterns = {
  grid: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let i = 0; i < w; i += spacing) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += spacing) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
  },
  dots: (ctx, w, h, spacing, color) => {
    ctx.fillStyle = color;
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  hexagons: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    const size = spacing / 2, hDist = size * Math.sqrt(3), vDist = size * 1.5;
    for (let row = 0; row * vDist < h + size; row++) {
      for (let col = 0; col * hDist < w + size; col++) {
        const x = col * hDist + (row % 2 === 1 ? hDist / 2 : 0), y = row * vDist;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = x + size * Math.cos(angle), py = y + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
      }
    }
  },
  waves: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 5) {
        const yOffset = Math.sin(x * 0.03) * (spacing * 0.3);
        if (x === 0) ctx.moveTo(x, y + yOffset); else ctx.lineTo(x, y + yOffset);
      }
      ctx.stroke();
    }
  },
  diagonals: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += spacing) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }
  },
  crosshatch: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += spacing) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }
    for (let i = 0; i < w + h; i += spacing) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - h, h); ctx.stroke(); }
  },
  circuit: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    const count = Math.floor((w * h) / (spacing * spacing * 15));
    for (let i = 0; i < count; i++) {
      const seed = i * 1.618033988749;
      const x = (seed * 137.5) % w, y = (seed * 97.3) % h;
      const len = spacing * 0.8, dir = (i % 4) * 0.25;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + len * (dir - 0.5), y);
      ctx.lineTo(x + len * (dir - 0.5), y + len * ((i % 3) * 0.3 - 0.3));
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.stroke();
    }
  },
  squares: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    const size = spacing * 0.6;
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
      }
    }
  },
  triangles: (ctx, w, h, spacing, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    const triH = spacing * Math.sqrt(3) / 2;
    for (let row = 0; row * triH < h + triH; row++) {
      for (let col = 0; col * spacing < w + spacing; col++) {
        const x = col * spacing + (row % 2 === 1 ? spacing / 2 : 0), y = row * triH;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + spacing / 2, y + triH); ctx.lineTo(x - spacing / 2, y + triH);
        ctx.closePath(); ctx.stroke();
      }
    }
  },
  noise: (ctx, w, h, spacing, color) => {
    ctx.fillStyle = color;
    const density = Math.floor((w * h) / (spacing * spacing * 2));
    for (let i = 0; i < density; i++) {
      const seed = i * 1.618033988749;
      const x = (seed * 137.5) % w, y = (seed * 97.3) % h;
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
  },
  none: () => {}
};

// ============================================================================
// MATERIAL PRESETS
// ============================================================================
export const materialPresets = {
  default: { cardMetalness: 0.3, cardRoughness: 0.4, sideMetalness: 0.8, sideRoughness: 0.2 },
  glossy: { cardMetalness: 0.6, cardRoughness: 0.1, sideMetalness: 0.9, sideRoughness: 0.1 },
  matte: { cardMetalness: 0.0, cardRoughness: 0.9, sideMetalness: 0.1, sideRoughness: 0.8 },
  metallic: { cardMetalness: 0.9, cardRoughness: 0.2, sideMetalness: 1.0, sideRoughness: 0.1 },
  plastic: { cardMetalness: 0.0, cardRoughness: 0.3, sideMetalness: 0.0, sideRoughness: 0.3 },
  brushed: { cardMetalness: 0.7, cardRoughness: 0.5, sideMetalness: 0.8, sideRoughness: 0.4 },
  satin: { cardMetalness: 0.2, cardRoughness: 0.6, sideMetalness: 0.3, sideRoughness: 0.5 },
  glass: { cardMetalness: 0.1, cardRoughness: 0.05, sideMetalness: 0.2, sideRoughness: 0.05 },
};

// ============================================================================
// ICON PRESETS
// ============================================================================
export const iconPresets = {
  glasses: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 55 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(0, 0, 120, 60, 12); ctx.roundRect(140, 0, 120, 60, 12);
    ctx.moveTo(120, 30); ctx.lineTo(140, 30); ctx.stroke();
    ctx.fillStyle = fillColor;
    ctx.fillRect(10, 10, 100, 40); ctx.fillRect(150, 10, 100, 40);
    ctx.restore();
  },
  laptop: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 350;
    ctx.save();
    ctx.translate(x + 20 * scale, y + 15 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(20, 0, 240, 130, 8); ctx.stroke();
    ctx.fillRect(30, 10, 220, 110);
    ctx.beginPath();
    ctx.moveTo(0, 140); ctx.lineTo(280, 140); ctx.lineTo(260, 160); ctx.lineTo(20, 160);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  },
  hardhat: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 55 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(140, 30, 120, 50, 0, Math.PI, 0); ctx.stroke(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 30); ctx.lineTo(280, 30); ctx.lineTo(260, 55); ctx.lineTo(20, 55);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(140, -20); ctx.lineTo(140, 30); ctx.stroke();
    ctx.restore();
  },
  medical: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 5 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(105, 0, 70, 120, 8); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.roundRect(50, 35, 180, 55, 8); ctx.stroke(); ctx.fill();
    ctx.restore();
  },
  building: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.rect(50, 0, 180, 130); ctx.stroke(); ctx.fill();
    ctx.lineWidth = 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) { ctx.strokeRect(70 + col * 50, 15 + row * 35, 30, 22); }
    }
    ctx.beginPath(); ctx.roundRect(115, 100, 50, 30, [8, 8, 0, 0]); ctx.stroke();
    ctx.restore();
  },
  code: (ctx, x, y, size, strokeColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 5 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(30, 60); ctx.lineTo(80, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(250, 60); ctx.lineTo(200, 120); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(160, -5); ctx.lineTo(120, 125); ctx.stroke();
    ctx.restore();
  },
  gear: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 10 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    const cx = 140, cy = 55, outerR = 50, innerR = 28, toothH = 15, teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
      ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
      ctx.lineTo(cx + Math.cos(a2) * (outerR + toothH), cy + Math.sin(a2) * (outerR + toothH));
      ctx.lineTo(cx + Math.cos(a3) * (outerR + toothH), cy + Math.sin(a3) * (outerR + toothH));
      ctx.lineTo(cx + Math.cos(a4) * outerR, cy + Math.sin(a4) * outerR);
    }
    ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  },
  briefcase: (ctx, x, y, size, strokeColor, fillColor) => {
    const scale = size / 280;
    ctx.save();
    ctx.translate(x, y + 10 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = strokeColor; ctx.fillStyle = fillColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(20, 30, 240, 90, 12); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.roundRect(100, 0, 80, 38, 8); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(120, 60, 40, 25, 4); ctx.stroke();
    ctx.restore();
  },
  none: () => {}
};

// ============================================================================
// CUSTOM LOGO HELPERS
// ============================================================================

/**
 * Load image from base64 data URL or regular URL
 * Base64 loads instantly, URLs require network fetch
 * @param {string} urlOrBase64 - URL or base64 data URL
 * @returns {Promise<HTMLImageElement|null>}
 */
export function loadImageFromUrl(urlOrBase64) {
  return new Promise((resolve) => {
    if (!urlOrBase64) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    
    // Base64 data URLs don't need crossOrigin (and it can cause issues)
    if (!urlOrBase64.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Failed to load image:', urlOrBase64.substring(0, 50) + '...');
      resolve(null);
    };
    img.src = urlOrBase64;
  });
}

/**
 * Apply theme tint to a white silhouette image
 * @param {HTMLImageElement} img - Source image (white silhouette)
 * @param {string} tintColor - Hex or rgb color string
 * @param {number} opacity - Opacity 0-1
 * @returns {HTMLCanvasElement} - Tinted canvas
 */
export function tintSilhouette(img, tintColor, opacity = 0.5) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const w = img.width || img.naturalWidth || 256;
  const h = img.height || img.naturalHeight || 256;
  canvas.width = w;
  canvas.height = h;
  
  ctx.drawImage(img, 0, 0, w, h);
  
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  // Parse color
  let r = 255, g = 255, b = 255;
  if (tintColor.startsWith('#')) {
    const hex = tintColor.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (tintColor.startsWith('rgb')) {
    const matches = tintColor.match(/[\d.]+/g);
    if (matches) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    }
  }
  
  const opacityByte = Math.floor(255 * opacity);
  
  // Apply tint to non-transparent pixels
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 30) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = Math.min(data[i + 3], opacityByte);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// DRAW LOGO (supports both presets and custom)
// ============================================================================

/**
 * Draw logo with support for both preset icons and custom uploaded logos
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} mode - 'portrait' or 'landscape'
 * @param {string} strokeColor - Theme stroke color
 * @param {string} fillColor - Theme fill color
 * @param {HTMLImageElement|null} customLogoImg - Pre-loaded custom logo image
 * @param {Object} settings - Logo settings { source, customData }
 */
export function drawLogo(ctx, mode, strokeColor, fillColor, customLogoImg = null, settings = null) {
  const config = settings || {};
  // Support both old (logoSource) and new (source) property names
  const source = config.source || config.logoSource || 'glasses';
  
  if (source === 'none') return;
  
  // Position configuration based on card orientation
  const pos = mode === 'portrait' 
    ? { x: 320, y: 10, size: 260 }
    : { x: 580, y: 0, size: 400 };
  
  // Handle custom uploaded logo (base64 or URL loaded into customLogoImg)
  if (source === 'custom' && customLogoImg) {
    const tinted = tintSilhouette(customLogoImg, strokeColor, 0.5);
    
    // Maintain aspect ratio
    const aspectRatio = tinted.width / tinted.height;
    let drawW, drawH;
    const targetSize = pos.size * 0.7;
    
    if (aspectRatio > 1) {
      drawW = targetSize;
      drawH = targetSize / aspectRatio;
    } else {
      drawH = targetSize;
      drawW = targetSize * aspectRatio;
    }
    
    // Center the logo in the position area
    const drawX = pos.x + (pos.size - drawW) / 2;
    const drawY = pos.y + (pos.size - drawH) / 2 - 40;
    
    ctx.drawImage(tinted, drawX, drawY, drawW, drawH);
  } 
  // Handle preset icons
  else if (iconPresets[source]) {
    iconPresets[source](ctx, pos.x, pos.y, pos.size, strokeColor, fillColor);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function drawPattern(patternType, ctx, width, height, spacing, color) {
  const fn = patterns[patternType];
  if (fn) fn(ctx, width, height, spacing, color);
}

export function getMaterialValues(preset) {
  return materialPresets[preset] || materialPresets.default;
}

export function getPatternNames() { return Object.keys(patterns); }
export function getPresetNames() { return Object.keys(materialPresets); }
export function getIconNames() { return Object.keys(iconPresets); }

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const materialSettings = {
  frontPattern: 'grid',
  backPattern: 'waves',
  frontPatternSpacing: 40,
  backPatternSpacing: 80,
  materialPreset: 'default',
  ambientIntensity: 0.35,
  point1Intensity: 1.5,
  point2Intensity: 1.0,
};

export const logoSettings = {
  source: 'glasses',
  customData: null,  // Base64 data URL for custom logos
  portrait: { x: 420, y: 110, size: 260 },
  landscape: { x: 680, y: 100, size: 400 },
  opacity: 0.5,
};