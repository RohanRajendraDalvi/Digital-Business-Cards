import { useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usePublicCard } from '../hooks/usePublicCard';
import BusinessCard from '../components/card/BusinessCard';

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
    LOCATION: content?.location || 'Location',
    LINK_URL: content?.linkUrl || '',
    ONLINE_LINKS: content?.onlineLinks || [],
    // Use ?? instead of || to allow empty strings
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
    LINK_QR_URL: content?.linkUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${content.linkUrl}` : '',
    LINK_QR_LABEL: content?.linkQrLabel || 'PORTFOLIO',
    BUSINESS_CARD_QR_URL: username ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}` : '',
    BUSINESS_CARD_QR_LABEL: content?.cardQrLabel || 'SHARE CARD',
    UI_TITLE: content?.uiTitle || 'Interactive Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom',
    UI_HINT: 'Tap to flip',
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
    logoCustomData: logo?.customData || null,
  };
}

export default function PublicCardPage() {
  const { username: cardUsername } = useParams();
  const { isAuthenticated, username: loggedInUsername } = useAuth();
  const { cardData, loading, error } = usePublicCard(cardUsername);

  // Check if the logged-in user is viewing their own card
  const isOwner = isAuthenticated && loggedInUsername === cardUsername;

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading card...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div style={styles.error}>
        <div style={styles.errorContent}>
          <div style={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 style={styles.errorTitle}>Card not found</h1>
          <p style={styles.errorText}>The card you're looking for doesn't exist or has been removed.</p>
          <a href="/" style={styles.errorBtn}>Go Home</a>
        </div>
      </div>
    );
  }

  const transformedData = transformToCardFormat(cardData, cardUsername);

  return (
    <div style={styles.page}>
      <BusinessCard 
        data={transformedData} 
        showControls={true} 
        showHint={true} 
        showTitle={true} 
        height="100dvh"
        isLoggedIn={isAuthenticated}
        isOwner={isOwner}
      />
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    height: '100dvh',
    minHeight: '-webkit-fill-available',
    overflow: 'hidden',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    boxSizing: 'border-box',
  },
  loading: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#08080c',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '2px solid rgba(0, 212, 255, 0.15)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '24px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  error: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#08080c',
    padding: '24px',
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  errorTitle: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  errorBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 28px',
    borderRadius: '100px',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    color: '#000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.25)',
  },
};