import * as THREE from 'three';
import { drawPattern, getMaterialValues, drawLogo, iconVisualHeights } from '../../config/materials';
import { getFontPreset, createFontStyle } from '../../config/fontPresets';
import { getLayoutPreset, L } from '../../config/layoutPresets';

const DEFAULT_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ============================================================================
// TEXT UTILITIES
// ============================================================================

function calcFontSize(ctx, text, maxWidth, maxSize, minSize = 24) {
  let size = maxSize;
  const match = ctx.font.match(/^(italic\s+)?(\d+)\s+(\d+)px\s+(.+)$/);
  const style = match?.[1] || '', weight = match?.[2] || 'bold', family = match?.[4] || DEFAULT_FONT;
  ctx.font = `${style}${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 4;
    ctx.font = `${style}${weight} ${size}px ${family}`;
  }
  return size;
}

function truncate(ctx, text, maxW) {
  if (!text || ctx.measureText(text).width <= maxW) return text || '';
  let t = text;
  while (ctx.measureText(t + '...').width > maxW && t.length > 0) t = t.slice(0, -1);
  return t.length > 0 ? t + '...' : '...';
}

const txt = (ctx, text, x, y, maxW) => { ctx.fillText(truncate(ctx, text, maxW), x, y); };
const txtC = (ctx, text, cx, y, maxW) => { ctx.save(); ctx.textAlign = 'center'; ctx.fillText(truncate(ctx, text, maxW), cx, y); ctx.restore(); };
const txtR = (ctx, text, rx, y, maxW) => { ctx.save(); ctx.textAlign = 'right'; ctx.fillText(truncate(ctx, text, maxW), rx, y); ctx.restore(); };

// ============================================================================
// DRAWING UTILITIES  
// ============================================================================

function drawQR(ctx, img, x, y, size, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
  if (img) ctx.drawImage(img, x, y, size, size);
}

function drawCorners(ctx, color, w, h, inset, len, lw) {
  if (!len || !lw) return;
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(inset, inset); ctx.lineTo(inset, inset + len); ctx.moveTo(inset, inset); ctx.lineTo(inset + len, inset); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - inset, inset); ctx.lineTo(w - inset, inset + len); ctx.moveTo(w - inset, inset); ctx.lineTo(w - inset - len, inset); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(inset, h - inset); ctx.lineTo(inset, h - inset - len); ctx.moveTo(inset, h - inset); ctx.lineTo(inset + len, h - inset); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - inset, h - inset); ctx.lineTo(w - inset, h - inset - len); ctx.moveTo(w - inset, h - inset); ctx.lineTo(w - inset - len, h - inset); ctx.stroke();
}

function drawDivider(ctx, x, y, w, h, c1, c2, centered = false) {
  if (!w || !h) return;
  const sx = centered ? x - w / 2 : x;
  const grad = ctx.createLinearGradient(sx, 0, sx + w, 0);
  if (centered) { grad.addColorStop(0, 'transparent'); grad.addColorStop(0.3, c1); grad.addColorStop(0.7, c1); grad.addColorStop(1, 'transparent'); }
  else { grad.addColorStop(0, c1); grad.addColorStop(0.5, c2 || c1); grad.addColorStop(1, 'transparent'); }
  ctx.fillStyle = grad;
  ctx.fillRect(sx, y, w, h);
}

function drawCard(ctx, x, y, w, h, r, bg, border) {
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke(); }
}

function drawLogoOnly(ctx, t, cx, cy, size, mat, custom) {
  const src = mat.logoSource || 'glasses';
  if (src !== 'none') drawLogo(ctx, cx, cy, size, t.glassesColor, t.glassesFill, custom, src);
}

function drawLogoAndTagline(ctx, t, cx, startY, areaW, areaH, logoSize, tagline, mat, custom, font) {
  const src = mat.logoSource || 'glasses';
  const hasLogo = src !== 'none', hasTag = tagline?.trim();
  if (!hasLogo && !hasTag) return startY;
  
  const logoH = hasLogo ? logoSize * (iconVisualHeights[src] || 0.5) : 0;
  let tagH = 0, tagSize = 24;
  if (hasTag) {
    ctx.font = createFontStyle(font, 24, 'medium', true);
    tagSize = calcFontSize(ctx, tagline, areaW - 40, 24, 14);
    tagH = tagSize * 1.2;
  }
  const totalH = logoH + (hasLogo && hasTag ? 40 : 0) + tagH;
  let y = startY + (areaH - totalH) / 2;
  
  if (hasLogo) { drawLogo(ctx, cx, y + logoH / 2, logoSize, t.glassesColor, t.glassesFill, custom, src); y += logoH + 40; }
  if (hasTag) { ctx.font = createFontStyle(font, tagSize, 'medium', true); ctx.fillStyle = t.textHint; txtC(ctx, tagline, cx, y + tagSize * 0.8, areaW - 40); }
  return startY + areaH;
}

// ============================================================================
// SKILL RENDERERS
// ============================================================================

function drawSkillBoxes(ctx, skills, x, y, boxW, boxH, cols, gap, bg, border, textColor, font, fontSize) {
  ctx.font = createFontStyle(font, fontSize, 'semibold');
  skills.forEach((s, i) => {
    const bx = x + (i % cols) * gap, by = y + Math.floor(i / cols) * (boxH + 8);
    ctx.fillStyle = bg; ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = border; ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = textColor; txt(ctx, s, bx + 10, by + boxH / 2 + 5, boxW - 20);
  });
  return Math.ceil(skills.length / cols) * (boxH + 8);
}

function drawSkillTags(ctx, skills, x, y, maxW, bg, border, textColor, font, fontSize, centered = false) {
  ctx.font = createFontStyle(font, fontSize, 'medium');
  const pad = centered ? 14 : 12, h = fontSize + (centered ? 16 : 14), rowGap = centered ? 10 : 8, tagGap = centered ? 12 : 10;
  
  if (centered) {
    const rows = []; let row = [], rowW = 0;
    skills.forEach(s => {
      const tw = ctx.measureText(s).width + pad * 2;
      if (rowW + tw + (row.length ? tagGap : 0) > maxW && row.length) {
        rows.push({ items: row, width: rowW }); row = [{ s, w: tw }]; rowW = tw;
      } else { row.push({ s, w: tw }); rowW += tw + (row.length > 1 ? tagGap : 0); }
    });
    if (row.length) rows.push({ items: row, width: rowW });
    
    let cy = y;
    rows.forEach(r => {
      let cx = x - r.width / 2;
      r.items.forEach((item, i) => {
        if (i > 0) cx += tagGap;
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx, cy, item.w, h, h / 2); ctx.fill();
        ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = textColor; ctx.fillText(item.s, cx + pad, cy + h / 2 + fontSize / 3);
        cx += item.w;
      });
      cy += h + rowGap;
    });
    return rows.length * (h + rowGap) - rowGap;
  } else {
    let cx = x, cy = y;
    skills.forEach(s => {
      const tw = ctx.measureText(s).width + pad * 2;
      if (cx + tw > x + maxW) { cx = x; cy += h + rowGap; }
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx, cy, tw, h, h / 2); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = textColor; ctx.fillText(s, cx + pad, cy + h / 2 + fontSize / 3);
      cx += tw + tagGap;
    });
    return cy - y + h;
  }
}

function drawSkillsInline(ctx, skills, x, y, maxW, textColor, font, fontSize) {
  ctx.font = createFontStyle(font, fontSize, 'regular');
  ctx.fillStyle = textColor;
  const separator = '  ·  ';
  let line = '', lineY = y;
  
  skills.forEach((skill, i) => {
    const testLine = line + (line ? separator : '') + skill;
    if (ctx.measureText(testLine).width > maxW && line) {
      ctx.fillText(line, x, lineY);
      line = skill;
      lineY += fontSize + 8;
    } else {
      line = testLine;
    }
  });
  if (line) ctx.fillText(line, x, lineY);
  return lineY - y + fontSize;
}

function drawWrappedItems(ctx, items, x, y, maxW, lineHeight, prefix = '', measureOnly = false) {
  let currentY = y;
  items.forEach(item => {
    const text = prefix + item;
    const words = text.split(' ');
    let line = '';
    
    words.forEach((word, i) => {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxW && line) {
        if (!measureOnly) ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });
    if (line) {
      if (!measureOnly) ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  });
  return currentY - y;
}

function drawWrappedItemCentered(ctx, text, cx, y, maxW, lineHeight, measureOnly = false) {
  const words = text.split(' ');
  let lines = [];
  let line = '';
  
  words.forEach(word => {
    const testLine = line + (line ? ' ' : '') + word;
    if (ctx.measureText(testLine).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  
  let currentY = y;
  lines.forEach(l => {
    if (!measureOnly) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillText(l, cx, currentY);
      ctx.restore();
    }
    currentY += lineHeight;
  });
  return lines.length * lineHeight;
}

// ============================================================================
// BACKGROUND HELPERS
// ============================================================================

function drawFrontBg(ctx, W, H, t, mat) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, t.bgPrimary); grad.addColorStop(0.5, t.bgSecondary); grad.addColorStop(1, t.bgPrimary);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  drawPattern(mat.frontPattern, ctx, W, H, mat.frontPatternSpacing, t.gridColor);
}

function drawBackBg(ctx, W, H, t, mat) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
  grad.addColorStop(0, t.bgRadialCenter); grad.addColorStop(1, t.bgRadialEdge);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  drawPattern(mat.backPattern, ctx, W, H, mat.backPatternSpacing, t.circuitColor);
}

// ============================================================================
// TEXTURE FACTORY
// ============================================================================

export function createTextureFactory(theme, images, data, matSettings, customLogo) {
  const t = theme, C = data;
  const font = getFontPreset(matSettings.fontPreset || 'modern');
  const layout = getLayoutPreset(matSettings.layoutPreset || 'default');
  const id = layout.id;

  const get = (key, isP) => L(layout, key, isP);

  // Consistent divider gap from text above (12px)
  const DIVIDER_GAP = 12;
  
  // Consistent spacing for skill sections (title to boxes, and between sections)
  const SKILL_TITLE_GAP = 18;  // Gap after skill title before boxes
  const SKILL_SECTION_GAP = 28; // Gap between skill sections

  // ════════════════════════════════════════════════════════════════════════
  // FRONT PORTRAIT
  // ════════════════════════════════════════════════════════════════════════
  function createFrontPortrait() {
    const canvas = document.createElement('canvas');
    canvas.width = 700; canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    const W = 700, H = 1100, isP = true;
    const pad = get('padding', isP), fullW = W - pad * 2;

    drawFrontBg(ctx, W, H, t, matSettings);

    if (id === 'compact') renderCompactFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'spacious') renderSpaciousFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'centered') renderCenteredFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'minimal') renderMinimalFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'cards') renderCardsFront(ctx, W, H, pad, fullW, isP);
    else renderDefaultFront(ctx, W, H, pad, fullW, isP);

    return new THREE.CanvasTexture(canvas);
  }

  // ════════════════════════════════════════════════════════════════════════
  // BACK PORTRAIT
  // ════════════════════════════════════════════════════════════════════════
  function createBackPortrait() {
    const canvas = document.createElement('canvas');
    canvas.width = 700; canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    const W = 700, H = 1100, isP = true;
    const pad = get('padding', isP), fullW = W - pad * 2;

    drawBackBg(ctx, W, H, t, matSettings);

    if (id === 'compact') renderCompactBack(ctx, W, H, pad, fullW, isP);
    else if (id === 'cards') renderCardsBack(ctx, W, H, pad, fullW, isP);
    else if (id === 'centered') renderCenteredBack(ctx, W, H, pad, fullW, isP);
    else renderDefaultBack(ctx, W, H, pad, fullW, isP);

    return new THREE.CanvasTexture(canvas);
  }

  // ════════════════════════════════════════════════════════════════════════
  // FRONT LANDSCAPE
  // ════════════════════════════════════════════════════════════════════════
  function createFrontLandscape() {
    const canvas = document.createElement('canvas');
    canvas.width = 1400; canvas.height = 820;
    const ctx = canvas.getContext('2d');
    const W = 1400, H = 820, isP = false;
    const pad = get('padding', isP), fullW = W - pad * 2;

    drawFrontBg(ctx, W, H, t, matSettings);

    if (id === 'compact') renderCompactFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'spacious') renderSpaciousFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'centered') renderCenteredFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'minimal') renderMinimalFront(ctx, W, H, pad, fullW, isP);
    else if (id === 'cards') renderCardsFront(ctx, W, H, pad, fullW, isP);
    else renderDefaultFront(ctx, W, H, pad, fullW, isP);

    return new THREE.CanvasTexture(canvas);
  }

  // ════════════════════════════════════════════════════════════════════════
  // BACK LANDSCAPE
  // ════════════════════════════════════════════════════════════════════════
  function createBackLandscape() {
    const canvas = document.createElement('canvas');
    canvas.width = 1400; canvas.height = 820;
    const ctx = canvas.getContext('2d');
    const W = 1400, H = 820, isP = false;
    const pad = get('padding', isP), fullW = W - pad * 2;

    drawBackBg(ctx, W, H, t, matSettings);

    if (id === 'compact') renderCompactBack(ctx, W, H, pad, fullW, isP);
    else if (id === 'cards') renderCardsBack(ctx, W, H, pad, fullW, isP);
    else if (id === 'centered') renderCenteredBack(ctx, W, H, pad, fullW, isP);
    else renderDefaultBack(ctx, W, H, pad, fullW, isP);

    return new THREE.CanvasTexture(canvas);
  }

  // ════════════════════════════════════════════════════════════════════════
  // DEFAULT LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderDefaultFront(ctx, W, H, P, fullW, isP) {
    const qr = get('qr', isP);
    const qrX = typeof qr.x === 'number' ? qr.x : (qr.x === 'right' ? W - qr.size - P : W - qr.size - P);
    const qrY = typeof qr.y === 'number' ? qr.y : P + 45;
    const textMaxW = isP ? qrX - P - 20 : qrX - P - 70;

    // Header
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, textMaxW, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txt(ctx, C.NAME, P, isP ? 75 : 140, textMaxW);

    ctx.font = createFontStyle(font, get('title', isP), 'semibold');
    ctx.fillStyle = t.accentCyan;
    txt(ctx, C.TITLE, P, isP ? 115 : 185, textMaxW);

    ctx.font = createFontStyle(font, get('tagline', isP), 'medium', true);
    ctx.fillStyle = t.accentSecondary;
    const taglineY = isP ? 152 : 225;
    txt(ctx, C.TAGLINE, P, taglineY, textMaxW);

    // QR
    drawQR(ctx, images.cardQr, qrX, qrY, qr.size, t.qrBg);
    ctx.font = createFontStyle(font, 14, 'semibold'); ctx.fillStyle = t.textHint;
    txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', qrX + qr.size / 2, qrY + qr.size + 20, qr.size);

    // Divider - consistent 12px gap from tagline
    const dividerY = taglineY + DIVIDER_GAP;
    drawDivider(ctx, P, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, t.accentSecondary);

    // Sections with TEXT WRAPPING - increased gap from divider
    let y = dividerY + layout.divider.height + 40;
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
    txt(ctx, C.FRONT_SECTION_1_TITLE, P, y, fullW); y += 28;
    ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textSecondary;
    y += drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, P, y, isP ? fullW : 600, get('itemGap', isP), '');

    y += 12;
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
    txt(ctx, C.FRONT_SECTION_2_TITLE, P, y, fullW); y += 28;
    ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
    y += drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, P, y, isP ? fullW : 600, 28, '› ');

    // Skills
    const sk = layout.skill;
    const skillX = isP ? P : 720;
    let skillY = isP ? y + 20 : 290;
    
    const skillSets = [
      { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
      { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
      { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
    ];
    
    skillSets.forEach(s => {
      ctx.font = createFontStyle(font, get('sectionTitle', isP) - 2, 'bold'); ctx.fillStyle = s.accent;
      txt(ctx, s.title, skillX, skillY, 600); skillY += SKILL_TITLE_GAP;
      skillY += drawSkillBoxes(ctx, s.items, skillX, skillY, sk.boxWidth, sk.boxHeight, sk.columns, sk.gap, s.bg, s.border, t.textPrimary, font, get('skillFont', isP));
      skillY += SKILL_SECTION_GAP;
    });

    // CTA
    const cta = get('cta', isP);
    const ctaW = isP ? cta.width : 420;
    const ctaH = isP ? cta.height : 65;
    const ctaY = isP ? skillY : y + 25;
    const ctaX = isP ? (W - ctaW) / 2 : P;
    ctx.fillStyle = t.ctaBg;
    ctx.beginPath(); ctx.roundRect(ctaX, ctaY, ctaW, ctaH, layout.cta.radius); ctx.fill();
    ctx.fillStyle = t.ctaText;
    ctx.font = createFontStyle(font, isP ? 28 : 26, 'bold');
    txtC(ctx, C.LOCATION, ctaX + ctaW / 2, ctaY + 42, ctaW - 40);

    drawCorners(ctx, t.cornerFront, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  function renderDefaultBack(ctx, W, H, P, fullW, isP) {
    const isCentered = id === 'spacious';
    const qr = get('qrBack', isP);
    const qrX = qr.x === 'right' ? W - qr.size - P : qr.x === 'center' ? (W - qr.size) / 2 : (typeof qr.x === 'number' ? qr.x : W - qr.size - P);
    const qrY = qr.y === 'bottom' ? H - qr.size - (isP ? 55 : 60) : (typeof qr.y === 'number' ? qr.y : H - qr.size - 55);

    // Header - NAME
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, isP ? fullW : 550, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    const nameY = P + ns * 0.85;
    if (isCentered && isP) txtC(ctx, C.NAME, W / 2, nameY, fullW);
    else txt(ctx, C.NAME, P, nameY, isP ? fullW : 550);

    // ALT_TITLE - positioned below name with proper gap
    const titleSize = get('title', isP) - 2;
    const altTitleY = P + ns + 35; // Use full name height + larger gap for proper spacing
    ctx.font = createFontStyle(font, titleSize, 'medium'); ctx.fillStyle = t.accentPrimary;
    if (isCentered && isP) txtC(ctx, C.ALT_TITLE, W / 2, altTitleY, fullW);
    else txt(ctx, C.ALT_TITLE, P, altTitleY, isP ? fullW : 550);

    // Divider - consistent 12px gap from ALT_TITLE (ALT_TAGLINE is in logo area, not header)
    const dividerY = altTitleY + DIVIDER_GAP;
    if (isCentered && isP) drawDivider(ctx, W / 2, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, null, true);
    else drawDivider(ctx, P, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, t.accentSecondary);
    
    let y = dividerY + layout.divider.height + 15;

    // Logo area with ALT_TAGLINE - moved up for landscape
    const logoSize = get('backLogoSize', isP);
    const logoX = isP ? W / 2 : 700 + (W - 700 - P) / 2;
    const logoStartY = isP ? y : P - 25; // Move logo up in landscape mode
    drawLogoAndTagline(ctx, t, isP ? W / 2 : logoX, logoStartY, isP ? fullW : 450, isP ? 170 : 180, logoSize, C.ALT_TAGLINE, matSettings, customLogo, font);
    if (isP) y += 190;

    // Contact section
    const leftY = isP ? y : dividerY + layout.divider.height + 35;
    let cy = leftY;
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.BACK_SECTION_1_TITLE, P, cy, fullW); cy += layout.sectionGap + 8;
    ctx.font = createFontStyle(font, get('sectionItem', isP), 'bold'); ctx.fillStyle = t.accentPrimary;
    txt(ctx, C.EMAIL, P, cy, fullW); cy += get('itemGap', isP);
    txt(ctx, C.PHONE, P, cy, fullW); cy += get('itemGap', isP) + 15;

    // Online
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.BACK_SECTION_2_TITLE, P, cy, fullW); cy += layout.sectionGap + 8;
    ctx.font = createFontStyle(font, get('sectionItem', isP) - 2, 'semibold'); ctx.fillStyle = t.textMuted;
    C.ONLINE_LINKS.forEach(link => { txt(ctx, link, P, cy, isP ? fullW : 550); cy += get('itemGap', isP) - 2; });
    cy += 25;

    // Back sections 3, 4, 5
    const rightX = isP ? P : 700;
    let ry = isP ? cy : 230;
    
    const backSections = [
      { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS, color: t.accentSecondary },
      { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS, color: t.accentTertiary },
      { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS, color: t.accentPrimary },
    ];
    
    backSections.forEach(s => {
      if ((isP && ry > H - 200) || (!isP && ry > H - 100)) return;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = s.color;
      txt(ctx, s.title, isP ? P : rightX, ry, isP ? fullW : W - rightX - P); ry += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      s.items.forEach(i => { txt(ctx, '› ' + i, isP ? P : rightX, ry, isP ? fullW : W - rightX - P); ry += get('itemGap', isP) - 2; });
      ry += 18;
    });

    // QR
    drawQR(ctx, images.linkQr, qrX, qrY, qr.size, t.qrBg);
    ctx.font = createFontStyle(font, 16, 'semibold'); ctx.fillStyle = t.textHint;
    txtC(ctx, C.LINK_QR_LABEL || 'WEBSITE', qrX + qr.size / 2, qrY + qr.size + 22, qr.size);

    drawCorners(ctx, t.cornerBack, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  // ════════════════════════════════════════════════════════════════════════
  // COMPACT LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderCompactFront(ctx, W, H, P, fullW, isP) {
    const cornerW = get('cornerWidth', isP) || (isP ? 300 : 380);
    const qr = get('qr', isP);
    const qrX = W - qr.size - P;
    const qrY = H - qr.size - P - 40;

    // Consistent header spacing
    const ELEMENT_GAP = 18; // Equal gap between all header elements

    // Centered header with logo above
    const logoSize = get('backLogoSize', isP);
    const logoH = logoSize * 0.5;
    const ns = get('name', isP);
    const ts = get('title', isP);
    const tgs = get('tagline', isP);
    
    // Calculate actual rendered heights
    ctx.font = createFontStyle(font, ns, 'bold');
    const calcNs = calcFontSize(ctx, C.NAME, isP ? W - 80 : 600, ns, layout.name.min);
    
    // Total header height: logo + gap + name + gap + title + gap + tagline
    const totalHeaderH = logoH + ELEMENT_GAP + calcNs + ELEMENT_GAP + ts + ELEMENT_GAP + tgs;
    let hy = (H - totalHeaderH) / 2;

    // Draw logo
    drawLogoOnly(ctx, t, W / 2, hy + logoH / 2, logoSize, matSettings, customLogo);
    hy += logoH + ELEMENT_GAP;

    // Draw name
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, calcNs, 'bold');
    txtC(ctx, C.NAME, W / 2, hy + calcNs * 0.85, isP ? W - 80 : 600);
    hy += calcNs + ELEMENT_GAP;

    // Draw title
    ctx.font = createFontStyle(font, ts, 'semibold'); ctx.fillStyle = t.accentCyan;
    txtC(ctx, C.TITLE, W / 2, hy + ts * 0.85, isP ? W - 80 : 600);
    hy += ts + ELEMENT_GAP;

    // Draw tagline
    ctx.font = createFontStyle(font, tgs, 'medium', true); ctx.fillStyle = t.accentSecondary;
    txtC(ctx, C.TAGLINE, W / 2, hy + tgs * 0.85, isP ? W - 80 : 600);
    const taglineBottomY = hy + tgs;
    
    // Divider - consistent gap from tagline
    const dividerY = taglineBottomY + DIVIDER_GAP;
    drawDivider(ctx, W / 2, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, null, true);

    // Four corners
    const gap = layout.sectionGap, itemGap = get('itemGap', isP);
    const stSize = get('sectionTitle', isP), siSize = get('sectionItem', isP), skSize = get('skillFont', isP);

    // Top-left - Education with TEXT WRAPPING
    let tlY = P + 40;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
    txt(ctx, C.FRONT_SECTION_1_TITLE, P, tlY, cornerW); tlY += gap;
    ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textSecondary;
    tlY += drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, P, tlY, cornerW - 10, itemGap, '');

    // Top-right - Why Me with TEXT WRAPPING
    let trY = P + 40;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
    txtR(ctx, C.FRONT_SECTION_2_TITLE, W - P, trY, cornerW); trY += gap;
    ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
    C.FRONT_SECTION_2_ITEMS.forEach(item => {
      const text = '› ' + item;
      const words = text.split(' ');
      let lines = [];
      let line = '';
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > cornerW - 10 && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) lines.push(line);
      lines.forEach(l => {
        ctx.save(); ctx.textAlign = 'right';
        ctx.fillText(l, W - P, trY);
        ctx.restore();
        trY += itemGap;
      });
    });

    // Bottom-right: QR
    drawQR(ctx, images.cardQr, qrX, qrY, qr.size, t.qrBg);
    ctx.font = createFontStyle(font, 12, 'semibold'); ctx.fillStyle = t.textHint;
    txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', qrX + qr.size / 2, qrY + qr.size + 18, qr.size);

    // Bottom-right above QR: skill set 3
    let brY = qrY - 20 - (C.SKILL_SET_3.length * itemGap) - 24;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentTertiary;
    txtR(ctx, C.SKILL_SET_3_TITLE, W - P, brY, cornerW); brY += 32;
    ctx.font = createFontStyle(font, siSize, 'medium'); ctx.fillStyle = t.textPrimary;
    C.SKILL_SET_3.forEach(s => { txtR(ctx, s, W - P, brY, cornerW); brY += itemGap; });

    // Bottom-left: CTA (location bar in corner)
    const cta = get('cta', isP);
    const ctaY = H - P - cta.height - 5;
    ctx.fillStyle = t.ctaBg;
    ctx.beginPath(); ctx.roundRect(P, ctaY, cta.width, cta.height, layout.cta.radius); ctx.fill();
    ctx.fillStyle = t.ctaText;
    ctx.font = createFontStyle(font, 18, 'bold');
    txtC(ctx, C.LOCATION, P + cta.width / 2, ctaY + 30, cta.width - 20);

    // Bottom-left above CTA: skills 1 & 2
    // First measure both skill sections to position them correctly
    ctx.font = createFontStyle(font, skSize, 'medium');
    const skill1Height = drawSkillTags(ctx, C.SKILL_SET_1, P, 0, cornerW, 'transparent', 'transparent', 'transparent', font, skSize);
    const skill2Height = drawSkillTags(ctx, C.SKILL_SET_2, P, 0, cornerW, 'transparent', 'transparent', 'transparent', font, skSize);
    
    // Position skill2 (bottom skill section) first
    const skill2TitleY = ctaY - 30 - skill2Height - 8;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentPrimary;
    txt(ctx, C.SKILL_SET_2_TITLE, P, skill2TitleY, cornerW);
    const skill2TagsY = skill2TitleY + 18;
    drawSkillTags(ctx, C.SKILL_SET_2, P, skill2TagsY, cornerW, t.frameworkBg, t.frameworkBorder, t.textPrimary, font, skSize);
    
    // Position skill1 (top skill section) above skill2
    const skill1TitleY = skill2TitleY - 56 - skill1Height - 8;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.SKILL_SET_1_TITLE, P, skill1TitleY, cornerW);
    const skill1TagsY = skill1TitleY + 18;
    drawSkillTags(ctx, C.SKILL_SET_1, P, skill1TagsY, cornerW, t.langBg, t.langBorder, t.textPrimary, font, skSize);

    drawCorners(ctx, t.cornerFront, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  function renderCompactBack(ctx, W, H, P, fullW, isP) {
    const cornerW = get('cornerWidth', isP) || (isP ? 300 : 380);
    const qr = get('qrBack', isP);
    const qrX = W - qr.size - P;
    const qrY = H - qr.size - P - 15;
    const gap = layout.sectionGap, itemGap = get('itemGap', isP);
    const stSize = get('sectionTitle', isP), siSize = get('sectionItem', isP);

    // Consistent header spacing
    const ELEMENT_GAP = 18; // Equal gap between all header elements

    // Centered header - ALT_TAGLINE IS in header for compact
    const logoSize = get('backLogoSize', isP);
    const logoH = logoSize * 0.5;
    const ns = get('name', isP);
    const ts = get('title', isP);
    const tgs = get('tagline', isP);
    
    // Calculate actual rendered heights
    ctx.font = createFontStyle(font, ns, 'bold');
    const calcNs = calcFontSize(ctx, C.NAME, isP ? 520 : 550, ns, layout.name.min);
    
    // Total header height: logo + gap + name + gap + altTitle + gap + altTagline
    const totalHeaderH = logoH + ELEMENT_GAP + calcNs + ELEMENT_GAP + ts + ELEMENT_GAP + tgs;
    let hy = (H - totalHeaderH) / 2;

    // Draw logo
    drawLogoOnly(ctx, t, W / 2, hy + logoH / 2, logoSize, matSettings, customLogo);
    hy += logoH + ELEMENT_GAP;

    // Draw name
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, calcNs, 'bold');
    txtC(ctx, C.NAME, W / 2, hy + calcNs * 0.85, isP ? 520 : 550);
    hy += calcNs + ELEMENT_GAP;

    // Draw ALT_TITLE
    ctx.font = createFontStyle(font, ts, 'medium'); ctx.fillStyle = t.accentPrimary;
    txtC(ctx, C.ALT_TITLE, W / 2, hy + ts * 0.85, isP ? 520 : 550);
    hy += ts + ELEMENT_GAP;

    // Draw ALT_TAGLINE
    ctx.font = createFontStyle(font, tgs, 'medium', true); ctx.fillStyle = t.textHint;
    txtC(ctx, C.ALT_TAGLINE, W / 2, hy + tgs * 0.85, isP ? 480 : 500);
    const taglineBottomY = hy + tgs;
    
    // Divider - consistent gap from ALT_TAGLINE
    const dividerY = taglineBottomY + DIVIDER_GAP;
    drawDivider(ctx, W / 2, dividerY, 280, 2, t.accentPrimary, null, true);

    // Four corners
    let tlY = P + 40;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.BACK_SECTION_1_TITLE, P, tlY, cornerW); tlY += gap;
    ctx.font = createFontStyle(font, siSize, 'bold'); ctx.fillStyle = t.accentPrimary;
    txt(ctx, C.EMAIL, P, tlY, cornerW); tlY += itemGap;
    txt(ctx, C.PHONE, P, tlY, cornerW); tlY += itemGap + 8;

    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.BACK_SECTION_2_TITLE, P, tlY, cornerW); tlY += gap;
    ctx.font = createFontStyle(font, 14, 'semibold'); ctx.fillStyle = t.textMuted;
    C.ONLINE_LINKS.forEach(link => { txt(ctx, link, P, tlY, cornerW); tlY += itemGap - 2; });

    let trY = P + 40;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
    txtR(ctx, C.BACK_SECTION_3_TITLE, W - P, trY, cornerW); trY += gap;
    ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_3_ITEMS.forEach(i => { txtR(ctx, '› ' + i, W - P, trY, cornerW); trY += itemGap; });

    let blY = H - P - 25 - (C.BACK_SECTION_4_ITEMS.length * itemGap) - gap;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentTertiary;
    txt(ctx, C.BACK_SECTION_4_TITLE, P, blY, cornerW); blY += gap;
    ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_4_ITEMS.forEach(i => { txt(ctx, '› ' + i, P, blY, cornerW); blY += itemGap; });

    let brY = qrY - 24 - (C.BACK_SECTION_5_ITEMS.length * itemGap) - gap;
    ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentPrimary;
    txtR(ctx, C.BACK_SECTION_5_TITLE, W - P, brY, cornerW); brY += gap;
    ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_5_ITEMS.forEach(i => { txtR(ctx, '› ' + i, W - P, brY, cornerW); brY += itemGap; });

    drawQR(ctx, images.linkQr, qrX, qrY, qr.size, t.qrBg);
    ctx.font = createFontStyle(font, 12, 'semibold'); ctx.fillStyle = t.textHint;
    txtC(ctx, C.LINK_QR_LABEL || 'WEBSITE', qrX + qr.size / 2, H - P, qr.size);

    drawCorners(ctx, t.cornerBack, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  // ════════════════════════════════════════════════════════════════════════
  // SPACIOUS LAYOUT (BOLD)
  // ════════════════════════════════════════════════════════════════════════
  function renderSpaciousFront(ctx, W, H, P, fullW, isP) {
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, fullW, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txtC(ctx, C.NAME, W / 2, isP ? 110 : 110, fullW);

    ctx.font = createFontStyle(font, get('title', isP), 'semibold'); ctx.fillStyle = t.accentCyan;
    txtC(ctx, C.TITLE, W / 2, isP ? 160 : 160, fullW);
    ctx.font = createFontStyle(font, get('tagline', isP), 'medium', true); ctx.fillStyle = t.accentSecondary;
    const taglineY = isP ? 200 : 200;
    txtC(ctx, C.TAGLINE, W / 2, taglineY, fullW);
    
    // Divider - consistent 12px gap from tagline
    const dividerY = taglineY + DIVIDER_GAP;
    drawDivider(ctx, W / 2, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, null, true);

    // Increased gap from divider to content
    const DIVIDER_CONTENT_GAP = isP ? 50 : 65;

    if (isP) {
      // Portrait: vertical flow with TEXT WRAPPING
      let y = dividerY + layout.divider.height + DIVIDER_CONTENT_GAP;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_1_TITLE, W / 2, y, fullW); y += 32;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => {
        y += drawWrappedItemCentered(ctx, item, W / 2, y, fullW - 60, 26);
      });

      y += 20;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_2_TITLE, W / 2, y, fullW); y += 32;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => {
        y += drawWrappedItemCentered(ctx, '› ' + item, W / 2, y, fullW - 60, 26);
      });

      y += 30;
      const skillSets = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      skillSets.forEach((s, idx) => {
        ctx.font = createFontStyle(font, 22, 'bold'); ctx.fillStyle = s.accent;
        txtC(ctx, s.title, W / 2, y, fullW); y += SKILL_TITLE_GAP;
        y += drawSkillTags(ctx, s.items, W / 2, y, fullW - 60, s.bg, s.border, t.textPrimary, font, get('skillFont', isP), true);
        y += SKILL_SECTION_GAP;
      });

      const cta = get('cta', isP);
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath(); ctx.roundRect((W - cta.width) / 2, y + 5, cta.width, cta.height, layout.cta.radius); ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 22, 'bold');
      txtC(ctx, C.LOCATION, W / 2, y + 40, cta.width - 40);

      const qr = get('qr', isP);
      drawQR(ctx, images.cardQr, W - qr.size - P, H - qr.size - 55, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qr.size / 2 - P, H - 30, 100);
    } else {
      // Landscape: 3 columns with TEXT WRAPPING
      const COL_W = 380, GAP = 60;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      const colY = dividerY + layout.divider.height + DIVIDER_CONTENT_GAP;

      let y1 = colY;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txt(ctx, C.FRONT_SECTION_1_TITLE, START_X, y1, COL_W); y1 += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textSecondary;
      y1 += drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, START_X, y1, COL_W - 20, 26, '');
      y1 += 18;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txt(ctx, C.FRONT_SECTION_2_TITLE, START_X, y1, COL_W); y1 += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      y1 += drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, START_X, y1, COL_W - 20, 26, '› ');

      const col2X = START_X + COL_W + GAP;
      let y2 = colY;
      const skillSets = [
        { t: C.SKILL_SET_1_TITLE, i: C.SKILL_SET_1, a: t.accentSecondary, b: t.langBg, br: t.langBorder },
        { t: C.SKILL_SET_2_TITLE, i: C.SKILL_SET_2, a: t.accentPrimary, b: t.frameworkBg, br: t.frameworkBorder },
        { t: C.SKILL_SET_3_TITLE, i: C.SKILL_SET_3, a: t.accentTertiary, b: t.aiBg, br: t.aiBorder },
      ];
      skillSets.forEach((s, idx) => {
        ctx.font = createFontStyle(font, 22, 'bold'); ctx.fillStyle = s.a;
        txtC(ctx, s.t, col2X + COL_W / 2, y2, COL_W); y2 += SKILL_TITLE_GAP;
        y2 += drawSkillTags(ctx, s.i, col2X + COL_W / 2, y2, COL_W, s.b, s.br, t.textPrimary, font, 16, true);
        y2 += SKILL_SECTION_GAP;
      });

      const col3X = START_X + (COL_W + GAP) * 2;
      const cta = get('cta', isP);
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath(); ctx.roundRect(col3X, colY, COL_W, cta.height, layout.cta.radius); ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      txtC(ctx, C.LOCATION, col3X + COL_W / 2, colY + 42, COL_W - 40);

      const qr = get('qr', isP);
      drawQR(ctx, images.cardQr, col3X + (COL_W - qr.size) / 2, colY + 100, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', col3X + COL_W / 2, colY + 260, 120);
    }

    drawCorners(ctx, t.cornerFront, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  // ════════════════════════════════════════════════════════════════════════
  // CENTERED LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderCenteredFront(ctx, W, H, P, fullW, isP) {
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, fullW, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txtC(ctx, C.NAME, W / 2, isP ? 80 : 90, fullW);

    ctx.font = createFontStyle(font, get('title', isP), 'semibold'); ctx.fillStyle = t.accentCyan;
    txtC(ctx, C.TITLE, W / 2, isP ? 125 : 138, fullW);
    ctx.font = createFontStyle(font, get('tagline', isP), 'medium', true); ctx.fillStyle = t.accentSecondary;
    const taglineY = isP ? 162 : 175;
    txtC(ctx, C.TAGLINE, W / 2, taglineY, fullW);
    
    // Divider - consistent 12px gap from tagline
    const dividerY = taglineY + DIVIDER_GAP;
    drawDivider(ctx, W / 2, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, null, true);

    // Increased gap from divider to content
    const DIVIDER_CONTENT_GAP = isP ? 45 : 55;

    const sk = layout.skill;
    const boxW = sk.boxWidth, boxH = sk.boxHeight, cols = sk.columns, gap = sk.gap;

    const drawCenteredBoxes = (skills, startX, startY, maxW, colCount) => {
      ctx.font = createFontStyle(font, get('skillFont', isP), 'semibold');
      const totalRowW = colCount * gap - (gap - boxW);
      const baseX = startX + (maxW - totalRowW) / 2;
      const rows = Math.ceil(skills.length / colCount);
      skills.forEach((s, i) => {
        const row = Math.floor(i / colCount), col = i % colCount;
        const itemsInRow = Math.min(colCount, skills.length - row * colCount);
        let rowX = baseX;
        if (itemsInRow < colCount) rowX = startX + (maxW - (itemsInRow * gap - (gap - boxW))) / 2;
        const bx = rowX + col * gap, by = startY + row * (boxH + 10);
        ctx.fillStyle = sk.bg || t.langBg; ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = sk.border || t.langBorder; ctx.strokeRect(bx, by, boxW, boxH);
        ctx.fillStyle = t.textPrimary; txt(ctx, s, bx + 10, by + boxH / 2 + 6, boxW - 20);
      });
      return rows * (boxH + 10);
    };

    const skillSets = [
      { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
      { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
      { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
    ];

    if (isP) {
      // Portrait: vertical centered flow with TEXT WRAPPING
      let y = dividerY + layout.divider.height + DIVIDER_CONTENT_GAP;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_1_TITLE, W / 2, y, fullW); y += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => {
        y += drawWrappedItemCentered(ctx, item, W / 2, y, fullW - 60, 26);
      });
      y += 16;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_2_TITLE, W / 2, y, fullW); y += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => {
        y += drawWrappedItemCentered(ctx, '› ' + item, W / 2, y, fullW - 60, 26);
      });

      y += 20;
      skillSets.forEach(s => {
        ctx.font = createFontStyle(font, 22, 'bold'); ctx.fillStyle = s.accent;
        txtC(ctx, s.title, W / 2, y, fullW); y += SKILL_TITLE_GAP;
        sk.bg = s.bg; sk.border = s.border;
        y += drawCenteredBoxes(s.items, P, y, fullW, cols);
        y += SKILL_SECTION_GAP;
      });

      const cta = get('cta', isP);
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath(); ctx.roundRect((W - cta.width) / 2, y, cta.width, cta.height, layout.cta.radius); ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      txtC(ctx, C.LOCATION, W / 2, y + 38, cta.width - 40);

      const qr = get('qr', isP);
      drawQR(ctx, images.cardQr, (W - qr.size) / 2, H - qr.size - 55, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W / 2, H - 28, 120);
    } else {
      // Landscape: 3 columns with TEXT WRAPPING
      const COL_W = 380, GAP = 50;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      const colY = dividerY + layout.divider.height + DIVIDER_CONTENT_GAP;

      // Column 1: Sections with wrapping
      let y1 = colY;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_1_TITLE, START_X + COL_W / 2, y1, COL_W); y1 += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => {
        y1 += drawWrappedItemCentered(ctx, item, START_X + COL_W / 2, y1, COL_W - 40, 26);
      });
      y1 += 16;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentCyan;
      txtC(ctx, C.FRONT_SECTION_2_TITLE, START_X + COL_W / 2, y1, COL_W); y1 += 28;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => {
        y1 += drawWrappedItemCentered(ctx, '› ' + item, START_X + COL_W / 2, y1, COL_W - 40, 26);
      });

      // Column 2: Skills
      const col2X = START_X + COL_W + GAP;
      let y2 = colY;
      const skillBoxW = 175, skillBoxH = 32, skillCols = 2, skillGap = 185;
      skillSets.forEach(s => {
        ctx.font = createFontStyle(font, 20, 'bold'); ctx.fillStyle = s.accent;
        txtC(ctx, s.title, col2X + COL_W / 2, y2, COL_W); y2 += SKILL_TITLE_GAP;
        ctx.font = createFontStyle(font, 16, 'semibold');
        const rows = Math.ceil(s.items.length / skillCols);
        const totalRowW = skillCols * skillGap - (skillGap - skillBoxW);
        s.items.forEach((skill, i) => {
          const row = Math.floor(i / skillCols), col = i % skillCols;
          const itemsInRow = Math.min(skillCols, s.items.length - row * skillCols);
          let rowX = col2X + (COL_W - totalRowW) / 2;
          if (itemsInRow < skillCols) rowX = col2X + (COL_W - (itemsInRow * skillGap - (skillGap - skillBoxW))) / 2;
          const bx = rowX + col * skillGap, by = y2 + row * (skillBoxH + 10);
          ctx.fillStyle = s.bg; ctx.fillRect(bx, by, skillBoxW, skillBoxH);
          ctx.strokeStyle = s.border; ctx.strokeRect(bx, by, skillBoxW, skillBoxH);
          ctx.fillStyle = t.textPrimary; txt(ctx, skill, bx + 8, by + skillBoxH / 2 + 5, skillBoxW - 16);
        });
        y2 += rows * (skillBoxH + 10) + SKILL_SECTION_GAP;
      });

      // Column 3: CTA + QR
      const col3X = START_X + (COL_W + GAP) * 2;
      let y3 = colY;
      const cta = get('cta', isP);
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath(); ctx.roundRect(col3X, y3, COL_W, cta.height, layout.cta.radius); ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      txtC(ctx, C.LOCATION, col3X + COL_W / 2, y3 + 38, COL_W - 30);
      y3 += cta.height + 30;

      const qr = get('qr', isP);
      drawQR(ctx, images.cardQr, col3X + (COL_W - qr.size) / 2, y3, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', col3X + COL_W / 2, y3 + qr.size + 20, 100);
    }

    drawCorners(ctx, t.cornerFront, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  // ════════════════════════════════════════════════════════════════════════
  // CENTERED BACK LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderCenteredBack(ctx, W, H, P, fullW, isP) {
    // Centered header - NAME
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, fullW, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    const nameY = P + ns * 0.85;
    txtC(ctx, C.NAME, W / 2, nameY, fullW);

    // ALT_TITLE - positioned below name with proper gap
    const titleSize = get('title', isP) - 2;
    const altTitleY = P + ns + 35; // Use full name height + larger gap for proper spacing
    ctx.font = createFontStyle(font, titleSize, 'medium'); ctx.fillStyle = t.accentPrimary;
    txtC(ctx, C.ALT_TITLE, W / 2, altTitleY, fullW);

    // Divider - consistent 12px gap from ALT_TITLE (ALT_TAGLINE is in logo area)
    const dividerY = altTitleY + DIVIDER_GAP;
    drawDivider(ctx, W / 2, dividerY, layout.divider.width, layout.divider.height, t.accentPrimary, null, true);
    
    let y = dividerY + layout.divider.height + 15;

    // Logo area with ALT_TAGLINE - centered
    const logoSize = get('backLogoSize', isP);
    const logoY = isP ? y : y + 20; // Move logo lower in landscape mode
    drawLogoAndTagline(ctx, t, W / 2, logoY, fullW, isP ? 170 : 150, logoSize, C.ALT_TAGLINE, matSettings, customLogo, font);
    y += isP ? 190 : 170;

    if (isP) {
      // Portrait: centered content flow
      const qr = get('qrBack', isP);
      const qrX = (W - qr.size) / 2;
      const qrY = H - qr.size - 55;
      
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txtC(ctx, C.BACK_SECTION_1_TITLE, W / 2, y, fullW); y += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'bold'); ctx.fillStyle = t.accentPrimary;
      txtC(ctx, C.EMAIL, W / 2, y, fullW); y += get('itemGap', isP);
      txtC(ctx, C.PHONE, W / 2, y, fullW); y += get('itemGap', isP) + 15;

      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txtC(ctx, C.BACK_SECTION_2_TITLE, W / 2, y, fullW); y += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP) - 2, 'semibold'); ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { txtC(ctx, link, W / 2, y, fullW); y += get('itemGap', isP) - 2; });
      y += 25;

      const backSections = [
        { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS, color: t.accentSecondary },
        { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS, color: t.accentTertiary },
        { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS, color: t.accentPrimary },
      ];
      
      backSections.forEach(s => {
        if (y > qrY - 80) return;
        ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = s.color;
        txtC(ctx, s.title, W / 2, y, fullW); y += layout.sectionGap + 8;
        ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
        s.items.forEach(i => { txtC(ctx, '› ' + i, W / 2, y, fullW); y += get('itemGap', isP) - 2; });
        y += 18;
      });

      drawQR(ctx, images.linkQr, qrX, qrY, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 16, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.LINK_QR_LABEL || 'WEBSITE', W / 2, qrY + qr.size + 22, qr.size);
    } else {
      // Landscape: 3 columns centered - FIXED overlapping issue
      const COL_W = 380, GAP = 50;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      
      // Start content below logo area with extra padding
      const contentStartY = y + 30;

      // Column 1: Contact info
      let y1 = contentStartY;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txtC(ctx, C.BACK_SECTION_1_TITLE, START_X + COL_W / 2, y1, COL_W); y1 += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'bold'); ctx.fillStyle = t.accentPrimary;
      txtC(ctx, C.EMAIL, START_X + COL_W / 2, y1, COL_W); y1 += get('itemGap', isP);
      txtC(ctx, C.PHONE, START_X + COL_W / 2, y1, COL_W); y1 += get('itemGap', isP) + 15;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txtC(ctx, C.BACK_SECTION_2_TITLE, START_X + COL_W / 2, y1, COL_W); y1 += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP) - 2, 'semibold'); ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { txtC(ctx, link, START_X + COL_W / 2, y1, COL_W); y1 += get('itemGap', isP) - 2; });

      // Column 2: Sections 3 & 4
      const col2X = START_X + COL_W + GAP;
      let y2 = contentStartY;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txtC(ctx, C.BACK_SECTION_3_TITLE, col2X + COL_W / 2, y2, COL_W); y2 += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(i => { txtC(ctx, '› ' + i, col2X + COL_W / 2, y2, COL_W); y2 += get('itemGap', isP) - 2; });
      y2 += 18;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentTertiary;
      txtC(ctx, C.BACK_SECTION_4_TITLE, col2X + COL_W / 2, y2, COL_W); y2 += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(i => { txtC(ctx, '› ' + i, col2X + COL_W / 2, y2, COL_W); y2 += get('itemGap', isP) - 2; });

      // Column 3: Section 5 + QR below it
      const col3X = START_X + (COL_W + GAP) * 2;
      let y3 = contentStartY;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentPrimary;
      txtC(ctx, C.BACK_SECTION_5_TITLE, col3X + COL_W / 2, y3, COL_W); y3 += layout.sectionGap + 8;
      ctx.font = createFontStyle(font, get('sectionItem', isP), 'semibold'); ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(i => { txtC(ctx, '› ' + i, col3X + COL_W / 2, y3, COL_W); y3 += get('itemGap', isP) - 2; });
      
      // QR code below certifications section in column 3
      const qr = get('qrBack', isP);
      const qrY = y3 + 30;
      const qrX = col3X + (COL_W - qr.size) / 2;
      drawQR(ctx, images.linkQr, qrX, qrY, qr.size, t.qrBg);
      ctx.font = createFontStyle(font, 16, 'semibold'); ctx.fillStyle = t.textHint;
      txtC(ctx, C.LINK_QR_LABEL || 'WEBSITE', col3X + COL_W / 2, qrY + qr.size + 22, qr.size);
    }

    drawCorners(ctx, t.cornerBack, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  // ════════════════════════════════════════════════════════════════════════
  // MINIMAL LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderMinimalFront(ctx, W, H, P, fullW, isP) {
    const upper = layout.uppercaseTitles;

    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, isP ? fullW : 700, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txt(ctx, C.NAME, P, 105, isP ? fullW : 700);

    ctx.font = createFontStyle(font, get('title', isP), 'medium'); ctx.fillStyle = t.accentCyan;
    txt(ctx, C.TITLE, P, isP ? 155 : 160, isP ? fullW : 700);
    ctx.font = createFontStyle(font, get('tagline', isP), 'regular', true); ctx.fillStyle = t.textMuted;
    txt(ctx, C.TAGLINE, P, isP ? 195 : 200, isP ? fullW : 700);

    const leftW = isP ? fullW : 560;
    let y = isP ? 270 : 270;
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, upper ? C.FRONT_SECTION_1_TITLE.toUpperCase() : C.FRONT_SECTION_1_TITLE, P, y, leftW); y += 30;
    ctx.font = createFontStyle(font, get('sectionItem', isP), 'regular'); ctx.fillStyle = t.textSecondary;
    y += drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, P, y, leftW - 20, 30, '');

    y += 30;
    ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
    txt(ctx, upper ? C.FRONT_SECTION_2_TITLE.toUpperCase() : C.FRONT_SECTION_2_TITLE, P, y, leftW); y += 30;
    ctx.font = createFontStyle(font, get('sectionItem', isP), 'regular'); ctx.fillStyle = t.textMuted;
    y += drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, P, y, leftW - 20, 30, '');

    // Skills - minimal mode keeps its own spacing
    const skillX = isP ? P : 750;
    let skillY = isP ? y + 40 : 270;
    const skillW = isP ? fullW : 560;
    const skillSets = [
      { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1 },
      { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2 },
      { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3 },
    ];
    skillSets.forEach(s => {
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentPrimary;
      txt(ctx, upper ? s.title.toUpperCase() : s.title, skillX, skillY, skillW); skillY += 26;
      const usedH = drawSkillsInline(ctx, s.items, skillX, skillY, skillW, t.textSecondary, font, get('skillFont', isP));
      skillY += usedH + 24;
    });

    // Location
    if (isP) {
      skillY += 10;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txt(ctx, 'LOCATION', P, skillY, fullW); skillY += 36;
      ctx.font = createFontStyle(font, 28, 'medium'); ctx.fillStyle = t.textPrimary;
      txt(ctx, C.LOCATION, P, skillY, fullW);
    } else {
      skillY += 15;
      ctx.font = createFontStyle(font, get('sectionTitle', isP), 'bold'); ctx.fillStyle = t.accentSecondary;
      txt(ctx, 'LOCATION', skillX, skillY, skillW); skillY += 36;
      ctx.font = createFontStyle(font, 28, 'medium'); ctx.fillStyle = t.textPrimary;
      txt(ctx, C.LOCATION, skillX, skillY, skillW);
    }

    // Logo top-right
    const logoSize = get('backLogoSize', isP);
    drawLogoAndTagline(ctx, t, W - P - logoSize / 2, isP ? 120 : 140, logoSize + 40, 100, logoSize, '', matSettings, customLogo, font);

    // QR
    const qr = get('qr', isP);
    drawQR(ctx, images.cardQr, W - qr.size - P, H - qr.size - P - 25, qr.size, t.qrBg);
    ctx.font = createFontStyle(font, 12, 'semibold'); ctx.fillStyle = t.textHint;
    txtC(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qr.size / 2 - P, H - P, qr.size);
  }

  // ════════════════════════════════════════════════════════════════════════
  // CARDS LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  function renderCardsFront(ctx, W, H, P, fullW, isP) {
    const card = layout.card;
    const R = card.radius;
    const stSize = get('sectionTitle', isP), siSize = get('sectionItem', isP), skSize = get('skillFont', isP);

    // Header card
    const headerH = isP ? 115 : 100;
    drawCard(ctx, P, P, fullW, headerH, R, card.bg, card.border);
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, fullW - 140, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txt(ctx, C.NAME, P + 20, P + (isP ? 42 : 40), fullW - 140);
    ctx.font = createFontStyle(font, get('title', isP), 'semibold'); ctx.fillStyle = t.accentCyan;
    txt(ctx, C.TITLE, P + 20, P + (isP ? 75 : 68), fullW - 140);
    ctx.font = createFontStyle(font, get('tagline', isP), 'medium', true); ctx.fillStyle = t.accentSecondary;
    txt(ctx, C.TAGLINE, P + 20, P + (isP ? 100 : 90), fullW - 140);

    const qr = get('qr', isP);
    drawQR(ctx, images.cardQr, W - P - qr.size - 12, P + 12, qr.size, t.qrBg);

    if (isP) {
      const leftW = (fullW - 10) * 0.54;
      const rightW = (fullW - 10) * 0.46;
      let leftY = P + headerH + 8, rightY = P + headerH + 8;
      const rightX = P + leftW + 10;
      const cardGap = 8;

      // Section 1 - Education with text wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s1ItemsHeight = drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, 0, 0, leftW - 28, 24, '', true);
      const s1H = 32 + s1ItemsHeight + 12;
      drawCard(ctx, P, leftY, leftW, s1H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.FRONT_SECTION_1_TITLE, P + leftW / 2, leftY + 24);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textSecondary;
      drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, P + 14, leftY + 48, leftW - 28, 24, '');
      leftY += s1H + cardGap;

      // Section 2 - Why Me with text wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s2ItemsHeight = drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, 0, 0, leftW - 28, 24, '› ', true);
      const s2H = 32 + s2ItemsHeight + 12;
      drawCard(ctx, P, leftY, leftW, s2H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.FRONT_SECTION_2_TITLE, P + leftW / 2, leftY + 24);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, P + 14, leftY + 48, leftW - 28, 24, '› ');
      leftY += s2H + cardGap;

      // Skill cards - editorial mode keeps its own spacing
      const skillCards = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      const skillSectionGap = 14;
      skillCards.forEach(sc => {
        const rows = Math.ceil(sc.items.length / 2);
        const scH = 28 + rows * 36 + 10;
        drawCard(ctx, rightX, rightY, rightW, scH, R, card.bg, card.border);
        ctx.font = createFontStyle(font, stSize - 3, 'bold'); ctx.fillStyle = sc.accent;
        ctx.save(); ctx.textAlign = 'center';
        ctx.fillText(sc.title, rightX + rightW / 2, rightY + 20);
        ctx.restore();
        ctx.font = createFontStyle(font, skSize - 1, 'semibold');
        const skillBoxW = (rightW - 32) / 2;
        const skillBoxH = 28;
        sc.items.forEach((s, i) => {
          const sx = rightX + 12 + (i % 2) * (skillBoxW + 4);
          const sy = rightY + 32 + Math.floor(i / 2) * (skillBoxH + 4);
          ctx.fillStyle = sc.bg; ctx.fillRect(sx, sy, skillBoxW, skillBoxH);
          ctx.strokeStyle = sc.border; ctx.strokeRect(sx, sy, skillBoxW, skillBoxH);
          ctx.fillStyle = t.textPrimary;
          ctx.save(); ctx.textAlign = 'center';
          ctx.fillText(truncate(ctx, s, skillBoxW - 12), sx + skillBoxW / 2, sy + 19);
          ctx.restore();
        });
        rightY += scH + skillSectionGap;
      });

      // CTA
      const ctaY = Math.max(leftY, rightY) + 4;
      const ctaH = 60;
      drawCard(ctx, P, ctaY, fullW, ctaH, R, t.ctaBg, null);
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 26, 'bold');
      txtC(ctx, C.LOCATION, W / 2, ctaY + 40, fullW - 40);
    } else {
      // Landscape layout
      const totalW = fullW - P * 3;
      const sectionW = totalW * 0.30;
      const skillW = totalW * 0.235;
      const cardY = headerH + P + 10;
      const cardH = H - cardY - P - 70;

      // Section 1 with wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s1ItemsHeight = drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, 0, 0, sectionW - 28, 24, '', true);
      const s1H = Math.min(cardH * 0.48, 32 + s1ItemsHeight + 14);
      drawCard(ctx, P, cardY, sectionW, s1H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.FRONT_SECTION_1_TITLE, P + sectionW / 2, cardY + 26);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textSecondary;
      drawWrappedItems(ctx, C.FRONT_SECTION_1_ITEMS, P + 14, cardY + 50, sectionW - 28, 24, '');

      // Section 2 with wrapping
      const card1bY = cardY + s1H + 8;
      const s2H = cardH - s1H - 8;
      drawCard(ctx, P, card1bY, sectionW, s2H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentCyan;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.FRONT_SECTION_2_TITLE, P + sectionW / 2, card1bY + 26);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.FRONT_SECTION_2_ITEMS, P + 14, card1bY + 50, sectionW - 28, 24, '› ');

      // Skill cards - editorial mode keeps its own spacing
      const skillCards = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      skillCards.forEach((sc, idx) => {
        const x = P + sectionW + P + (skillW + P) * idx;
        drawCard(ctx, x, cardY, skillW, cardH, R, card.bg, card.border);
        ctx.font = createFontStyle(font, stSize - 2, 'bold'); ctx.fillStyle = sc.accent;
        ctx.save(); ctx.textAlign = 'center';
        ctx.fillText(sc.title, x + skillW / 2, cardY + 24);
        ctx.restore();
        ctx.font = createFontStyle(font, skSize - 1, 'semibold');
        sc.items.forEach((s, i) => {
          const sy = cardY + 42 + i * 36;
          ctx.fillStyle = sc.bg; ctx.fillRect(x + 10, sy, skillW - 20, 28);
          ctx.strokeStyle = sc.border; ctx.strokeRect(x + 10, sy, skillW - 20, 28);
          ctx.fillStyle = t.textPrimary;
          ctx.save(); ctx.textAlign = 'center';
          ctx.fillText(truncate(ctx, s, skillW - 32), x + skillW / 2, sy + 19);
          ctx.restore();
        });
      });

      // CTA
      const ctaY = H - P - 55;
      drawCard(ctx, (W - 380) / 2, ctaY, 380, 50, R, t.ctaBg, null);
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      txtC(ctx, C.LOCATION, W / 2, ctaY + 34, 360);
    }

    drawCorners(ctx, t.cornerFront, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  function renderCardsBack(ctx, W, H, P, fullW, isP) {
    const card = layout.card;
    const R = card.radius;
    const stSize = get('sectionTitle', isP), siSize = get('sectionItem', isP);
    const lineHeight = siSize + 6;

    // Header card
    const headerH = isP ? 115 : 90;
    drawCard(ctx, P, P, fullW, headerH, R, card.bg, card.border);
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, get('name', isP), 'bold');
    const ns = calcFontSize(ctx, C.NAME, fullW - 140, get('name', isP), layout.name.min);
    ctx.font = createFontStyle(font, ns, 'bold');
    txt(ctx, C.NAME, P + 20, P + (isP ? 42 : 38), fullW - 140);
    ctx.font = createFontStyle(font, 24, 'medium'); ctx.fillStyle = t.accentPrimary;
    txt(ctx, C.ALT_TITLE, P + 20, P + (isP ? 75 : 66), fullW - 140);
    if (isP) {
      ctx.font = createFontStyle(font, 18, 'medium', true); ctx.fillStyle = t.textHint;
      txt(ctx, C.ALT_TAGLINE, P + 20, P + 100, fullW - 140);
    }

    const qr = get('qrBack', isP);
    drawQR(ctx, images.linkQr, W - P - qr.size - 12, P + 10, qr.size, t.qrBg);

    if (isP) {
      const leftW = (fullW - 10) * 0.54;
      const rightW = (fullW - 10) * 0.46;
      let leftY = P + headerH + 8, rightY = P + headerH + 8;
      const rightX = P + leftW + 10;
      const cardGap = 8;
      const sectionGap = 12;

      // Contact card
      const contactH = 34 + 28 * 2 + 14;
      drawCard(ctx, P, leftY, leftW, contactH, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_1_TITLE, P + leftW / 2, leftY + 22);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'bold'); ctx.fillStyle = t.accentPrimary;
      txt(ctx, C.EMAIL, P + 14, leftY + 50, leftW - 28);
      txt(ctx, C.PHONE, P + 14, leftY + 78, leftW - 28);
      leftY += contactH + cardGap;

      // Online card with wrapping
      ctx.font = createFontStyle(font, siSize - 2, 'semibold');
      const onlineItemsHeight = drawWrappedItems(ctx, C.ONLINE_LINKS, 0, 0, leftW - 28, lineHeight, '', true);
      const onlineH = 34 + onlineItemsHeight + 10;
      drawCard(ctx, P, leftY, leftW, onlineH, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_2_TITLE, P + leftW / 2, leftY + 22);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize - 2, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.ONLINE_LINKS, P + 14, leftY + 46, leftW - 28, lineHeight, '');
      leftY += onlineH + cardGap;

      // Section 3 with wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s3ItemsHeight = drawWrappedItems(ctx, C.BACK_SECTION_3_ITEMS, 0, 0, leftW - 28, lineHeight, '› ', true);
      const s3H = 34 + s3ItemsHeight + 10;
      drawCard(ctx, P, leftY, leftW, s3H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_3_TITLE, P + leftW / 2, leftY + 22);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.BACK_SECTION_3_ITEMS, P + 14, leftY + 46, leftW - 28, lineHeight, '› ');
      leftY += s3H + cardGap;

      // Section 4 with wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s4ItemsHeight = drawWrappedItems(ctx, C.BACK_SECTION_4_ITEMS, 0, 0, rightW - 28, lineHeight, '› ', true);
      const s4H = 34 + s4ItemsHeight + 10;
      drawCard(ctx, rightX, rightY, rightW, s4H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentTertiary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_4_TITLE, rightX + rightW / 2, rightY + 22);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.BACK_SECTION_4_ITEMS, rightX + 14, rightY + 46, rightW - 28, lineHeight, '› ');
      rightY += s4H + sectionGap;

      // Section 5 with wrapping
      ctx.font = createFontStyle(font, siSize, 'semibold');
      const s5ItemsHeight = drawWrappedItems(ctx, C.BACK_SECTION_5_ITEMS, 0, 0, rightW - 28, lineHeight, '› ', true);
      const s5H = 34 + s5ItemsHeight + 10;
      drawCard(ctx, rightX, rightY, rightW, s5H, R, card.bg, card.border);
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentPrimary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_5_TITLE, rightX + rightW / 2, rightY + 22);
      ctx.restore();
      ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.BACK_SECTION_5_ITEMS, rightX + 14, rightY + 46, rightW - 28, lineHeight, '› ');
      rightY += s5H + sectionGap;

      // Logo card
      const logoCardH = 140;
      drawCard(ctx, rightX, rightY, rightW, logoCardH, R, card.bg, card.border);
      drawLogoAndTagline(ctx, t, rightX + rightW / 2, rightY + 8, rightW - 28, logoCardH - 16, 90, '', matSettings, customLogo, font);
    } else {
      // Landscape layout
      const totalW = fullW - 36;
      const contactW = totalW * 0.28;
      const sectionW = totalW * 0.24;
      const cardY = headerH + P + 10;
      const cardH = H - cardY - P - 10;

      // Contact column with wrapping
      drawCard(ctx, P, cardY, contactW, cardH, R, card.bg, card.border);
      let y1 = cardY + 24;
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_1_TITLE, P + contactW / 2, y1);
      ctx.restore();
      y1 += 28;
      ctx.font = createFontStyle(font, siSize, 'bold'); ctx.fillStyle = t.accentPrimary;
      txt(ctx, C.EMAIL, P + 14, y1, contactW - 28); y1 += 26;
      txt(ctx, C.PHONE, P + 14, y1, contactW - 28); y1 += 36;
      ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = t.accentSecondary;
      ctx.save(); ctx.textAlign = 'center';
      ctx.fillText(C.BACK_SECTION_2_TITLE, P + contactW / 2, y1);
      ctx.restore();
      y1 += 28;
      ctx.font = createFontStyle(font, siSize - 2, 'semibold'); ctx.fillStyle = t.textMuted;
      drawWrappedItems(ctx, C.ONLINE_LINKS, P + 14, y1, contactW - 28, lineHeight, '');

      // Other sections with wrapping
      const sections = [
        { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS, color: t.accentSecondary },
        { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS, color: t.accentTertiary },
        { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS, color: t.accentPrimary },
      ];
      sections.forEach((s, idx) => {
        const x = P + contactW + 12 + (sectionW + 12) * idx;
        drawCard(ctx, x, cardY, sectionW, cardH, R, card.bg, card.border);
        let sy = cardY + 24;
        ctx.font = createFontStyle(font, stSize, 'bold'); ctx.fillStyle = s.color;
        ctx.save(); ctx.textAlign = 'center';
        ctx.fillText(s.title, x + sectionW / 2, sy);
        ctx.restore();
        sy += 28;
        ctx.font = createFontStyle(font, siSize, 'semibold'); ctx.fillStyle = t.textMuted;
        drawWrappedItems(ctx, s.items, x + 14, sy, sectionW - 28, lineHeight, '› ');

        if (idx === 2) {
          const logoY = cardY + cardH - 120;
          drawLogoAndTagline(ctx, t, x + sectionW / 2, logoY, sectionW - 28, 110, 80, C.ALT_TAGLINE, matSettings, customLogo, font);
        }
      });
    }

    drawCorners(ctx, t.cornerBack, W, H, layout.corners.inset, layout.corners.length, layout.corners.width);
  }

  return { createFrontPortrait, createBackPortrait, createFrontLandscape, createBackLandscape };
}

// ============================================================================
// PRINT HELPERS
// ============================================================================

export function createPrintCanvas(factory, isPortrait) {
  const tex = isPortrait ? factory.createFrontPortrait() : factory.createFrontLandscape();
  const url = tex.image.toDataURL('image/png');
  tex.dispose();
  return url;
}

export function createPrintCanvasBack(factory, isPortrait) {
  const tex = isPortrait ? factory.createBackPortrait() : factory.createBackLandscape();
  const url = tex.image.toDataURL('image/png');
  tex.dispose();
  return url;
}

export { DEFAULT_FONT as FONT_STACK };