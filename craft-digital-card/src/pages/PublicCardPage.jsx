import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usePublicCard } from '../hooks/usePublicCard';
import BusinessCard from '../components/card/BusinessCard';

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
    LINK_QR_LABEL: content?.linkQrLabel || 'PORTFOLIO',
    BUSINESS_CARD_QR_URL: username ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}` : '',
    BUSINESS_CARD_QR_LABEL: content?.cardQrLabel || 'SHARE CARD',
    UI_TITLE: content?.uiTitle || 'Interactive Business Card',
    UI_INSTRUCTIONS: '',
    UI_HINT: '',
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
    // Use customData (base64), fallback to customUrl for migration
    logoCustomData: logo?.customData || logo?.customUrl || null,
  };
}

export default function PublicCardPage() {
  const { username } = useParams();
  const { openAuthModal, isAuthenticated, hasUsername } = useAuth();
  const { cardData, loading, error, notFound } = usePublicCard(username);
  const transformedData = useMemo(() => transformToCardFormat(cardData, username), [cardData, username]);

  const handleCreateClick = () => {
    if (isAuthenticated && hasUsername) window.location.href = '/edit';
    else openAuthModal();
  };

  if (notFound) {
    return (
      <div style={styles.notFoundContainer}>
        <div style={styles.notFoundIcon}>🔍</div>
        <h1 style={styles.notFoundTitle}>Card Not Found</h1>
        <p style={styles.notFoundText}>The username "<strong>{username}</strong>" doesn't have a card yet</p>
        <div style={styles.notFoundActions}>
          <Link to="/" style={styles.secondaryBtn}>Go Home</Link>
          <button onClick={handleCreateClick} style={styles.primaryBtn}>Claim this username →</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>Loading card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !notFound) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Something went wrong</h2>
        <p style={styles.errorText}>{error}</p>
        <Link to="/" style={styles.secondaryBtn}>Go Home</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Top Left CTA */}
      <button onClick={handleCreateClick} className="cta-btn" style={styles.ctaTopLeft}>
        <span className="cta-icon">✨</span>
        <span className="cta-text">Create</span>
      </button>

      {/* Card Area */}
      <div style={styles.cardArea}>
        {transformedData && (
          <BusinessCard data={transformedData} showControls={true} showHint={false} showTitle={true} height="100%" />
        )}
      </div>

      {/* Bottom Instructions */}
      <p className="instructions">Drag to rotate • Click to flip • Scroll to zoom</p>

      <style>{`
        .cta-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 14px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cta-btn:hover {
          background: rgba(0,0,0,0.7);
          border-color: rgba(255,255,255,0.25);
        }
        .cta-icon { font-size: 10px; }
        .cta-text { white-space: nowrap; }
        .instructions {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.4);
          font-size: 10px;
          margin: 0;
          text-align: center;
          z-index: 50;
          pointer-events: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        @media (max-width: 480px) {
          .cta-btn {
            padding: 5px 8px;
            font-size: 10px;
            border-radius: 12px;
            gap: 3px;
          }
          .cta-icon { font-size: 9px; }
          .instructions { font-size: 9px; bottom: 8px; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
  },
  cardArea: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  ctaTopLeft: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 50,
  },
  loadingContainer: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)',
  },
  spinner: { 
    width: '48px', height: '48px', 
    border: '3px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff', 
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  notFoundContainer: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)', 
    padding: '20px', textAlign: 'center',
  },
  notFoundIcon: { fontSize: '64px', marginBottom: '20px' },
  notFoundTitle: { color: '#fff', fontSize: '28px', marginBottom: '10px' },
  notFoundText: { color: 'rgba(255,255,255,0.6)', marginBottom: '30px' },
  notFoundActions: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' },
  errorContainer: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)', 
    padding: '20px', textAlign: 'center',
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: { color: '#fff', fontSize: '24px', marginBottom: '10px' },
  errorText: { color: 'rgba(255,255,255,0.6)', marginBottom: '24px' },
  primaryBtn: { 
    padding: '12px 24px', borderRadius: '25px', 
    background: 'linear-gradient(135deg, #00d4ff, #0099ff)', 
    border: 'none', color: '#000', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  secondaryBtn: { 
    padding: '12px 24px', borderRadius: '25px', 
    background: 'rgba(255,255,255,0.1)', 
    color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
  },
};