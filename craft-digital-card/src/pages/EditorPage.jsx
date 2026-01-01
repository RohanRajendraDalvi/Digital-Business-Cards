import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserCard } from '../hooks/useUserCard';
import BusinessCard from '../components/card/BusinessCard';
import { themeVariants, patternOptions, materialOptions, logoOptions } from '../config/defaultCard';

// Transform Firestore data to BusinessCard format
function transformToCardFormat(cardData, username) {
  if (!cardData) return null;
  const { content, materials, theme, logo } = cardData;
  const sections = content?.sections || {};
  
  const mode = theme?.mode || 'dark';
  const currentVariant = mode === 'dark' 
    ? (theme?.darkVariant || 'cyber')
    : (theme?.lightVariant || 'professional');
  
  return {
    NAME: content?.name || 'Your Name',
    TITLE: content?.title || 'Your Title',
    ALT_TITLE: content?.altTitle || 'Company',
    TAGLINE: content?.tagline || '"Your tagline"',
    ALT_TAGLINE: content?.altTagline || 'What drives you',
    EMAIL: content?.email || '',
    PHONE: content?.phone || '',
    LOCATION: content?.location || '📍 Location',
    LINK_URL: content?.linkUrl || '',
    ONLINE_LINKS: content?.onlineLinks || [],
    FRONT_SECTION_1_TITLE: sections.front1?.title || 'Experience',
    FRONT_SECTION_1_ITEMS: sections.front1?.items || [],
    FRONT_SECTION_2_TITLE: sections.front2?.title || 'Focus Areas',
    FRONT_SECTION_2_ITEMS: sections.front2?.items || [],
    BACK_SECTION_1_TITLE: 'CONTACT',
    BACK_SECTION_2_TITLE: 'ONLINE',
    BACK_SECTION_3_TITLE: sections.back3?.title || 'Services',
    BACK_SECTION_3_ITEMS: sections.back3?.items || [],
    BACK_SECTION_4_TITLE: sections.back4?.title || 'Interests',
    BACK_SECTION_4_ITEMS: sections.back4?.items || [],
    BACK_SECTION_5_TITLE: sections.back5?.title || 'Achievements',
    BACK_SECTION_5_ITEMS: sections.back5?.items || [],
    SKILL_SET_1_TITLE: sections.skills1?.title || 'Skills',
    SKILL_SET_1: sections.skills1?.items || [],
    SKILL_SET_2_TITLE: sections.skills2?.title || 'Tools',
    SKILL_SET_2: sections.skills2?.items || [],
    SKILL_SET_3_TITLE: sections.skills3?.title || 'Expertise',
    SKILL_SET_3: sections.skills3?.items || [],
    LINK_QR_URL: content?.linkUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${content.linkUrl}` : '',
    LINK_QR_LABEL: 'PORTFOLIO',
    BUSINESS_CARD_QR_URL: username ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}` : '',
    BUSINESS_CARD_QR_LABEL: 'SHARE CARD',
    UI_TITLE: 'Interactive Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom',
    UI_HINT: '✨ Tap to flip',
    frontPattern: materials?.frontPattern || 'grid',
    backPattern: materials?.backPattern || 'waves',
    frontPatternSpacing: materials?.frontPatternSpacing || 40,
    backPatternSpacing: materials?.backPatternSpacing || 80,
    materialPreset: materials?.preset || 'default',
    themeMode: mode,
    themeVariant: currentVariant,
    darkVariant: theme?.darkVariant || 'cyber',
    lightVariant: theme?.lightVariant || 'professional',
    logoSource: logo?.source || 'glasses',
  };
}

export default function EditorPage() {
  const { username } = useAuth();
  const { cardData, loading, saving, updateContent, updateSection, updateTheme, updateMaterials, updateLogo } = useUserCard();
  const [activeTab, setActiveTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const isResizing = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resize handlers
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
    const newWidth = clientX;
    const minWidth = 280;
    const maxWidth = window.innerWidth - 300; // Leave at least 300px for preview
    setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
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
  const currentVariant = currentMode === 'dark' 
    ? (theme.darkVariant || 'cyber') 
    : (theme.lightVariant || 'professional');

  const handleModeChange = (newMode) => {
    if (currentMode === newMode) return;
    updateTheme({ mode: newMode });
  };

  const handleVariantChange = (newVariant) => {
    if (currentMode === 'dark') {
      updateTheme({ darkVariant: newVariant });
    } else {
      updateTheme({ lightVariant: newVariant });
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>Loading your card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const content = cardData?.content || {};
  const sections = content.sections || {};
  const materials = cardData?.materials || {};
  const logo = cardData?.logo || { source: 'glasses' };

  // Mobile view
  if (isMobile) {
    return (
      <div style={styles.mobilePage}>
        <div style={styles.mobileHeader}>
          <div>
            <h2 style={styles.mobileTitle}>Edit Card</h2>
            <p style={styles.mobileSubtitle}>/{username} {saving ? '• Saving...' : '• Saved ✓'}</p>
          </div>
          <button onClick={() => setShowPreview(!showPreview)} style={styles.previewToggle}>
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>

        {showPreview ? (
          <div style={styles.mobilePreview}>
            {transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={false} height="100%" />}
          </div>
        ) : (
          <div style={styles.mobileEditor}>
            <div style={styles.mobileTabs}>
              {['profile', 'content', 'skills', 'theme', 'style'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.mobileTabActive : styles.mobileTab}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div style={styles.mobileTabContent}>
              {activeTab === 'profile' && (
                <div style={styles.section}>
                  <Input label="Name" value={content.name || ''} onChange={v => updateContent('name', v)} />
                  <Input label="Title" value={content.title || ''} onChange={v => updateContent('title', v)} />
                  <Input label="Company" value={content.altTitle || ''} onChange={v => updateContent('altTitle', v)} />
                  <Input label="Tagline" value={content.tagline || ''} onChange={v => updateContent('tagline', v)} />
                  <Input label="Email" value={content.email || ''} onChange={v => updateContent('email', v)} type="email" />
                  <Input label="Phone" value={content.phone || ''} onChange={v => updateContent('phone', v)} />
                  <Input label="Location" value={content.location || ''} onChange={v => updateContent('location', v)} />
                  <Input label="Website" value={content.linkUrl || ''} onChange={v => updateContent('linkUrl', v)} />
                  <ArrayInput label="Social Links" value={content.onlineLinks || []} onChange={v => updateContent('onlineLinks', v)} max={2} />
                </div>
              )}
              {activeTab === 'content' && (
                <div style={styles.section}>
                  <SectionEditor label="Front Section 1" section={sections.front1} onChange={v => updateSection('front1', v)} />
                  <SectionEditor label="Front Section 2" section={sections.front2} onChange={v => updateSection('front2', v)} />
                  <SectionEditor label="Back Section 3" section={sections.back3} onChange={v => updateSection('back3', v)} />
                  <SectionEditor label="Back Section 4" section={sections.back4} onChange={v => updateSection('back4', v)} />
                  <SectionEditor label="Back Section 5" section={sections.back5} onChange={v => updateSection('back5', v)} />
                </div>
              )}
              {activeTab === 'skills' && (
                <div style={styles.section}>
                  <SectionEditor label="Skill Set 1" section={sections.skills1} onChange={v => updateSection('skills1', v)} max={6} />
                  <SectionEditor label="Skill Set 2" section={sections.skills2} onChange={v => updateSection('skills2', v)} max={6} />
                  <SectionEditor label="Skill Set 3" section={sections.skills3} onChange={v => updateSection('skills3', v)} max={6} />
                </div>
              )}
              {activeTab === 'theme' && (
                <div style={styles.section}>
                  <label style={styles.label}>Mode</label>
                  <div style={styles.modeToggle}>
                    <button onClick={() => handleModeChange('dark')} style={currentMode === 'dark' ? styles.modeBtnActive : styles.modeBtn}>🌙 Dark</button>
                    <button onClick={() => handleModeChange('light')} style={currentMode === 'light' ? styles.modeBtnActive : styles.modeBtn}>☀️ Light</button>
                  </div>
                  <label style={styles.label}>Variant</label>
                  <div style={styles.variantGrid}>
                    {themeVariants[currentMode]?.map(v => (
                      <button key={v.id} onClick={() => handleVariantChange(v.id)} style={currentVariant === v.id ? styles.variantBtnActive : styles.variantBtn}>
                        <span style={{ color: '#fff', fontSize: '13px' }}>{v.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'style' && (
                <div style={styles.section}>
                  <Select label="Front Pattern" value={materials.frontPattern || 'grid'} options={patternOptions} onChange={v => updateMaterials({ frontPattern: v })} />
                  <Select label="Back Pattern" value={materials.backPattern || 'waves'} options={patternOptions} onChange={v => updateMaterials({ backPattern: v })} />
                  <Select label="Material" value={materials.preset || 'default'} options={materialOptions} onChange={v => updateMaterials({ preset: v })} />
                  <Select label="Logo Icon" value={logo.source || 'glasses'} options={logoOptions.filter(l => l.id !== 'custom')} onChange={v => updateLogo({ source: v })} />
                </div>
              )}
            </div>

            <div style={styles.mobileShareSection}>
              <button onClick={handleShare} style={styles.shareBtn}>{copied ? '✓ Copied!' : '🔗 Share Card Link'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop view with resizable sidebar
  return (
    <div ref={containerRef} style={styles.page}>
      <div style={{ ...styles.sidebar, width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Your Card</h2>
          <p style={styles.subtitle}>/{username}<span style={{ marginLeft: '8px', color: saving ? '#ffb347' : '#00ff88', fontSize: '12px' }}>{saving ? 'Saving...' : '✓ Saved'}</span></p>
        </div>

        <div style={styles.tabs}>
          {['profile', 'content', 'skills', 'theme', 'style'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? styles.tabActive : styles.tab}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'profile' && (
            <div style={styles.section}>
              <Input label="Name" value={content.name || ''} onChange={v => updateContent('name', v)} />
              <Input label="Title" value={content.title || ''} onChange={v => updateContent('title', v)} />
              <Input label="Company" value={content.altTitle || ''} onChange={v => updateContent('altTitle', v)} />
              <Input label="Tagline" value={content.tagline || ''} onChange={v => updateContent('tagline', v)} />
              <Input label="Email" value={content.email || ''} onChange={v => updateContent('email', v)} type="email" />
              <Input label="Phone" value={content.phone || ''} onChange={v => updateContent('phone', v)} />
              <Input label="Location" value={content.location || ''} onChange={v => updateContent('location', v)} />
              <Input label="Website" value={content.linkUrl || ''} onChange={v => updateContent('linkUrl', v)} />
              <ArrayInput label="Social Links" value={content.onlineLinks || []} onChange={v => updateContent('onlineLinks', v)} max={2} />
            </div>
          )}
          {activeTab === 'content' && (
            <div style={styles.section}>
              <SectionEditor label="Front Section 1" section={sections.front1} onChange={v => updateSection('front1', v)} />
              <SectionEditor label="Front Section 2" section={sections.front2} onChange={v => updateSection('front2', v)} />
              <SectionEditor label="Back Section 3" section={sections.back3} onChange={v => updateSection('back3', v)} />
              <SectionEditor label="Back Section 4" section={sections.back4} onChange={v => updateSection('back4', v)} />
              <SectionEditor label="Back Section 5" section={sections.back5} onChange={v => updateSection('back5', v)} />
            </div>
          )}
          {activeTab === 'skills' && (
            <div style={styles.section}>
              <SectionEditor label="Skill Set 1" section={sections.skills1} onChange={v => updateSection('skills1', v)} max={6} />
              <SectionEditor label="Skill Set 2" section={sections.skills2} onChange={v => updateSection('skills2', v)} max={6} />
              <SectionEditor label="Skill Set 3" section={sections.skills3} onChange={v => updateSection('skills3', v)} max={6} />
            </div>
          )}
          {activeTab === 'theme' && (
            <div style={styles.section}>
              <label style={styles.label}>Mode</label>
              <div style={styles.modeToggle}>
                <button onClick={() => handleModeChange('dark')} style={currentMode === 'dark' ? styles.modeBtnActive : styles.modeBtn}>🌙 Dark</button>
                <button onClick={() => handleModeChange('light')} style={currentMode === 'light' ? styles.modeBtnActive : styles.modeBtn}>☀️ Light</button>
              </div>
              <label style={styles.label}>Variant</label>
              <div style={styles.variantGrid}>
                {themeVariants[currentMode]?.map(v => (
                  <button key={v.id} onClick={() => handleVariantChange(v.id)} style={currentVariant === v.id ? styles.variantBtnActive : styles.variantBtn}>
                    <span style={{ color: '#fff', fontSize: '13px' }}>{v.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{v.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'style' && (
            <div style={styles.section}>
              <Select label="Front Pattern" value={materials.frontPattern || 'grid'} options={patternOptions} onChange={v => updateMaterials({ frontPattern: v })} />
              <Select label="Back Pattern" value={materials.backPattern || 'waves'} options={patternOptions} onChange={v => updateMaterials({ backPattern: v })} />
              <Select label="Material" value={materials.preset || 'default'} options={materialOptions} onChange={v => updateMaterials({ preset: v })} />
              <Select label="Logo Icon" value={logo.source || 'glasses'} options={logoOptions.filter(l => l.id !== 'custom')} onChange={v => updateLogo({ source: v })} />
            </div>
          )}
        </div>

        <div style={styles.shareSection}>
          <button onClick={handleShare} style={styles.shareBtn}>{copied ? '✓ Copied!' : '🔗 Share Card Link'}</button>
        </div>
      </div>

      {/* Resizer handle */}
      <div
        style={styles.resizer}
        onMouseDown={startResizing}
        onTouchStart={startResizing}
      >
        <div style={styles.resizerLine} />
        <div style={styles.resizerGrip}>
          <span style={styles.resizerDots}>⋮</span>
        </div>
        <div style={styles.resizerLine} />
      </div>

      <div style={styles.preview}>
        {transformedData && <BusinessCard data={transformedData} showControls={false} showHint={true} showTitle={true} height="100%" />}
      </div>
    </div>
  );
}

// Helper Components
function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={styles.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={styles.input} />
    </div>
  );
}

function ArrayInput({ label, value, onChange, max = 5 }) {
  const update = (i, v) => { const a = [...value]; a[i] = v; onChange(a); };
  const add = () => value.length < max && onChange([...value, '']);
  const remove = i => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={styles.label}>{label}</label>}
      {value.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
          <input value={v} onChange={e => update(i, e.target.value)} style={styles.inputFlex} />
          <button onClick={() => remove(i)} style={styles.removeBtn}>×</button>
        </div>
      ))}
      {value.length < max && <button onClick={add} style={styles.addBtn}>+ Add</button>}
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
    <div style={{ marginBottom: '12px' }}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
        {options.map(o => (
          <option key={o.id} value={o.id} style={styles.option}>
            {o.name}{o.description ? ` - ${o.description}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  loading: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)' },
  spinner: { width: '48px', height: '48px', border: '3px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  
  page: { minHeight: '100vh', display: 'flex', background: '#0a0a0f', paddingTop: '60px' },
  sidebar: { background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', flexShrink: 0 },
  header: { padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  title: { color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 },
  subtitle: { color: '#00d4ff', fontSize: '14px', marginTop: '4px' },
  tabs: { display: 'flex', padding: '12px', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' },
  tab: { padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,212,255,0.2)', border: 'none', color: '#00d4ff', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabContent: { flex: 1, overflowY: 'auto', padding: '16px' },
  section: { display: 'flex', flexDirection: 'column' },
  
  // Resizer styles
  resizer: {
    width: '12px',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'col-resize',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  resizerLine: {
    flex: 1,
    width: '2px',
    background: 'rgba(255,255,255,0.1)',
  },
  resizerGrip: {
    padding: '8px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizerDots: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
    letterSpacing: '2px',
  },
  
  preview: { flex: 1, height: 'calc(100vh - 60px)', overflow: 'hidden', minWidth: '300px', position: 'relative' },

  mobilePage: { minHeight: '100vh', background: '#0a0a0f', paddingTop: '60px', display: 'flex', flexDirection: 'column' },
  mobileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  mobileTitle: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 },
  mobileSubtitle: { color: '#00d4ff', fontSize: '12px', marginTop: '2px' },
  previewToggle: { padding: '10px 16px', borderRadius: '20px', border: 'none', background: 'rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  mobilePreview: { flex: 1, minHeight: '60vh' },
  mobileEditor: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mobileTabs: { display: 'flex', padding: '10px', gap: '6px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  mobileTab: { padding: '8px 14px', borderRadius: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' },
  mobileTabActive: { padding: '8px 14px', borderRadius: '20px', background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' },
  mobileTabContent: { flex: 1, overflowY: 'auto', padding: '16px' },
  mobileShareSection: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },

  label: { color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  inputFlex: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  
  // Fixed select styles
  select: { 
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: '8px', 
    border: '1px solid rgba(255,255,255,0.15)', 
    background: '#1a1a2e', 
    color: '#fff', 
    fontSize: '14px', 
    outline: 'none', 
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    boxSizing: 'border-box',
  },
  option: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '10px',
  },
  
  removeBtn: { width: '38px', height: '38px', borderRadius: '6px', border: 'none', background: 'rgba(255,71,87,0.2)', color: '#ff6b7a', fontSize: '18px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addBtn: { padding: '8px 12px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', width: '100%' },
  sectionBox: { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' },
  sectionTitle: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#00d4ff', fontSize: '15px', fontWeight: '600', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' },
  modeToggle: { display: 'flex', gap: '8px', marginBottom: '16px' },
  modeBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' },
  modeBtnActive: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #00d4ff', background: 'rgba(0,212,255,0.2)', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  variantGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },
  variantBtn: { padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' },
  variantBtnActive: { padding: '12px', borderRadius: '10px', border: '1px solid #00d4ff', background: 'rgba(0,212,255,0.15)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' },
  shareSection: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  shareBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #0099ff)', color: '#000', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};