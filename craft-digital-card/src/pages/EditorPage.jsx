import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserCard } from '../hooks/useUserCard';
import BusinessCard from '../components/card/BusinessCard';
import LogoUploader from '../components/LogoUploader';
import { themeVariants, patternOptions, materialOptions, logoOptions } from '../config/defaultCard';

function transformToCardFormat(cardData, username) {
  if (!cardData) return null;
  const { content, materials, theme, logo } = cardData;
  const sections = content?.sections || {};
  const mode = theme?.mode || 'dark';
  const currentVariant = mode === 'dark' ? (theme?.darkVariant || 'cyber') : (theme?.lightVariant || 'professional');
  
  return {
    NAME: content?.name || 'Your Name', TITLE: content?.title || 'Your Title', ALT_TITLE: content?.altTitle || 'Company',
    TAGLINE: content?.tagline || '"Your tagline"', ALT_TAGLINE: content?.altTagline || 'What drives you',
    EMAIL: content?.email || '', PHONE: content?.phone || '', LOCATION: content?.location || 'Location',
    LINK_URL: content?.linkUrl || '', ONLINE_LINKS: content?.onlineLinks || [],
    FRONT_SECTION_1_TITLE: sections.front1?.title || 'Experience', FRONT_SECTION_1_ITEMS: sections.front1?.items || [],
    FRONT_SECTION_2_TITLE: sections.front2?.title || 'Focus Areas', FRONT_SECTION_2_ITEMS: sections.front2?.items || [],
    BACK_SECTION_1_TITLE: 'CONTACT', BACK_SECTION_2_TITLE: 'ONLINE',
    BACK_SECTION_3_TITLE: sections.back3?.title || 'Services', BACK_SECTION_3_ITEMS: sections.back3?.items || [],
    BACK_SECTION_4_TITLE: sections.back4?.title || 'Interests', BACK_SECTION_4_ITEMS: sections.back4?.items || [],
    BACK_SECTION_5_TITLE: sections.back5?.title || 'Achievements', BACK_SECTION_5_ITEMS: sections.back5?.items || [],
    SKILL_SET_1_TITLE: sections.skills1?.title || 'Skills', SKILL_SET_1: sections.skills1?.items || [],
    SKILL_SET_2_TITLE: sections.skills2?.title || 'Tools', SKILL_SET_2: sections.skills2?.items || [],
    SKILL_SET_3_TITLE: sections.skills3?.title || 'Expertise', SKILL_SET_3: sections.skills3?.items || [],
    LINK_QR_URL: content?.linkUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${content.linkUrl}` : '',
    LINK_QR_LABEL: content?.linkQrLabel || 'PORTFOLIO',
    BUSINESS_CARD_QR_URL: username ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}` : '',
    BUSINESS_CARD_QR_LABEL: content?.cardQrLabel || 'SHARE CARD',
    UI_TITLE: content?.uiTitle || 'Interactive Business Card', UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom', UI_HINT: 'Tap to flip',
    frontPattern: materials?.frontPattern || 'grid', backPattern: materials?.backPattern || 'waves',
    frontPatternSpacing: materials?.frontPatternSpacing || 40, backPatternSpacing: materials?.backPatternSpacing || 80,
    materialPreset: materials?.preset || 'default', themeMode: mode, themeVariant: currentVariant,
    darkVariant: theme?.darkVariant || 'cyber', lightVariant: theme?.lightVariant || 'professional',
    logoSource: logo?.source || 'glasses', logoCustomData: logo?.customData || logo?.customUrl || null,
  };
}

export default function EditorPage() {
  const { username } = useAuth();
  const { cardData, loading, saving, updateContent, updateSection, updateTheme, updateMaterials, updateLogo } = useUserCard();
  const [activeTab, setActiveTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setSidebarWidth(Math.max(300, Math.min(window.innerWidth - 400, clientX)));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize);
    window.addEventListener('touchend', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [resize, stopResizing]);

  const transformedData = useMemo(() => transformToCardFormat(cardData, username), [cardData, username]);

  const handleShare = async () => {
    const url = `${window.location.origin}/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert(`Your card: ${url}`);
    }
  };

  const theme = cardData?.theme || { mode: 'dark', darkVariant: 'cyber', lightVariant: 'professional' };
  const currentMode = theme.mode || 'dark';
  const currentVariant = currentMode === 'dark' ? (theme.darkVariant || 'cyber') : (theme.lightVariant || 'professional');

  const handleModeChange = (newMode) => { if (currentMode !== newMode) updateTheme({ mode: newMode }); };
  const handleVariantChange = (v) => updateTheme(currentMode === 'dark' ? { darkVariant: v } : { lightVariant: v });

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const content = cardData?.content || {};
  const sections = content.sections || {};
  const materials = cardData?.materials || {};
  const logo = cardData?.logo || { source: 'glasses' };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'content', label: 'Content' },
    { id: 'skills', label: 'Skills' },
    { id: 'theme', label: 'Theme' },
    { id: 'style', label: 'Style' },
  ];

  // Mobile View
  if (isMobile) {
    return (
      <div style={styles.mobilePage}>
        <div style={styles.mobileHeader}>
          <div>
            <h2 style={styles.mobileTitle}>Edit Card</h2>
            <p style={styles.mobileSubtitle}>/{username} <span style={{ color: saving ? '#ffb347' : '#00d4ff' }}>{saving ? '• Saving' : '• Saved'}</span></p>
          </div>
          <button onClick={() => setShowPreview(!showPreview)} style={styles.previewToggle}>
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {showPreview ? (
          <div style={styles.mobilePreview}>
            {transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={false} height="100%" />}
          </div>
        ) : (
          <div style={styles.mobileEditor}>
            <div style={styles.mobileTabs}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.mobileTabActive : styles.mobileTab}>{tab.label}</button>
              ))}
            </div>
            <div style={styles.mobileTabContent}>
              <TabContent activeTab={activeTab} content={content} sections={sections} materials={materials} logo={logo}
                currentMode={currentMode} currentVariant={currentVariant}
                updateContent={updateContent} updateSection={updateSection} updateTheme={updateTheme}
                updateMaterials={updateMaterials} updateLogo={updateLogo}
                handleModeChange={handleModeChange} handleVariantChange={handleVariantChange} />
            </div>
            <div style={styles.mobileShareSection}>
              <button onClick={handleShare} style={styles.shareBtn}>{copied ? 'Copied!' : 'Copy Card Link'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div style={styles.page}>
      <div style={{ ...styles.sidebar, width: `${sidebarWidth}px` }}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Your Card</h2>
          <p style={styles.subtitle}>/{username} <span style={{ color: saving ? '#ffb347' : '#00d4ff', marginLeft: '8px', fontSize: '12px' }}>{saving ? 'Saving...' : 'Saved'}</span></p>
        </div>

        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.tabActive : styles.tab}>{tab.label}</button>
          ))}
        </div>

        <div style={styles.tabContent}>
          <TabContent activeTab={activeTab} content={content} sections={sections} materials={materials} logo={logo}
            currentMode={currentMode} currentVariant={currentVariant}
            updateContent={updateContent} updateSection={updateSection} updateTheme={updateTheme}
            updateMaterials={updateMaterials} updateLogo={updateLogo}
            handleModeChange={handleModeChange} handleVariantChange={handleVariantChange} />
        </div>

        <div style={styles.shareSection}>
          <button onClick={handleShare} style={styles.shareBtn}>{copied ? 'Copied!' : 'Copy Card Link'}</button>
        </div>
      </div>

      <div style={styles.resizer} onMouseDown={startResizing} onTouchStart={startResizing}>
        <div style={styles.resizerGrip} />
      </div>

      <div style={styles.preview}>
        {transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={true} height="100%" />}
      </div>
    </div>
  );
}

function TabContent({ activeTab, content, sections, materials, logo, currentMode, currentVariant,
  updateContent, updateSection, updateTheme, updateMaterials, updateLogo, handleModeChange, handleVariantChange }) {
  
  if (activeTab === 'profile') return (
    <div style={styles.section}>
      <Input label="Name" value={content.name || ''} onChange={v => updateContent('name', v)} />
      <Input label="Title" value={content.title || ''} onChange={v => updateContent('title', v)} />
      <Input label="Company" value={content.altTitle || ''} onChange={v => updateContent('altTitle', v)} />
      <Input label="Tagline" value={content.tagline || ''} onChange={v => updateContent('tagline', v)} />
      <Input label="Alt Tagline" value={content.altTagline || ''} onChange={v => updateContent('altTagline', v)} placeholder="Under logo text" />
      <Input label="Email" value={content.email || ''} onChange={v => updateContent('email', v)} type="email" />
      <Input label="Phone" value={content.phone || ''} onChange={v => updateContent('phone', v)} />
      <Input label="Location" value={content.location || ''} onChange={v => updateContent('location', v)} />
      <Input label="Website" value={content.linkUrl || ''} onChange={v => updateContent('linkUrl', v)} />
      <ArrayInput label="Social Links" value={content.onlineLinks || []} onChange={v => updateContent('onlineLinks', v)} max={2} />
      <Divider />
      <SectionLabel>Card Labels</SectionLabel>
      <Input label="Card Title" value={content.uiTitle || ''} onChange={v => updateContent('uiTitle', v)} placeholder="Interactive Business Card" />
      <Input label="Share QR Label" value={content.cardQrLabel || ''} onChange={v => updateContent('cardQrLabel', v)} placeholder="SHARE CARD" />
      <Input label="Website QR Label" value={content.linkQrLabel || ''} onChange={v => updateContent('linkQrLabel', v)} placeholder="PORTFOLIO" />
    </div>
  );

  if (activeTab === 'content') return (
    <div style={styles.section}>
      <SectionEditor label="Front Section 1" section={sections.front1} onChange={v => updateSection('front1', v)} />
      <SectionEditor label="Front Section 2" section={sections.front2} onChange={v => updateSection('front2', v)} />
      <SectionEditor label="Back Section 3" section={sections.back3} onChange={v => updateSection('back3', v)} />
      <SectionEditor label="Back Section 4" section={sections.back4} onChange={v => updateSection('back4', v)} />
      <SectionEditor label="Back Section 5" section={sections.back5} onChange={v => updateSection('back5', v)} />
    </div>
  );

  if (activeTab === 'skills') return (
    <div style={styles.section}>
      <SectionEditor label="Skill Set 1" section={sections.skills1} onChange={v => updateSection('skills1', v)} max={6} />
      <SectionEditor label="Skill Set 2" section={sections.skills2} onChange={v => updateSection('skills2', v)} max={6} />
      <SectionEditor label="Skill Set 3" section={sections.skills3} onChange={v => updateSection('skills3', v)} max={6} />
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
      <Select label="Front Pattern" value={materials.frontPattern || 'grid'} options={patternOptions} onChange={v => updateMaterials({ frontPattern: v })} />
      <Select label="Back Pattern" value={materials.backPattern || 'waves'} options={patternOptions} onChange={v => updateMaterials({ backPattern: v })} />
      <Select label="Material" value={materials.preset || 'default'} options={materialOptions} onChange={v => updateMaterials({ preset: v })} />
      <Divider />
      <SectionLabel>Logo / Icon</SectionLabel>
      {logo.source !== 'custom' && (
        <Select label="Icon Preset" value={logo.source || 'glasses'} options={logoOptions.filter(l => l.id !== 'custom')} onChange={v => updateLogo({ source: v })} />
      )}
      <LogoUploader currentLogo={logo} onLogoChange={(updates) => updateLogo(updates)} />
    </div>
  );

  return null;
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={styles.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={styles.input} placeholder={placeholder} />
    </div>
  );
}

function ArrayInput({ label, value, onChange, max = 5, placeholder = '' }) {
  // Ensure value is always an array
  const items = Array.isArray(value) ? value : [];
  
  const update = (i, v) => { 
    const a = [...items]; 
    a[i] = v; 
    onChange(a); 
  };
  
  const add = () => {
    if (items.length < max) {
      onChange([...items, '']);
    }
  };
  
  const remove = i => {
    const newItems = items.filter((_, idx) => idx !== i);
    onChange(newItems);
  };
  
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && <label style={styles.label}>{label}</label>}
      {items.map((v, i) => (
        <div key={`item-${i}-${items.length}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input 
            value={v || ''} 
            onChange={e => update(i, e.target.value)} 
            style={{ ...styles.input, marginBottom: 0 }} 
            placeholder={placeholder}
          />
          <button onClick={() => remove(i)} style={styles.removeBtn} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      {items.length < max && (
        <button onClick={add} style={styles.addBtn} type="button">+ Add {label ? label.replace(/s$/, '') : 'Item'}</button>
      )}
    </div>
  );
}

function SectionEditor({ label, section, onChange, max = 5 }) {
  const s = section || { title: '', items: [] };
  return (
    <div style={styles.sectionBox}>
      <input value={s.title || ''} onChange={e => onChange({ ...s, title: e.target.value })} placeholder="Section Title" style={styles.sectionTitle} />
      <ArrayInput label="" value={s.items || []} onChange={items => onChange({ ...s, items })} max={max} />
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
  header: { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '-0.3px' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' },
  tabs: { display: 'flex', padding: '16px', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' },
  tab: { padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  tabActive: { padding: '10px 16px', borderRadius: '10px', background: 'rgba(0,212,255,0.1)', border: 'none', color: '#00d4ff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  section: { display: 'flex', flexDirection: 'column' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0 20px' },
  sectionLabel: { color: '#00d4ff', fontSize: '11px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.5px' },
  resizer: { width: '8px', background: 'transparent', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' },
  resizerGrip: { width: '4px', height: '40px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' },
  preview: { flex: 1, height: 'calc(100vh - 72px)', overflow: 'hidden', minWidth: '400px' },
  mobilePage: { minHeight: '100vh', background: '#08080c', paddingTop: '72px', display: 'flex', flexDirection: 'column' },
  mobileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  mobileTitle: { color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 },
  mobileSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' },
  previewToggle: { padding: '10px 20px', borderRadius: '24px', border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  mobilePreview: { flex: 1, minHeight: '60vh' },
  mobileEditor: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mobileTabs: { display: 'flex', padding: '12px 16px', gap: '8px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  mobileTab: { padding: '10px 18px', borderRadius: '24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  mobileTabActive: { padding: '10px 18px', borderRadius: '24px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  mobileTabContent: { flex: 1, overflowY: 'auto', padding: '20px' },
  mobileShareSection: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '500', marginBottom: '8px', display: 'block' },
  input: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  select: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f0f14', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300d4ff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '40px', boxSizing: 'border-box', fontFamily: 'inherit' },
  option: { background: '#0f0f14', color: '#fff', padding: '10px' },
  removeBtn: { width: '42px', height: '42px', borderRadius: '10px', border: 'none', background: 'rgba(255,71,87,0.1)', color: '#ff6b7a', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addBtn: { padding: '10px 14px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },
  sectionBox: { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' },
  sectionTitle: { width: '100%', padding: '10px 0', borderRadius: '0', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#00d4ff', fontSize: '14px', fontWeight: '600', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  modeToggle: { display: 'flex', gap: '8px', marginBottom: '20px' },
  modeBtn: { flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  modeBtnActive: { flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  variantGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  variantBtn: { padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'all 0.2s' },
  variantBtnActive: { padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.08)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' },
  variantName: { color: '#fff', fontSize: '13px', fontWeight: '500' },
  variantDesc: { color: 'rgba(255,255,255,0.35)', fontSize: '11px' },
  shareSection: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  shareBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)', color: '#000', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(0, 212, 255, 0.2)' },
};