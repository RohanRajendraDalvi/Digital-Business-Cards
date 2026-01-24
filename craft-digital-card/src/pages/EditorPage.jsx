import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserCard } from '../hooks/useUserCard';
import { clearPublicCardCache } from '../hooks/usePublicCard';
import BusinessCard from '../components/card/BusinessCard';
import LogoUploader from '../components/LogoUploader';
import AIImportModal from '../components/AIImportModal';
import { themeVariants, patternOptions, materialOptions, logoOptions, fontOptions, layoutOptions, getDefaultCard } from '../config/defaultCard';
import { LIMITS } from '../utils/security';

function transformToCardFormat(cardData, username) {
  if (!cardData) return null;
  const { content, materials, theme, logo } = cardData;
  const sections = content?.sections || {};
  const mode = theme?.mode || 'dark';
  const currentVariant = mode === 'dark' ? (theme?.darkVariant || 'cyber') : (theme?.lightVariant || 'professional');
  
  return {
    NAME: content?.name || 'Your Name',
    TITLE: content?.title || 'Your Title',
    ALT_TITLE: content?.altTitle || 'Company',
    TAGLINE: content?.tagline || '"Your tagline"',
    ALT_TAGLINE: content?.altTagline || 'What drives you',
    EMAIL: content?.email || '',
    PHONE: content?.phone || '',
    LOCATION: content?.location || 'Location',
    LINK_URL: content?.linkUrl || '',
    ONLINE_LINKS: content?.onlineLinks || [],
    FRONT_SECTION_1_TITLE: sections.front1?.title ?? 'Experience',
    FRONT_SECTION_1_ITEMS: sections.front1?.items || [],
    FRONT_SECTION_2_TITLE: sections.front2?.title ?? 'Focus Areas',
    FRONT_SECTION_2_ITEMS: sections.front2?.items || [],
    BACK_SECTION_1_TITLE: 'CONTACT',
    BACK_SECTION_2_TITLE: 'ONLINE',
    BACK_SECTION_3_TITLE: sections.back3?.title ?? 'Services',
    BACK_SECTION_3_ITEMS: sections.back3?.items || [],
    BACK_SECTION_4_TITLE: sections.back4?.title ?? 'Interests',
    BACK_SECTION_4_ITEMS: sections.back4?.items || [],
    BACK_SECTION_5_TITLE: sections.back5?.title ?? 'Achievements',
    BACK_SECTION_5_ITEMS: sections.back5?.items || [],
    SKILL_SET_1_TITLE: sections.skills1?.title ?? 'Skills',
    SKILL_SET_1: sections.skills1?.items || [],
    SKILL_SET_2_TITLE: sections.skills2?.title ?? 'Tools',
    SKILL_SET_2: sections.skills2?.items || [],
    SKILL_SET_3_TITLE: sections.skills3?.title ?? 'Expertise',
    SKILL_SET_3: sections.skills3?.items || [],
    LINK_QR_LABEL: content?.linkQrLabel || 'PORTFOLIO',
    CARD_SHARE_URL: username ? `${window.location.origin}/${username}` : '',
    BUSINESS_CARD_QR_LABEL: content?.cardQrLabel || 'SHARE CARD',
    UI_TITLE: content?.uiTitle || 'Interactive Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom',
    UI_HINT: 'Tap to flip',
    frontPattern: materials?.frontPattern || 'grid',
    backPattern: materials?.backPattern || 'waves',
    frontPatternSpacing: materials?.frontPatternSpacing || 40,
    backPatternSpacing: materials?.backPatternSpacing || 80,
    materialPreset: materials?.preset || 'default',
    fontPreset: materials?.fontPreset || 'modern',
    layoutPreset: materials?.layoutPreset || 'default',
    themeMode: mode,
    themeVariant: currentVariant,
    darkVariant: theme?.darkVariant || 'cyber',
    lightVariant: theme?.lightVariant || 'professional',
    logoSource: logo?.source || 'glasses',
    logoCustomData: logo?.customData || logo?.customUrl || null,
  };
}

function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') return window.visualViewport?.height || window.innerHeight;
    return 800;
  });
  
  useEffect(() => {
    let timeoutId;
    const updateHeight = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const height = window.visualViewport?.height || window.innerHeight;
        setViewportHeight(height);
        document.documentElement.style.setProperty('--app-height', `${height}px`);
      }, 50);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateHeight);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', updateHeight);
    };
  }, []);
  
  return viewportHeight;
}

function isValidCardStructure(data) {
  if (!data || typeof data !== 'object') return false;
  // Simplified validation - trust the structure
  return true;
}

function useGuestCard() {
  const GUEST_STORAGE_KEY = 'guestCardData';
  
  const [cardData, setCardData] = useState(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidCardStructure(parsed)) return parsed;
      }
    } catch (e) { console.warn('Failed to load guest card:', e); }
    return getDefaultCard({ name: 'Your Name', email: '' });
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cardData)); }
    catch (e) { console.warn('Failed to save guest card:', e); }
  }, [cardData]);

  const updateContent = useCallback((field, value) => {
    setCardData(prev => ({ ...prev, content: { ...prev?.content, [field]: value } }));
    setHasUnsavedChanges(true);
  }, []);

  const updateSection = useCallback((sectionKey, updates) => {
    setCardData(prev => ({
      ...prev,
      content: { ...prev?.content, sections: { ...prev?.content?.sections, [sectionKey]: updates } }
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateTheme = useCallback((updates) => {
    setCardData(prev => ({ ...prev, theme: { ...prev?.theme, ...updates } }));
    setHasUnsavedChanges(true);
  }, []);

  const updateMaterials = useCallback((updates) => {
    setCardData(prev => ({ ...prev, materials: { ...prev?.materials, ...updates } }));
    setHasUnsavedChanges(true);
  }, []);

  const updateLogo = useCallback((updates) => {
    setCardData(prev => ({ ...prev, logo: { ...prev?.logo, ...updates } }));
    setHasUnsavedChanges(true);
  }, []);

  const clearGuestData = useCallback(() => {
    try { localStorage.removeItem(GUEST_STORAGE_KEY); } catch (e) {}
  }, []);

  const getCardData = useCallback(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidCardStructure(parsed)) return parsed;
      }
    } catch (e) {}
    return cardData;
  }, [cardData]);

  return { cardData, loading: false, saving: false, hasUnsavedChanges, updateContent, updateSection, updateTheme, updateMaterials, updateLogo, clearGuestData, setCardData, setHasUnsavedChanges, getCardData };
}

export default function EditorPage() {
  const { isAuthenticated, hasUsername, username, openAuthModal } = useAuth();
  
  const userCard = useUserCard();
  const guestCard = useGuestCard();
  
  const isGuestMode = !isAuthenticated || !hasUsername;
  const activeCard = isGuestMode ? guestCard : userCard;
  
  const { cardData, loading, saving, hasUnsavedChanges, updateContent, updateSection, updateTheme, updateMaterials, updateLogo } = activeCard;

  const [activeTab, setActiveTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [pendingSave, setPendingSave] = useState(false);
  const isResizing = useRef(false);
  const containerRef = useRef(null);
  const viewportHeight = useViewportHeight();

  const handleSaveAfterAuth = useCallback(async () => {
    const guestData = guestCard.getCardData();
    if (!guestData || !isValidCardStructure(guestData)) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const guestContent = guestData.content || {};
    const guestSections = guestContent.sections || {};
    const guestTheme = guestData.theme || {};
    const guestMaterials = guestData.materials || {};
    const guestLogo = guestData.logo || {};

    Object.entries(guestContent).forEach(([key, value]) => {
      if (key !== 'sections' && value !== undefined) userCard.updateContent(key, value);
    });

    Object.entries(guestSections).forEach(([sectionKey, sectionValue]) => {
      if (sectionValue) userCard.updateSection(sectionKey, sectionValue);
    });

    if (Object.keys(guestTheme).length > 0) userCard.updateTheme(guestTheme);
    if (Object.keys(guestMaterials).length > 0) userCard.updateMaterials(guestMaterials);
    if (Object.keys(guestLogo).length > 0) userCard.updateLogo(guestLogo);

    setTimeout(async () => {
      const result = await userCard.save();
      if (result.success) {
        if (username) clearPublicCardCache(username);
        setSaveStatus('saved');
        guestCard.clearGuestData();
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    }, 200);
  }, [guestCard, userCard, username]);

  useEffect(() => {
    if (pendingSave && isAuthenticated && hasUsername && !userCard.loading) {
      handleSaveAfterAuth();
      setPendingSave(false);
    }
  }, [isAuthenticated, hasUsername, pendingSave, userCard.loading, handleSaveAfterAuth]);

  useEffect(() => {
    let timeoutId;
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth < 768), 50);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', checkMobile); };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const startResizing = useCallback((e) => { isResizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; e.preventDefault(); }, []);
  const stopResizing = useCallback(() => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; }, []);
  const resize = useCallback((e) => { if (!isResizing.current) return; const clientX = e.touches ? e.touches[0].clientX : e.clientX; setSidebarWidth(Math.max(300, Math.min(window.innerWidth - 400, clientX))); }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize); window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize); window.addEventListener('touchend', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); window.removeEventListener('touchmove', resize); window.removeEventListener('touchend', stopResizing); };
  }, [resize, stopResizing]);

  const transformedData = useMemo(() => transformToCardFormat(cardData, isGuestMode ? null : username), [cardData, username, isGuestMode]);

  const handleShare = async () => {
    if (isGuestMode) { alert('Sign in and save your card first to get a shareable link!'); return; }
    const url = `${window.location.origin}/${username}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (err) { alert(`Your card: ${url}`); }
  };

  const handleSave = async () => {
    if (isGuestMode) { setPendingSave(true); openAuthModal(); return; }
    const result = await userCard.save();
    if (result.success) {
      if (username) clearPublicCardCache(username);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDiscard = async () => {
    if (window.confirm('Discard all unsaved changes?')) {
      if (isGuestMode) { guestCard.setCardData(getDefaultCard({ name: 'Your Name', email: '' })); guestCard.setHasUnsavedChanges(false); }
      else { await userCard.discardChanges(); }
    }
  };

  const content = cardData?.content || {};
  const sections = content.sections || {};

  const handleAIImport = (data, options = {}) => {
    const { replaceAll = false } = options;
    const isEmpty = (val) => { if (val === null || val === undefined) return true; if (typeof val === 'string') return val.trim() === ''; if (Array.isArray(val)) return val.length === 0; return false; };
    const isSectionEmpty = (section) => { if (!section) return true; return isEmpty(section.title) && isEmpty(section.items); };
    const contentFields = ['name', 'title', 'altTitle', 'tagline', 'altTagline', 'email', 'phone', 'location', 'linkUrl'];
    
    contentFields.forEach(field => {
      if (replaceAll) { updateContent(field, data[field] || ''); }
      else { if (data[field] && isEmpty(content[field])) { updateContent(field, data[field]); } }
    });

    if (replaceAll) { updateContent('onlineLinks', data.onlineLinks || []); }
    else if (data.onlineLinks?.length > 0 && isEmpty(content.onlineLinks)) { updateContent('onlineLinks', data.onlineLinks); }

    if (data.sections) {
      const sectionKeys = ['front1', 'front2', 'back3', 'back4', 'back5', 'skills1', 'skills2', 'skills3'];
      sectionKeys.forEach(key => {
        const aiSection = data.sections[key];
        const currentSection = sections[key];
        if (replaceAll) { updateSection(key, aiSection || { title: '', items: [] }); }
        else { if (aiSection && !isEmpty(aiSection.title) && isSectionEmpty(currentSection)) { updateSection(key, aiSection); } }
      });
    }
  };

  const theme = cardData?.theme || { mode: 'dark', darkVariant: 'cyber', lightVariant: 'professional' };
  const currentMode = theme.mode || 'dark';
  const currentVariant = currentMode === 'dark' ? (theme.darkVariant || 'cyber') : (theme.lightVariant || 'professional');
  const handleModeChange = (newMode) => { if (currentMode !== newMode) updateTheme({ mode: newMode }); };
  const handleVariantChange = (v) => updateTheme(currentMode === 'dark' ? { darkVariant: v } : { lightVariant: v });

  if (loading && !isGuestMode) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const materials = cardData?.materials || {};
  const logo = cardData?.logo || { source: 'glasses' };
  const tabs = [{ id: 'profile', label: 'Profile' }, { id: 'content', label: 'Content' }, { id: 'skills', label: 'Skills' }, { id: 'theme', label: 'Theme' }, { id: 'style', label: 'Style' }];

  const GuestBanner = () => isGuestMode ? (
    <div style={styles.guestBanner}>
      <span style={styles.guestIcon}>👋</span>
      <div>
        <strong style={styles.guestTitle}>You're editing as a guest</strong>
        <p style={styles.guestText}>Sign in when you save to keep your card permanently</p>
      </div>
    </div>
  ) : null;

  const SaveButton = ({ mobile = false }) => (
    <div style={mobile ? styles.mobileSaveSection : styles.saveSection}>
      <div style={styles.saveButtons}>
        {hasUnsavedChanges && (
          <button onClick={handleDiscard} style={{ ...styles.discardBtn, padding: mobile ? '12px 16px' : '14px 20px', fontSize: mobile ? '13px' : '14px' }} disabled={saving}>Discard</button>
        )}
        <button onClick={handleSave} style={{
          ...styles.saveBtn, padding: mobile ? '12px 16px' : '14px', fontSize: mobile ? '13px' : '14px', opacity: saving ? 0.7 : 1,
          background: saveStatus === 'saved' ? 'linear-gradient(135deg, #00c853 0%, #00a844 100%)' : saveStatus === 'error' ? 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)' : hasUnsavedChanges || isGuestMode ? 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)' : 'rgba(255,255,255,0.1)',
          color: hasUnsavedChanges || saveStatus || isGuestMode ? '#000' : 'rgba(255,255,255,0.4)',
        }} disabled={saving}>
          {saving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : isGuestMode ? 'Sign In & Save' : hasUnsavedChanges ? 'Save' : 'Saved'}
        </button>
      </div>
      {hasUnsavedChanges && !mobile && <p style={styles.unsavedHint}>You have unsaved changes</p>}
      {isGuestMode && <p style={styles.guestHint}>🔐 Sign in to save your card permanently</p>}
      {!isGuestMode && <button onClick={handleShare} style={{ ...styles.shareBtn, padding: mobile ? '10px' : '12px', fontSize: mobile ? '12px' : '13px' }}>{copied ? 'Copied!' : 'Copy Link'}</button>}
    </div>
  );

  if (isMobile) {
    const navbarHeight = 72, headerHeight = 60, tabsHeight = 54, saveHeight = showPreview ? 0 : 110;
    const guestBannerHeight = isGuestMode && !showPreview ? 70 : 0;
    const availableHeight = viewportHeight - navbarHeight - headerHeight - (showPreview ? 0 : tabsHeight) - saveHeight - guestBannerHeight;

    return (
      <div ref={containerRef} style={styles.mobilePage}>
        <div style={styles.mobileHeader}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={styles.mobileTitle}>{isGuestMode ? 'Create Your Card' : 'Edit Card'}</h2>
            <p style={styles.mobileSubtitle}>{isGuestMode ? 'Guest Mode' : `/${username}`} {hasUnsavedChanges && <span style={{ color: '#ffa94d' }}>• Unsaved</span>}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setShowAIImport(true)} style={styles.aiImportBtnMobile}>🪄</button>
            <button onClick={() => setShowPreview(!showPreview)} style={styles.previewToggle}>{showPreview ? 'Edit' : 'Preview'}</button>
          </div>
        </div>

        {showPreview ? (
          <div style={{ height: `${viewportHeight - navbarHeight - headerHeight}px`, overflow: 'hidden' }}>
            {transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={false} height="100%" />}
          </div>
        ) : (
          <>
            <GuestBanner />
            <div style={styles.mobileTabs}>
              {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.mobileTabActive : styles.mobileTab}>{tab.label}</button>))}
            </div>
            <div style={{ ...styles.mobileTabContent, height: `${availableHeight}px` }}>
              <TabContent activeTab={activeTab} content={content} sections={sections} materials={materials} logo={logo} currentMode={currentMode} currentVariant={currentVariant} updateContent={updateContent} updateSection={updateSection} updateTheme={updateTheme} updateMaterials={updateMaterials} updateLogo={updateLogo} handleModeChange={handleModeChange} handleVariantChange={handleVariantChange} />
            </div>
            <SaveButton mobile />
          </>
        )}
        <AIImportModal isOpen={showAIImport} onClose={() => setShowAIImport(false)} onImport={handleAIImport} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.sidebar, width: `${sidebarWidth}px` }}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{isGuestMode ? 'Create Your Card' : 'Edit Your Card'}</h2>
            <p style={styles.subtitle}>{isGuestMode ? 'Guest Mode' : `/${username}`} {hasUnsavedChanges && <span style={{ color: '#ffa94d', marginLeft: '8px', fontSize: '12px' }}>• Unsaved changes</span>}</p>
          </div>
          <button onClick={() => setShowAIImport(true)} style={styles.aiImportBtn}>AI Import</button>
        </div>
        <GuestBanner />
        <div style={styles.tabs}>{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.tabActive : styles.tab}>{tab.label}</button>))}</div>
        <div style={styles.tabContent}>
          <TabContent activeTab={activeTab} content={content} sections={sections} materials={materials} logo={logo} currentMode={currentMode} currentVariant={currentVariant} updateContent={updateContent} updateSection={updateSection} updateTheme={updateTheme} updateMaterials={updateMaterials} updateLogo={updateLogo} handleModeChange={handleModeChange} handleVariantChange={handleVariantChange} />
        </div>
        <SaveButton />
      </div>
      <div style={styles.resizer} onMouseDown={startResizing} onTouchStart={startResizing}><div style={styles.resizerGrip} /></div>
      <div style={styles.preview}>{transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={true} height="100%" />}</div>
      <AIImportModal isOpen={showAIImport} onClose={() => setShowAIImport(false)} onImport={handleAIImport} />
    </div>
  );
}

function TabContent({ activeTab, content, sections, materials, logo, currentMode, currentVariant, updateContent, updateSection, updateTheme, updateMaterials, updateLogo, handleModeChange, handleVariantChange }) {
  if (activeTab === 'profile') return (
    <div style={styles.section}>
      <Input label="Name" value={content.name || ''} onChange={v => updateContent('name', v)} maxLength={LIMITS.shortText} showCount />
      <Input label="Title" value={content.title || ''} onChange={v => updateContent('title', v)} maxLength={LIMITS.shortText} showCount />
      <Input label="Company" value={content.altTitle || ''} onChange={v => updateContent('altTitle', v)} maxLength={LIMITS.shortText} showCount />
      <Input label="Tagline" value={content.tagline || ''} onChange={v => updateContent('tagline', v)} maxLength={LIMITS.mediumText} showCount />
      <Input label="Alt Tagline" value={content.altTagline || ''} onChange={v => updateContent('altTagline', v)} maxLength={LIMITS.mediumText} showCount placeholder="Under logo text" />
      <Input label="Email" value={content.email || ''} onChange={v => updateContent('email', v)} maxLength={LIMITS.shortText} type="email" />
      <Input label="Phone" value={content.phone || ''} onChange={v => updateContent('phone', v)} maxLength={LIMITS.phoneLength} />
      <Input label="Location" value={content.location || ''} onChange={v => updateContent('location', v)} maxLength={LIMITS.shortText} />
      <Input label="Website" value={content.linkUrl || ''} onChange={v => updateContent('linkUrl', v)} maxLength={LIMITS.longText} showCount hint="Enter domain without https://" />
      <ArrayInput label="Social Links" value={content.onlineLinks || []} onChange={v => updateContent('onlineLinks', v)} max={LIMITS.linksMaxItems} maxItemLength={LIMITS.longText} />
      <Divider />
      <SectionLabel>Card Labels</SectionLabel>
      <Input label="Card Title" value={content.uiTitle || ''} onChange={v => updateContent('uiTitle', v)} maxLength={LIMITS.shortText} placeholder="Interactive Business Card" />
      <Input label="Share QR Label" value={content.cardQrLabel || ''} onChange={v => updateContent('cardQrLabel', v)} maxLength={LIMITS.labelLength} placeholder="SHARE CARD" />
      <Input label="Website QR Label" value={content.linkQrLabel || ''} onChange={v => updateContent('linkQrLabel', v)} maxLength={LIMITS.labelLength} placeholder="PORTFOLIO" />
    </div>
  );

  if (activeTab === 'content') return (
    <div style={styles.section}>
      <InfoBox>Each section supports up to {LIMITS.arrayMaxItems} items.</InfoBox>
      <SectionEditor label="Front Section 1" section={sections.front1} onChange={v => updateSection('front1', v)} max={LIMITS.arrayMaxItems} />
      <SectionEditor label="Front Section 2" section={sections.front2} onChange={v => updateSection('front2', v)} max={LIMITS.arrayMaxItems} />
      <SectionEditor label="Back Section 3" section={sections.back3} onChange={v => updateSection('back3', v)} max={LIMITS.arrayMaxItems} />
      <SectionEditor label="Back Section 4" section={sections.back4} onChange={v => updateSection('back4', v)} max={LIMITS.arrayMaxItems} />
      <SectionEditor label="Back Section 5" section={sections.back5} onChange={v => updateSection('back5', v)} max={LIMITS.arrayMaxItems} />
    </div>
  );

  if (activeTab === 'skills') return (
    <div style={styles.section}>
      <InfoBox>Each skill set supports up to {LIMITS.skillsMaxItems} items.</InfoBox>
      <SectionEditor label="Skill Set 1" section={sections.skills1} onChange={v => updateSection('skills1', v)} max={LIMITS.skillsMaxItems} />
      <SectionEditor label="Skill Set 2" section={sections.skills2} onChange={v => updateSection('skills2', v)} max={LIMITS.skillsMaxItems} />
      <SectionEditor label="Skill Set 3" section={sections.skills3} onChange={v => updateSection('skills3', v)} max={LIMITS.skillsMaxItems} />
    </div>
  );

  if (activeTab === 'theme') return (
    <div style={styles.section}>
      <label style={styles.label}>Mode</label>
      <div style={styles.modeToggle}>
        <button onClick={() => handleModeChange('dark')} style={currentMode === 'dark' ? styles.modeBtnActive : styles.modeBtn}>Dark</button>
        <button onClick={() => handleModeChange('light')} style={currentMode === 'light' ? styles.modeBtnActive : styles.modeBtn}>Light</button>
      </div>
      <label style={styles.label}>Color Scheme</label>
      <div style={styles.variantGrid}>
        {themeVariants[currentMode]?.map(v => (
          <button key={v.id} onClick={() => handleVariantChange(v.id)} style={currentVariant === v.id ? styles.variantBtnActive : styles.variantBtn}>
            <span style={styles.variantName}>{v.name}</span>
            <span style={styles.variantDesc}>{v.description}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (activeTab === 'style') return (
    <div style={styles.section}>
      {/* NEW: Font & Layout Selectors */}
      <SectionLabel>Typography & Layout</SectionLabel>
      <Select label="Font Style" value={materials.fontPreset || 'modern'} options={fontOptions} onChange={v => updateMaterials({ fontPreset: v })} />
      <Select label="Layout" value={materials.layoutPreset || 'default'} options={layoutOptions} onChange={v => updateMaterials({ layoutPreset: v })} />
      
      <Divider />
      <SectionLabel>Patterns & Materials</SectionLabel>
      <Select label="Front Pattern" value={materials.frontPattern || 'grid'} options={patternOptions} onChange={v => updateMaterials({ frontPattern: v })} />
      <Select label="Back Pattern" value={materials.backPattern || 'waves'} options={patternOptions} onChange={v => updateMaterials({ backPattern: v })} />
      <Select label="Material" value={materials.preset || 'default'} options={materialOptions} onChange={v => updateMaterials({ preset: v })} />
      
      <Divider />
      <SectionLabel>Logo / Icon</SectionLabel>
      <InfoBox>Custom logos: PNG, JPG, WebP, or GIF. Max size {Math.round(LIMITS.logoMaxBytes / 1024)}KB.</InfoBox>
      {logo.source !== 'custom' && (<Select label="Icon Preset" value={logo.source || 'glasses'} options={logoOptions.filter(l => l.id !== 'custom')} onChange={v => updateLogo({ source: v })} />)}
      <LogoUploader currentLogo={logo} onLogoChange={(updates) => updateLogo(updates)} />
    </div>
  );

  return null;
}

function InfoBox({ children }) { return (<div style={styles.infoBox}><span style={styles.infoIcon}>ℹ</span><span>{children}</span></div>); }

function Input({ label, value, onChange, type = 'text', placeholder = '', maxLength = LIMITS.shortText, showCount = false, hint = '' }) {
  const currentLength = (value || '').length;
  const isNearLimit = currentLength > maxLength * 0.8;
  const isAtLimit = currentLength >= maxLength;
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={styles.label}>{label}</label>
        {showCount && (<span style={{ fontSize: '11px', color: isAtLimit ? '#ff6b6b' : isNearLimit ? '#ffa94d' : 'rgba(255,255,255,0.3)' }}>{currentLength}/{maxLength}</span>)}
      </div>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value.slice(0, maxLength))} maxLength={maxLength} style={{ ...styles.input, borderColor: isAtLimit ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.1)' }} placeholder={placeholder} />
      {hint && <p style={styles.hint}>{hint}</p>}
    </div>
  );
}

function ArrayInput({ label, value, onChange, max = 5, maxItemLength = LIMITS.arrayItemText, placeholder = '' }) {
  const items = Array.isArray(value) ? value.slice(0, max) : [];
  const update = (i, v) => { const a = [...items]; a[i] = v.slice(0, maxItemLength); onChange(a); };
  const add = () => { if (items.length < max) onChange([...items, '']); };
  const remove = i => onChange(items.filter((_, idx) => idx !== i));
  
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}><label style={styles.label}>{label}</label><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{items.length}/{max}</span></div>)}
      {items.map((v, i) => (
        <div key={`item-${i}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input value={v || ''} onChange={e => update(i, e.target.value)} maxLength={maxItemLength} style={{ ...styles.input, flex: 1, marginBottom: 0 }} placeholder={placeholder} />
          <button onClick={() => remove(i)} style={styles.removeBtn} type="button">✕</button>
        </div>
      ))}
      {items.length < max && (<button onClick={add} style={styles.addBtn} type="button">+ Add Item</button>)}
    </div>
  );
}

function SectionEditor({ label, section, onChange, max = 5, maxItemLength = LIMITS.arrayItemText }) {
  const s = section || { title: '', items: [] };
  return (
    <div style={styles.sectionBox}>
      <input value={s.title || ''} onChange={e => onChange({ ...s, title: e.target.value.slice(0, LIMITS.mediumText) })} maxLength={LIMITS.mediumText} placeholder="Section Title" style={styles.sectionTitle} />
      <ArrayInput label="" value={s.items || []} onChange={items => onChange({ ...s, items })} max={max} maxItemLength={maxItemLength} />
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
        {options.map(o => <option key={o.id} value={o.id} style={styles.option}>{o.name}{o.description ? ` — ${o.description}` : ''}</option>)}
      </select>
    </div>
  );
}

function Divider() { return <div style={styles.divider} />; }
function SectionLabel({ children }) { return <label style={styles.sectionLabel}>{children}</label>; }

const styles = {
  loading: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#08080c' },
  spinner: { width: '40px', height: '40px', border: '2px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: '20px', fontSize: '14px' },
  page: { minHeight: '100vh', display: 'flex', background: '#08080c', paddingTop: '72px' },
  sidebar: { background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden', flexShrink: 0 },
  header: { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' },
  guestBanner: { display: 'flex', alignItems: 'center', gap: '12px', margin: '0 20px 16px', padding: '12px 16px', background: 'rgba(255, 171, 0, 0.1)', border: '1px solid rgba(255, 171, 0, 0.3)', borderRadius: '12px' },
  guestIcon: { fontSize: '24px', flexShrink: 0 },
  guestTitle: { color: '#ffab00', fontSize: '13px', display: 'block', marginBottom: '2px' },
  guestText: { color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 },
  guestHint: { color: '#00d4ff', fontSize: '12px', marginBottom: '12px', marginTop: '8px', textAlign: 'center', fontWeight: '500' },
  tabs: { display: 'flex', padding: '16px', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' },
  tab: { padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { padding: '10px 16px', borderRadius: '10px', background: 'rgba(0,212,255,0.1)', border: 'none', color: '#00d4ff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  section: { display: 'flex', flexDirection: 'column' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0 20px' },
  sectionLabel: { color: '#00d4ff', fontSize: '11px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.5px' },
  resizer: { width: '8px', background: 'transparent', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resizerGrip: { width: '4px', height: '40px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' },
  preview: { flex: 1, height: 'calc(100vh - 72px)', overflow: 'hidden', minWidth: '400px' },
  mobilePage: { position: 'absolute', top: '72px', left: 0, right: 0, bottom: 0, background: '#08080c', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mobileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, minHeight: '56px', gap: '8px' },
  mobileTitle: { color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 },
  mobileSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '2px' },
  previewToggle: { padding: '8px 14px', borderRadius: '16px', border: '1px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.15)', color: '#00d4ff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  mobileTabs: { display: 'flex', padding: '10px 12px', gap: '6px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, minHeight: '54px' },
  mobileTab: { padding: '8px 14px', borderRadius: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  mobileTabActive: { padding: '8px 14px', borderRadius: '20px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  mobileTabContent: { flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 },
  mobileSaveSection: { padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: '#08080c' },
  saveSection: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  saveButtons: { display: 'flex', gap: '8px', marginBottom: '8px' },
  saveBtn: { flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  discardBtn: { padding: '14px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  unsavedHint: { color: '#ffa94d', fontSize: '11px', marginBottom: '12px', textAlign: 'center' },
  shareBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  aiImportBtn: { padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  aiImportBtnMobile: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '500', marginBottom: '0', display: 'block' },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '6px', marginBottom: '0' },
  infoBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
  infoIcon: { color: '#00d4ff', fontSize: '14px', flexShrink: 0 },
  input: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f0f14', color: '#fff', fontSize: '16px', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300d4ff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '40px', boxSizing: 'border-box', fontFamily: 'inherit' },
  option: { background: '#0f0f14', color: '#fff', padding: '10px' },
  removeBtn: { width: '42px', height: '42px', borderRadius: '10px', border: 'none', background: 'rgba(255,71,87,0.1)', color: '#ff6b7a', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  addBtn: { padding: '10px 14px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },
  sectionBox: { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' },
  sectionTitle: { width: '100%', padding: '10px 0', borderRadius: '0', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#00d4ff', fontSize: '14px', fontWeight: '600', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  modeToggle: { display: 'flex', gap: '8px', marginBottom: '20px' },
  modeBtn: { flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  modeBtnActive: { flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  variantGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' },
  variantBtn: { padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' },
  variantBtnActive: { padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.08)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' },
  variantName: { color: '#fff', fontSize: '13px', fontWeight: '500' },
  variantDesc: { color: 'rgba(255,255,255,0.35)', fontSize: '11px' },
};