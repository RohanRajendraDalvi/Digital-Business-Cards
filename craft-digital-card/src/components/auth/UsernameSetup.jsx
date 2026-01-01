import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

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
        setUsername(suggested.slice(0, 20));
      }
    }
  }, [user, username]);

  // Validate username format
  const validateUsername = (value) => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-z0-9]+$/.test(value)) return 'Only lowercase letters and numbers allowed';
    if (/^[0-9]/.test(value)) return 'Username cannot start with a number';
    return null;
  };

  // Debounced availability check
  const checkAvailability = useCallback(async (value) => {
    const validationError = validateUsername(value);
    if (validationError) {
      setIsAvailable(null);
      setError(validationError);
      return;
    }

    setIsChecking(true);
    setError('');
    
    const available = await checkUsernameAvailable(value);
    setIsAvailable(available);
    setIsChecking(false);
    
    if (!available) {
      setError('This username is already taken');
    }
  }, [checkUsernameAvailable]);

  // Check availability when username changes
  useEffect(() => {
    if (username.length >= 3) {
      const timer = setTimeout(() => checkAvailability(username), 500);
      return () => clearTimeout(timer);
    } else {
      setIsAvailable(null);
      if (username.length > 0) {
        setError('Username must be at least 3 characters');
      } else {
        setError('');
      }
    }
  }, [username, checkAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAvailable) {
      setError('Please choose an available username');
      return;
    }

    setLoading(true);
    const result = await createUserProfile(username);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setUsername(value.slice(0, 20));
    setIsAvailable(null);
  };

  if (!usernameModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001, // Above auth modal
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '15px',
            }}
          >
            🎉
          </div>
          <h2
            style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            Almost There!
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
            }}
          >
            Choose your unique card URL
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* URL Preview */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              Your card will be at:
            </span>
            <div
              style={{
                color: '#00d4ff',
                fontSize: '18px',
                fontWeight: '600',
                marginTop: '8px',
                fontFamily: 'monospace',
              }}
            >
              yoursite.com/<span style={{ color: '#fff' }}>{username || '...'}</span>
            </div>
          </div>

          {/* Username input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="yourname"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 45px 14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${
                    error
                      ? 'rgba(255, 71, 87, 0.5)'
                      : isAvailable
                      ? 'rgba(0, 255, 136, 0.5)'
                      : 'rgba(255, 255, 255, 0.2)'
                  }`,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
              />
              {/* Status indicator */}
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                }}
              >
                {isChecking && (
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>⏳</span>
                )}
                {!isChecking && isAvailable === true && (
                  <span style={{ color: '#00ff88' }}>✓</span>
                )}
                {!isChecking && isAvailable === false && (
                  <span style={{ color: '#ff6b7a' }}>✗</span>
                )}
              </div>
            </div>
            
            {/* Error/hint message */}
            <div
              style={{
                marginTop: '8px',
                fontSize: '13px',
                minHeight: '18px',
              }}
            >
              {error ? (
                <span style={{ color: '#ff6b7a' }}>{error}</span>
              ) : isAvailable ? (
                <span style={{ color: '#00ff88' }}>Username is available!</span>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Lowercase letters and numbers only
                </span>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !isAvailable || !!error}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: 'none',
              background:
                loading || !isAvailable || error
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
              color: loading || !isAvailable || error ? 'rgba(255, 255, 255, 0.4)' : '#000',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !isAvailable || error ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Creating...' : 'Create My Card →'}
          </button>
        </form>

        {/* Cancel option */}
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '13px',
          }}
        >
          Changed your mind?{' '}
          <button
            onClick={closeUsernameModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            Sign out
          </button>
        </p>

        {/* Note */}
        <p
          style={{
            marginTop: '15px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '12px',
          }}
        >
          ⚠️ Username cannot be changed later
        </p>
      </div>
    </div>
  );
}