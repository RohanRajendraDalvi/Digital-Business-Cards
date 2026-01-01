import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usePublicCard } from '../hooks/usePublicCard';
import BusinessCard from '../components/card/BusinessCard';

// Transform Firestore data to BusinessCard format
function transformToCardFormat(cardData, username) {
  if (!cardData) return null;
  const { content, materials, theme, logo } = cardData;
  const sections = content?.sections || {};

  // Determine current variant based on mode
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
    // FIXED: Pass both variants so BusinessCard can switch correctly
    darkVariant: theme?.darkVariant || 'cyber',
    lightVariant: theme?.lightVariant || 'professional',
    logoSource: logo?.source || 'glasses',
  };
}

export default function PublicCardPage() {
  const { username } = useParams();
  const { openAuthModal, isAuthenticated, hasUsername } = useAuth();
  const { cardData, loading, error, notFound } = usePublicCard(username);

  const transformedData = useMemo(() => transformToCardFormat(cardData, username), [cardData, username]);

  const handleCreateClick = () => {
    if (isAuthenticated && hasUsername) {
      window.location.href = '/edit';
    } else {
      openAuthModal();
    }
  };

  // Not found
  if (notFound) {
    return (
      <div style={styles.notFoundContainer}>
        <div style={styles.notFoundIcon}>🔍</div>
        <h1 style={styles.notFoundTitle}>Card Not Found</h1>
        <p style={styles.notFoundText}>
          The username "<strong>{username}</strong>" doesn't have a card yet
        </p>
        <div style={styles.notFoundActions}>
          <Link to="/" style={styles.secondaryBtn}>Go Home</Link>
          <button onClick={handleCreateClick} style={styles.primaryBtn}>Claim this username →</button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>Loading card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error
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
      {/* Card Area - Takes full available space */}
      <div style={styles.cardArea}>
        {transformedData && (
          <BusinessCard 
            data={transformedData} 
            showControls={true}
            showHint={true}
            showTitle={true}
            height="100%"
          />
        )}
      </div>

      {/* Floating CTA at bottom */}
      {cardData && (
        <div style={styles.ctaFloating}>
          <span style={styles.ctaText}>Want your own 3D card?</span>
          <button onClick={handleCreateClick} style={styles.ctaBtn}>Create Free →</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { 
    position: 'fixed',
    top: '60px',  // Below navbar
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
  ctaFloating: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px 10px 20px',
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '30px',
    border: '1px solid rgba(0,212,255,0.2)',
    zIndex: 50,
  },
  ctaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  ctaBtn: { 
    padding: '8px 16px', 
    borderRadius: '20px', 
    background: 'linear-gradient(135deg, #00d4ff, #0099ff)', 
    border: 'none', 
    color: '#000', 
    fontSize: '12px', 
    fontWeight: '600', 
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  
  loadingContainer: { 
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)',
  },
  spinner: { 
    width: '48px', 
    height: '48px', 
    border: '3px solid rgba(0,212,255,0.2)', 
    borderTopColor: '#00d4ff', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite',
  },
  
  notFoundContainer: { 
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)', 
    padding: '20px', 
    textAlign: 'center',
  },
  notFoundIcon: { fontSize: '64px', marginBottom: '20px' },
  notFoundTitle: { color: '#fff', fontSize: '28px', marginBottom: '10px' },
  notFoundText: { color: 'rgba(255,255,255,0.6)', marginBottom: '30px' },
  notFoundActions: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' },
  
  errorContainer: { 
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e, #0a0a0f)', 
    padding: '20px', 
    textAlign: 'center',
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: { color: '#fff', fontSize: '24px', marginBottom: '10px' },
  errorText: { color: 'rgba(255,255,255,0.6)', marginBottom: '24px' },
  
  primaryBtn: { 
    padding: '12px 24px', 
    borderRadius: '25px', 
    background: 'linear-gradient(135deg, #00d4ff, #0099ff)', 
    border: 'none', 
    color: '#000', 
    fontSize: '14px', 
    fontWeight: '600', 
    cursor: 'pointer',
  },
  secondaryBtn: { 
    padding: '12px 24px', 
    borderRadius: '25px', 
    background: 'rgba(255,255,255,0.1)', 
    color: '#fff', 
    textDecoration: 'none', 
    fontSize: '14px', 
    fontWeight: '500',
  },
};