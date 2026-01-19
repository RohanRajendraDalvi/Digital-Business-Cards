import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { lightProfessional, lightWarm, lightCool, lightNature, lightRose, lightMinimal, lightLavender } from '../../config/lightTheme';
import { darkCyber, darkNeon, darkForest, darkOcean, darkSunset, darkMono, darkRoyal } from '../../config/darkTheme';
import { drawPattern, getMaterialValues, drawLogo, loadImageFromUrl, iconVisualHeights } from '../../config/materials';
import { generateQRCodeImage } from '../../utils/qrcode';

// Cross-platform font stack for iOS/macOS/Windows/Android support
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const darkThemes = { cyber: darkCyber, neon: darkNeon, forest: darkForest, ocean: darkOcean, sunset: darkSunset, mono: darkMono, royal: darkRoyal };
const lightThemes = { professional: lightProfessional, warm: lightWarm, cool: lightCool, nature: lightNature, rose: lightRose, minimal: lightMinimal, lavender: lightLavender };

function cleanContactData(str) {
  if (!str) return '';
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
}

function generateVCard(C) {
  const name = C.NAME || 'Contact';
  const nameParts = name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');
  let vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${lastName};${firstName};;;`,
    `TITLE:${C.TITLE || ''}`,
    `ORG:${C.ALT_TITLE || ''}`
  ];
  if (C.EMAIL) vcard.push(`EMAIL;TYPE=WORK:${cleanContactData(C.EMAIL)}`);
  if (C.PHONE) vcard.push(`TEL;TYPE=CELL:${cleanContactData(C.PHONE)}`);
  if (C.LINK_URL) vcard.push(`URL;TYPE=WORK:https://${cleanContactData(C.LINK_URL)}`);
  if (C.ONLINE_LINKS?.[0]) vcard.push(`X-SOCIALPROFILE;TYPE=linkedin:https://${cleanContactData(C.ONLINE_LINKS[0])}`);
  if (C.ONLINE_LINKS?.[1]) vcard.push(`X-SOCIALPROFILE;TYPE=github:https://${cleanContactData(C.ONLINE_LINKS[1])}`);
  if (C.TAGLINE) vcard.push(`NOTE:${C.TAGLINE.replace(/"/g, '')}`);
  vcard.push('END:VCARD');
  return vcard.join('\r\n');
}

function downloadVCard(C) {
  const vcard = generateVCard(C);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(C.NAME || 'contact').replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createTextureFactory(theme, images, C, matSettings, customLogo) {
  const t = theme;
  const PADDING = 30;
  
  const calcFontSize = (ctx, text, maxWidth, maxSize, minSize = 24) => {
    let size = maxSize;
    ctx.font = `bold ${size}px ${FONT_STACK}`;
    while (ctx.measureText(text).width > maxWidth && size > minSize) {
      size -= 4;
      ctx.font = `bold ${size}px ${FONT_STACK}`;
    }
    return size;
  };
  
  const truncateText = (ctx, text, maxWidth) => {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated.length > 0 ? truncated + '...' : '...';
  };
  
  const drawText = (ctx, text, x, y, maxWidth, options = {}) => {
    const truncated = truncateText(ctx, text || '', maxWidth);
    if (options.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(truncated, x + maxWidth / 2, y);
      ctx.textAlign = 'left';
    } else {
      ctx.fillText(truncated, x, y);
    }
    return truncated;
  };
  
  const drawTextCentered = (ctx, text, centerX, y, maxWidth) => {
    const truncated = truncateText(ctx, text || '', maxWidth);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillText(truncated, centerX, y);
    ctx.restore();
    return ctx.measureText(truncated).width;
  };
  
  const drawQR = (ctx, img, x, y, size) => {
    ctx.fillStyle = t.qrBg;
    ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
    if (img) ctx.drawImage(img, x, y, size, size);
  };
  
  const drawCorners = (ctx, color, w, h, inset = 15, len = 45, lw = 3) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(inset, inset);
    ctx.lineTo(inset, inset + len);
    ctx.moveTo(inset, inset);
    ctx.lineTo(inset + len, inset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - inset, inset);
    ctx.lineTo(w - inset, inset + len);
    ctx.moveTo(w - inset, inset);
    ctx.lineTo(w - inset - len, inset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(inset, h - inset);
    ctx.lineTo(inset, h - inset - len);
    ctx.moveTo(inset, h - inset);
    ctx.lineTo(inset + len, h - inset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - inset, h - inset);
    ctx.lineTo(w - inset, h - inset - len);
    ctx.moveTo(w - inset, h - inset);
    ctx.lineTo(w - inset - len, h - inset);
    ctx.stroke();
  };
  
  const drawLogoAndTagline = (ctx, centerX, startY, areaWidth, areaHeight, logoSize, tagline, mode) => {
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
      taglineFontSize = calcFontSize(ctx, tagline, areaWidth - 40, mode === 'landscape' ? 24 : 22, 14);
      taglineHeight = taglineFontSize * 1.2;
    }
    
    const totalHeight = estimatedLogoHeight + (hasLogo && hasTagline ? LOGO_TAGLINE_GAP : 0) + taglineHeight;
    const blockStartY = startY + (areaHeight - totalHeight) / 2;
    
    let currentY = blockStartY;
    
    if (hasLogo) {
      const logoCenterY = currentY + estimatedLogoHeight / 2;
      drawLogo(ctx, centerX, logoCenterY, logoSize, t.glassesColor, t.glassesFill, customLogo, source);
      currentY += estimatedLogoHeight + LOGO_TAGLINE_GAP;
    }
    
    if (hasTagline) {
      ctx.font = `italic ${taglineFontSize}px ${FONT_STACK}`;
      ctx.fillStyle = t.textHint;
      drawTextCentered(ctx, tagline, centerX, currentY + taglineFontSize * 0.8, areaWidth - 40);
    }
    
    return startY + areaHeight;
  };

  return {
    createFrontPortrait: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      const W = 700, H = 1100;
      const QR_SIZE = 140;
      const QR_X = 510;
      const TEXT_MAX_WIDTH = QR_X - PADDING - 20;
      const FULL_WIDTH = W - PADDING * 2;
      const SKILL_BOX_WIDTH = 205;
      
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, t.bgPrimary);
      grad.addColorStop(0.5, t.bgSecondary);
      grad.addColorStop(1, t.bgPrimary);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(matSettings.frontPattern, ctx, W, H, matSettings.frontPatternSpacing, t.gridColor);
      
      ctx.fillStyle = t.textPrimary;
      const nameSize = calcFontSize(ctx, C.NAME, TEXT_MAX_WIDTH, 65, 32);
      ctx.font = `bold ${nameSize}px ${FONT_STACK}`;
      drawText(ctx, C.NAME, PADDING, 75, TEXT_MAX_WIDTH);
      
      ctx.font = `bold ${calcFontSize(ctx, C.TITLE, TEXT_MAX_WIDTH, 30, 18)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, PADDING, 115, TEXT_MAX_WIDTH);
      
      ctx.font = `italic ${calcFontSize(ctx, C.TAGLINE, TEXT_MAX_WIDTH, 24, 14)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.TAGLINE, PADDING, 152, TEXT_MAX_WIDTH);
      
      drawQR(ctx, images.cardQr, QR_X, 45, QR_SIZE);
      ctx.font = `bold 14px ${FONT_STACK}`;
      ctx.fillStyle = t.textHint;
      ctx.textAlign = 'center';
      drawText(ctx, C.BUSINESS_CARD_QR_LABEL, QR_X, 205, QR_SIZE, { align: 'center' });
      ctx.textAlign = 'left';
      
      const divGrad = ctx.createLinearGradient(PADDING, 0, 400, 0);
      divGrad.addColorStop(0, t.accentPrimary);
      divGrad.addColorStop(0.5, t.accentSecondary);
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(PADDING, 168, 340, 3);
      
      let fpY = 205;
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, PADDING, fpY, FULL_WIDTH);
      fpY += 30;
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach((e) => {
        drawText(ctx, e, PADDING, fpY, FULL_WIDTH);
        fpY += 27;
      });
      fpY += 15;
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_2_TITLE, PADDING, fpY, FULL_WIDTH);
      fpY += 32;
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach((p) => {
        drawText(ctx, '› ' + p, PADDING, fpY, FULL_WIDTH);
        fpY += 30;
      });
      fpY += 20;
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.SKILL_SET_1_TITLE, PADDING, fpY, FULL_WIDTH);
      fpY += 32;
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_1.forEach((l, i) => {
        const x = PADDING + (i % 3) * 215;
        const y = fpY + Math.floor(i / 3) * 38;
        ctx.fillStyle = t.langBg;
        ctx.fillRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.strokeStyle = t.langBorder;
        ctx.strokeRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.fillStyle = t.textPrimary;
        drawText(ctx, l, x + 12, y + 6, SKILL_BOX_WIDTH - 24);
      });
      fpY += Math.ceil(C.SKILL_SET_1.length / 3) * 38 + 20;
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.SKILL_SET_2_TITLE, PADDING, fpY, FULL_WIDTH);
      fpY += 32;
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_2.forEach((f, i) => {
        const x = PADDING + (i % 3) * 215;
        const y = fpY + Math.floor(i / 3) * 38;
        ctx.fillStyle = t.frameworkBg;
        ctx.fillRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.strokeStyle = t.frameworkBorder;
        ctx.strokeRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.fillStyle = t.textPrimary;
        drawText(ctx, f, x + 12, y + 6, SKILL_BOX_WIDTH - 24);
      });
      fpY += Math.ceil(C.SKILL_SET_2.length / 3) * 38 + 20;
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.SKILL_SET_3_TITLE, PADDING, fpY, FULL_WIDTH);
      fpY += 32;
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_3.forEach((a, i) => {
        const x = PADDING + (i % 3) * 215;
        const y = fpY + Math.floor(i / 3) * 38;
        ctx.fillStyle = t.aiBg;
        ctx.fillRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.strokeStyle = t.aiBorder;
        ctx.strokeRect(x, y - 17, SKILL_BOX_WIDTH, 32);
        ctx.fillStyle = t.textPrimary;
        drawText(ctx, a, x + 12, y + 6, SKILL_BOX_WIDTH - 24);
      });
      fpY += Math.ceil(C.SKILL_SET_3.length / 3) * 38 + 40;
      
      const CTA_WIDTH = 420;
      const CTA_X = (W - CTA_WIDTH) / 2;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect(CTA_X, fpY, CTA_WIDTH, 65, 32);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = `bold 28px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      drawText(ctx, C.LOCATION, CTA_X, fpY + 42, CTA_WIDTH, { align: 'center' });
      ctx.textAlign = 'left';
      
      drawCorners(ctx, t.cornerFront, W, H);
      return new THREE.CanvasTexture(canvas);
    },
    
    createBackPortrait: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      const W = 700, H = 1100;
      const QR_SIZE = 150;
      const QR_X = 520;
      const TEXT_MAX_WIDTH = QR_X - PADDING - 40;
      const FULL_WIDTH = W - PADDING * 2;
      
      const grad = ctx.createRadialGradient(350, 550, 0, 350, 550, 700);
      grad.addColorStop(0, t.bgRadialCenter);
      grad.addColorStop(1, t.bgRadialEdge);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(matSettings.backPattern, ctx, W, H, matSettings.backPatternSpacing, t.circuitColor);
      
      ctx.fillStyle = t.textPrimary;
      const nameSize = calcFontSize(ctx, C.NAME, FULL_WIDTH, 64, 32);
      ctx.font = `bold ${nameSize}px ${FONT_STACK}`;
      drawText(ctx, C.NAME, PADDING, 100, FULL_WIDTH);
      
      const altTitleY = 100 + nameSize * 0.65 + 12;
      ctx.font = `${calcFontSize(ctx, C.ALT_TITLE, FULL_WIDTH, 28, 16)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, PADDING, altTitleY, FULL_WIDTH);
      
      const divY = altTitleY + 20;
      const divGrad = ctx.createLinearGradient(PADDING, 0, 400, 0);
      divGrad.addColorStop(0, t.accentPrimary);
      divGrad.addColorStop(0.5, t.accentSecondary);
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(PADDING, divY, 340, 3);
      
      const baseY = divY + 45;
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, PADDING, baseY, TEXT_MAX_WIDTH);
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, PADDING, baseY + 35, TEXT_MAX_WIDTH);
      drawText(ctx, C.PHONE, PADDING, baseY + 68, TEXT_MAX_WIDTH);
      
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, PADDING, baseY + 120, TEXT_MAX_WIDTH);
      
      ctx.font = `bold 21px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach((link, i) => {
        drawText(ctx, link, PADDING, baseY + 153 + i * 30, TEXT_MAX_WIDTH);
      });
      
      let bpY = baseY + 153 + C.ONLINE_LINKS.length * 30 + 35;
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_3_TITLE, PADDING, bpY, TEXT_MAX_WIDTH);
      bpY += 35;
      ctx.font = `bold 21px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach((b) => {
        drawText(ctx, '› ' + b, PADDING, bpY, TEXT_MAX_WIDTH);
        bpY += 34;
      });
      bpY += 25;
      
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, PADDING, bpY, TEXT_MAX_WIDTH);
      bpY += 35;
      ctx.font = `bold 21px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach((s) => {
        drawText(ctx, '› ' + s, PADDING, bpY, TEXT_MAX_WIDTH);
        bpY += 34;
      });
      bpY += 25;
      
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.BACK_SECTION_5_TITLE, PADDING, bpY, TEXT_MAX_WIDTH);
      bpY += 35;
      ctx.font = `bold 21px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach((c) => {
        drawText(ctx, '› ' + c, PADDING, bpY, TEXT_MAX_WIDTH);
        bpY += 34;
      });
      
      const logoAreaX = QR_X - 100;
      const logoAreaWidth = W - QR_X + 60;
      const logoCenterX = logoAreaX + logoAreaWidth / 2;
      const logoStartY = 30;
      const logoAreaHeight = 500;
      drawLogoAndTagline(ctx, logoCenterX, logoStartY, logoAreaWidth, logoAreaHeight, 180, C.ALT_TAGLINE, 'portrait');
      
      drawQR(ctx, images.linkQr, QR_X, 750, QR_SIZE);
      ctx.font = `bold 18px ${FONT_STACK}`;
      ctx.fillStyle = t.textHint;
      ctx.textAlign = 'center';
      drawText(ctx, C.LINK_QR_LABEL, QR_X, 920, QR_SIZE, { align: 'center' });
      ctx.textAlign = 'left';
      
      drawCorners(ctx, t.cornerBack, W, H);
      return new THREE.CanvasTexture(canvas);
    },
    
    createFrontLandscape: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 820;
      const ctx = canvas.getContext('2d');
      const W = 1400, H = 820;
      const QR_SIZE = 150;
      const QR_X = 1190;
      const LEFT_COL_WIDTH = 600;
      const RIGHT_COL_X = 720;
      const RIGHT_COL_WIDTH = W - RIGHT_COL_X - PADDING;
      const HEADER_MAX_WIDTH = QR_X - 50 - 20;
      const SKILL_BOX_WIDTH = 205;
      
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, t.bgPrimary);
      grad.addColorStop(0.5, t.bgSecondary);
      grad.addColorStop(1, t.bgPrimary);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(matSettings.frontPattern, ctx, W, H, matSettings.frontPatternSpacing, t.gridColor);
      
      ctx.fillStyle = t.textPrimary;
      ctx.font = `bold ${calcFontSize(ctx, C.NAME, HEADER_MAX_WIDTH, 88, 44)}px ${FONT_STACK}`;
      drawText(ctx, C.NAME, 50, 140, HEADER_MAX_WIDTH);
      
      ctx.font = `bold ${calcFontSize(ctx, C.TITLE, HEADER_MAX_WIDTH - 200, 32, 20)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.TITLE, 50, 185, HEADER_MAX_WIDTH - 200);
      
      ctx.font = `italic ${calcFontSize(ctx, C.TAGLINE, HEADER_MAX_WIDTH, 26, 16)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.TAGLINE, 50, 225, HEADER_MAX_WIDTH);
      
      drawQR(ctx, images.cardQr, QR_X, 50, QR_SIZE);
      ctx.font = `bold 14px ${FONT_STACK}`;
      ctx.fillStyle = t.textHint;
      ctx.textAlign = 'center';
      drawText(ctx, C.BUSINESS_CARD_QR_LABEL, QR_X, 220, QR_SIZE, { align: 'center' });
      ctx.textAlign = 'left';
      
      const divGrad = ctx.createLinearGradient(50, 0, 500, 0);
      divGrad.addColorStop(0, t.accentPrimary);
      divGrad.addColorStop(0.5, t.accentSecondary);
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(50, 245, 450, 3);
      
      let flY = 290;
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_1_TITLE, 50, flY, LEFT_COL_WIDTH);
      flY += 35;
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.textSecondary;
      C.FRONT_SECTION_1_ITEMS.forEach((e) => {
        drawText(ctx, e, 50, flY, LEFT_COL_WIDTH);
        flY += 30;
      });
      flY += 15;
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.accentCyan;
      drawText(ctx, C.FRONT_SECTION_2_TITLE, 50, flY, LEFT_COL_WIDTH);
      flY += 35;
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.FRONT_SECTION_2_ITEMS.forEach((p) => {
        drawText(ctx, '› ' + p, 50, flY, LEFT_COL_WIDTH);
        flY += 32;
      });
      flY += 25;
      
      const CTA_WIDTH = 320;
      ctx.fillStyle = t.ctaBg;
      ctx.beginPath();
      ctx.roundRect(50, flY, CTA_WIDTH, 65, 32);
      ctx.fill();
      ctx.fillStyle = t.ctaText;
      ctx.font = `bold 26px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      drawText(ctx, C.LOCATION, 50, flY + 43, CTA_WIDTH, { align: 'center' });
      ctx.textAlign = 'left';
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.SKILL_SET_1_TITLE, RIGHT_COL_X, 290, RIGHT_COL_WIDTH);
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_1.forEach((l, i) => {
        const x = RIGHT_COL_X + (i % 3) * 220;
        const y = 320 + Math.floor(i / 3) * 42;
        ctx.fillStyle = t.langBg;
        ctx.fillRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.strokeStyle = t.langBorder;
        ctx.strokeRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.fillStyle = t.textSecondary;
        drawText(ctx, l, x + 14, y + 6, SKILL_BOX_WIDTH - 28);
      });
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.SKILL_SET_2_TITLE, RIGHT_COL_X, 430, RIGHT_COL_WIDTH);
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_2.forEach((f, i) => {
        const x = RIGHT_COL_X + (i % 3) * 220;
        const y = 460 + Math.floor(i / 3) * 42;
        ctx.fillStyle = t.frameworkBg;
        ctx.fillRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.strokeStyle = t.frameworkBorder;
        ctx.strokeRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.fillStyle = t.textSecondary;
        drawText(ctx, f, x + 14, y + 6, SKILL_BOX_WIDTH - 28);
      });
      
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.SKILL_SET_3_TITLE, RIGHT_COL_X, 570, RIGHT_COL_WIDTH);
      ctx.font = `bold 18px ${FONT_STACK}`;
      C.SKILL_SET_3.forEach((a, i) => {
        const x = RIGHT_COL_X + (i % 3) * 220;
        const y = 600 + Math.floor(i / 3) * 42;
        ctx.fillStyle = t.aiBg;
        ctx.fillRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.strokeStyle = t.aiBorder;
        ctx.strokeRect(x, y - 18, SKILL_BOX_WIDTH, 34);
        ctx.fillStyle = t.textSecondary;
        drawText(ctx, a, x + 14, y + 6, SKILL_BOX_WIDTH - 28);
      });
      
      drawCorners(ctx, t.cornerFront, W, H, 20, 60, 4);
      return new THREE.CanvasTexture(canvas);
    },
    
    createBackLandscape: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 820;
      const ctx = canvas.getContext('2d');
      const W = 1400, H = 820;
      const QR_SIZE = 160;
      const QR_X = 1180;
      const LEFT_COL_WIDTH = 550;
      const RIGHT_COL_X = 650;
      const RIGHT_COL_WIDTH = QR_X - RIGHT_COL_X - 40;
      
      const grad = ctx.createRadialGradient(700, 410, 0, 700, 410, 800);
      grad.addColorStop(0, t.bgRadialCenter);
      grad.addColorStop(1, t.bgRadialEdge);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(matSettings.backPattern, ctx, W, H, matSettings.backPatternSpacing, t.circuitColor);
      
      ctx.fillStyle = t.textPrimary;
      const nameSizeL = calcFontSize(ctx, C.NAME, LEFT_COL_WIDTH, 72, 36);
      ctx.font = `bold ${nameSizeL}px ${FONT_STACK}`;
      drawText(ctx, C.NAME, 50, 100, LEFT_COL_WIDTH);
      
      const altTitleYL = 100 + nameSizeL * 0.65 + 12;
      ctx.font = `${calcFontSize(ctx, C.ALT_TITLE, LEFT_COL_WIDTH, 28, 16)}px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.ALT_TITLE, 50, altTitleYL, LEFT_COL_WIDTH);
      
      const divYL = altTitleYL + 20;
      const divGrad = ctx.createLinearGradient(50, 0, 500, 0);
      divGrad.addColorStop(0, t.accentPrimary);
      divGrad.addColorStop(0.5, t.accentSecondary);
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(50, divYL, 450, 3);
      
      const baseYL = divYL + 50;
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_1_TITLE, 50, baseYL, LEFT_COL_WIDTH);
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.EMAIL, 50, baseYL + 43, LEFT_COL_WIDTH);
      drawText(ctx, C.PHONE, 50, baseYL + 80, LEFT_COL_WIDTH);
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_2_TITLE, 50, baseYL + 140, LEFT_COL_WIDTH);
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.ONLINE_LINKS.forEach((link, i) => {
        drawText(ctx, link, 50, baseYL + 180 + i * 37, LEFT_COL_WIDTH);
      });
      
      const backSection3Y = baseYL + 180 + C.ONLINE_LINKS.length * 37 + 40;
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentSecondary;
      drawText(ctx, C.BACK_SECTION_3_TITLE, 50, backSection3Y, LEFT_COL_WIDTH);
      
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_3_ITEMS.forEach((b, i) => {
        drawText(ctx, '› ' + b, 50, backSection3Y + 40 + i * 38, LEFT_COL_WIDTH);
      });
      
      const logoAreaCenterX = RIGHT_COL_X + RIGHT_COL_WIDTH / 2;
      const logoStartY = 50;
      const logoAreaHeight = 280;
      drawLogoAndTagline(ctx, logoAreaCenterX, logoStartY, RIGHT_COL_WIDTH, logoAreaHeight, 200, C.ALT_TAGLINE, 'landscape');
      
      let blY = logoStartY + logoAreaHeight + 30;
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentTertiary;
      drawText(ctx, C.BACK_SECTION_4_TITLE, RIGHT_COL_X, blY, RIGHT_COL_WIDTH);
      blY += 42;
      ctx.font = `bold 22px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_4_ITEMS.forEach((s) => {
        drawText(ctx, '› ' + s, RIGHT_COL_X, blY, RIGHT_COL_WIDTH);
        blY += 38;
      });
      blY += 25;
      
      ctx.font = `bold 24px ${FONT_STACK}`;
      ctx.fillStyle = t.accentPrimary;
      drawText(ctx, C.BACK_SECTION_5_TITLE, RIGHT_COL_X, blY, RIGHT_COL_WIDTH);
      blY += 38;
      ctx.font = `bold 20px ${FONT_STACK}`;
      ctx.fillStyle = t.textMuted;
      C.BACK_SECTION_5_ITEMS.forEach((c) => {
        drawText(ctx, '› ' + c, RIGHT_COL_X, blY, RIGHT_COL_WIDTH);
        blY += 34;
      });
      
      drawQR(ctx, images.linkQr, QR_X, 550, QR_SIZE);
      ctx.font = `bold 16px ${FONT_STACK}`;
      ctx.fillStyle = t.textHint;
      ctx.textAlign = 'center';
      drawText(ctx, C.LINK_QR_LABEL, QR_X, 735, QR_SIZE, { align: 'center' });
      ctx.textAlign = 'left';
      
      drawCorners(ctx, t.cornerBack, W, H, 20, 60, 4);
      return new THREE.CanvasTexture(canvas);
    }
  };
}

export default function BusinessCard({ data, showControls = true, showHint = true, showTitle = true, height = '100%', isLoggedIn = false, isOwner = false }) {
  const containerRef = useRef(null);
  const getInitialDarkMode = () => data?.themeMode ? data.themeMode === 'dark' : true;
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [showSaved, setShowSaved] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const [rebuildVersion, setRebuildVersion] = useState(0);

  const triggerRebuild = useCallback(() => {
    setRebuildVersion(v => v + 1);
  }, []);

  const getTheme = useCallback((dark) => {
    const variant = dark 
      ? (data?.darkVariant || data?.themeVariant || 'cyber') 
      : (data?.lightVariant || data?.themeVariant || 'professional');
    return dark ? (darkThemes[variant] || darkCyber) : (lightThemes[variant] || lightProfessional);
  }, [data?.themeVariant, data?.darkVariant, data?.lightVariant]);

  const [currentTheme, setCurrentTheme] = useState(() => getTheme(isDark));

  useEffect(() => {
    setCurrentTheme(getTheme(isDark));
  }, [isDark, getTheme]);
  
  useEffect(() => {
    if (data?.themeMode) setIsDark(data.themeMode === 'dark');
  }, [data?.themeMode]);

  const C = useMemo(() => data || {
    NAME: 'Your Name',
    TITLE: 'Your Title',
    TAGLINE: '"Your tagline"',
    ALT_TITLE: 'Company',
    ALT_TAGLINE: 'Subtitle',
    EMAIL: 'email@example.com',
    PHONE: '+1 555 000 0000',
    LOCATION: 'Location',
    LINK_URL: 'example.com',
    ONLINE_LINKS: [],
    FRONT_SECTION_1_TITLE: 'Section 1',
    FRONT_SECTION_1_ITEMS: [],
    FRONT_SECTION_2_TITLE: 'Section 2',
    FRONT_SECTION_2_ITEMS: [],
    BACK_SECTION_1_TITLE: 'Contact',
    BACK_SECTION_2_TITLE: 'Online',
    BACK_SECTION_3_TITLE: 'Section 3',
    BACK_SECTION_3_ITEMS: [],
    BACK_SECTION_4_TITLE: 'Section 4',
    BACK_SECTION_4_ITEMS: [],
    BACK_SECTION_5_TITLE: 'Section 5',
    BACK_SECTION_5_ITEMS: [],
    SKILL_SET_1_TITLE: 'Skills 1',
    SKILL_SET_1: [],
    SKILL_SET_2_TITLE: 'Skills 2',
    SKILL_SET_2: [],
    SKILL_SET_3_TITLE: 'Skills 3',
    SKILL_SET_3: [],
    CARD_SHARE_URL: '',
    BUSINESS_CARD_QR_LABEL: 'SHARE',
    LINK_QR_LABEL: 'WEBSITE',
    UI_TITLE: 'Digital Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate | Pinch/Scroll to zoom | Tap to flip',
    UI_HINT: 'Tap card to flip',
  }, [data]);

  const matSettings = useMemo(() => ({
    frontPattern: data?.frontPattern || 'grid',
    backPattern: data?.backPattern || 'waves',
    frontPatternSpacing: data?.frontPatternSpacing || 40,
    backPatternSpacing: data?.backPatternSpacing || 80,
    materialPreset: data?.materialPreset || 'default',
    logoSource: data?.logoSource || 'glasses',
    logoCustomData: data?.logoCustomData || null,
  }), [data?.frontPattern, data?.backPattern, data?.frontPatternSpacing, data?.backPatternSpacing, data?.materialPreset, data?.logoSource, data?.logoCustomData]);

  const threeRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    cardGroup: null,
    card: null,
    edges: null,
    lights: { ambient: null, point1: null, point2: null },
    orbs: [],
    textures: { front: null, back: null },
    animationId: null,
    isInitialized: false
  });
  
  const stateRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    targetRotX: 0.1,
    targetRotY: 0,
    time: 0,
    lastTouchDist: 0,
    lastTapTime: 0,
    touchStartTime: 0,
    isPortrait: true,
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    pinchCenterX: 0,
    pinchCenterY: 0
  });
  
  const imagesRef = useRef({ linkQr: null, cardQr: null });
  const customLogoRef = useRef(null);
  const dataRef = useRef(C);

  // Update data ref
  useEffect(() => {
    dataRef.current = C;
    if (threeRef.current.isInitialized) {
      triggerRebuild();
    }
  }, [C, triggerRebuild]);

  // Load custom logo
  useEffect(() => {
    if (matSettings.logoSource === 'custom' && matSettings.logoCustomData) {
      loadImageFromUrl(matSettings.logoCustomData).then(img => {
        customLogoRef.current = img;
        if (threeRef.current.isInitialized) {
          triggerRebuild();
        }
      });
    } else {
      customLogoRef.current = null;
    }
  }, [matSettings.logoSource, matSettings.logoCustomData, triggerRebuild]);

  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 15 + Math.random() * 10
  })), []);

  // Generate QR codes
  useEffect(() => {
    const generateQRCodes = async () => {
      const linkUrl = C.LINK_URL ? `https://${C.LINK_URL}` : null;
      const cardUrl = C.CARD_SHARE_URL || null;

      const [linkQr, cardQr] = await Promise.all([
        generateQRCodeImage(linkUrl),
        generateQRCodeImage(cardUrl),
      ]);

      imagesRef.current = { linkQr, cardQr };
      if (threeRef.current.isInitialized) {
        triggerRebuild();
      }
    };

    generateQRCodes();
  }, [C.LINK_URL, C.CARD_SHARE_URL, triggerRebuild]);

  // Three.js initialization
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const three = threeRef.current;
    const state = stateRef.current;
    
    // Reset and cleanup any existing instance
    if (three.renderer) {
      three.renderer.dispose();
      if (three.renderer.domElement?.parentNode) {
        three.renderer.domElement.parentNode.removeChild(three.renderer.domElement);
      }
    }
    three.isInitialized = false;
    
    let W = container.clientWidth, H = container.clientHeight;
    
    const isPortrait = () => W / H < 1.4;
    state.isPortrait = isPortrait();
    
    const calcCameraZ = (w, h, cardW, cardH) => {
      const fov = 45 * (Math.PI / 180);
      const aspect = w / h;
      const padding = 1.4;
      const zForHeight = (cardH * padding) / (2 * Math.tan(fov / 2));
      const zForWidth = (cardW * padding) / (2 * Math.tan(fov / 2) * aspect);
      return Math.max(zForHeight, zForWidth, 3.0);
    };

    three.scene = new THREE.Scene();
    three.cardGroup = new THREE.Group();
    three.scene.add(three.cardGroup);
    
    const cardDims = isPortrait() ? { w: 2.0, h: 3.2 } : { w: 3.6, h: 2.2 };
    three.camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    three.camera.position.z = calcCameraZ(W, H, cardDims.w, cardDims.h);
    
    three.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    three.renderer.setSize(W, H);
    container.appendChild(three.renderer.domElement);

    three.lights.ambient = new THREE.AmbientLight(0xffffff, 0.35);
    three.scene.add(three.lights.ambient);
    
    three.lights.point1 = new THREE.PointLight(0xffffff, 1.5, 10);
    three.lights.point1.position.set(2, 2, 3);
    three.scene.add(three.lights.point1);
    
    three.lights.point2 = new THREE.PointLight(0xffffff, 1.0, 10);
    three.lights.point2.position.set(-2, -1, 2);
    three.scene.add(three.lights.point2);

    const orbGeo = new THREE.SphereGeometry(0.04, 8, 8);
    three.orbs = [];
    for (let i = 0; i < 3; i++) {
      const orbMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        -2 - Math.random() * 2
      );
      orb.userData = { speed: 0.5 + Math.random(), offset: Math.random() * Math.PI * 2 };
      three.scene.add(orb);
      three.orbs.push(orb);
    }

    const onMouseDown = (e) => {
      state.isDragging = true;
      state.prevX = e.clientX;
      state.prevY = e.clientY;
      state.touchStartTime = Date.now();
    };
    
    const onMouseMove = (e) => {
      if (!state.isDragging) return;
      state.targetRotY += (e.clientX - state.prevX) * 0.01;
      state.targetRotX += (e.clientY - state.prevY) * 0.01;
      state.targetRotX = Math.max(-0.5, Math.min(0.5, state.targetRotX));
      state.prevX = e.clientX;
      state.prevY = e.clientY;
    };
    
    const onMouseUp = () => {
      state.isDragging = false;
    };
    
    let touchHandled = false;
    
    const onClick = (e) => {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      const tapDuration = Date.now() - state.touchStartTime;
      if (Math.abs(e.clientX - state.prevX) < 5 && tapDuration < 250) {
        state.targetRotY += Math.PI;
      }
    };
    
    const onWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      const oldZ = three.camera.position.z;
      const newZ = Math.max(2.0, Math.min(8, oldZ + e.deltaY * 0.005));
      const zoomFactor = (oldZ - newZ) / oldZ;
      state.targetPanX -= mouseX * zoomFactor * 2;
      state.targetPanY += mouseY * zoomFactor * 2;
      three.camera.position.z = newZ;
    };
    
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        state.isDragging = true;
        state.prevX = e.touches[0].clientX;
        state.prevY = e.touches[0].clientY;
        state.touchStartTime = Date.now();
      } else if (e.touches.length === 2) {
        state.lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        state.pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        state.pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && state.isDragging) {
        state.targetRotY += (e.touches[0].clientX - state.prevX) * 0.01;
        state.targetRotX += (e.touches[0].clientY - state.prevY) * 0.01;
        state.targetRotX = Math.max(-0.5, Math.min(0.5, state.targetRotX));
        state.prevX = e.touches[0].clientX;
        state.prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const rect = container.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const pinchX = (centerX - rect.left) / rect.width - 0.5;
        const pinchY = (centerY - rect.top) / rect.height - 0.5;
        const oldZ = three.camera.position.z;
        const newZ = Math.max(2.0, Math.min(8, oldZ + (state.lastTouchDist - dist) * 0.02));
        const zoomFactor = (oldZ - newZ) / oldZ;
        state.targetPanX -= pinchX * zoomFactor * 2;
        state.targetPanY += pinchY * zoomFactor * 2;
        three.camera.position.z = newZ;
        state.lastTouchDist = dist;
      }
    };
    
    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        const now = Date.now();
        const touch = e.changedTouches[0];
        const tapDuration = now - state.touchStartTime;
        const movedX = Math.abs(touch.clientX - state.prevX);
        const movedY = Math.abs(touch.clientY - state.prevY);
        if (state.isDragging && movedX < 10 && movedY < 10 && tapDuration < 250 && now - state.lastTapTime > 400) {
          state.targetRotY += Math.PI;
          touchHandled = true;
          state.lastTapTime = now;
        }
        state.isDragging = false;
      }
    };
    
    let resizeTimeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        W = container.clientWidth;
        H = container.clientHeight;
        if (W === 0 || H === 0) return;
        const newCardDims = isPortrait() ? { w: 2.0, h: 3.2 } : { w: 3.6, h: 2.2 };
        three.camera.aspect = W / H;
        three.camera.position.z = calcCameraZ(W, H, newCardDims.w, newCardDims.h);
        three.camera.updateProjectionMatrix();
        three.renderer.setSize(W, H);
        if (isPortrait() !== state.isPortrait) {
          state.isPortrait = isPortrait();
          triggerRebuild();
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', onResize);

    const animate = () => {
      three.animationId = requestAnimationFrame(animate);
      state.time += 0.016;
      
      if (three.cardGroup) {
        three.cardGroup.rotation.x += (state.targetRotX - three.cardGroup.rotation.x) * 0.08;
        three.cardGroup.rotation.y += (state.targetRotY - three.cardGroup.rotation.y) * 0.08;
        state.panX += (state.targetPanX - state.panX) * 0.1;
        state.panY += (state.targetPanY - state.panY) * 0.1;
        three.cardGroup.position.x = state.panX;
        three.cardGroup.position.y = Math.sin(state.time) * 0.05 + state.panY;
        if (three.camera.position.z > 4) {
          state.targetPanX *= 0.95;
          state.targetPanY *= 0.95;
        }
      }
      
      if (three.lights.point1) {
        three.lights.point1.position.x = Math.sin(state.time * 0.5) * 3;
        three.lights.point1.position.y = Math.cos(state.time * 0.5) * 2;
      }
      
      three.orbs.forEach(o => {
        o.position.y += Math.sin(state.time * o.userData.speed + o.userData.offset) * 0.002;
        o.position.x += Math.cos(state.time * o.userData.speed * 0.5 + o.userData.offset) * 0.001;
      });
      
      three.renderer.render(three.scene, three.camera);
    };
    
    animate();
    three.isInitialized = true;
    
    // Trigger initial build
    triggerRebuild();

    return () => {
      cancelAnimationFrame(three.animationId);
      clearTimeout(resizeTimeout);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      
      if (three.renderer) {
        three.renderer.dispose();
        if (three.renderer.domElement?.parentNode) {
          three.renderer.domElement.parentNode.removeChild(three.renderer.domElement);
        }
      }
      
      three.textures.front?.dispose();
      three.textures.back?.dispose();
      
      if (three.card) {
        three.card.geometry.dispose();
        three.card.material.forEach(m => m.dispose());
      }
      
      if (three.edges) {
        three.edges.geometry.dispose();
        three.edges.material.dispose();
      }
      
      three.orbs.forEach(o => {
        o.geometry.dispose();
        o.material.dispose();
      });
      
      three.isInitialized = false;
    };
  }, [triggerRebuild]);

  // Unified rebuild effect - triggers on theme, settings, or version change
  useEffect(() => {
    const three = threeRef.current;
    const state = stateRef.current;
    
    if (!three.isInitialized) return;
    
    const t = currentTheme;
    
    // Update lights
    if (three.lights.point1) {
      three.lights.point1.color.setHex(t.lightColor1);
      three.lights.point2.color.setHex(t.lightColor2);
      three.lights.ambient.intensity = t.ambientIntensity ?? 0.35;
      three.lights.point1.intensity = t.pointLight1Intensity ?? 1.5;
      three.lights.point2.intensity = t.pointLight2Intensity ?? 1.0;
    }
    
    // Update orbs
    three.orbs.forEach((orb, i) => {
      orb.material.color.setHex(i % 2 ? t.orbColor1 : t.orbColor2);
    });

    // Rebuild card using requestAnimationFrame for smooth update
    const frameId = requestAnimationFrame(() => {
      // Dispose old resources
      three.textures.front?.dispose();
      three.textures.back?.dispose();
      
      if (three.card) {
        three.cardGroup.remove(three.card);
        three.card.geometry.dispose();
        three.card.material.forEach(m => m.dispose());
      }
      
      if (three.edges) {
        three.cardGroup.remove(three.edges);
        three.edges.geometry.dispose();
        three.edges.material.dispose();
      }
      
      // Create new textures and card
      const portrait = state.isPortrait;
      const cw = portrait ? 2.0 : 3.6;
      const ch = portrait ? 3.2 : 2.2;
      const mat = getMaterialValues(matSettings.materialPreset);
      
      const factory = createTextureFactory(t, imagesRef.current, dataRef.current, matSettings, customLogoRef.current);
      const frontTex = portrait ? factory.createFrontPortrait() : factory.createFrontLandscape();
      const backTex = portrait ? factory.createBackPortrait() : factory.createBackLandscape();
      three.textures = { front: frontTex, back: backTex };
      
      const cardGeo = new THREE.BoxGeometry(cw, ch, 0.08);
      const sideMat = new THREE.MeshStandardMaterial({
        color: t.cardSide,
        metalness: mat.sideMetalness,
        roughness: mat.sideRoughness
      });
      
      const materials = [
        sideMat, sideMat, sideMat, sideMat,
        new THREE.MeshStandardMaterial({ map: frontTex, metalness: mat.cardMetalness, roughness: mat.cardRoughness }),
        new THREE.MeshStandardMaterial({ map: backTex, metalness: mat.cardMetalness, roughness: mat.cardRoughness })
      ];
      
      three.card = new THREE.Mesh(cardGeo, materials);
      three.cardGroup.add(three.card);
      
      const edgeGeo = new THREE.EdgesGeometry(cardGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: t.edgeColor, transparent: true, opacity: 0.6 });
      three.edges = new THREE.LineSegments(edgeGeo, edgeMat);
      three.cardGroup.add(three.edges);
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [currentTheme, matSettings, rebuildVersion]);

  const handleDownload = useCallback(() => {
    downloadVCard(C);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [C]);
  
  const handleThemeToggle = useCallback(() => {
    setIsDark(d => !d);
  }, []);
  
  const handleHome = useCallback(() => {
    window.location.href = '/';
  }, []);
  
  const handleEdit = useCallback(() => {
    window.location.href = '/edit';
  }, []);
  
  const handleCreate = useCallback(() => {
    window.location.href = '/';
  }, []);
  
  const icons = {
    home: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    share: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
    print: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    contact: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    link: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    edit: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    phone: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    email: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    text: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    globe: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  };
  
  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${C.NAME} - Business Card`,
      text: `${C.NAME}\n${C.TITLE}${C.ALT_TITLE ? ` at ${C.ALT_TITLE}` : ''}\n${C.EMAIL ? `${C.EMAIL}` : ''}${C.PHONE ? `\n${C.PHONE}` : ''}${C.LINK_URL ? `\n${C.LINK_URL}` : ''}`,
      url: window.location.href,
    };
    
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    
    const contactText = `${C.NAME}\n${C.TITLE}${C.ALT_TITLE ? `\n${C.ALT_TITLE}` : ''}\n\n${C.EMAIL ? `Email: ${C.EMAIL}\n` : ''}${C.PHONE ? `Phone: ${C.PHONE}\n` : ''}${C.LINK_URL ? `Website: ${C.LINK_URL}\n` : ''}${C.LOCATION ? `Location: ${C.LOCATION}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(contactText);
      alert('Contact info copied to clipboard!');
    } catch (err) {
      prompt('Copy contact info:', contactText);
    }
  }, [C]);

  const getSocialPlatform = useCallback((url) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    
    if (lower.includes('github.com') || lower.includes('github')) 
      return { name: 'GitHub', color: '#333' };
    if (lower.includes('linkedin.com') || lower.includes('linkedin')) 
      return { name: 'LinkedIn', color: '#0077b5' };
    if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('/x/')) 
      return { name: 'X', color: '#000' };
    if (lower.includes('instagram.com') || lower.includes('instagram')) 
      return { name: 'Instagram', color: '#e4405f' };
    if (lower.includes('facebook.com') || lower.includes('fb.com')) 
      return { name: 'Facebook', color: '#1877f2' };
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) 
      return { name: 'YouTube', color: '#ff0000' };
    if (lower.includes('tiktok.com') || lower.includes('tiktok')) 
      return { name: 'TikTok', color: '#000' };
    if (lower.includes('dribbble.com') || lower.includes('dribbble')) 
      return { name: 'Dribbble', color: '#ea4c89' };
    if (lower.includes('behance.net') || lower.includes('behance')) 
      return { name: 'Behance', color: '#1769ff' };
    if (lower.includes('medium.com') || lower.includes('medium')) 
      return { name: 'Medium', color: '#000' };
    if (lower.includes('dev.to')) 
      return { name: 'Dev.to', color: '#0a0a0a' };
    if (lower.includes('stackoverflow.com') || lower.includes('stackoverflow')) 
      return { name: 'Stack Overflow', color: '#f48024' };
    if (lower.includes('codepen.io') || lower.includes('codepen')) 
      return { name: 'CodePen', color: '#000' };
    if (lower.includes('twitch.tv') || lower.includes('twitch')) 
      return { name: 'Twitch', color: '#9146ff' };
    if (lower.includes('discord.gg') || lower.includes('discord')) 
      return { name: 'Discord', color: '#5865f2' };
    if (lower.includes('telegram') || lower.includes('t.me')) 
      return { name: 'Telegram', color: '#0088cc' };
    if (lower.includes('whatsapp')) 
      return { name: 'WhatsApp', color: '#25d366' };
    if (lower.includes('pinterest')) 
      return { name: 'Pinterest', color: '#e60023' };
    if (lower.includes('snapchat')) 
      return { name: 'Snapchat', color: '#fffc00' };
    if (lower.includes('reddit.com') || lower.includes('reddit')) 
      return { name: 'Reddit', color: '#ff4500' };
    if (lower.includes('threads.net') || lower.includes('threads')) 
      return { name: 'Threads', color: '#000' };
    if (lower.includes('mastodon')) 
      return { name: 'Mastodon', color: '#6364ff' };
    if (lower.includes('bluesky') || lower.includes('bsky')) 
      return { name: 'Bluesky', color: '#0085ff' };
    
    return { name: 'Link', color: '#666' };
  }, []);

  const handleSocialClick = useCallback((url) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleCall = useCallback(() => {
    if (!C.PHONE) return;
    const cleanPhone = C.PHONE.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  }, [C.PHONE]);

  const handleEmail = useCallback(() => {
    if (!C.EMAIL) return;
    window.location.href = `mailto:${C.EMAIL}`;
  }, [C.EMAIL]);

  const handleText = useCallback(() => {
    if (!C.PHONE) return;
    const cleanPhone = C.PHONE.replace(/[^\d+]/g, '');
    window.location.href = `sms:${cleanPhone}`;
  }, [C.PHONE]);

  const handleWebsite = useCallback(() => {
    if (!C.LINK_URL) return;
    const fullUrl = C.LINK_URL.startsWith('http') ? C.LINK_URL : `https://${C.LINK_URL}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [C.LINK_URL]);

  const socialLinks = useMemo(() => {
    return (C.ONLINE_LINKS || []).filter(Boolean).map(link => ({
      url: link,
      platform: getSocialPlatform(link)
    }));
  }, [C.ONLINE_LINKS, getSocialPlatform]);
  
  const handlePrint = useCallback(() => {
    const state = stateRef.current;
    const factory = createTextureFactory(currentTheme, imagesRef.current, C, matSettings, customLogoRef.current);
    
    const frontCanvas = state.isPortrait 
      ? createPrintCanvas(factory.createFrontPortrait, 700, 1100)
      : createPrintCanvas(factory.createFrontLandscape, 1400, 820);
    const backCanvas = state.isPortrait
      ? createPrintCanvas(factory.createBackPortrait, 700, 1100)
      : createPrintCanvas(factory.createBackLandscape, 1400, 820);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print your card');
      return;
    }
    
    const isPortrait = state.isPortrait;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Business Card - ${C.NAME}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${FONT_STACK};
            background: #f8f9fa;
            padding: 40px 20px;
          }
          .print-container {
            max-width: 1000px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #1a1a2e;
            margin-bottom: 8px;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          .instructions {
            text-align: center;
            color: #6b7280;
            margin-bottom: 40px;
            font-size: 14px;
          }
          .cards {
            display: flex;
            flex-wrap: wrap;
            gap: 32px;
            justify-content: center;
          }
          .card-side {
            background: white;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .card-side h2 {
            text-align: center;
            color: #6b7280;
            margin-bottom: 16px;
            font-size: 13px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .card-side img {
            display: block;
            max-width: 100%;
            height: auto;
            border-radius: 12px;
          }
          .print-btn {
            display: block;
            margin: 40px auto 0;
            padding: 16px 48px;
            font-size: 15px;
            font-weight: 600;
            color: #000;
            background: linear-gradient(135deg, #00d4ff, #0066ff);
            border: none;
            border-radius: 100px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
          }
          .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 212, 255, 0.4);
          }
          @media print {
            body { background: white; padding: 0; }
            .print-btn, h1, .instructions { display: none; }
            .card-side { 
              box-shadow: none; 
              page-break-inside: avoid;
              padding: 10px;
            }
            .cards { gap: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <h1>Print Your Business Card</h1>
          <p class="instructions">Click the button below or use Ctrl+P / Cmd+P to print</p>
          <div class="cards">
            <div class="card-side">
              <h2>Front Side</h2>
              <img src="${frontCanvas}" alt="Card Front" style="width: ${isPortrait ? '350px' : '500px'};" />
            </div>
            <div class="card-side">
              <h2>Back Side</h2>
              <img src="${backCanvas}" alt="Card Back" style="width: ${isPortrait ? '350px' : '500px'};" />
            </div>
          </div>
          <button class="print-btn" onclick="window.print()">Print Card</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [C, currentTheme, matSettings]);
  
  function createPrintCanvas(textureFactory, width, height) {
    const texture = textureFactory();
    const canvas = texture.image;
    texture.dispose();
    return canvas.toDataURL('image/png');
  }

  const bgGradient = isDark 
    ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' 
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)';

  return (
    <div className={`card-container ${isDark ? 'dark' : 'light'}`} style={{
      height,
      minHeight: height === '100dvh' ? '-webkit-fill-available' : undefined,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      background: bgGradient,
      boxSizing: 'border-box',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: p.id % 2 ? currentTheme.particleColor : currentTheme.particleAlt,
            left: `${p.left}%`,
            bottom: '-10px',
            opacity: 0.5,
            animation: `float ${p.duration}s infinite linear`,
            animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>
      
      {showControls && (
        <div className="top-left-buttons">
          {isLoggedIn && (
            <button onClick={handleHome} className="card-btn">
              <span className="btn-icon">{icons.home}</span>
              <span className="btn-text">Home</span>
            </button>
          )}
          {isOwner ? (
            <button onClick={handleEdit} className="card-btn edit-btn">
              <span className="btn-icon">{icons.edit}</span>
              <span className="btn-text">Edit</span>
            </button>
          ) : (
            <button onClick={handleCreate} className="card-btn create-btn">
              <span className="btn-icon">{icons.plus}</span>
              <span className="btn-text">Create Yours</span>
            </button>
          )}
        </div>
      )}
      
      {showControls && (
        <button onClick={handleShare} className="card-btn share-btn">
          <span className="btn-icon">{icons.share}</span>
          <span className="btn-text">Share</span>
        </button>
      )}
      
      {showControls && (
        <button onClick={handlePrint} className="card-btn print-btn">
          <span className="btn-icon">{icons.print}</span>
          <span className="btn-text">Print</span>
        </button>
      )}
      
      {showControls && (
        <button onClick={handleThemeToggle} className="card-btn theme-btn">
          <span className="btn-icon">{isDark ? '☀️' : '🌙'}</span>
          <span className="btn-text">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      )}
      
      {showControls && (
        <button onClick={handleDownload} className={`card-btn download-btn ${showSaved ? 'saved' : ''}`}>
          <span className="btn-icon">{showSaved ? icons.check : icons.contact}</span>
          <span className="btn-text">{showSaved ? 'Saved!' : 'Add to Contacts'}</span>
        </button>
      )}
      
      {showTitle && (
        <div className="card-title-area">
          <h3 style={{ color: currentTheme.accentPrimary }}>{C.UI_TITLE}</h3>
        </div>
      )}
      
      <div ref={containerRef} style={{
        width: '100%',
        flex: 1,
        cursor: 'grab',
        touchAction: 'none',
        minHeight: '300px'
      }} />
      
      {showHint && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(8px + max(env(safe-area-inset-bottom, 0px), 5px))',
          color: currentTheme.textHint,
          fontSize: '11px',
          animation: 'pulse 2s infinite',
          zIndex: 10,
          textAlign: 'center'
        }}>
          Tap to flip • Drag to rotate • Scroll to zoom
        </div>
      )}
      
      {showControls && (C.PHONE || C.EMAIL || C.LINK_URL || socialLinks.length > 0) && (
        <div className={`social-buttons ${contactsExpanded ? 'expanded' : 'collapsed'}`}>
          <button 
            onClick={() => setContactsExpanded(!contactsExpanded)} 
            className="card-btn social-btn expand-btn"
            title={contactsExpanded ? 'Collapse' : 'Quick Actions'}
          >
            <span className="btn-icon">{contactsExpanded ? '✕' : '+'}</span>
            <span className="btn-text">{contactsExpanded ? 'Close' : 'Actions'}</span>
          </button>
          <div className="social-buttons-list">
            {C.PHONE && (
              <button 
                onClick={handleCall} 
                className="card-btn social-btn call-btn"
                title={`Call ${C.PHONE}`}
              >
                <span className="btn-icon">{icons.phone}</span>
                <span className="btn-text">Call</span>
              </button>
            )}
            {C.PHONE && (
              <button 
                onClick={handleText} 
                className="card-btn social-btn text-btn"
                title={`Text ${C.PHONE}`}
              >
                <span className="btn-icon">{icons.text}</span>
                <span className="btn-text">Text</span>
              </button>
            )}
            {C.EMAIL && (
              <button 
                onClick={handleEmail} 
                className="card-btn social-btn email-btn"
                title={`Email ${C.EMAIL}`}
              >
                <span className="btn-icon">{icons.email}</span>
                <span className="btn-text">Email</span>
              </button>
            )}
            {C.LINK_URL && (
              <button 
                onClick={handleWebsite} 
                className="card-btn social-btn website-btn"
                title={`Visit ${C.LINK_URL}`}
              >
                <span className="btn-icon">{icons.globe}</span>
                <span className="btn-text">{C.LINK_QR_LABEL || 'Website'}</span>
              </button>
            )}
            {socialLinks.map((social, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSocialClick(social.url)} 
                className="card-btn social-btn"
                title={`Go to ${social.platform.name}`}
              >
                <span className="btn-icon">{icons.link}</span>
                <span className="btn-text">{social.platform.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); opacity: 0; }
          5% { opacity: 0.5; }
          95% { opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .card-title-area {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          text-align: center;
          max-width: calc(100% - 240px);
          padding: 0 10px;
          overflow: hidden;
        }
        
        .card-title-area h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        .card-title-area p {
          margin: 4px 0 0 0;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .card-btn {
          position: absolute;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          font-family: ${FONT_STACK};
        }
        
        .card-btn .btn-icon {
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card-btn .btn-icon svg {
          width: 12px;
          height: 12px;
        }
        
        .card-btn .btn-text {
          white-space: nowrap;
        }
        
        .card-container.dark .card-btn {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
        }
        
        .card-container.dark .card-btn:hover {
          background: rgba(0,0,0,0.7);
          border-color: rgba(255,255,255,0.25);
        }
        
        .card-container.light .card-btn {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.1);
          color: rgba(0,0,0,0.7);
        }
        
        .card-container.light .card-btn:hover {
          background: rgba(255,255,255,0.9);
          border-color: rgba(0,0,0,0.2);
        }
        
        .top-left-buttons {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .top-left-buttons .card-btn {
          position: relative;
        }
        
        .edit-btn {
          background: rgba(0, 212, 255, 0.15) !important;
          border-color: rgba(0, 212, 255, 0.3) !important;
        }
        
        .card-container.light .edit-btn {
          background: rgba(0, 150, 200, 0.15) !important;
          border-color: rgba(0, 150, 200, 0.3) !important;
        }
        
        .create-btn {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 102, 255, 0.2)) !important;
          border-color: rgba(0, 212, 255, 0.4) !important;
        }
        
        .card-container.light .create-btn {
          background: linear-gradient(135deg, rgba(0, 180, 220, 0.2), rgba(0, 80, 200, 0.2)) !important;
          border-color: rgba(0, 150, 200, 0.4) !important;
        }
        
        .theme-btn { top: 10px; right: 10px; }
        .print-btn { top: 45px; right: 10px; }
        .share-btn { bottom: calc(75px + max(env(safe-area-inset-bottom, 0px), 10px)); left: 20px; }
        .download-btn { bottom: calc(40px + max(env(safe-area-inset-bottom, 0px), 10px)); left: 20px; transform: none; }
        
        .social-buttons {
          position: absolute;
          bottom: calc(40px + max(env(safe-area-inset-bottom, 0px), 10px));
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 100;
        }
        
        .social-buttons-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .expand-btn {
          display: none;
        }
        
        .social-btn {
          position: relative;
          bottom: auto;
          right: auto;
        }
        
        .social-buttons-list .social-btn {
          position: relative;
        }
        
        .call-btn {
          background: rgba(34, 197, 94, 0.2) !important;
          border-color: rgba(34, 197, 94, 0.4) !important;
        }
        
        .card-container.dark .call-btn:hover {
          background: rgba(34, 197, 94, 0.3) !important;
          border-color: rgba(34, 197, 94, 0.5) !important;
        }
        
        .card-container.light .call-btn {
          background: rgba(22, 163, 74, 0.15) !important;
          border-color: rgba(22, 163, 74, 0.4) !important;
        }
        
        .text-btn {
          background: rgba(168, 85, 247, 0.2) !important;
          border-color: rgba(168, 85, 247, 0.4) !important;
        }
        
        .card-container.dark .text-btn:hover {
          background: rgba(168, 85, 247, 0.3) !important;
          border-color: rgba(168, 85, 247, 0.5) !important;
        }
        
        .card-container.light .text-btn {
          background: rgba(147, 51, 234, 0.15) !important;
          border-color: rgba(147, 51, 234, 0.4) !important;
        }
        
        .email-btn {
          background: rgba(59, 130, 246, 0.2) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
        }
        
        .card-container.dark .email-btn:hover {
          background: rgba(59, 130, 246, 0.3) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        
        .card-container.light .email-btn {
          background: rgba(37, 99, 235, 0.15) !important;
          border-color: rgba(37, 99, 235, 0.4) !important;
        }
        
        .website-btn {
          background: rgba(6, 182, 212, 0.2) !important;
          border-color: rgba(6, 182, 212, 0.4) !important;
        }
        
        .card-container.dark .website-btn:hover {
          background: rgba(6, 182, 212, 0.3) !important;
          border-color: rgba(6, 182, 212, 0.5) !important;
        }
        
        .card-container.light .website-btn {
          background: rgba(8, 145, 178, 0.15) !important;
          border-color: rgba(8, 145, 178, 0.4) !important;
        }
        
        .card-container.dark .download-btn.saved {
          background: rgba(0,255,136,0.2);
          border-color: rgba(0,255,136,0.3);
          color: #00ff88;
        }
        
        .card-container.light .download-btn.saved {
          background: rgba(5,150,105,0.2);
          border-color: rgba(5,150,105,0.3);
          color: #059669;
        }
        
        @media (max-width: 480px) {
          .card-btn {
            padding: 5px 8px;
            font-size: 10px;
            border-radius: 12px;
            gap: 3px;
          }
          
          .card-btn .btn-icon { font-size: 9px; }
          .card-btn .btn-icon svg { width: 10px; height: 10px; }
          
          .top-left-buttons { top: 8px; left: 8px; gap: 6px; }
          .download-btn { bottom: calc(35px + max(env(safe-area-inset-bottom, 0px), 10px)); }
          .print-btn { top: 40px; right: 8px; }
          .share-btn { bottom: calc(70px + max(env(safe-area-inset-bottom, 0px), 10px)); left: 15px; }
          .social-buttons { bottom: calc(35px + max(env(safe-area-inset-bottom, 0px), 10px)); right: 15px; gap: 6px; }
          
          .expand-btn {
            display: flex !important;
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(168, 85, 247, 0.25)) !important;
            border-color: rgba(0, 212, 255, 0.5) !important;
          }
          
          .card-container.light .expand-btn {
            background: linear-gradient(135deg, rgba(0, 150, 200, 0.2), rgba(147, 51, 234, 0.2)) !important;
            border-color: rgba(0, 150, 200, 0.5) !important;
          }
          
          .social-buttons.collapsed .social-buttons-list {
            display: none;
          }
          
          .social-buttons.expanded .social-buttons-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            animation: slideIn 0.2s ease-out;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .card-title-area { max-width: calc(100% - 180px); }
          .card-title-area h3 { font-size: 10px; letter-spacing: 1.5px; max-width: 100%; }
          .card-title-area p { font-size: 9px; max-width: 100%; }
        }
        
        @media (max-width: 360px) {
          .card-title-area { max-width: calc(100% - 160px); }
          .card-title-area h3 { font-size: 8px; letter-spacing: 1px; }
          .print-btn { top: 45px; right: 10px; }
          .social-buttons { bottom: calc(35px + max(env(safe-area-inset-bottom, 0px), 10px)); right: 10px; }
          .top-left-buttons { gap: 4px; }
          
          .social-buttons.expanded .social-buttons-list {
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}