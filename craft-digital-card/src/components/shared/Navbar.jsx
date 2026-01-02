import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, hasUsername, username, openAuthModal, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isEditorPage = location.pathname === '/edit';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle resize - close menu and track mobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateClick = () => {
    if (isAuthenticated && hasUsername) {
      navigate('/edit');
    } else {
      openAuthModal();
    }
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(16px, 5vw, 48px)',
        background: scrolled || menuOpen ? 'rgba(8, 8, 12, 0.95)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 212, 255, 0.25)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <line x1="6" y1="9" x2="14" y2="9" />
              <line x1="6" y1="13" x2="10" y2="13" />
            </svg>
          </div>
          <span style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '-0.5px',
          }}>
            CardCraft
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <div style={{ width: '100px', height: '36px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.05)' }} />
            ) : isAuthenticated && hasUsername ? (
              <>
                {!isEditorPage && <Link to={`/${username}`} style={styles.navLink}>My Card</Link>}
                {!isEditorPage && <Link to="/edit" style={styles.primaryBtn}>Edit Card</Link>}
                {isEditorPage && (
                  <Link to={`/${username}`} target="_blank" style={styles.navLink}>
                    View Live
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </Link>
                )}
                <button onClick={handleSignOut} style={styles.ghostBtn}>Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={openAuthModal} style={styles.navLink}>Sign In</button>
                <button onClick={handleCreateClick} style={styles.primaryBtn}>Get Started</button>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={styles.menuBtn}>
            <div style={{ ...styles.menuLine, transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <div style={{ ...styles.menuLine, opacity: menuOpen ? 0 : 1, margin: '4px 0' }} />
            <div style={{ ...styles.menuLine, transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        )}
      </nav>

      {/* Mobile Menu - Only render when mobile AND open */}
      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {isAuthenticated && hasUsername ? (
            <>
              {!isEditorPage && <Link to={`/${username}`} onClick={() => setMenuOpen(false)} style={styles.mobileLink}>My Card</Link>}
              {!isEditorPage && <Link to="/edit" onClick={() => setMenuOpen(false)} style={styles.mobilePrimaryBtn}>Edit Card</Link>}
              {isEditorPage && <Link to={`/${username}`} target="_blank" onClick={() => setMenuOpen(false)} style={styles.mobileLink}>View Live</Link>}
              <button onClick={handleSignOut} style={styles.mobileGhostBtn}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { openAuthModal(); setMenuOpen(false); }} style={styles.mobileLink}>Sign In</button>
              <button onClick={handleCreateClick} style={styles.mobilePrimaryBtn}>Get Started</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

const styles = {
  navLink: {
    padding: '8px 16px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  primaryBtn: {
    padding: '8px 18px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    border: 'none',
    color: '#000',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(0, 212, 255, 0.2)',
  },
  ghostBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  menuBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
  },
  menuLine: {
    width: '16px',
    height: '2px',
    background: '#fff',
    borderRadius: '1px',
    transition: 'all 0.2s ease',
  },
  mobileMenu: {
    position: 'fixed',
    top: '64px',
    left: '16px',
    right: '16px',
    background: 'rgba(15, 15, 20, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '12px',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  mobileLink: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  mobilePrimaryBtn: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    border: 'none',
    color: '#000',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    marginTop: '4px',
  },
  mobileGhostBtn: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
  },
};