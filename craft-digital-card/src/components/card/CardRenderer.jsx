import { useMemo } from 'react';
import BusinessCard from './BusinessCard';

/**
 * Transform Firestore card data to BusinessCard component format
 */
function transformCardData(cardData, username) {
  if (!cardData) return null;

  const { content, theme, materials, logo } = cardData;
  const sections = content?.sections || {};

  return {
    // Profile
    NAME: content?.name || 'Your Name',
    TITLE: content?.title || 'Your Title',
    ALT_TITLE: content?.altTitle || 'Company',
    TAGLINE: content?.tagline || '"Your tagline"',
    ALT_TAGLINE: content?.altTagline || 'What drives you',
    
    // Contact
    EMAIL: content?.email || '',
    PHONE: content?.phone || '',
    LOCATION: content?.location || '📍 Location',
    LINK_URL: content?.linkUrl || '',
    ONLINE_LINKS: content?.onlineLinks || [],
    
    // Front sections
    FRONT_SECTION_1_TITLE: sections.front1?.title || 'Experience',
    FRONT_SECTION_1_ITEMS: sections.front1?.items || [],
    FRONT_SECTION_2_TITLE: sections.front2?.title || 'Focus Areas',
    FRONT_SECTION_2_ITEMS: sections.front2?.items || [],
    
    // Back sections
    BACK_SECTION_1_TITLE: 'CONTACT',
    BACK_SECTION_2_TITLE: 'ONLINE',
    BACK_SECTION_3_TITLE: sections.back3?.title || 'Services',
    BACK_SECTION_3_ITEMS: sections.back3?.items || [],
    BACK_SECTION_4_TITLE: sections.back4?.title || 'Interests',
    BACK_SECTION_4_ITEMS: sections.back4?.items || [],
    BACK_SECTION_5_TITLE: sections.back5?.title || 'Achievements',
    BACK_SECTION_5_ITEMS: sections.back5?.items || [],
    
    // Skills
    SKILL_SET_1_TITLE: sections.skills1?.title || 'Skills',
    SKILL_SET_1: sections.skills1?.items || [],
    SKILL_SET_2_TITLE: sections.skills2?.title || 'Tools',
    SKILL_SET_2: sections.skills2?.items || [],
    SKILL_SET_3_TITLE: sections.skills3?.title || 'Expertise',
    SKILL_SET_3: sections.skills3?.items || [],
    
    // QR Codes
    LINK_QR_URL: content?.linkUrl 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${content.linkUrl}`
      : '',
    LINK_QR_LABEL: 'PORTFOLIO',
    BUSINESS_CARD_QR_URL: username 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/${username}`
      : '',
    BUSINESS_CARD_QR_LABEL: 'SHARE CARD',
    
    // UI
    UI_TITLE: 'Interactive Business Card',
    UI_INSTRUCTIONS: 'Drag to rotate • Click to flip • Scroll to zoom',
    UI_HINT: '✨ Tap card to see more',
    
    // Material settings (pass through)
    frontPattern: materials?.frontPattern || 'grid',
    backPattern: materials?.backPattern || 'waves',
    frontPatternSpacing: materials?.frontPatternSpacing || 40,
    backPatternSpacing: materials?.backPatternSpacing || 80,
    materialPreset: materials?.preset || 'default',
  };
}

/**
 * CardRenderer - Wrapper that handles loading states and data transformation
 */
export default function CardRenderer({
  cardData,
  username,
  loading = false,
  error = null,
}) {
  // Transform data
  const transformedData = useMemo(() => {
    if (!cardData) return null;
    return transformCardData(cardData, username);
  }, [cardData, username]);

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading card...</p>
        </div>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>⚠️</span>
          <p style={styles.errorText}>Failed to load card</p>
          <p style={styles.errorDetail}>{error}</p>
        </div>
      </div>
    );
  }

  // No data
  if (!cardData || !transformedData) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCard}>
          <span style={styles.emptyIcon}>💳</span>
          <p style={styles.emptyText}>No card data</p>
        </div>
      </div>
    );
  }

  return <BusinessCard data={transformedData} />;
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
  },
  loadingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(0, 212, 255, 0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
  },
  errorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px',
    background: 'rgba(255, 71, 87, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 71, 87, 0.2)',
  },
  errorIcon: { fontSize: '32px' },
  errorText: { color: '#ff6b7a', fontSize: '16px', fontWeight: '500' },
  errorDetail: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: { fontSize: '48px' },
  emptyText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' },
};

const spinnerKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;