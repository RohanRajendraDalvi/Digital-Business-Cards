import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { lightProfessional, lightWarm, lightCool, lightNature, lightRose, lightMinimal, lightLavender } from '../../config/lightTheme';
import { darkCyber, darkNeon, darkForest, darkOcean, darkSunset, darkMono, darkRoyal } from '../../config/darkTheme';
import { loadImageFromUrl } from '../../config/materials';
import { generateQRCodeImage } from '../../utils/qrcode';
import { createTextureFactory, createPrintCanvas, createPrintCanvasBack, FONT_STACK } from './cardRenderer';
import { initScene, createCard, updateTheme, setupEventHandlers, setupResizeHandler, startAnimation, dispose, createInitialState } from './cardScene';

// ============================================================================
// THEME MAPS
// ============================================================================

const darkThemes = { cyber: darkCyber, neon: darkNeon, forest: darkForest, ocean: darkOcean, sunset: darkSunset, mono: darkMono, royal: darkRoyal };
const lightThemes = { professional: lightProfessional, warm: lightWarm, cool: lightCool, nature: lightNature, rose: lightRose, minimal: lightMinimal, lavender: lightLavender };

// ============================================================================
// VCARD UTILITIES
// ============================================================================

function cleanContactData(str) {
  if (!str) return '';
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
}

function generateVCard(C) {
  const name = C.NAME || 'Contact';
  const nameParts = name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');
  let vcard = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`, `N:${lastName};${firstName};;;`, `TITLE:${C.TITLE || ''}`, `ORG:${C.ALT_TITLE || ''}`];
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

// ============================================================================
// SOCIAL PLATFORM DETECTION
// ============================================================================

function getSocialPlatform(url) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('github.com') || lower.includes('github')) return { name: 'GitHub', color: '#333' };
  if (lower.includes('linkedin.com') || lower.includes('linkedin')) return { name: 'LinkedIn', color: '#0077b5' };
  if (lower.includes('twitter.com') || lower.includes('x.com')) return { name: 'X', color: '#000' };
  if (lower.includes('instagram.com')) return { name: 'Instagram', color: '#e4405f' };
  if (lower.includes('facebook.com')) return { name: 'Facebook', color: '#1877f2' };
  if (lower.includes('youtube.com')) return { name: 'YouTube', color: '#ff0000' };
  return { name: 'Link', color: '#666' };
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_DATA = {
  NAME: 'Your Name', TITLE: 'Your Title', TAGLINE: '"Your tagline"', ALT_TITLE: 'Company', ALT_TAGLINE: 'Subtitle',
  EMAIL: 'email@example.com', PHONE: '+1 555 000 0000', LOCATION: 'Location', LINK_URL: 'example.com', ONLINE_LINKS: [],
  FRONT_SECTION_1_TITLE: 'Section 1', FRONT_SECTION_1_ITEMS: [], FRONT_SECTION_2_TITLE: 'Section 2', FRONT_SECTION_2_ITEMS: [],
  BACK_SECTION_1_TITLE: 'Contact', BACK_SECTION_2_TITLE: 'Online', BACK_SECTION_3_TITLE: 'Section 3', BACK_SECTION_3_ITEMS: [],
  BACK_SECTION_4_TITLE: 'Section 4', BACK_SECTION_4_ITEMS: [], BACK_SECTION_5_TITLE: 'Section 5', BACK_SECTION_5_ITEMS: [],
  SKILL_SET_1_TITLE: 'Skills 1', SKILL_SET_1: [], SKILL_SET_2_TITLE: 'Skills 2', SKILL_SET_2: [], SKILL_SET_3_TITLE: 'Skills 3', SKILL_SET_3: [],
  CARD_SHARE_URL: '', BUSINESS_CARD_QR_LABEL: 'SHARE', LINK_QR_LABEL: 'WEBSITE',
  UI_TITLE: 'Digital Business Card', UI_INSTRUCTIONS: 'Drag to rotate | Pinch/Scroll to zoom | Tap to flip', UI_HINT: 'Tap card to flip',
};

// ============================================================================
// ICONS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessCard({ data, showControls = true, showHint = true, showTitle = true, height = '100%', isLoggedIn = false, isOwner = false }) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const stateRef = useRef(null);
  const imagesRef = useRef({ linkQr: null, cardQr: null });
  const customLogoRef = useRef(null);
  const cleanupRef = useRef({ events: null, resize: null });

  // Theme state
  const getInitialDarkMode = () => data?.themeMode ? data.themeMode === 'dark' : true;
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [showSaved, setShowSaved] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const [rebuildKey, setRebuildKey] = useState(0);

  const triggerRebuild = useCallback(() => setRebuildKey(k => k + 1), []);

  const getTheme = useCallback((dark) => {
    const variant = dark 
      ? (data?.darkVariant || data?.themeVariant || 'cyber') 
      : (data?.lightVariant || data?.themeVariant || 'professional');
    return dark ? (darkThemes[variant] || darkCyber) : (lightThemes[variant] || lightProfessional);
  }, [data?.themeVariant, data?.darkVariant, data?.lightVariant]);

  const [currentTheme, setCurrentTheme] = useState(() => getTheme(isDark));

  useEffect(() => setCurrentTheme(getTheme(isDark)), [isDark, getTheme]);
  useEffect(() => { if (data?.themeMode) setIsDark(data.themeMode === 'dark'); }, [data?.themeMode]);

  // Card data
  const C = useMemo(() => data || DEFAULT_DATA, [data]);

  const matSettings = useMemo(() => ({
    frontPattern: data?.frontPattern || 'grid',
    backPattern: data?.backPattern || 'waves',
    frontPatternSpacing: data?.frontPatternSpacing || 40,
    backPatternSpacing: data?.backPatternSpacing || 80,
    materialPreset: data?.materialPreset || 'default',
    fontPreset: data?.fontPreset || 'modern',
    layoutPreset: data?.layoutPreset || 'default',
    logoSource: data?.logoSource || 'glasses',
    logoCustomData: data?.logoCustomData || null,
  }), [data?.frontPattern, data?.backPattern, data?.frontPatternSpacing, data?.backPatternSpacing, data?.materialPreset, data?.fontPreset, data?.layoutPreset, data?.logoSource, data?.logoCustomData]);
  
  // Particles
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 15, duration: 15 + Math.random() * 10
  })), []);

  // Social links
  const socialLinks = useMemo(() => {
    return (C.ONLINE_LINKS || []).filter(Boolean).map(link => ({ url: link, platform: getSocialPlatform(link) }));
  }, [C.ONLINE_LINKS]);

  // Load QR codes
  useEffect(() => {
    const generateQRCodes = async () => {
      const linkUrl = C.LINK_URL ? `https://${C.LINK_URL}` : null;
      const cardUrl = C.CARD_SHARE_URL || null;
      const [linkQr, cardQr] = await Promise.all([generateQRCodeImage(linkUrl), generateQRCodeImage(cardUrl)]);
      imagesRef.current = { linkQr, cardQr };
      if (threeRef.current?.isInitialized) triggerRebuild();
    };
    generateQRCodes();
  }, [C.LINK_URL, C.CARD_SHARE_URL, triggerRebuild]);

  // Load custom logo
  useEffect(() => {
    if (matSettings.logoSource === 'custom' && matSettings.logoCustomData) {
      loadImageFromUrl(matSettings.logoCustomData).then(img => {
        customLogoRef.current = img;
        if (threeRef.current?.isInitialized) triggerRebuild();
      });
    } else {
      customLogoRef.current = null;
    }
  }, [matSettings.logoSource, matSettings.logoCustomData, triggerRebuild]);

  // Trigger rebuild on data/settings change
  useEffect(() => {
    if (threeRef.current?.isInitialized) triggerRebuild();
  }, [C, matSettings, triggerRebuild]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Initialize
    const W = container.clientWidth, H = container.clientHeight;
    const isPortrait = W / H < 1.4;
    
    threeRef.current = initScene(container);
    stateRef.current = createInitialState(isPortrait);

    // Setup event handlers
    cleanupRef.current.events = setupEventHandlers(container, stateRef.current, threeRef.current);

    // Setup resize handler
    cleanupRef.current.resize = setupResizeHandler(container, threeRef.current, stateRef.current, () => triggerRebuild());

    // Start animation
    startAnimation(threeRef.current, stateRef.current);

    // Initial build
    triggerRebuild();

    return () => {
      cleanupRef.current.events?.();
      cleanupRef.current.resize?.();
      if (threeRef.current) dispose(threeRef.current);
    };
  }, [triggerRebuild]);

  // Rebuild card on theme/settings/data change
  useEffect(() => {
    const three = threeRef.current;
    const state = stateRef.current;
    if (!three?.isInitialized || !state) return;

    // Update theme (lights, orbs)
    updateTheme(three, currentTheme);

    // Rebuild card
    const frameId = requestAnimationFrame(() => {
      const factory = createTextureFactory(currentTheme, imagesRef.current, C, matSettings, customLogoRef.current);
      const textures = {
        front: state.isPortrait ? factory.createFrontPortrait() : factory.createFrontLandscape(),
        back: state.isPortrait ? factory.createBackPortrait() : factory.createBackLandscape()
      };
      createCard(three, textures, currentTheme, matSettings, state.isPortrait);
    });

    return () => cancelAnimationFrame(frameId);
  }, [currentTheme, matSettings, rebuildKey, C]);

  // Handlers
  const handleDownload = useCallback(() => {
    downloadVCard(C);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [C]);

  const handleThemeToggle = useCallback(() => setIsDark(d => !d), []);
  const handleHome = useCallback(() => { window.location.href = '/'; }, []);
  const handleEdit = useCallback(() => { window.location.href = '/edit'; }, []);
  const handleCreate = useCallback(() => { window.location.href = '/'; }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${C.NAME} - Business Card`,
      text: `${C.NAME}\n${C.TITLE}${C.ALT_TITLE ? ` at ${C.ALT_TITLE}` : ''}\n${C.EMAIL || ''}${C.PHONE ? `\n${C.PHONE}` : ''}`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); return; } catch (err) { if (err.name === 'AbortError') return; }
    }
    const contactText = `${C.NAME}\n${C.TITLE}${C.ALT_TITLE ? `\n${C.ALT_TITLE}` : ''}\n\n${C.EMAIL ? `Email: ${C.EMAIL}\n` : ''}${C.PHONE ? `Phone: ${C.PHONE}\n` : ''}${C.LINK_URL ? `Website: ${C.LINK_URL}` : ''}`;
    try { await navigator.clipboard.writeText(contactText); alert('Contact info copied!'); } catch { prompt('Copy:', contactText); }
  }, [C]);

  const handlePrint = useCallback(() => {
    const state = stateRef.current;
    const factory = createTextureFactory(currentTheme, imagesRef.current, C, matSettings, customLogoRef.current);
    const frontCanvas = createPrintCanvas(factory, state.isPortrait);
    const backCanvas = createPrintCanvasBack(factory, state.isPortrait);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow popups to print'); return; }
    
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Print - ${C.NAME}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${FONT_STACK};background:#f8f9fa;padding:40px 20px}
      .container{max-width:1000px;margin:0 auto}h1{text-align:center;color:#1a1a2e;margin-bottom:8px;font-size:24px}
      .cards{display:flex;flex-wrap:wrap;gap:32px;justify-content:center}.card-side{background:white;padding:24px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
      .card-side h2{text-align:center;color:#6b7280;margin-bottom:16px;font-size:13px;text-transform:uppercase;letter-spacing:1px}
      .card-side img{display:block;max-width:100%;border-radius:12px}.print-btn{display:block;margin:40px auto 0;padding:16px 48px;font-size:15px;font-weight:600;color:#000;background:linear-gradient(135deg,#00d4ff,#0066ff);border:none;border-radius:100px;cursor:pointer}
      @media print{body{background:white;padding:0}.print-btn,h1{display:none}.card-side{box-shadow:none;page-break-inside:avoid}}</style></head>
      <body><div class="container"><h1>Print Your Business Card</h1><div class="cards">
      <div class="card-side"><h2>Front</h2><img src="${frontCanvas}" style="width:${state.isPortrait?'350px':'500px'}"/></div>
      <div class="card-side"><h2>Back</h2><img src="${backCanvas}" style="width:${state.isPortrait?'350px':'500px'}"/></div>
      </div><button class="print-btn" onclick="window.print()">Print</button></div></body></html>`);
    printWindow.document.close();
  }, [C, currentTheme, matSettings]);

  const handleCall = useCallback(() => { if (C.PHONE) window.location.href = `tel:${C.PHONE.replace(/[^\d+]/g, '')}`; }, [C.PHONE]);
  const handleEmail = useCallback(() => { if (C.EMAIL) window.location.href = `mailto:${C.EMAIL}`; }, [C.EMAIL]);
  const handleText = useCallback(() => { if (C.PHONE) window.location.href = `sms:${C.PHONE.replace(/[^\d+]/g, '')}`; }, [C.PHONE]);
  const handleWebsite = useCallback(() => { if (C.LINK_URL) window.open(C.LINK_URL.startsWith('http') ? C.LINK_URL : `https://${C.LINK_URL}`, '_blank'); }, [C.LINK_URL]);
  const handleSocialClick = useCallback((url) => { if (url) window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'); }, []);

  const bgGradient = isDark 
    ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' 
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)';

  return (
    <div className={`card-container ${isDark ? 'dark' : 'light'}`} style={{
      height, minHeight: height === '100dvh' ? '-webkit-fill-available' : undefined,
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative', background: bgGradient, boxSizing: 'border-box',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* Particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', width: '4px', height: '4px', borderRadius: '50%',
            background: p.id % 2 ? currentTheme.particleColor : currentTheme.particleAlt,
            left: `${p.left}%`, bottom: '-10px', opacity: 0.5,
            animation: `float ${p.duration}s infinite linear`, animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="top-left-buttons">
          {isLoggedIn && <button onClick={handleHome} className="card-btn"><span className="btn-icon">{icons.home}</span><span className="btn-text">Home</span></button>}
          {isOwner ? (
            <button onClick={handleEdit} className="card-btn edit-btn"><span className="btn-icon">{icons.edit}</span><span className="btn-text">Edit</span></button>
          ) : (
            <button onClick={handleCreate} className="card-btn create-btn"><span className="btn-icon">{icons.plus}</span><span className="btn-text">Create Yours</span></button>
          )}
        </div>
      )}

      {showControls && <button onClick={handleShare} className="card-btn share-btn"><span className="btn-icon">{icons.share}</span><span className="btn-text">Share</span></button>}
      {showControls && <button onClick={handlePrint} className="card-btn print-btn"><span className="btn-icon">{icons.print}</span><span className="btn-text">Print</span></button>}
      {showControls && <button onClick={handleThemeToggle} className="card-btn theme-btn"><span className="btn-icon">{isDark ? '☀️' : '🌙'}</span><span className="btn-text">{isDark ? 'Light' : 'Dark'}</span></button>}
      {showControls && <button onClick={handleDownload} className={`card-btn download-btn ${showSaved ? 'saved' : ''}`}><span className="btn-icon">{showSaved ? icons.check : icons.contact}</span><span className="btn-text">{showSaved ? 'Saved!' : 'Add to Contacts'}</span></button>}

      {/* Title */}
      {showTitle && (
        <div className="card-title-area">
          <h3 style={{ color: currentTheme.accentPrimary }}>{C.UI_TITLE}</h3>
        </div>
      )}

      {/* Three.js Container */}
      <div ref={containerRef} style={{ width: '100%', flex: 1, cursor: 'grab', touchAction: 'none', minHeight: '300px' }} />

      {/* Hint - FIXED: Updated bottom position for iOS */}
      {showHint && (
        <div style={{ 
          position: 'absolute', 
          bottom: 'calc(25px + env(safe-area-inset-bottom, 20px))', 
          left: '50%',
          transform: 'translateX(-50%)',
          color: currentTheme.textHint, 
          fontSize: '11px', 
          animation: 'pulse 2s infinite', 
          zIndex: 10, 
          textAlign: 'center',
          padding: '0 20px',
          pointerEvents: 'none',
        }}>
          Tap to flip • Drag to rotate • Scroll to zoom
        </div>
      )}

      {/* Social Buttons */}
      {showControls && (C.PHONE || C.EMAIL || C.LINK_URL || socialLinks.length > 0) && (
        <div className={`social-buttons ${contactsExpanded ? 'expanded' : 'collapsed'}`}>
          <button onClick={() => setContactsExpanded(!contactsExpanded)} className="card-btn social-btn expand-btn" title={contactsExpanded ? 'Collapse' : 'Quick Actions'}>
            <span className="btn-icon">{contactsExpanded ? '✕' : '+'}</span><span className="btn-text">{contactsExpanded ? 'Close' : 'Actions'}</span>
          </button>
          <div className="social-buttons-list">
            {C.PHONE && <button onClick={handleCall} className="card-btn social-btn call-btn"><span className="btn-icon">{icons.phone}</span><span className="btn-text">Call</span></button>}
            {C.PHONE && <button onClick={handleText} className="card-btn social-btn text-btn"><span className="btn-icon">{icons.text}</span><span className="btn-text">Text</span></button>}
            {C.EMAIL && <button onClick={handleEmail} className="card-btn social-btn email-btn"><span className="btn-icon">{icons.email}</span><span className="btn-text">Email</span></button>}
            {C.LINK_URL && <button onClick={handleWebsite} className="card-btn social-btn website-btn"><span className="btn-icon">{icons.globe}</span><span className="btn-text">{C.LINK_QR_LABEL || 'Website'}</span></button>}
            {socialLinks.map((social, idx) => (
              <button key={idx} onClick={() => handleSocialClick(social.url)} className="card-btn social-btn"><span className="btn-icon">{icons.link}</span><span className="btn-text">{social.platform.name}</span></button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float { 0% { transform: translateY(0); opacity: 0; } 5% { opacity: 0.5; } 95% { opacity: 0.5; } 100% { transform: translateY(-110vh); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        
        .card-title-area { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 10; text-align: center; max-width: calc(100% - 240px); padding: 0 10px; overflow: hidden; }
        .card-title-area h3 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .card-btn { position: absolute; z-index: 100; display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 14px; border: none; cursor: pointer; font-size: 11px; font-weight: 500; backdrop-filter: blur(8px); transition: all 0.2s ease; font-family: inherit; -webkit-tap-highlight-color: transparent; }
        .card-btn .btn-icon { font-size: 10px; display: flex; align-items: center; justify-content: center; }
        .card-btn .btn-icon svg { width: 12px; height: 12px; }
        .card-btn .btn-text { white-space: nowrap; }
        
        .card-container.dark .card-btn { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); }
        .card-container.dark .card-btn:hover, .card-container.dark .card-btn:active { background: rgba(0,0,0,0.8); border-color: rgba(255,255,255,0.25); }
        .card-container.light .card-btn { background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); color: rgba(0,0,0,0.7); }
        .card-container.light .card-btn:hover, .card-container.light .card-btn:active { background: rgba(255,255,255,0.95); border-color: rgba(0,0,0,0.2); }
        
        .top-left-buttons { position: absolute; top: 10px; left: 10px; z-index: 100; display: flex; flex-direction: column; gap: 8px; }
        .top-left-buttons .card-btn { position: relative; }
        
        .edit-btn { background: rgba(0, 212, 255, 0.15) !important; border-color: rgba(0, 212, 255, 0.3) !important; }
        .create-btn { background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 102, 255, 0.2)) !important; border-color: rgba(0, 212, 255, 0.4) !important; }
        
        .theme-btn { top: 10px; right: 10px; }
        .print-btn { top: 45px; right: 10px; }
        
        /* ===== BOTTOM BUTTONS - iOS SAFE ===== */
        .share-btn { 
          bottom: 100px; 
          bottom: calc(100px + env(safe-area-inset-bottom, 0px)); 
          left: 20px; 
        }
        .download-btn { 
          bottom: 60px;
          bottom: calc(60px + env(safe-area-inset-bottom, 0px)); 
          left: 20px; 
        }
        .social-buttons { 
          position: absolute; 
          bottom: 60px;
          bottom: calc(60px + env(safe-area-inset-bottom, 0px)); 
          right: 20px; 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          z-index: 100; 
        }
        
        .social-buttons-list { display: flex; flex-direction: column; gap: 8px; }
        .expand-btn { display: none; }
        .social-btn { position: relative; }
        
        .call-btn { background: rgba(34, 197, 94, 0.2) !important; border-color: rgba(34, 197, 94, 0.4) !important; }
        .text-btn { background: rgba(168, 85, 247, 0.2) !important; border-color: rgba(168, 85, 247, 0.4) !important; }
        .email-btn { background: rgba(59, 130, 246, 0.2) !important; border-color: rgba(59, 130, 246, 0.4) !important; }
        .website-btn { background: rgba(6, 182, 212, 0.2) !important; border-color: rgba(6, 182, 212, 0.4) !important; }
        
        .card-container.dark .download-btn.saved { background: rgba(0,255,136,0.2); border-color: rgba(0,255,136,0.3); color: #00ff88; }
        .card-container.light .download-btn.saved { background: rgba(5,150,105,0.2); border-color: rgba(5,150,105,0.3); color: #059669; }
        
        /* ===== MOBILE SPECIFIC ===== */
        @media (max-width: 480px) {
          .card-btn { padding: 6px 10px; font-size: 10px; border-radius: 12px; gap: 3px; }
          .card-btn .btn-icon { font-size: 9px; }
          .card-btn .btn-icon svg { width: 10px; height: 10px; }
          .top-left-buttons { top: 8px; left: 8px; gap: 6px; }
          
          .download-btn { 
            bottom: 65px;
            bottom: calc(65px + env(safe-area-inset-bottom, 0px)); 
            left: 15px;
          }
          .print-btn { top: 40px; right: 8px; }
          .share-btn { 
            bottom: 105px;
            bottom: calc(105px + env(safe-area-inset-bottom, 0px)); 
            left: 15px; 
          }
          .social-buttons { 
            bottom: 65px;
            bottom: calc(65px + env(safe-area-inset-bottom, 0px)); 
            right: 15px; 
            gap: 6px; 
          }
          
          .expand-btn { display: flex !important; background: linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(168, 85, 247, 0.25)) !important; border-color: rgba(0, 212, 255, 0.5) !important; }
          .social-buttons.collapsed .social-buttons-list { display: none; }
          .social-buttons.expanded .social-buttons-list { display: flex; animation: slideIn 0.2s ease-out; }
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          
          .card-title-area { max-width: calc(100% - 180px); }
          .card-title-area h3 { font-size: 10px; letter-spacing: 1.5px; }
        }
        
        @media (max-width: 360px) {
          .card-title-area { max-width: calc(100% - 160px); }
          .card-title-area h3 { font-size: 8px; letter-spacing: 1px; }
        }
        
        /* ===== iOS SAFARI SPECIFIC FIX ===== */
        @supports (-webkit-touch-callout: none) {
          .share-btn { 
            bottom: calc(105px + env(safe-area-inset-bottom, 34px)) !important; 
          }
          .download-btn { 
            bottom: calc(65px + env(safe-area-inset-bottom, 34px)) !important; 
          }
          .social-buttons { 
            bottom: calc(65px + env(safe-area-inset-bottom, 34px)) !important; 
          }
          
          @media (max-width: 480px) {
            .share-btn { 
              bottom: calc(110px + env(safe-area-inset-bottom, 34px)) !important; 
            }
            .download-btn { 
              bottom: calc(70px + env(safe-area-inset-bottom, 34px)) !important; 
            }
            .social-buttons { 
              bottom: calc(70px + env(safe-area-inset-bottom, 34px)) !important; 
            }
          }
        }
      `}</style>
    </div>
  );
}