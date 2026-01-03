import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Terms of Service</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={modalStyles.content}>
          <p style={{ marginBottom: '16px' }}><strong>Last Updated:</strong> January 2025</p>
          <p style={{ marginBottom: '16px' }}>
            By accessing or using Craft Digital Cards ("Service"), you agree to be bound by these Terms of Service:
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>1. License to Use.</strong> Craft Digital Cards grants you a free, non-exclusive, revocable license to use the Service for creating and sharing digital business cards. This license is subject to these Terms and may be modified or terminated at any time without prior notice.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>2. Modifications.</strong> We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, including features, functionality, and these Terms. Continued use of the Service following any changes constitutes acceptance of the modified Terms.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>3. User Responsibility.</strong> You are solely responsible for all content you publish through the Service. You agree to use the Service only for lawful purposes and in compliance with all applicable local, state, national, and international laws and regulations.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>4. Public Information.</strong> All information you provide for your digital business card will be made publicly accessible. Do not include sensitive personal information that you do not wish to be publicly available.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>5. Prohibited Content.</strong> You may not use the Service to publish content that is illegal, fraudulent, defamatory, threatening, harassing, obscene, or otherwise objectionable. We reserve the right to remove any content and terminate accounts that violate these Terms.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>6. Disclaimer of Liability.</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL LIABILITY FOR ANY DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR ANY CONTENT PUBLISHED THROUGH IT.
          </p>
          <p>
            <strong>7. Indemnification.</strong> You agree to indemnify and hold harmless Craft Digital Cards and its operators from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
          </p>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
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

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    if (mode === 'signup' && !agreedToTerms) {
      setError('Please agree to the Terms of Service to continue');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signInWithGoogle();
    if (result.success) {
      closeAuthModal();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGithubSignIn = async () => {
    if (mode === 'signup' && !agreedToTerms) {
      setError('Please agree to the Terms of Service to continue');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signInWithGithub();
    if (result.success) {
      closeAuthModal();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'signup' && !agreedToTerms) {
      setError('Please agree to the Terms of Service to continue');
      return;
    }
    
    setLoading(true);
    setError('');

    const result = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);

    if (result.success) {
      closeAuthModal();
      setEmail('');
      setPassword('');
      setAgreedToTerms(false);
    } else {
      let message = result.error;
      if (message.includes('user-not-found')) message = 'No account found with this email';
      if (message.includes('wrong-password')) message = 'Incorrect password';
      if (message.includes('email-already-in-use')) message = 'An account already exists with this email';
      if (message.includes('weak-password')) message = 'Password should be at least 6 characters';
      if (message.includes('invalid-email')) message = 'Please enter a valid email address';
      setError(message);
    }
    setLoading(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setAgreedToTerms(false);
  };

  return (
    <>
      <div onClick={handleBackdropClick} style={styles.overlay}>
        <div style={styles.modal}>
          {/* Close button */}
          <button onClick={closeAuthModal} style={styles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>
              {mode === 'signin' ? 'Welcome back' : 'Create your card'}
            </h2>
            <p style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to edit your card'
                : 'Sign up to create your 3D business card'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Social buttons */}
          <div style={styles.socialButtons}>
            <button onClick={handleGoogleSignIn} disabled={loading} style={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button onClick={handleGithubSignIn} disabled={loading} style={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit}>
            <div style={styles.inputGroup}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={styles.input}
              />
            </div>

            {/* Terms checkbox - only for signup */}
            {mode === 'signup' && (
              <div style={styles.checkboxContainer}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                  <span style={{
                    ...styles.checkboxCustom,
                    background: agreedToTerms ? '#00d4ff' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: agreedToTerms ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)',
                  }}>
                    {agreedToTerms && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span style={styles.checkboxText}>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      style={styles.termsLink}
                    >
                      Terms of Service
                    </button>
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && !agreedToTerms)}
              style={{
                ...styles.submitBtn,
                opacity: loading || (mode === 'signup' && !agreedToTerms) ? 0.5 : 1,
                cursor: loading || (mode === 'signup' && !agreedToTerms) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p style={styles.toggleText}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} style={styles.toggleBtn}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#0f0f14',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.5)',
    transition: 'all 0.2s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    margin: 0,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255, 71, 87, 0.1)',
    border: '1px solid rgba(255, 71, 87, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    color: '#ff6b7a',
    fontSize: '13px',
  },
  socialButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  inputGroup: {
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  checkboxContainer: {
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },
  checkboxInput: {
    display: 'none',
  },
  checkboxCustom: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  checkboxText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  termsLink: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    padding: 0,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    color: '#000',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(0, 212, 255, 0.2)',
  },
  toggleText: {
    marginTop: '24px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '13px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    padding: 0,
  },
};