import { useState, useMemo } from 'react';
import { useAuth, validatePassword, PASSWORD_RULES } from '../../context/AuthContext';

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
            <strong>1. License to Use.</strong> Craft Digital Cards grants you a free, non-exclusive, revocable license to use the Service for creating and sharing digital business cards.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>2. Modifications.</strong> We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>3. User Responsibility.</strong> You are solely responsible for all content you publish through the Service.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>4. Public Information.</strong> All information you provide for your digital business card will be made publicly accessible.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>5. Prohibited Content.</strong> You may not use the Service to publish illegal, fraudulent, or objectionable content.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>6. Disclaimer.</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
          </p>
          <p>
            <strong>7. Indemnification.</strong> You agree to indemnify and hold harmless Craft Digital Cards from any claims arising from your use.
          </p>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  container: { background: '#0f0f14', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' },
  content: { padding: '24px', overflowY: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.7' },
};

// Password strength indicator component
function PasswordStrength({ password }) {
  const validation = useMemo(() => validatePassword(password), [password]);
  
  if (!password) return null;
  
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['#ff4757', '#ffa502', '#ffdd59', '#7bed9f', '#2ed573'];
  
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: i < validation.strength ? strengthColors[validation.strength] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: strengthColors[validation.strength], fontWeight: '500' }}>
          {strengthLabels[validation.strength]}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <RequirementPill met={password.length >= PASSWORD_RULES.minLength} text={`${PASSWORD_RULES.minLength}+ chars`} />
        {PASSWORD_RULES.requireUppercase && <RequirementPill met={/[A-Z]/.test(password)} text="Uppercase" />}
        {PASSWORD_RULES.requireLowercase && <RequirementPill met={/[a-z]/.test(password)} text="Lowercase" />}
        {PASSWORD_RULES.requireNumber && <RequirementPill met={/\d/.test(password)} text="Number" />}
        {PASSWORD_RULES.requireSpecial && <RequirementPill met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} text="Special" />}
      </div>
    </div>
  );
}

function RequirementPill({ met, text }) {
  return (
    <span style={{
      fontSize: '10px',
      padding: '4px 8px',
      borderRadius: '12px',
      background: met ? 'rgba(46,213,115,0.15)' : 'rgba(255,255,255,0.05)',
      color: met ? '#2ed573' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${met ? 'rgba(46,213,115,0.3)' : 'rgba(255,255,255,0.1)'}`,
      transition: 'all 0.2s',
    }}>
      {met ? '✓' : '○'} {text}
    </span>
  );
}

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    user,
    hasUsername,
  } = useAuth();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword;

  if (!authModalOpen) return null;

  // Handle closing the modal - sign out if user authenticated but no username
  const handleClose = () => {
    if (user && !hasUsername) {
      // User started auth but didn't complete username setup - sign them out
      signOut();
    }
    closeAuthModal();
    resetForm();
  };

  const handleGoogleSignIn = async () => {
    if (mode === 'signup' && !agreedToTerms) {
      setError('Please agree to the Terms of Service to continue');
      return;
    }
    setLoading(true);
    clearMessages();
    
    const result = await signInWithGoogle();
    
    if (result.success) {
      // Don't close modal here - let onAuthStateChanged handle the flow
      // The modal will close when username is set, or user will see username setup
      closeAuthModal();
      resetForm();
    } else {
      if (result.code === 'use-google') {
        setInfo(result.error);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (mode === 'signup') {
      if (!agreedToTerms) {
        setError('Please agree to the Terms of Service to continue');
        return;
      }
      if (!passwordValidation.isValid) {
        setError('Please meet all password requirements');
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match');
        return;
      }
    }
    
    setLoading(true);

    const result = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);

    if (result.success) {
      closeAuthModal();
      resetForm();
    } else {
      if (result.code === 'use-google') {
        setInfo(result.error);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess(result.message);
    } else {
      if (result.code === 'use-google') {
        setInfo(result.error);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const clearMessages = () => {
    setError('');
    setInfo('');
    setSuccess('');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreedToTerms(false);
    clearMessages();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    clearMessages();
    if (newMode !== 'signup') setAgreedToTerms(false);
  };

  const isSignupValid = mode === 'signup' 
    ? agreedToTerms && passwordValidation.isValid && passwordsMatch && email
    : true;

  return (
    <>
      {/* Removed onClick from overlay - no more backdrop click to close */}
      <div style={styles.overlay}>
        <div style={styles.modal}>
          {/* Close button - only way to close the modal */}
          <button onClick={handleClose} style={styles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your card' : 'Reset password'}
            </h2>
            <p style={styles.subtitle}>
              {mode === 'signin' ? 'Sign in to edit your card' 
                : mode === 'signup' ? 'Sign up to create your 3D business card'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Messages */}
          {error && <Message type="error" text={error} />}
          {info && <Message type="info" text={info} />}
          {success && <Message type="success" text={success} />}

          {/* Forgot Password Form */}
          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword}>
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
              
              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <p style={styles.toggleText}>
                Remember your password?{' '}
                <button type="button" onClick={() => switchMode('signin')} style={styles.toggleBtn}>
                  Sign In
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Google button */}
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ ...styles.input, paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {mode === 'signup' && <PasswordStrength password={password} />}
                </div>

                {mode === 'signup' && (
                  <div style={styles.inputGroup}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        ...styles.input,
                        borderColor: confirmPassword && !passwordsMatch 
                          ? 'rgba(255,71,87,0.5)' 
                          : confirmPassword && passwordsMatch 
                            ? 'rgba(46,213,115,0.5)' 
                            : 'rgba(255,255,255,0.1)',
                      }}
                    />
                    {confirmPassword && (
                      <p style={{ 
                        fontSize: '12px', 
                        marginTop: '6px',
                        color: passwordsMatch ? '#2ed573' : '#ff6b7a',
                      }}>
                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                )}

                {mode === 'signin' && (
                  <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <button type="button" onClick={() => switchMode('forgot')} style={styles.forgotBtn}>
                      Forgot password?
                    </button>
                  </div>
                )}

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
                        background: agreedToTerms ? '#00d4ff' : 'rgba(255,255,255,0.05)',
                        borderColor: agreedToTerms ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                      }}>
                        {agreedToTerms && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span style={styles.checkboxText}>
                        I agree to the{' '}
                        <button type="button" onClick={() => setShowTermsModal(true)} style={styles.termsLink}>
                          Terms of Service
                        </button>
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !isSignupValid)}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading || (mode === 'signup' && !isSignupValid) ? 0.5 : 1,
                    cursor: loading || (mode === 'signup' && !isSignupValid) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p style={styles.toggleText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.toggleBtn}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}

function Message({ type, text }) {
  const colors = {
    error: { bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.2)', text: '#ff6b7a' },
    info: { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)', text: '#00d4ff' },
    success: { bg: 'rgba(46,213,115,0.1)', border: 'rgba(46,213,115,0.2)', text: '#2ed573' },
  };
  const c = colors[type];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: c.text, fontSize: '13px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        {type === 'success' ? <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/> : <><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>}
      </svg>
      {text}
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#0f0f14', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: { color: '#fff', fontSize: '24px', fontWeight: '600', marginBottom: '8px', letterSpacing: '-0.5px' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 },
  socialButtons: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  socialBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
  divider: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
  inputGroup: { marginBottom: '16px' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  forgotBtn: { background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '13px', padding: 0 },
  checkboxContainer: { marginBottom: '20px' },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' },
  checkboxInput: { display: 'none' },
  checkboxCustom: { width: '20px', height: '20px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  checkboxText: { color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.4' },
  termsLink: { background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px' },
  submitBtn: { width: '100%', padding: '14px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)', color: '#000', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,212,255,0.2)' },
  toggleText: { marginTop: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' },
  toggleBtn: { background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 },
};