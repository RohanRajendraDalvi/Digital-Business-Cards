import * as THREE from 'three';
import { drawPattern, getMaterialValues, drawLogo, iconVisualHeights } from '../../config/materials';
import { getFontPreset, createFontStyle } from '../../config/fontPresets';
import { getLayoutPreset, getQRSize, getQRPosition, getCTAWidth, scaleSize, getHeaderAlign } from '../../config/layoutPresets';

const DEFAULT_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ============================================================================
// TEXT HELPERS
// ============================================================================

function calcFontSize(ctx, text, maxWidth, maxSize, minSize = 24) {
  let size = maxSize;
  const currentFont = ctx.font;
  const fontParts = currentFont.match(/^(italic\s+)?(\d+)\s+(\d+)px\s+(.+)$/);
  const fontStyle = fontParts ? fontParts[1] || '' : '';
  const fontWeight = fontParts ? fontParts[2] : 'bold';
  const fontFamily = fontParts ? fontParts[4] : DEFAULT_FONT;
  ctx.font = `${fontStyle}${fontWeight} ${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 4;
    ctx.font = `${fontStyle}${fontWeight} ${size}px ${fontFamily}`;
  }
  return size;
}

function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + '...' : '...';
}

function drawText(ctx, text, x, y, maxWidth) {
  const truncated = truncateText(ctx, text || '', maxWidth);
  ctx.fillText(truncated, x, y);
  return ctx.measureText(truncated).width;
}

function drawTextCentered(ctx, text, centerX, y, maxWidth) {
  const truncated = truncateText(ctx, text || '', maxWidth);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillText(truncated, centerX, y);
  ctx.restore();
  return ctx.measureText(truncated).width;
}

function drawTextRight(ctx, text, rightX, y, maxWidth) {
  const truncated = truncateText(ctx, text || '', maxWidth);
  ctx.save();
  ctx.textAlign = 'right';
  ctx.fillText(truncated, rightX, y);
  ctx.restore();
  return ctx.measureText(truncated).width;
}

// ============================================================================
// DRAWING HELPERS
// ============================================================================

function drawQR(ctx, img, x, y, size, bgColor) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
  if (img) ctx.drawImage(img, x, y, size, size);
}

function drawCorners(ctx, color, w, h, inset, len, lw) {
  if (!len || !lw) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(inset, inset); ctx.lineTo(inset, inset + len);
  ctx.moveTo(inset, inset); ctx.lineTo(inset + len, inset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - inset, inset); ctx.lineTo(w - inset, inset + len);
  ctx.moveTo(w - inset, inset); ctx.lineTo(w - inset - len, inset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(inset, h - inset); ctx.lineTo(inset, h - inset - len);
  ctx.moveTo(inset, h - inset); ctx.lineTo(inset + len, h - inset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - inset, h - inset); ctx.lineTo(w - inset, h - inset - len);
  ctx.moveTo(w - inset, h - inset); ctx.lineTo(w - inset - len, h - inset);
  ctx.stroke();
}

function drawDivider(ctx, x, y, width, height, color1, color2) {
  if (!width || !height) return;
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.5, color2 || color1);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
}

function drawDividerCentered(ctx, centerX, y, width, height, color) {
  if (!width || !height) return;
  const x = centerX - width / 2;
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
}

function drawCard(ctx, x, y, w, h, radius, bgColor, borderColor) {
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Simplified logo drawing for compact header (logo above title)
function drawLogoOnly(ctx, theme, centerX, centerY, logoSize, matSettings, customLogo) {
  const source = matSettings.logoSource || 'glasses';
  if (source === 'none') return;
  drawLogo(ctx, centerX, centerY, logoSize, theme.glassesColor, theme.glassesFill, customLogo, source);
}

function drawLogoAndTagline(ctx, theme, centerX, startY, areaWidth, areaHeight, logoSize, tagline, mode, matSettings, customLogo, font) {
  const source = matSettings.logoSource || 'glasses';
  const hasLogo = source !== 'none';
  const hasTagline = tagline && tagline.trim().length > 0;
  if (!hasLogo && !hasTagline) return startY;
  const LOGO_TAGLINE_GAP = 40;
  const logoHeightRatio = iconVisualHeights[source] || 0.5;
  const estimatedLogoHeight = hasLogo ? logoSize * logoHeightRatio : 0;
  let taglineHeight = 0;
  let taglineFontSize = 24;
  if (hasTagline) {
    ctx.font = createFontStyle(font, 24, 'medium', true);
    taglineFontSize = calcFontSize(ctx, tagline, areaWidth - 40, mode === 'landscape' ? 24 : 22, 14);
    taglineHeight = taglineFontSize * 1.2;
  }
  const totalHeight = estimatedLogoHeight + (hasLogo && hasTagline ? LOGO_TAGLINE_GAP : 0) + taglineHeight;
  const blockStartY = startY + (areaHeight - totalHeight) / 2;
  let currentY = blockStartY;
  if (hasLogo) {
    const logoCenterY = currentY + estimatedLogoHeight / 2;
    drawLogo(ctx, centerX, logoCenterY, logoSize, theme.glassesColor, theme.glassesFill, customLogo, source);
    currentY += estimatedLogoHeight + LOGO_TAGLINE_GAP;
  }
  if (hasTagline) {
    ctx.font = createFontStyle(font, taglineFontSize, 'medium', true);
    ctx.fillStyle = theme.textHint;
    drawTextCentered(ctx, tagline, centerX, currentY + taglineFontSize * 0.8, areaWidth - 40);
  }
  return startY + areaHeight;
}

// ============================================================================
// SKILL RENDERERS
// ============================================================================

function drawSkillBoxes(ctx, skills, startX, startY, boxW, boxH, cols, gap, bgColor, borderColor, textColor, font, fontSize) {
  ctx.font = createFontStyle(font, fontSize, 'semibold');
  skills.forEach((skill, i) => {
    const x = startX + (i % cols) * gap;
    const y = startY + Math.floor(i / cols) * (boxH + 8);
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(x, y, boxW, boxH);
    ctx.fillStyle = textColor;
    drawText(ctx, skill, x + 10, y + boxH/2 + 5, boxW - 20);
  });
  return Math.ceil(skills.length / cols) * (boxH + 8);
}

function drawSkillTags(ctx, skills, startX, startY, maxWidth, bgColor, borderColor, textColor, font, fontSize) {
  ctx.font = createFontStyle(font, fontSize, 'medium');
  let x = startX;
  let y = startY;
  const padding = 12;
  const height = fontSize + 14;
  const rowGap = 8;
  skills.forEach(skill => {
    const textWidth = ctx.measureText(skill).width;
    const tagWidth = textWidth + padding * 2;
    if (x + tagWidth > startX + maxWidth) {
      x = startX;
      y += height + rowGap;
    }
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, tagWidth, height, height / 2);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.fillText(skill, x + padding, y + height/2 + fontSize/3);
    x += tagWidth + 10;
  });
  return y - startY + height;
}

function drawSkillTagsCentered(ctx, skills, centerX, startY, maxWidth, bgColor, borderColor, textColor, font, fontSize) {
  ctx.font = createFontStyle(font, fontSize, 'medium');
  const padding = 14;
  const height = fontSize + 16;
  const rowGap = 10;
  const tagGap = 12;
  const rows = [];
  let currentRow = [];
  let currentRowWidth = 0;
  skills.forEach(skill => {
    const textWidth = ctx.measureText(skill).width;
    const tagWidth = textWidth + padding * 2;
    if (currentRowWidth + tagWidth + (currentRow.length > 0 ? tagGap : 0) > maxWidth && currentRow.length > 0) {
      rows.push({ items: currentRow, width: currentRowWidth });
      currentRow = [{ skill, width: tagWidth }];
      currentRowWidth = tagWidth;
    } else {
      currentRow.push({ skill, width: tagWidth });
      currentRowWidth += tagWidth + (currentRow.length > 1 ? tagGap : 0);
    }
  });
  if (currentRow.length > 0) {
    rows.push({ items: currentRow, width: currentRowWidth });
  }
  let y = startY;
  rows.forEach(row => {
    let x = centerX - row.width / 2;
    row.items.forEach((item, i) => {
      if (i > 0) x += tagGap;
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(x, y, item.width, height, height / 2);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.fillText(item.skill, x + padding, y + height/2 + fontSize/3);
      x += item.width;
    });
    y += height + rowGap;
  });
  return rows.length * (height + rowGap) - rowGap;
}

// ============================================================================
// TEXTURE FACTORY
// ============================================================================

export function createTextureFactory(theme, images, data, matSettings, customLogo) {
  const t = theme;
  const C = data;
  const font = getFontPreset(matSettings.fontPreset || 'modern');
  const layout = getLayoutPreset(matSettings.layoutPreset || 'default');
  const layoutId = layout.id;

  // ══════════════════════════════════════════════════════════════════════════
  // FRONT PORTRAIT
  // ══════════════════════════════════════════════════════════════════════════
  function createFrontPortrait() {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    const W = 700, H = 1100;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, t.bgPrimary);
    grad.addColorStop(0.5, t.bgSecondary);
    grad.addColorStop(1, t.bgPrimary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawPattern(matSettings.frontPattern, ctx, W, H, matSettings.frontPatternSpacing, t.gridColor);

    // ════════════════════════════════════════════════════════════════════════
    // COMPACT PORTRAIT - Logo above title, larger text, better spacing
    // ════════════════════════════════════════════════════════════════════════
    if (layoutId === 'compact') {
      const P = 28;
      const qrSize = 100;
      const cornerW = 300;
      const logoSize = 80;
      const nameSize = 58;
      const titleSize = 28;
      const taglineSize = 20;
      const sectionTitleSize = 18;
      const sectionItemSize = 16;
      const skillFontSize = 14;
      const SECTION_GAP = 28;
      const ITEM_GAP = 24;
      const SKILL_SECTION_GAP = 35;
      const logoHeight = logoSize * 0.5;
      const headerContentHeight = logoHeight + 25 + nameSize + 20 + titleSize + 16 + taglineSize + 20;
      const headerStartY = (H - headerContentHeight) / 2;
      let headerY = headerStartY;
      drawLogoOnly(ctx, t, W / 2, headerY + logoHeight / 2, logoSize, matSettings, customLogo);
      headerY += logoHeight + 25;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, nameSize, 'bold');
      const calcedNameSize = calcFontSize(ctx, C.NAME, W - 80, nameSize, 36);
      ctx.font = createFontStyle(font, calcedNameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, headerY + calcedNameSize * 0.8, W - 80);
      headerY += calcedNameSize + 20;
      ctx.font = createFontStyle(font, titleSize, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, headerY, W - 80);
      headerY += 16 + titleSize;
      ctx.font = createFontStyle(font, taglineSize, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, headerY, W - 80);
      headerY += 20;
      drawDividerCentered(ctx, W / 2, headerY, 300, 2, t.accentPrimary);
      let tlY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawText(ctx, item, P, tlY, cornerW); tlY += ITEM_GAP; });
      let trY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextRight(ctx, C.FRONT_SECTION_2_TITLE, W - P, trY, cornerW);
      trY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, trY, cornerW); trY += ITEM_GAP; });
      let blY = H - P - 240;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.SKILL_SET_1_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      blY += drawSkillTags(ctx, C.SKILL_SET_1, P, blY, cornerW, t.langBg, t.langBorder, t.textPrimary, font, skillFontSize) + SKILL_SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.SKILL_SET_2_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      drawSkillTags(ctx, C.SKILL_SET_2, P, blY, cornerW, t.frameworkBg, t.frameworkBorder, t.textPrimary, font, skillFontSize);
      let brY = H - P - qrSize - 55 - (C.SKILL_SET_3.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawTextRight(ctx, C.SKILL_SET_3_TITLE, W - P, brY, cornerW);
      brY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'medium');
      C.SKILL_SET_3.forEach(skill => { ctx.fillStyle = t.textPrimary; drawTextRight(ctx, skill, W - P, brY, cornerW); brY += ITEM_GAP; });
      drawQR(ctx, images.cardQr, W - qrSize - P, H - qrSize - P - 40, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qrSize/2 - P, H - P - 22, qrSize);
      const ctaW = 320;
      const ctaY = H - 60;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect((W - ctaW) / 2, ctaY, ctaW, 48, 24);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 20, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, ctaY + 32, ctaW - 30);
      drawCorners(ctx, t.cornerFront, W, H, 12, 35, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SPACIOUS (BOLD) PORTRAIT
    // ════════════════════════════════════════════════════════════════════════
    if (layoutId === 'spacious') {
      const P = 40;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 85, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 85, 48);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, 110, fullW);
      ctx.font = createFontStyle(font, 32, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, 160, fullW);
      ctx.font = createFontStyle(font, 24, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, 200, fullW);
      drawDividerCentered(ctx, W / 2, 225, 450, 4, t.accentPrimary);
      let y = 275;
      ctx.font = createFontStyle(font, 26, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_1_TITLE, W / 2, y, fullW);
      y += 38;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawTextCentered(ctx, item, W / 2, y, fullW); y += 30; });
      y += 25;
      ctx.font = createFontStyle(font, 26, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_2_TITLE, W / 2, y, fullW);
      y += 38;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawTextCentered(ctx, item, W / 2, y, fullW); y += 30; });
      y += 40;
      const skillSets = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      const BLOCK_GAP = 45;
      skillSets.forEach(set => {
        ctx.font = createFontStyle(font, 22, 'bold');
        ctx.fillStyle = set.accent;
        drawTextCentered(ctx, set.title, W / 2, y, fullW);
        y += 32;
        y += drawSkillTagsCentered(ctx, set.items, W / 2, y, fullW - 60, set.bg, set.border, t.textPrimary, font, 17) + BLOCK_GAP;
      });
      const ctaW = 340;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect((W - ctaW) / 2, y + 5, ctaW, 54, 27);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 22, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, y + 40, ctaW - 40);
      const qrSize = 115;
      drawQR(ctx, images.cardQr, W - qrSize - P, H - qrSize - 55, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qrSize/2 - P, H - 30, 100);
      drawCorners(ctx, t.cornerFront, W, H, 20, 60, 5);
      return new THREE.CanvasTexture(canvas);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CENTERED PORTRAIT
    // ════════════════════════════════════════════════════════════════════════
    if (layoutId === 'centered') {
      const P = 35;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 62, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 62, 38);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, 80, fullW);
      ctx.font = createFontStyle(font, 28, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, 125, fullW);
      ctx.font = createFontStyle(font, 22, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, 162, fullW);
      drawDividerCentered(ctx, W / 2, 185, 350, 2, t.accentPrimary);
      let y = 225;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_1_TITLE, W / 2, y, fullW);
      y += 34;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawTextCentered(ctx, item, W / 2, y, fullW); y += 30; });
      y += 22;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_2_TITLE, W / 2, y, fullW);
      y += 34;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawTextCentered(ctx, '› ' + item, W / 2, y, fullW); y += 30; });
      y += 28;
      const boxW = 195, boxH = 34, cols = 3, gap = 210;
      const totalRowW = cols * gap - (gap - boxW);
      const skillStartX = (W - totalRowW) / 2;
      const drawCenteredSkillBoxes = (skills, startY, bgColor, borderColor) => {
        ctx.font = createFontStyle(font, 17, 'semibold');
        const totalRows = Math.ceil(skills.length / cols);
        skills.forEach((skill, i) => {
          const row = Math.floor(i / cols);
          const colInRow = i % cols;
          const itemsInThisRow = Math.min(cols, skills.length - row * cols);
          let rowStartX = skillStartX;
          if (itemsInThisRow < cols) {
            const rowWidth = itemsInThisRow * gap - (gap - boxW);
            rowStartX = (W - rowWidth) / 2;
          }
          const x = rowStartX + colInRow * gap;
          const by = startY + row * (boxH + 10);
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, by, boxW, boxH);
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(x, by, boxW, boxH);
          ctx.fillStyle = t.textPrimary;
          drawText(ctx, skill, x + 10, by + boxH/2 + 6, boxW - 20);
        });
        return totalRows * (boxH + 10);
      };
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.SKILL_SET_1_TITLE, W / 2, y, fullW);
      y += 32;
      y += drawCenteredSkillBoxes(C.SKILL_SET_1, y, t.langBg, t.langBorder) + 22;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.SKILL_SET_2_TITLE, W / 2, y, fullW);
      y += 32;
      y += drawCenteredSkillBoxes(C.SKILL_SET_2, y, t.frameworkBg, t.frameworkBorder) + 22;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawTextCentered(ctx, C.SKILL_SET_3_TITLE, W / 2, y, fullW);
      y += 32;
      y += drawCenteredSkillBoxes(C.SKILL_SET_3, y, t.aiBg, t.aiBorder) + 32;
      const ctaW = 360;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect((W - ctaW) / 2, y, ctaW, 58, 29);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, y + 38, ctaW - 40);
      const qrSize = 120;
      drawQR(ctx, images.cardQr, (W - qrSize) / 2, H - qrSize - 55, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W / 2, H - 28, 120);
      drawCorners(ctx, t.cornerFront, W, H, 16, 50, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // ════════════════════════════════════════════════════════════════════════
    // MINIMAL PORTRAIT
    // ════════════════════════════════════════════════════════════════════════
    if (layoutId === 'minimal') {
      const P = 50;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 68, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 68, 42);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P, 105, fullW);
      ctx.font = createFontStyle(font, 30, 'medium');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, P, 155, fullW);
      ctx.font = createFontStyle(font, 24, 'regular', true);
      ctx.fillStyle = t.textMuted;
      drawText(ctx, C.TAGLINE, P, 195, fullW);
      let y = 270;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.FRONT_SECTION_1_TITLE.toUpperCase(), P, y, fullW);
      y += 36;
      ctx.font = createFontStyle(font, 22, 'regular');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawText(ctx, item, P, y, fullW); y += 34; });
      y += 40;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.FRONT_SECTION_2_TITLE.toUpperCase(), P, y, fullW);
      y += 36;
      ctx.font = createFontStyle(font, 22, 'regular');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawText(ctx, item, P, y, fullW); y += 34; });
      y += 50;
      const skillSets = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1 },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2 },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3 },
      ];
      skillSets.forEach(set => {
        ctx.font = createFontStyle(font, 18, 'bold');
        ctx.fillStyle = t.accentPrimary;
        drawText(ctx, set.title.toUpperCase(), P, y, fullW);
        y += 34;
        ctx.font = createFontStyle(font, 21, 'regular');
        ctx.fillStyle = t.textSecondary;
        drawText(ctx, set.items.join('  ·  '), P, y, fullW);
        y += 52;
      });
      y += 15;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, 'LOCATION', P, y, fullW);
      y += 36;
      ctx.font = createFontStyle(font, 28, 'medium');
      ctx.fillStyle = t.textPrimary;
      drawText(ctx, C.LOCATION, P, y, fullW);
      const logoSize = 80;
      drawLogoAndTagline(ctx, t, W - P - logoSize/2, 120, logoSize + 40, 100, logoSize, '', 'portrait', matSettings, customLogo, font);
      const qrSize = 110;
      drawQR(ctx, images.cardQr, W - qrSize - P, H - qrSize - P - 25, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qrSize/2 - P, H - P, qrSize);
      return new THREE.CanvasTexture(canvas);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CARDS (EDITORIAL) PORTRAIT
    // ════════════════════════════════════════════════════════════════════════
    if (layoutId === 'cards') {
      const P = 25;
      const cardBg = 'rgba(255,255,255,0.04)';
      const cardBorder = 'rgba(255,255,255,0.08)';
      const R = 16;
      const fullW = W - P * 2;
      const TITLE_SIZE = 24;
      const ITEM_SIZE = 20;
      const SKILL_SIZE = 17;
      drawCard(ctx, P, P, fullW, 130, R, cardBg, cardBorder);
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 54, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW - 140, 54, 34);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P + 20, P + 52, fullW - 140);
      ctx.font = createFontStyle(font, 28, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, P + 20, P + 90, fullW - 140);
      ctx.font = createFontStyle(font, 22, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.TAGLINE, P + 20, P + 118, fullW - 140);
      const qrSize = 95;
      drawQR(ctx, images.cardQr, W - P - qrSize - 16, P + 18, qrSize, t.qrBg);
      const cardW = (fullW - 14) / 2;
      let leftY = P + 150;
      let rightY = P + 150;
      const rightX = P + cardW + 14;
      const s1H = 40 + C.FRONT_SECTION_1_ITEMS.length * 32 + 20;
      drawCard(ctx, P, leftY, cardW, s1H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, P + 16, leftY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach((item, i) => { drawText(ctx, item, P + 16, leftY + 68 + i * 32, cardW - 32); });
      leftY += s1H + 12;
      const s2H = 40 + C.FRONT_SECTION_2_ITEMS.length * 32 + 20;
      drawCard(ctx, P, leftY, cardW, s2H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_2_TITLE, P + 16, leftY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach((item, i) => { drawText(ctx, '› ' + item, P + 16, leftY + 68 + i * 32, cardW - 32); });
      leftY += s2H + 12;
      const skillCards = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      skillCards.forEach(sc => {
        const rows = Math.ceil(sc.items.length / 2);
        const scH = 40 + rows * 44 + 14;
        drawCard(ctx, rightX, rightY, cardW, scH, R, cardBg, cardBorder);
        ctx.font = createFontStyle(font, TITLE_SIZE - 2, 'bold');
        ctx.fillStyle = sc.accent;
        drawText(ctx, sc.title, rightX + 16, rightY + 32, cardW - 32);
        ctx.font = createFontStyle(font, SKILL_SIZE, 'semibold');
        sc.items.forEach((skill, i) => {
          const sx = rightX + 16 + (i % 2) * ((cardW - 36) / 2 + 4);
          const sy = rightY + 58 + Math.floor(i / 2) * 40;
          ctx.fillStyle = sc.bg;
          ctx.fillRect(sx, sy, (cardW - 40) / 2, 34);
          ctx.strokeStyle = sc.border;
          ctx.strokeRect(sx, sy, (cardW - 40) / 2, 34);
          ctx.fillStyle = t.textPrimary;
          drawText(ctx, skill, sx + 10, sy + 23, (cardW - 60) / 2);
        });
        rightY += scH + 12;
      });
      const ctaY = Math.max(leftY, rightY) + 10;
      drawCard(ctx, P, ctaY, fullW, 75, R, t.ctaBg, null);
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 30, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, ctaY + 50, fullW - 40);
      drawCorners(ctx, t.cornerFront, W, H, 12, 36, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DEFAULT PORTRAIT
    // ════════════════════════════════════════════════════════════════════════
    const P = 30;
    const qrSize = 140;
    const qrX = 510, qrY = 45;
    const textMaxW = qrX - P - 20;
    const fullW = W - P * 2;
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, 65, 'bold');
    const nameSize = calcFontSize(ctx, C.NAME, textMaxW, 65, 32);
    ctx.font = createFontStyle(font, nameSize, 'bold');
    drawText(ctx, C.NAME, P, 75, textMaxW);
    ctx.font = createFontStyle(font, 30, 'semibold');
    ctx.fillStyle = t.accentCyan;
    const titleSize = calcFontSize(ctx, C.TITLE, textMaxW, 30, 18);
    ctx.font = createFontStyle(font, titleSize, 'semibold');
    drawText(ctx, C.TITLE, P, 115, textMaxW);
    ctx.font = createFontStyle(font, 24, 'medium', true);
    ctx.fillStyle = t.accentSecondary;
    const taglineSize = calcFontSize(ctx, C.TAGLINE, textMaxW, 24, 14);
    ctx.font = createFontStyle(font, taglineSize, 'medium', true);
    drawText(ctx, C.TAGLINE, P, 152, textMaxW);
    drawQR(ctx, images.cardQr, qrX, qrY, qrSize, t.qrBg);
    ctx.font = createFontStyle(font, 14, 'semibold');
    ctx.fillStyle = t.textHint;
    drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', qrX + qrSize/2, qrY + qrSize + 20, qrSize);
    drawDivider(ctx, P, 168, 340, 3, t.accentPrimary, t.accentSecondary);
    let y = 205;
    ctx.font = createFontStyle(font, 24, 'bold');
    ctx.fillStyle = t.accentCyan;
    drawText(ctx, C.FRONT_SECTION_1_TITLE, P, y, fullW);
    y += 30;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textSecondary;
    C.FRONT_SECTION_1_ITEMS.forEach(e => { drawText(ctx, e, P, y, fullW); y += 27; });
    y += 15;
    ctx.font = createFontStyle(font, 24, 'bold');
    ctx.fillStyle = t.accentCyan;
    drawText(ctx, C.FRONT_SECTION_2_TITLE, P, y, fullW);
    y += 32;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.FRONT_SECTION_2_ITEMS.forEach(p => { drawText(ctx, '› ' + p, P, y, fullW); y += 30; });
    y += 20;
    const boxW = 205, boxH = 32, cols = 3, gap = 215;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.SKILL_SET_1_TITLE, P, y, fullW);
    y += 32;
    y += drawSkillBoxes(ctx, C.SKILL_SET_1, P, y, boxW, boxH, cols, gap, t.langBg, t.langBorder, t.textPrimary, font, 18) + 20;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.SKILL_SET_2_TITLE, P, y, fullW);
    y += 32;
    y += drawSkillBoxes(ctx, C.SKILL_SET_2, P, y, boxW, boxH, cols, gap, t.frameworkBg, t.frameworkBorder, t.textPrimary, font, 18) + 20;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentTertiary;
    drawText(ctx, C.SKILL_SET_3_TITLE, P, y, fullW);
    y += 32;
    y += drawSkillBoxes(ctx, C.SKILL_SET_3, P, y, boxW, boxH, cols, gap, t.aiBg, t.aiBorder, t.textPrimary, font, 18) + 40;
    const ctaW = 420;
    ctx.fillStyle = t.ctaBg;
    ctx.beginPath();
    ctx.roundRect((W - ctaW) / 2, y, ctaW, 65, 32);
    ctx.fill();
    ctx.fillStyle = t.ctaText;
    ctx.font = createFontStyle(font, 28, 'bold');
    drawTextCentered(ctx, C.LOCATION, W / 2, y + 42, ctaW - 40);
    drawCorners(ctx, t.cornerFront, W, H, 15, 45, 3);
    return new THREE.CanvasTexture(canvas);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BACK PORTRAIT
  // ══════════════════════════════════════════════════════════════════════════
  function createBackPortrait() {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    const W = 700, H = 1100;
    const grad = ctx.createRadialGradient(350, 550, 0, 350, 550, 700);
    grad.addColorStop(0, t.bgRadialCenter);
    grad.addColorStop(1, t.bgRadialEdge);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawPattern(matSettings.backPattern, ctx, W, H, matSettings.backPatternSpacing, t.circuitColor);

    // COMPACT BACK PORTRAIT
    if (layoutId === 'compact') {
      const P = 28;
      const qrSize = 100;
      const cornerW = 300;
      const logoSize = 75;
      const nameSize = 52;
      const titleSize = 24;
      const taglineSize = 18;
      const sectionTitleSize = 17;
      const sectionItemSize = 15;
      const SECTION_GAP = 26;
      const ITEM_GAP = 22;
      const logoHeight = logoSize * 0.5;
      const headerContentHeight = logoHeight + 20 + nameSize + 16 + titleSize + 14 + taglineSize + 18;
      const headerStartY = (H - headerContentHeight) / 2;
      let headerY = headerStartY;
      drawLogoOnly(ctx, t, W / 2, headerY + logoHeight / 2, logoSize, matSettings, customLogo);
      headerY += logoHeight + 20;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, nameSize, 'bold');
      const calcedNameSize = calcFontSize(ctx, C.NAME, 520, nameSize, 32);
      ctx.font = createFontStyle(font, calcedNameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, headerY + calcedNameSize * 0.8, 520);
      headerY += calcedNameSize + 16;
      ctx.font = createFontStyle(font, titleSize, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.ALT_TITLE, W / 2, headerY, 520);
      headerY += titleSize + 14;
      ctx.font = createFontStyle(font, taglineSize, 'medium', true);
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.ALT_TAGLINE, W / 2, headerY, 480);
      headerY += 18;
      drawDividerCentered(ctx, W / 2, headerY, 280, 2, t.accentPrimary);
      let tlY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P, tlY, cornerW);
      tlY += ITEM_GAP;
      drawText(ctx, C.PHONE, P, tlY, cornerW);
      tlY += ITEM_GAP + 8;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, tlY, cornerW); tlY += ITEM_GAP - 2; });
      let trY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextRight(ctx, C.BACK_SECTION_3_TITLE, W - P, trY, cornerW);
      trY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, trY, cornerW); trY += ITEM_GAP; });
      let blY = H - P - 25 - (C.BACK_SECTION_4_ITEMS.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(item => { drawText(ctx, '› ' + item, P, blY, cornerW); blY += ITEM_GAP; });
      let brY = H - P - qrSize - 50 - (C.BACK_SECTION_5_ITEMS.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextRight(ctx, C.BACK_SECTION_5_TITLE, W - P, brY, cornerW);
      brY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, brY, cornerW); brY += ITEM_GAP; });
      drawQR(ctx, images.linkQr, W - qrSize - P, H - qrSize - P - 15, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, H - P, qrSize);
      drawCorners(ctx, t.cornerBack, W, H, 12, 35, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // CENTERED BACK PORTRAIT
    if (layoutId === 'centered') {
      const P = 35;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 62, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 62, 38);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, P + nameSize * 0.85, fullW);
      let y = P + nameSize + 25;
      ctx.font = createFontStyle(font, 28, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.ALT_TITLE, W / 2, y, fullW);
      y += 45;
      drawDividerCentered(ctx, W / 2, y, 350, 2, t.accentPrimary);
      y += 30;
      drawLogoAndTagline(ctx, t, W / 2, y, fullW, 180, 150, C.ALT_TAGLINE, 'portrait', matSettings, customLogo, font);
      y += 200;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.BACK_SECTION_1_TITLE, W / 2, y, fullW);
      y += 32;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.EMAIL, W / 2, y, fullW);
      y += 32;
      drawTextCentered(ctx, C.PHONE, W / 2, y, fullW);
      y += 40;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.BACK_SECTION_2_TITLE, W / 2, y, fullW);
      y += 32;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawTextCentered(ctx, link, W / 2, y, fullW); y += 30; });
      y += 25;
      const backSections = [
        { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS, color: t.accentSecondary },
        { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS, color: t.accentTertiary },
        { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS, color: t.accentPrimary },
      ];
      backSections.forEach(section => {
        if (y > H - 200) return;
        ctx.font = createFontStyle(font, 22, 'bold');
        ctx.fillStyle = section.color;
        drawTextCentered(ctx, section.title, W / 2, y, fullW);
        y += 30;
        ctx.font = createFontStyle(font, 20, 'semibold');
        ctx.fillStyle = t.textMuted;
        section.items.forEach(item => { drawTextCentered(ctx, '› ' + item, W / 2, y, fullW); y += 30; });
        y += 20;
      });
      const qrSize = 120;
      drawQR(ctx, images.linkQr, (W - qrSize) / 2, H - qrSize - 55, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W / 2, H - 28, 120);
      drawCorners(ctx, t.cornerBack, W, H, 16, 50, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // MINIMAL BACK PORTRAIT
    if (layoutId === 'minimal') {
      const P = 50;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 58, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 58, 36);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P, P + nameSize * 0.85, fullW);
      let y = P + nameSize + 25;
      ctx.font = createFontStyle(font, 26, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, P, y, fullW);
      y += 60;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE.toUpperCase(), P, y, fullW);
      y += 34;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P, y, fullW);
      y += 32;
      drawText(ctx, C.PHONE, P, y, fullW);
      y += 50;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE.toUpperCase(), P, y, fullW);
      y += 34;
      ctx.font = createFontStyle(font, 20, 'regular');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, y, fullW); y += 32; });
      y += 40;
      const backSections = [
        { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS },
        { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS },
        { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS },
      ];
      backSections.forEach(section => {
        if (y > H - 250) return;
        ctx.font = createFontStyle(font, 18, 'bold');
        ctx.fillStyle = t.accentPrimary;
        drawText(ctx, section.title.toUpperCase(), P, y, fullW);
        y += 32;
        ctx.font = createFontStyle(font, 20, 'regular');
        ctx.fillStyle = t.textMuted;
        section.items.forEach(item => { drawText(ctx, item, P, y, fullW); y += 30; });
        y += 28;
      });
      const logoSize = 100;
      drawLogoAndTagline(ctx, t, W - P - logoSize/2, H - 180, logoSize + 40, 120, logoSize, '', 'portrait', matSettings, customLogo, font);
      const qrSize = 100;
      drawQR(ctx, images.linkQr, W - qrSize - P, H - qrSize - P - 25, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, H - P, qrSize);
      return new THREE.CanvasTexture(canvas);
    }

    // CARDS BACK PORTRAIT
    if (layoutId === 'cards') {
      const P = 25;
      const cardBg = 'rgba(255,255,255,0.04)';
      const cardBorder = 'rgba(255,255,255,0.08)';
      const R = 16;
      const fullW = W - P * 2;
      const TITLE_SIZE = 24;
      const ITEM_SIZE = 20;
      drawCard(ctx, P, P, fullW, 130, R, cardBg, cardBorder);
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 54, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW - 140, 54, 34);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P + 20, P + 52, fullW - 140);
      ctx.font = createFontStyle(font, 26, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, P + 20, P + 90, fullW - 140);
      ctx.font = createFontStyle(font, 20, 'medium', true);
      ctx.fillStyle = t.textHint;
      drawText(ctx, C.ALT_TAGLINE, P + 20, P + 118, fullW - 140);
      const qrSize = 95;
      drawQR(ctx, images.linkQr, W - P - qrSize - 16, P + 18, qrSize, t.qrBg);
      const cardW = (fullW - 14) / 2;
      let leftY = P + 150;
      let rightY = P + 150;
      const rightX = P + cardW + 14;
      const contactH = 42 + 32 * 2 + 22;
      drawCard(ctx, P, leftY, cardW, contactH, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, P + 16, leftY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P + 16, leftY + 68, cardW - 32);
      drawText(ctx, C.PHONE, P + 16, leftY + 100, cardW - 32);
      leftY += contactH + 12;
      const onlineH = 42 + C.ONLINE_LINKS.length * 30 + 22;
      drawCard(ctx, P, leftY, cardW, onlineH, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, P + 16, leftY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE - 2, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach((link, i) => { drawText(ctx, link, P + 16, leftY + 68 + i * 30, cardW - 32); });
      leftY += onlineH + 12;
      const s3H = 42 + C.BACK_SECTION_3_ITEMS.length * 32 + 22;
      drawCard(ctx, P, leftY, cardW, s3H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_3_TITLE, P + 16, leftY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach((item, i) => { drawText(ctx, '› ' + item, P + 16, leftY + 68 + i * 32, cardW - 32); });
      leftY += s3H + 12;
      const s4H = 42 + C.BACK_SECTION_4_ITEMS.length * 32 + 22;
      drawCard(ctx, rightX, rightY, cardW, s4H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, rightX + 16, rightY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach((item, i) => { drawText(ctx, '› ' + item, rightX + 16, rightY + 68 + i * 32, cardW - 32); });
      rightY += s4H + 12;
      const s5H = 42 + C.BACK_SECTION_5_ITEMS.length * 32 + 22;
      drawCard(ctx, rightX, rightY, cardW, s5H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.BACK_SECTION_5_TITLE, rightX + 16, rightY + 34, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach((item, i) => { drawText(ctx, '› ' + item, rightX + 16, rightY + 68 + i * 32, cardW - 32); });
      rightY += s5H + 12;
      const logoCardH = 160;
      drawCard(ctx, rightX, rightY, cardW, logoCardH, R, cardBg, cardBorder);
      drawLogoAndTagline(ctx, t, rightX + cardW / 2, rightY + 10, cardW - 32, logoCardH - 20, 100, '', 'portrait', matSettings, customLogo, font);
      drawCorners(ctx, t.cornerBack, W, H, 12, 36, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // DEFAULT/SPACIOUS BACK PORTRAIT
    const settings = {
      default:  { P: 30, nameSize: 60, titleSize: 28, sectionSize: 24, itemSize: 21, itemGap: 30, qrSize: 140, cornerArgs: [15, 45, 3] },
      spacious: { P: 40, nameSize: 72, titleSize: 30, sectionSize: 26, itemSize: 22, itemGap: 32, qrSize: 130, cornerArgs: [20, 60, 5] },
    };
    const s = settings[layoutId] || settings.default;
    const P = s.P;
    const fullW = W - P * 2;
    const isCentered = layoutId === 'spacious';
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, s.nameSize, 'bold');
    const calcedNameSize = calcFontSize(ctx, C.NAME, fullW, s.nameSize, Math.round(s.nameSize * 0.5));
    ctx.font = createFontStyle(font, calcedNameSize, 'bold');
    if (isCentered) { drawTextCentered(ctx, C.NAME, W / 2, P + calcedNameSize * 0.85, fullW); }
    else { drawText(ctx, C.NAME, P, P + calcedNameSize * 0.85, fullW); }
    let y = P + calcedNameSize + 20;
    ctx.font = createFontStyle(font, s.titleSize, 'medium');
    ctx.fillStyle = t.accentPrimary;
    if (isCentered) { drawTextCentered(ctx, C.ALT_TITLE, W / 2, y, fullW); }
    else { drawText(ctx, C.ALT_TITLE, P, y, fullW); }
    y += s.titleSize + 15;
    if (isCentered) { drawDividerCentered(ctx, W / 2, y, 350, 3, t.accentPrimary); }
    else { drawDivider(ctx, P, y, 340, 3, t.accentPrimary, t.accentSecondary); }
    y += 25;
    const logoSize = layoutId === 'spacious' ? 180 : 140;
    drawLogoAndTagline(ctx, t, W / 2, y, fullW, 170, logoSize, C.ALT_TAGLINE, 'portrait', matSettings, customLogo, font);
    y += 190;
    ctx.font = createFontStyle(font, s.sectionSize, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.BACK_SECTION_1_TITLE, P, y, fullW);
    y += s.sectionSize + 8;
    ctx.font = createFontStyle(font, s.itemSize, 'bold');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.EMAIL, P, y, fullW);
    y += s.itemGap;
    drawText(ctx, C.PHONE, P, y, fullW);
    y += s.itemGap + 15;
    ctx.font = createFontStyle(font, s.sectionSize, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.BACK_SECTION_2_TITLE, P, y, fullW);
    y += s.sectionSize + 8;
    ctx.font = createFontStyle(font, s.itemSize - 2, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, y, fullW); y += s.itemGap - 2; });
    y += 25;
    const backSections = [
      { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS, color: t.accentSecondary },
      { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS, color: t.accentTertiary },
      { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS, color: t.accentPrimary },
    ];
    backSections.forEach(section => {
      if (y > H - 200) return;
      ctx.font = createFontStyle(font, s.sectionSize, 'bold');
      ctx.fillStyle = section.color;
      drawText(ctx, section.title, P, y, fullW);
      y += s.sectionSize + 8;
      ctx.font = createFontStyle(font, s.itemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      section.items.forEach(item => { drawText(ctx, '› ' + item, P, y, fullW); y += s.itemGap - 2; });
      y += 18;
    });
    const qrX = isCentered ? (W - s.qrSize) / 2 : W - s.qrSize - P;
    const qrY = H - s.qrSize - 55;
    drawQR(ctx, images.linkQr, qrX, qrY, s.qrSize, t.qrBg);
    ctx.font = createFontStyle(font, 16, 'semibold');
    ctx.fillStyle = t.textHint;
    drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', qrX + s.qrSize / 2, qrY + s.qrSize + 22, s.qrSize);
    if (s.cornerArgs) { drawCorners(ctx, t.cornerBack, W, H, ...s.cornerArgs); }
    return new THREE.CanvasTexture(canvas);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FRONT LANDSCAPE
  // ══════════════════════════════════════════════════════════════════════════
  function createFrontLandscape() {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    const W = 1400, H = 820;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, t.bgPrimary);
    grad.addColorStop(0.5, t.bgSecondary);
    grad.addColorStop(1, t.bgPrimary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawPattern(matSettings.frontPattern, ctx, W, H, matSettings.frontPatternSpacing, t.gridColor);

    // COMPACT FRONT LANDSCAPE
    if (layoutId === 'compact') {
      const P = 30;
      const qrSize = 100;
      const cornerW = 380;
      const logoSize = 70;
      const nameSize = 56;
      const titleSize = 26;
      const taglineSize = 18;
      const sectionTitleSize = 17;
      const sectionItemSize = 15;
      const skillFontSize = 13;
      const SECTION_GAP = 26;
      const ITEM_GAP = 22;
      const SKILL_SECTION_GAP = 32;
      const logoHeight = logoSize * 0.5;
      const headerContentHeight = logoHeight + 20 + nameSize + 16 + titleSize + 12 + taglineSize + 16;
      const headerStartY = (H - headerContentHeight) / 2;
      let headerY = headerStartY;
      drawLogoOnly(ctx, t, W / 2, headerY + logoHeight / 2, logoSize, matSettings, customLogo);
      headerY += logoHeight + 20;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, nameSize, 'bold');
      const calcedNameSize = calcFontSize(ctx, C.NAME, 600, nameSize, 36);
      ctx.font = createFontStyle(font, calcedNameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, headerY + calcedNameSize * 0.8, 600);
      headerY += calcedNameSize + 16;
      ctx.font = createFontStyle(font, titleSize, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, headerY, 600);
      headerY += titleSize + 12;
      ctx.font = createFontStyle(font, taglineSize, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, headerY, 600);
      headerY += 16;
      drawDividerCentered(ctx, W / 2, headerY, 380, 2, t.accentPrimary);
      let tlY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawText(ctx, item, P, tlY, cornerW); tlY += ITEM_GAP; });
      let trY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextRight(ctx, C.FRONT_SECTION_2_TITLE, W - P, trY, cornerW);
      trY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, trY, cornerW); trY += ITEM_GAP; });
      let blY = H - P - 190;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.SKILL_SET_1_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      blY += drawSkillTags(ctx, C.SKILL_SET_1, P, blY, cornerW, t.langBg, t.langBorder, t.textPrimary, font, skillFontSize) + SKILL_SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.SKILL_SET_2_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      drawSkillTags(ctx, C.SKILL_SET_2, P, blY, cornerW, t.frameworkBg, t.frameworkBorder, t.textPrimary, font, skillFontSize);
      let brY = H - P - qrSize - 50 - (C.SKILL_SET_3.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawTextRight(ctx, C.SKILL_SET_3_TITLE, W - P, brY, cornerW);
      brY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'medium');
      C.SKILL_SET_3.forEach(skill => { ctx.fillStyle = t.textPrimary; drawTextRight(ctx, skill, W - P, brY, cornerW); brY += ITEM_GAP; });
      drawQR(ctx, images.cardQr, W - qrSize - P, H - qrSize - P - 15, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 11, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qrSize/2 - P, H - P, qrSize);
      const ctaW = 320;
      const ctaY = H - 55;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect((W - ctaW) / 2, ctaY, ctaW, 44, 22);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 20, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, ctaY + 30, ctaW - 30);
      drawCorners(ctx, t.cornerFront, W, H, 14, 40, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // SPACIOUS FRONT LANDSCAPE
    if (layoutId === 'spacious') {
      const P = 50;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 100, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 100, 56);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, 110, fullW);
      ctx.font = createFontStyle(font, 34, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, 160, fullW);
      ctx.font = createFontStyle(font, 24, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, 200, fullW);
      drawDividerCentered(ctx, W / 2, 225, 550, 4, t.accentPrimary);
      const COL_W = 380;
      const GAP = 60;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      const colY = 275;
      let y1 = colY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, START_X, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawText(ctx, item, START_X, y1, COL_W); y1 += 30; });
      y1 += 22;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_2_TITLE, START_X, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawText(ctx, '› ' + item, START_X, y1, COL_W); y1 += 30; });
      let y2 = colY;
      const col2X = START_X + COL_W + GAP;
      const skillSets = [
        { t: C.SKILL_SET_1_TITLE, i: C.SKILL_SET_1, a: t.accentSecondary, b: t.langBg, br: t.langBorder },
        { t: C.SKILL_SET_2_TITLE, i: C.SKILL_SET_2, a: t.accentPrimary, b: t.frameworkBg, br: t.frameworkBorder },
        { t: C.SKILL_SET_3_TITLE, i: C.SKILL_SET_3, a: t.accentTertiary, b: t.aiBg, br: t.aiBorder },
      ];
      const SKILL_BLOCK_GAP = 40;
      skillSets.forEach(s => {
        ctx.font = createFontStyle(font, 22, 'bold');
        ctx.fillStyle = s.a;
        drawTextCentered(ctx, s.t, col2X + COL_W / 2, y2, COL_W);
        y2 += 32;
        y2 += drawSkillTagsCentered(ctx, s.i, col2X + COL_W / 2, y2, COL_W, s.b, s.br, t.textPrimary, font, 16) + SKILL_BLOCK_GAP;
      });
      const col3X = START_X + (COL_W + GAP) * 2;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect(col3X, colY, COL_W, 65, 32);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      drawTextCentered(ctx, C.LOCATION, col3X + COL_W / 2, colY + 42, COL_W - 40);
      const qrSize = 140;
      drawQR(ctx, images.cardQr, col3X + (COL_W - qrSize) / 2, colY + 100, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', col3X + COL_W / 2, colY + 260, 120);
      drawCorners(ctx, t.cornerFront, W, H, 25, 70, 5);
      return new THREE.CanvasTexture(canvas);
    }

    // CENTERED FRONT LANDSCAPE
    if (layoutId === 'centered') {
      const P = 40;
      const fullW = W - P * 2;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 72, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 72, 46);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, 90, fullW);
      ctx.font = createFontStyle(font, 30, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.TITLE, W / 2, 138, fullW);
      ctx.font = createFontStyle(font, 24, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.TAGLINE, W / 2, 175, fullW);
      drawDividerCentered(ctx, W / 2, 198, 450, 3, t.accentPrimary);
      const COL_W = 380;
      const GAP = 50;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      const colY = 240;
      let y1 = colY;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_1_TITLE, START_X + COL_W / 2, y1, COL_W);
      y1 += 32;
      ctx.font = createFontStyle(font, 19, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawTextCentered(ctx, item, START_X + COL_W / 2, y1, COL_W); y1 += 30; });
      y1 += 20;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawTextCentered(ctx, C.FRONT_SECTION_2_TITLE, START_X + COL_W / 2, y1, COL_W);
      y1 += 32;
      ctx.font = createFontStyle(font, 19, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawTextCentered(ctx, '› ' + item, START_X + COL_W / 2, y1, COL_W); y1 += 30; });
      let y2 = colY;
      const col2X = START_X + COL_W + GAP;
      const boxW = 175, boxH = 32, skillCols = 2, skillGap = 185;
      const drawCenteredSkills = (skills, startX, startY, bgColor, borderColor) => {
        ctx.font = createFontStyle(font, 16, 'semibold');
        const totalRows = Math.ceil(skills.length / skillCols);
        const totalRowW = skillCols * skillGap - (skillGap - boxW);
        skills.forEach((skill, i) => {
          const row = Math.floor(i / skillCols);
          const colInRow = i % skillCols;
          const itemsInThisRow = Math.min(skillCols, skills.length - row * skillCols);
          let rowStartX = startX;
          if (itemsInThisRow < skillCols) {
            const rowWidth = itemsInThisRow * skillGap - (skillGap - boxW);
            rowStartX = startX + (totalRowW - rowWidth) / 2;
          }
          const x = rowStartX + colInRow * skillGap;
          const by = startY + row * (boxH + 10);
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, by, boxW, boxH);
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(x, by, boxW, boxH);
          ctx.fillStyle = t.textPrimary;
          drawText(ctx, skill, x + 8, by + boxH/2 + 5, boxW - 16);
        });
        return totalRows * (boxH + 10);
      };
      ctx.font = createFontStyle(font, 20, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.SKILL_SET_1_TITLE, col2X + COL_W / 2, y2, COL_W);
      y2 += 30;
      y2 += drawCenteredSkills(C.SKILL_SET_1, col2X, y2, t.langBg, t.langBorder) + 20;
      ctx.font = createFontStyle(font, 20, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.SKILL_SET_2_TITLE, col2X + COL_W / 2, y2, COL_W);
      y2 += 30;
      y2 += drawCenteredSkills(C.SKILL_SET_2, col2X, y2, t.frameworkBg, t.frameworkBorder);
      let y3 = colY;
      const col3X = START_X + (COL_W + GAP) * 2;
      ctx.font = createFontStyle(font, 20, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawTextCentered(ctx, C.SKILL_SET_3_TITLE, col3X + COL_W / 2, y3, COL_W);
      y3 += 30;
      y3 += drawCenteredSkills(C.SKILL_SET_3, col3X, y3, t.aiBg, t.aiBorder) + 30;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect(col3X, y3, COL_W, 58, 29);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 24, 'bold');
      drawTextCentered(ctx, C.LOCATION, col3X + COL_W / 2, y3 + 38, COL_W - 30);
      const qrSize = 115;
      drawQR(ctx, images.cardQr, (W - qrSize) / 2, H - qrSize - 55, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W / 2, H - 32, 100);
      drawCorners(ctx, t.cornerFront, W, H, 18, 50, 3);
      return new THREE.CanvasTexture(canvas);
    }

    // MINIMAL FRONT LANDSCAPE
    if (layoutId === 'minimal') {
      const P = 60;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 82, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, 700, 82, 50);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P, 105, 700);
      ctx.font = createFontStyle(font, 32, 'medium');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, P, 160, 700);
      ctx.font = createFontStyle(font, 24, 'regular', true);
      ctx.fillStyle = t.textMuted;
      drawText(ctx, C.TAGLINE, P, 200, 700);
      const COL_W = 560;
      const colY = 270;
      let y1 = colY;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.FRONT_SECTION_1_TITLE.toUpperCase(), P, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 22, 'regular');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach(item => { drawText(ctx, item, P, y1, COL_W); y1 += 32; });
      y1 += 40;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.FRONT_SECTION_2_TITLE.toUpperCase(), P, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 22, 'regular');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach(item => { drawText(ctx, item, P, y1, COL_W); y1 += 32; });
      const rightX = 750;
      let y2 = colY;
      const skillSets = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1 },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2 },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3 },
      ];
      skillSets.forEach(set => {
        ctx.font = createFontStyle(font, 18, 'bold');
        ctx.fillStyle = t.accentPrimary;
        drawText(ctx, set.title.toUpperCase(), rightX, y2, COL_W);
        y2 += 32;
        ctx.font = createFontStyle(font, 20, 'regular');
        ctx.fillStyle = t.textSecondary;
        drawText(ctx, set.items.join('  ·  '), rightX, y2, COL_W);
        y2 += 55;
      });
      y2 += 20;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, 'LOCATION', rightX, y2, COL_W);
      y2 += 36;
      ctx.font = createFontStyle(font, 28, 'medium');
      ctx.fillStyle = t.textPrimary;
      drawText(ctx, C.LOCATION, rightX, y2, COL_W);
      const logoSize = 80;
      drawLogoAndTagline(ctx, t, W - P - 120, 140, logoSize + 40, 100, logoSize, '', 'landscape', matSettings, customLogo, font);
      const qrSize = 110;
      drawQR(ctx, images.cardQr, W - qrSize - P, H - qrSize - P - 25, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', W - qrSize/2 - P, H - P, qrSize);
      return new THREE.CanvasTexture(canvas);
    }

    // CARDS FRONT LANDSCAPE
    if (layoutId === 'cards') {
      const P = 25;
      const cardBg = 'rgba(255,255,255,0.04)';
      const cardBorder = 'rgba(255,255,255,0.08)';
      const R = 14;
      const fullW = W - P * 2;
      const TITLE_SIZE = 22;
      const ITEM_SIZE = 19;
      const SKILL_SIZE = 16;
      drawCard(ctx, P, P, fullW, 115, R, cardBg, cardBorder);
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 52, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, 600, 52, 34);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P + 20, P + 50, 600);
      ctx.font = createFontStyle(font, 24, 'semibold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, P + 20, P + 82, 600);
      ctx.font = createFontStyle(font, 18, 'medium', true);
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.TAGLINE, P + 20, P + 106, 600);
      const qrSize = 78;
      drawQR(ctx, images.cardQr, W - qrSize - P - 18, P + 18, qrSize, t.qrBg);
      const cardW = (fullW - P * 3) / 4;
      const cardY = 160;
      const cardH = H - cardY - P - 80;
      const s1H = cardH * 0.48;
      drawCard(ctx, P, cardY, cardW, s1H, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, P + 16, cardY + 30, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach((item, i) => { drawText(ctx, item, P + 16, cardY + 58 + i * 28, cardW - 32); });
      const card1bY = cardY + s1H + 12;
      drawCard(ctx, P, card1bY, cardW, cardH - s1H - 12, R, cardBg, cardBorder);
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_2_TITLE, P + 16, card1bY + 30, cardW - 32);
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach((item, i) => { drawText(ctx, '› ' + item, P + 16, card1bY + 58 + i * 28, cardW - 32); });
      const skillCards = [
        { title: C.SKILL_SET_1_TITLE, items: C.SKILL_SET_1, accent: t.accentSecondary, bg: t.langBg, border: t.langBorder },
        { title: C.SKILL_SET_2_TITLE, items: C.SKILL_SET_2, accent: t.accentPrimary, bg: t.frameworkBg, border: t.frameworkBorder },
        { title: C.SKILL_SET_3_TITLE, items: C.SKILL_SET_3, accent: t.accentTertiary, bg: t.aiBg, border: t.aiBorder },
      ];
      skillCards.forEach((sc, idx) => {
        const x = P + (cardW + P) * (idx + 1);
        drawCard(ctx, x, cardY, cardW, cardH, R, cardBg, cardBorder);
        ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
        ctx.fillStyle = sc.accent;
        drawText(ctx, sc.title, x + 16, cardY + 30, cardW - 32);
        ctx.font = createFontStyle(font, SKILL_SIZE, 'semibold');
        sc.items.forEach((skill, i) => {
          const sy = cardY + 58 + i * 46;
          ctx.fillStyle = sc.bg;
          ctx.fillRect(x + 16, sy, cardW - 32, 36);
          ctx.strokeStyle = sc.border;
          ctx.strokeRect(x + 16, sy, cardW - 32, 36);
          ctx.fillStyle = t.textPrimary;
          drawText(ctx, skill, x + 28, sy + 24, cardW - 56);
        });
      });
      const ctaY = H - P - 60;
      drawCard(ctx, (W - 400) / 2, ctaY, 400, 55, R, t.ctaBg, null);
      ctx.fillStyle = t.ctaText;
      ctx.font = createFontStyle(font, 26, 'bold');
      drawTextCentered(ctx, C.LOCATION, W / 2, ctaY + 37, 380);
      drawCorners(ctx, t.cornerFront, W, H, 14, 40, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // DEFAULT FRONT LANDSCAPE
    const P = 50;
    const qrSize = 150;
    const qrX = 1190, qrY = 50;
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, 88, 'bold');
    const nameSize = calcFontSize(ctx, C.NAME, qrX - 70, 88, 44);
    ctx.font = createFontStyle(font, nameSize, 'bold');
    drawText(ctx, C.NAME, P, 140, qrX - 70);
    ctx.font = createFontStyle(font, 32, 'semibold');
    ctx.fillStyle = t.accentCyan;
    drawText(ctx, C.TITLE, P, 185, qrX - 250);
    ctx.font = createFontStyle(font, 26, 'medium', true);
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.TAGLINE, P, 225, qrX - 70);
    drawQR(ctx, images.cardQr, qrX, qrY, qrSize, t.qrBg);
    ctx.font = createFontStyle(font, 14, 'semibold');
    ctx.fillStyle = t.textHint;
    drawTextCentered(ctx, C.BUSINESS_CARD_QR_LABEL || 'SHARE', qrX + qrSize / 2, qrY + qrSize + 20, qrSize);
    drawDivider(ctx, P, 245, 450, 3, t.accentPrimary, t.accentSecondary);
    let leftY = 290;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentCyan;
    drawText(ctx, C.FRONT_SECTION_1_TITLE, P, leftY, 600);
    leftY += 35;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textSecondary;
    C.FRONT_SECTION_1_ITEMS.forEach(e => { drawText(ctx, e, P, leftY, 600); leftY += 30; });
    leftY += 15;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentCyan;
    drawText(ctx, C.FRONT_SECTION_2_TITLE, P, leftY, 600);
    leftY += 35;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.FRONT_SECTION_2_ITEMS.forEach(p => { drawText(ctx, '› ' + p, P, leftY, 600); leftY += 32; });
    leftY += 25;
    const ctaW = 320;
    ctx.fillStyle = t.ctaBg;
    ctx.beginPath();
    ctx.roundRect(P, leftY, ctaW, 65, 32);
    ctx.fill();
    ctx.fillStyle = t.ctaText;
    ctx.font = createFontStyle(font, 26, 'bold');
    drawTextCentered(ctx, C.LOCATION, P + ctaW / 2, leftY + 42, ctaW - 40);
    const rightX = 720;
    const boxW = 205;
    ctx.font = createFontStyle(font, 20, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.SKILL_SET_1_TITLE, rightX, 290, 600);
    drawSkillBoxes(ctx, C.SKILL_SET_1, rightX, 318, boxW, 34, 3, 220, t.langBg, t.langBorder, t.textSecondary, font, 18);
    ctx.font = createFontStyle(font, 20, 'bold');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.SKILL_SET_2_TITLE, rightX, 430, 600);
    drawSkillBoxes(ctx, C.SKILL_SET_2, rightX, 458, boxW, 34, 3, 220, t.frameworkBg, t.frameworkBorder, t.textSecondary, font, 18);
    ctx.font = createFontStyle(font, 20, 'bold');
    ctx.fillStyle = t.accentTertiary;
    drawText(ctx, C.SKILL_SET_3_TITLE, rightX, 570, 600);
    drawSkillBoxes(ctx, C.SKILL_SET_3, rightX, 598, boxW, 34, 3, 220, t.aiBg, t.aiBorder, t.textSecondary, font, 18);
    drawCorners(ctx, t.cornerFront, W, H, 20, 60, 4);
    return new THREE.CanvasTexture(canvas);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BACK LANDSCAPE
  // ══════════════════════════════════════════════════════════════════════════
  function createBackLandscape() {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    const W = 1400, H = 820;
    const grad = ctx.createRadialGradient(700, 410, 0, 700, 410, 800);
    grad.addColorStop(0, t.bgRadialCenter);
    grad.addColorStop(1, t.bgRadialEdge);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    drawPattern(matSettings.backPattern, ctx, W, H, matSettings.backPatternSpacing, t.circuitColor);

    // COMPACT BACK LANDSCAPE
    if (layoutId === 'compact') {
      const P = 30;
      const qrSize = 100;
      const cornerW = 380;
      const logoSize = 65;
      const nameSize = 52;
      const titleSize = 24;
      const taglineSize = 17;
      const sectionTitleSize = 17;
      const sectionItemSize = 15;
      const SECTION_GAP = 26;
      const ITEM_GAP = 22;
      const logoHeight = logoSize * 0.5;
      const headerContentHeight = logoHeight + 18 + nameSize + 14 + titleSize + 12 + taglineSize + 16;
      const headerStartY = (H - headerContentHeight) / 2;
      let headerY = headerStartY;
      drawLogoOnly(ctx, t, W / 2, headerY + logoHeight / 2, logoSize, matSettings, customLogo);
      headerY += logoHeight + 18;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, nameSize, 'bold');
      const calcedNameSize = calcFontSize(ctx, C.NAME, 550, nameSize, 32);
      ctx.font = createFontStyle(font, calcedNameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, headerY + calcedNameSize * 0.8, 550);
      headerY += calcedNameSize + 14;
      ctx.font = createFontStyle(font, titleSize, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.ALT_TITLE, W / 2, headerY, 550);
      headerY += titleSize + 12;
      ctx.font = createFontStyle(font, taglineSize, 'medium', true);
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.ALT_TAGLINE, W / 2, headerY, 500);
      headerY += 16;
      drawDividerCentered(ctx, W / 2, headerY, 320, 2, t.accentPrimary);
      let tlY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P, tlY, cornerW);
      tlY += ITEM_GAP;
      drawText(ctx, C.PHONE, P, tlY, cornerW);
      tlY += ITEM_GAP + 8;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, P, tlY, cornerW);
      tlY += SECTION_GAP;
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, tlY, cornerW); tlY += ITEM_GAP - 2; });
      let trY = P + 40;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextRight(ctx, C.BACK_SECTION_3_TITLE, W - P, trY, cornerW);
      trY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, trY, cornerW); trY += ITEM_GAP; });
      let blY = H - P - 25 - (C.BACK_SECTION_4_ITEMS.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, P, blY, cornerW);
      blY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(item => { drawText(ctx, '› ' + item, P, blY, cornerW); blY += ITEM_GAP; });
      let brY = H - P - qrSize - 45 - (C.BACK_SECTION_5_ITEMS.length * ITEM_GAP) - SECTION_GAP;
      ctx.font = createFontStyle(font, sectionTitleSize, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextRight(ctx, C.BACK_SECTION_5_TITLE, W - P, brY, cornerW);
      brY += SECTION_GAP;
      ctx.font = createFontStyle(font, sectionItemSize, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(item => { drawTextRight(ctx, '› ' + item, W - P, brY, cornerW); brY += ITEM_GAP; });
      drawQR(ctx, images.linkQr, W - qrSize - P, H - qrSize - P - 12, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 11, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, H - P + 2, qrSize);
      drawCorners(ctx, t.cornerBack, W, H, 14, 40, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // SPACIOUS BACK LANDSCAPE
    if (layoutId === 'spacious') {
      const P = 50;
      const fullW = W - P * 2;
      const qrSize = 130;
      drawQR(ctx, images.linkQr, W - qrSize - P, P, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, P + qrSize + 20, qrSize);
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 80, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW - qrSize - 80, 80, 48);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, P + nameSize * 0.75, fullW - qrSize - 80);
      let headerY = P + nameSize + 15;
      ctx.font = createFontStyle(font, 30, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.ALT_TITLE, W / 2, headerY, fullW);
      headerY += 45;
      drawDividerCentered(ctx, W / 2, headerY, 500, 3, t.accentPrimary);
      headerY += 25;
      drawLogoAndTagline(ctx, t, W / 2, headerY, 400, 140, 120, C.ALT_TAGLINE, 'landscape', matSettings, customLogo, font);
      headerY += 160;
      const COL_W = 360;
      const GAP = 50;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      let y1 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, START_X, y1, COL_W);
      y1 += 30;
      ctx.font = createFontStyle(font, 20, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, START_X, y1, COL_W);
      y1 += 28;
      drawText(ctx, C.PHONE, START_X, y1, COL_W);
      y1 += 35;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, START_X, y1, COL_W);
      y1 += 30;
      ctx.font = createFontStyle(font, 18, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, START_X, y1, COL_W); y1 += 28; });
      const col2X = START_X + COL_W + GAP;
      let y2 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_3_TITLE, col2X, y2, COL_W);
      y2 += 30;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(item => { drawText(ctx, '› ' + item, col2X, y2, COL_W); y2 += 28; });
      y2 += 18;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, col2X, y2, COL_W);
      y2 += 30;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(item => { drawText(ctx, '› ' + item, col2X, y2, COL_W); y2 += 28; });
      const col3X = START_X + (COL_W + GAP) * 2;
      let y3 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.BACK_SECTION_5_TITLE, col3X, y3, COL_W);
      y3 += 30;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(item => { drawText(ctx, '› ' + item, col3X, y3, COL_W); y3 += 28; });
      drawCorners(ctx, t.cornerBack, W, H, 25, 70, 5);
      return new THREE.CanvasTexture(canvas);
    }

    // CENTERED BACK LANDSCAPE
    if (layoutId === 'centered') {
      const P = 40;
      const fullW = W - P * 2;
      const qrSize = 130;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 72, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, fullW, 72, 46);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawTextCentered(ctx, C.NAME, W / 2, P + nameSize * 0.75, fullW);
      let headerY = P + nameSize + 18;
      ctx.font = createFontStyle(font, 28, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.ALT_TITLE, W / 2, headerY, fullW);
      headerY += 45;
      drawDividerCentered(ctx, W / 2, headerY, 450, 3, t.accentPrimary);
      headerY += 28;
      drawLogoAndTagline(ctx, t, W / 2, headerY, 400, 140, 120, C.ALT_TAGLINE, 'landscape', matSettings, customLogo, font);
      headerY += 160;
      const COL_W = 360;
      const GAP = 50;
      const START_X = (W - COL_W * 3 - GAP * 2) / 2;
      let y1 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.BACK_SECTION_1_TITLE, START_X + COL_W / 2, y1, COL_W);
      y1 += 32;
      ctx.font = createFontStyle(font, 20, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.EMAIL, START_X + COL_W / 2, y1, COL_W);
      y1 += 30;
      drawTextCentered(ctx, C.PHONE, START_X + COL_W / 2, y1, COL_W);
      y1 += 38;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.BACK_SECTION_2_TITLE, START_X + COL_W / 2, y1, COL_W);
      y1 += 32;
      ctx.font = createFontStyle(font, 18, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawTextCentered(ctx, link, START_X + COL_W / 2, y1, COL_W); y1 += 28; });
      const col2X = START_X + COL_W + GAP;
      let y2 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawTextCentered(ctx, C.BACK_SECTION_3_TITLE, col2X + COL_W / 2, y2, COL_W);
      y2 += 32;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(item => { drawTextCentered(ctx, '› ' + item, col2X + COL_W / 2, y2, COL_W); y2 += 30; });
      y2 += 18;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawTextCentered(ctx, C.BACK_SECTION_4_TITLE, col2X + COL_W / 2, y2, COL_W);
      y2 += 32;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(item => { drawTextCentered(ctx, '› ' + item, col2X + COL_W / 2, y2, COL_W); y2 += 30; });
      const col3X = START_X + (COL_W + GAP) * 2;
      let y3 = headerY;
      ctx.font = createFontStyle(font, 24, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawTextCentered(ctx, C.BACK_SECTION_5_TITLE, col3X + COL_W / 2, y3, COL_W);
      y3 += 32;
      ctx.font = createFontStyle(font, 20, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(item => { drawTextCentered(ctx, '› ' + item, col3X + COL_W / 2, y3, COL_W); y3 += 30; });
      drawQR(ctx, images.linkQr, (W - qrSize) / 2, H - qrSize - 80, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 14, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W / 2, H - 50, 120);
      drawCorners(ctx, t.cornerBack, W, H, 18, 50, 3);
      return new THREE.CanvasTexture(canvas);
    }

    // MINIMAL BACK LANDSCAPE
    if (layoutId === 'minimal') {
      const P = 60;
      const fullW = W - P * 2;
      const qrSize = 110;
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 82, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, 700, 82, 50);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P, 105, 700);
      ctx.font = createFontStyle(font, 32, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, P, 160, 700);
      const COL_W = 560;
      const colY = 230;
      let y1 = colY;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE.toUpperCase(), P, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 22, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P, y1, COL_W);
      y1 += 32;
      drawText(ctx, C.PHONE, P, y1, COL_W);
      y1 += 50;
      ctx.font = createFontStyle(font, 18, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE.toUpperCase(), P, y1, COL_W);
      y1 += 34;
      ctx.font = createFontStyle(font, 20, 'regular');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, y1, COL_W); y1 += 32; });
      const rightX = 750;
      let y2 = colY;
      const backSections = [
        { title: C.BACK_SECTION_3_TITLE, items: C.BACK_SECTION_3_ITEMS },
        { title: C.BACK_SECTION_4_TITLE, items: C.BACK_SECTION_4_ITEMS },
        { title: C.BACK_SECTION_5_TITLE, items: C.BACK_SECTION_5_ITEMS },
      ];
      backSections.forEach(section => {
        ctx.font = createFontStyle(font, 18, 'bold');
        ctx.fillStyle = t.accentPrimary;
        drawText(ctx, section.title.toUpperCase(), rightX, y2, COL_W);
        y2 += 32;
        ctx.font = createFontStyle(font, 20, 'regular');
        ctx.fillStyle = t.textMuted;
        section.items.forEach(item => { drawText(ctx, item, rightX, y2, COL_W); y2 += 30; });
        y2 += 28;
      });
      const logoSize = 80;
      drawLogoAndTagline(ctx, t, W - P - 120, 140, logoSize + 40, 100, logoSize, '', 'landscape', matSettings, customLogo, font);
      drawQR(ctx, images.linkQr, W - qrSize - P, H - qrSize - P - 25, qrSize, t.qrBg);
      ctx.font = createFontStyle(font, 12, 'semibold');
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, H - P, qrSize);
      return new THREE.CanvasTexture(canvas);
    }

    // CARDS BACK LANDSCAPE
    if (layoutId === 'cards') {
      const P = 25;
      const cardBg = 'rgba(255,255,255,0.04)';
      const cardBorder = 'rgba(255,255,255,0.08)';
      const R = 14;
      const fullW = W - P * 2;
      const TITLE_SIZE = 22;
      const ITEM_SIZE = 19;
      drawCard(ctx, P, P, fullW, 100, R, cardBg, cardBorder);
      ctx.fillStyle = t.textPrimary;
      ctx.font = createFontStyle(font, 50, 'bold');
      const nameSize = calcFontSize(ctx, C.NAME, 580, 50, 32);
      ctx.font = createFontStyle(font, nameSize, 'bold');
      drawText(ctx, C.NAME, P + 20, P + 44, 580);
      ctx.font = createFontStyle(font, 24, 'medium');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, P + 20, P + 78, 580);
      const headerQrSize = 78;
      drawQR(ctx, images.linkQr, W - headerQrSize - P - 18, P + 11, headerQrSize, t.qrBg);
      const cardW = (fullW - 36) / 4;
      const cardY = 140;
      const cardH = H - cardY - P - 12;
      drawCard(ctx, P, cardY, cardW, cardH, R, cardBg, cardBorder);
      let y1 = cardY + 30;
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, P + 16, y1, cardW - 32);
      y1 += 32;
      ctx.font = createFontStyle(font, ITEM_SIZE, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, P + 16, y1, cardW - 32);
      y1 += 30;
      drawText(ctx, C.PHONE, P + 16, y1, cardW - 32);
      y1 += 42;
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, P + 16, y1, cardW - 32);
      y1 += 32;
      ctx.font = createFontStyle(font, ITEM_SIZE - 2, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P + 16, y1, cardW - 32); y1 += 28; });
      const card2X = P + cardW + 12;
      drawCard(ctx, card2X, cardY, cardW, cardH, R, cardBg, cardBorder);
      let y2 = cardY + 30;
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_3_TITLE, card2X + 16, y2, cardW - 32);
      y2 += 32;
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach(item => { drawText(ctx, '› ' + item, card2X + 16, y2, cardW - 32); y2 += 30; });
      const card3X = P + (cardW + 12) * 2;
      drawCard(ctx, card3X, cardY, cardW, cardH, R, cardBg, cardBorder);
      let y3 = cardY + 30;
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, card3X + 16, y3, cardW - 32);
      y3 += 32;
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach(item => { drawText(ctx, '› ' + item, card3X + 16, y3, cardW - 32); y3 += 30; });
      const card4X = P + (cardW + 12) * 3;
      drawCard(ctx, card4X, cardY, cardW, cardH, R, cardBg, cardBorder);
      let y4 = cardY + 30;
      ctx.font = createFontStyle(font, TITLE_SIZE, 'bold');
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.BACK_SECTION_5_TITLE, card4X + 16, y4, cardW - 32);
      y4 += 32;
      ctx.font = createFontStyle(font, ITEM_SIZE, 'semibold');
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach(item => { drawText(ctx, '› ' + item, card4X + 16, y4, cardW - 32); y4 += 30; });
      const logoY = cardY + cardH - 140;
      drawLogoAndTagline(ctx, t, card4X + cardW / 2, logoY, cardW - 32, 120, 90, C.ALT_TAGLINE, 'landscape', matSettings, customLogo, font);
      drawCorners(ctx, t.cornerBack, W, H, 14, 40, 2);
      return new THREE.CanvasTexture(canvas);
    }

    // DEFAULT BACK LANDSCAPE
    const P = 50;
    const fullW = W - P * 2;
    const qrSize = 160;
    ctx.fillStyle = t.textPrimary;
    ctx.font = createFontStyle(font, 72, 'bold');
    const nameSize = calcFontSize(ctx, C.NAME, 550, 72, 40);
    ctx.font = createFontStyle(font, nameSize, 'bold');
    drawText(ctx, C.NAME, P, P + nameSize * 0.75, 550);
    let headerY = P + nameSize + 15;
    ctx.font = createFontStyle(font, 28, 'medium');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.ALT_TITLE, P, headerY, 550);
    headerY += 40;
    drawDivider(ctx, P, headerY, 450, 3, t.accentPrimary, t.accentSecondary);
    headerY += 25;
    const logoX = 700 + (W - 700 - P) / 2;
    drawLogoAndTagline(ctx, t, logoX, P, 450, 180, 140, C.ALT_TAGLINE, 'landscape', matSettings, customLogo, font);
    let leftY = headerY + 20;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.BACK_SECTION_1_TITLE, P, leftY, 550);
    leftY += 30;
    ctx.font = createFontStyle(font, 20, 'bold');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.EMAIL, P, leftY, 550);
    leftY += 32;
    drawText(ctx, C.PHONE, P, leftY, 550);
    leftY += 45;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.BACK_SECTION_2_TITLE, P, leftY, 550);
    leftY += 30;
    ctx.font = createFontStyle(font, 18, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.ONLINE_LINKS.forEach(link => { drawText(ctx, link, P, leftY, 550); leftY += 32; });
    leftY += 20;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentSecondary;
    drawText(ctx, C.BACK_SECTION_3_TITLE, P, leftY, 550);
    leftY += 30;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_3_ITEMS.forEach(item => { drawText(ctx, '› ' + item, P, leftY, 550); leftY += 32; });
    const rightX = 700;
    let rightY = 230;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentTertiary;
    drawText(ctx, C.BACK_SECTION_4_TITLE, rightX, rightY, W - rightX - P);
    rightY += 30;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_4_ITEMS.forEach(item => { drawText(ctx, '› ' + item, rightX, rightY, W - rightX - P); rightY += 32; });
    rightY += 20;
    ctx.font = createFontStyle(font, 22, 'bold');
    ctx.fillStyle = t.accentPrimary;
    drawText(ctx, C.BACK_SECTION_5_TITLE, rightX, rightY, W - rightX - P);
    rightY += 30;
    ctx.font = createFontStyle(font, 20, 'semibold');
    ctx.fillStyle = t.textMuted;
    C.BACK_SECTION_5_ITEMS.forEach(item => { drawText(ctx, '› ' + item, rightX, rightY, W - rightX - P); rightY += 32; });
    drawQR(ctx, images.linkQr, W - qrSize - P, H - qrSize - 60, qrSize, t.qrBg);
    ctx.font = createFontStyle(font, 16, 'semibold');
    ctx.fillStyle = t.textHint;
    drawTextCentered(ctx, C.LINK_QR_LABEL || 'WEBSITE', W - qrSize/2 - P, H - 30, qrSize);
    drawCorners(ctx, t.cornerBack, W, H, 20, 60, 4);
    return new THREE.CanvasTexture(canvas);
  }

  return {
    createFrontPortrait,
    createBackPortrait,
    createFrontLandscape,
    createBackLandscape
  };
}

// ============================================================================
// PRINT HELPERS
// ============================================================================

export function createPrintCanvas(textureFactory, isPortrait) {
  const texture = isPortrait ? textureFactory.createFrontPortrait() : textureFactory.createFrontLandscape();
  const canvas = texture.image;
  texture.dispose();
  return canvas.toDataURL('image/png');
}

export function createPrintCanvasBack(textureFactory, isPortrait) {
  const texture = isPortrait ? textureFactory.createBackPortrait() : textureFactory.createBackLandscape();
  const canvas = texture.image;
  texture.dispose();
  return canvas.toDataURL('image/png');
}

export { DEFAULT_FONT as FONT_STACK };