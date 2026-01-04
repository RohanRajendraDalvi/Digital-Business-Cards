import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import BusinessCard from '../components/card/BusinessCard';
import demoCardData from '../config/demoCard';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{title}</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={modalStyles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  container: {
    background: '#0f0f14',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    lineHeight: '1.7',
  },
};

export default function LandingPage() {
  const { isAuthenticated, hasUsername, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeModal, setActiveModal] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated && hasUsername) {
      navigate('/edit');
    } else {
      openAuthModal();
    }
  };

  // Create card data with current theme mode
  const cardDataWithTheme = {
    ...demoCardData,
    themeMode: isDarkMode ? 'dark' : 'light',
  };

  return (
    <div style={styles.page}>
      {/* Ambient Background */}
      <div style={styles.ambientBg}>
        <div style={{ ...styles.gradientOrb, ...styles.orb1, transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div style={{ ...styles.gradientOrb, ...styles.orb2, transform: `translate(${-mousePos.x * 20}px, ${-mousePos.y * 20}px)` }} />
        <div style={styles.noiseOverlay} />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section" style={styles.hero}>
        <div className="hero-content" style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Now with AI-powered resume uploads!
          </div>
          
          <h1 style={styles.headline}>
            Your digital identity,
            <br />
            <span style={styles.headlineGradient}>beautifully crafted</span>
          </h1>
          
          <p style={styles.subheadline}>
            Create stunning 3D interactive business cards that leave lasting impressions.
            <br className="desktop-only" />
            Share your story with a single link.
          </p>

          <div className="cta-group" style={styles.ctaGroup}>
            <button onClick={handleGetStarted} style={styles.primaryCta}>
              Create Your Card
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '8px' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a href="#features" style={styles.secondaryCta}>See how it works</a>
          </div>

          <div className="social-proof" style={styles.socialProof}>
            <div style={styles.avatarStack}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ ...styles.avatar, marginLeft: i > 1 ? '-10px' : 0, background: `linear-gradient(135deg, hsl(${180 + i * 30}, 80%, 60%), hsl(${200 + i * 30}, 80%, 50%))` }} />
              ))}
            </div>
            <span style={styles.socialText}>Join professionals, Have a business card</span>
          </div>
        </div>

        {/* Card Preview */}
        <div className="card-preview-section" style={styles.cardPreview}>
          <div style={styles.cardWrapper}>
            {/* Theme Toggle Button - inside card wrapper */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              style={styles.themeToggle}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</span>
              <span style={styles.themeText}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <BusinessCard 
              data={cardDataWithTheme} 
              showControls={false} 
              showHint={false} 
              showTitle={false} 
              height="100%" 
            />
          </div>
          <div style={styles.cardGlow} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything you need</h2>
          <p style={styles.sectionSubtitle}>Powerful features to make your digital presence unforgettable</p>
        </div>

        <div style={styles.featureGrid}>
          {features.map((feature, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Ready to stand out?</h2>
          <p style={styles.ctaSubtitle}>Create your professional digital business card in minutes</p>
          <button onClick={handleGetStarted} style={styles.ctaButton}>
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <line x1="6" y1="9" x2="14" y2="9" />
              <line x1="6" y1="13" x2="10" y2="13" />
            </svg>
            <span style={styles.footerLogo}>Craft Digital Cards</span>
          </div>
          <div style={styles.footerLinks}>
            <button onClick={() => setActiveModal('privacy')} style={styles.footerLink}>Privacy</button>
            <button onClick={() => setActiveModal('terms')} style={styles.footerLink}>Terms</button>
            <button onClick={() => setActiveModal('contact')} style={styles.footerLink}>Contact</button>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span style={styles.copyright}>© 2025 Craft Digital Cards. All rights reserved.</span>
        </div>
      </footer>

      {/* Privacy Modal */}
      <Modal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} title="Privacy Policy">
        <p style={{ marginBottom: '16px' }}><strong>Last Updated:</strong> January 2025</p>
        <p style={{ marginBottom: '16px' }}>
          By using Craft Digital Cards ("Service"), you acknowledge and agree to the following terms regarding your privacy and data:
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>1. Public Information.</strong> All information you provide for your digital business card, including but not limited to your name, title, contact information, professional details, and any uploaded images or logos, will be made publicly accessible via your unique Craft Digital Cards URL.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>2. Data Collection.</strong> We collect and store the information you voluntarily provide when creating and editing your business card.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>3. No Expectation of Privacy.</strong> Given the public nature of digital business cards, you should have no expectation of privacy regarding the content you publish through our Service.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>4. Third-Party Access.</strong> Your public card information may be accessed by third parties, including other users, search engines, and web crawlers.
        </p>
        <p>
          <strong>5. Data Retention.</strong> Your data will be retained for as long as your account remains active.
        </p>
      </Modal>

      {/* Terms Modal */}
      <Modal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} title="Terms of Service">
        <p style={{ marginBottom: '16px' }}><strong>Last Updated:</strong> January 2025</p>
        <p style={{ marginBottom: '16px' }}>
          By accessing or using Craft Digital Cards ("Service"), you agree to be bound by these Terms of Service.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>1. License to Use.</strong> Craft Digital Cards grants you a free, non-exclusive, revocable license to use the Service.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>2. Modifications.</strong> We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>3. User Responsibility.</strong> You are solely responsible for all content you publish through the Service.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>4. Prohibited Content.</strong> You may not use the Service to publish content that is illegal, fraudulent, or objectionable.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>5. Disclaimer of Liability.</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
        </p>
        <p>
          <strong>6. Indemnification.</strong> You agree to indemnify and hold harmless Craft Digital Cards from any claims arising from your use of the Service.
        </p>
      </Modal>

      {/* Contact Modal */}
      <Modal isOpen={activeModal === 'contact'} onClose={() => setActiveModal(null)} title="Contact Us">
        <p style={{ marginBottom: '24px' }}>
          Have questions, feedback, or need assistance? We'd love to hear from you.
        </p>
        <div style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ marginBottom: '8px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</p>
          <a href="mailto:dalvi.ro@northeastern.edu" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}>
            dalvi.ro@northeastern.edu
          </a>
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
          We typically respond within 24-48 hours.
        </p>
      </Modal>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) { .desktop-only { display: none; } }
        @media (max-width: 1100px) {
          .hero-section { flex-direction: column !important; text-align: center !important; }
          .hero-content { align-items: center !important; }
          .hero-content > div, .hero-content > p { margin-left: auto; margin-right: auto; }
          .cta-group { justify-content: center !important; }
          .social-proof { justify-content: center !important; }
          .card-preview-section { width: 100%; max-width: 450px !important; min-height: 500px; margin: 0 auto; }
        }
        @media (min-width: 1400px) {
          .card-preview-section { max-width: 700px !important; min-height: 600px !important; }
        }
        @media (min-width: 1600px) {
          .card-preview-section { max-width: 800px !important; min-height: 650px !important; }
        }
      `}</style>
    </div>
  );
}

const features = [
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, title: '3D Interactive', desc: 'Stunning three-dimensional cards with smooth animations and gestures' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/></svg>, title: 'Custom Themes', desc: 'Choose from premium dark and light themes with unique color palettes' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: 'QR Sharing', desc: 'Auto-generated QR codes for instant sharing at events and meetings' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>, title: 'One-Click Save', desc: 'Let contacts save your info directly to their phone with vCard export' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Always Updated', desc: 'Update your card anytime — contacts always see the latest info' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, title: 'Unique URL', desc: 'Get your own Craft Digital Cards/yourname link to share everywhere' },
];

const styles = {
  page: { minHeight: '100vh', background: '#08080c', color: '#fff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: 'hidden' },
  ambientBg: { position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' },
  gradientOrb: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, transition: 'transform 0.3s ease-out' },
  orb1: { width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)', top: '-200px', right: '-100px' },
  orb2: { width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)', bottom: '-150px', left: '-100px' },
  noiseOverlay: { position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` },
  
  hero: { position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(100px, 15vh, 140px) clamp(24px, 6vw, 100px)', gap: '40px', flexWrap: 'wrap' },
  heroContent: { flex: '1 1 480px', maxWidth: '580px', display: 'flex', flexDirection: 'column' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)', color: '#00d4ff', fontSize: '13px', fontWeight: '500', marginBottom: '24px' },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#00d4ff', animation: 'pulse 2s infinite' },
  headline: { fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '700', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px' },
  headlineGradient: { background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #00d4ff 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subheadline: { fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.6', marginBottom: '40px', maxWidth: '480px' },
  ctaGroup: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px', justifyContent: 'flex-start' },
  primaryCta: { display: 'inline-flex', alignItems: 'center', padding: '16px 32px', borderRadius: '100px', background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)', border: 'none', color: '#000', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)', fontFamily: 'inherit' },
  secondaryCta: { display: 'inline-flex', alignItems: 'center', padding: '16px 32px', borderRadius: '100px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.3s ease', fontFamily: 'inherit' },
  socialProof: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarStack: { display: 'flex' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #08080c' },
  socialText: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' },

  cardPreview: { flex: '1 1 500px', maxWidth: '600px', minHeight: '550px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { width: '100%', height: '550px', borderRadius: '20px', overflow: 'hidden', position: 'relative' },
  cardGlow: { position: 'absolute', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  
  themeToggle: { 
    position: 'absolute', 
    top: '15px', 
    left: '15px', 
    zIndex: 20, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    padding: '8px 14px', 
    borderRadius: '100px', 
    background: 'rgba(0, 0, 0, 0.6)', 
    border: '1px solid rgba(255, 255, 255, 0.15)', 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: '12px', 
    fontWeight: '500', 
    cursor: 'pointer', 
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  themeIcon: { fontSize: '14px' },
  themeText: { whiteSpace: 'nowrap' },

  features: { position: 'relative', zIndex: 1, padding: 'clamp(60px, 10vh, 120px) clamp(24px, 8vw, 120px)' },
  sectionHeader: { textAlign: 'center', marginBottom: '60px' },
  sectionTitle: { fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '16px' },
  sectionSubtitle: { fontSize: 'clamp(16px, 2vw, 18px)', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '500px', margin: '0 auto' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' },
  featureCard: { padding: '32px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', transition: 'all 0.3s ease' },
  featureIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#00d4ff' },
  featureTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '8px' },
  featureDesc: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.6' },

  ctaSection: { position: 'relative', zIndex: 1, padding: 'clamp(60px, 10vh, 100px) clamp(24px, 8vw, 120px)' },
  ctaCard: { maxWidth: '800px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px)', borderRadius: '32px', background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' },
  ctaTitle: { fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '700', marginBottom: '16px' },
  ctaSubtitle: { fontSize: 'clamp(16px, 2vw, 18px)', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px' },
  ctaButton: { display: 'inline-flex', alignItems: 'center', padding: '18px 40px', borderRadius: '100px', background: '#fff', border: 'none', color: '#000', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: 'inherit' },

  footer: { position: 'relative', zIndex: 1, padding: '40px clamp(24px, 8vw, 120px)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' },
  footerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' },
  footerBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  footerLogo: { fontSize: '18px', fontWeight: '600' },
  footerLinks: { display: 'flex', gap: '32px' },
  footerLink: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', textDecoration: 'none', fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s', padding: 0 },
  footerBottom: { textAlign: 'center' },
  copyright: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.3)' },
};