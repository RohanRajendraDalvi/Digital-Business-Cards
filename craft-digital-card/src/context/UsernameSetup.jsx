import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, validateUsername } from '../../context/AuthContext';

export default function UsernameSetup() {
  const {
    usernameModalOpen,
    closeUsernameModal,
    checkUsernameAvailable,
    createUserProfile,
    user,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Rate limiting for availability checks
  const lastCheckTime = useRef(0);
  const checkCount = useRef(0);
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_CHECKS_PER_WINDOW = 20;

  // Generate suggested username from email or display name
  useEffect(() => {
    if (user && !username) {
      let suggested = '';
      if (user.displayName) {
        suggested = user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      } else if (user.email) {
        suggested = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      if (suggested) {
        // Ensure it starts with a letter or number (not underscore/hyphen)
        suggested = suggested.replace(/^[^a-z0-9]+/, '');
        setUsername(suggested.slice(0, 20));
      }
    }
  }, [user, username]);

  // Debounced availability check with rate limiting
  const checkAvailability = useCallback(async (value) => {
    // Client-side validation first
    const validation = validateUsername(value);
    if (!validation.isValid) {
      setIsAvailable(null);
      setError(validation.error);
      return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastCheckTime.current > RATE_LIMIT_WINDOW) {
      checkCount.current = 0;
    }
    
    if (checkCount.current >= MAX_CHECKS_PER_WINDOW) {
      setError('Too many checks. Please wait a moment.');
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      checkCount.current++;
      lastCheckTime.current = now;
      
      const available = await checkUsernameAvailable(value);
      setIsAvailable(available);
      
      if (!available) {
        setError('This username is already taken');
      }
    } catch (err) {
      setError('Could not check availability. Please try again.');
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, [checkUsernameAvailable]);

  // Check availability when username changes (debounced)
  useEffect(() => {
    const validation = validateUsername(username);
    
    if (username.length === 0) {
      setIsAvailable(null);
      setError('');
      return;
    }
    
    if (!validation.isValid) {
      setIsAvailable(null);
      setError(validation.error);
      return;
    }

    const timer = setTimeout(() => checkAvailability(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!isAvailable) {
      setError('Please choose an available username');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await createUserProfile(username);
    
    if (!result.success) {
      setError(result.error);
      // If username was taken (race condition), reset availability
      if (result.error.toLowerCase().includes('taken')) {
        setIsAvailable(false);
      }
    }
    setLoading(false);
  };

  const handleUsernameChange = (e) => {
    // Allow letters, numbers, underscores, hyphens - but sanitize
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 30);
    
    setUsername(value);
    setIsAvailable(null);
  };

  if (!usernameModalOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.emoji}>🎉</div>
          <h2 style={styles.title}>Almost There!</h2>
          <p style={styles.subtitle}>Choose your unique card URL</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* URL Preview */}
          <div style={styles.urlPreview}>
            <span style={styles.urlLabel}>Your card will be at:</span>
            <div style={styles.urlDisplay}>
              yoursite.com/<span style={styles.urlUsername}>{username || '...'}</span>
            </div>
          </div>

          {/* Username input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="yourname"
                autoFocus
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...styles.input,
                  borderColor: error
                    ? 'rgba(255, 71, 87, 0.5)'
                    : isAvailable
                    ? 'rgba(0, 255, 136, 0.5)'
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              />
              {/* Status indicator */}
              <div style={styles.statusIndicator}>
                {isChecking && <span style={styles.checking}>⏳</span>}
                {!isChecking && isAvailable === true && <span style={styles.available}>✓</span>}
                {!isChecking && isAvailable === false && <span style={styles.unavailable}>✗</span>}
              </div>
            </div>
            
            {/* Error/hint message */}
            <div style={styles.message}>
              {error ? (
                <span style={styles.errorText}>{error}</span>
              ) : isAvailable ? (
                <span style={styles.successText}>Username is available!</span>
              ) : (
                <span style={styles.hintText}>
                  Letters, numbers, underscores, and hyphens only
                </span>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !isAvailable || !!error}
            style={{
              ...styles.submitBtn,
              background: loading || !isAvailable || error
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
              color: loading || !isAvailable || error ? 'rgba(255, 255, 255, 0.4)' : '#000',
              cursor: loading || !isAvailable || error ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create My Card →'}
          </button>
        </form>

        {/* Cancel option */}
        <p style={styles.cancelText}>
          Changed your mind?{' '}
          <button onClick={closeUsernameModal} style={styles.cancelBtn}>
            Sign out
          </button>
        </p>

        {/* Note */}
        <p style={styles.noteText}>⚠️ Username cannot be changed later</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    padding: '20px',
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '420px',
    width: '100%',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  emoji: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  title: {
    color: '#fff',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
  },
  urlPreview: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  urlLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  urlDisplay: {
    color: '#00d4ff',
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '8px',
    fontFamily: 'monospace',
  },
  urlUsername: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 45px 14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  statusIndicator: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
  },
  checking: { color: 'rgba(255, 255, 255, 0.5)' },
  available: { color: '#00ff88' },
  unavailable: { color: '#ff6b7a' },
  message: {
    marginTop: '8px',
    fontSize: '13px',
    minHeight: '18px',
  },
  errorText: { color: '#ff6b7a' },
  successText: { color: '#00ff88' },
  hintText: { color: 'rgba(255, 255, 255, 0.4)' },
  submitBtn: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  cancelText: {
    marginTop: '20px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '13px',
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
  },
  noteText: {
    marginTop: '15px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '12px',
  },
};