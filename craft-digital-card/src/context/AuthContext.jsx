import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getDefaultCard } from '../config/defaultCard';

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

// Reserved usernames (must match Firestore rules)
const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'www', 'mail', 'ftp', 'root',
  'system', 'support', 'help', 'login', 'signup',
  'edit', 'settings', 'dashboard', 'account',
  'profile', 'user', 'users', 'card', 'cards',
  'new', 'create', 'delete', 'update', 'auth',
  'oauth', 'null', 'undefined'
]);

// Validate password against rules
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`At least ${PASSWORD_RULES.minLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('One number');
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password),
  };
}

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  return Math.min(4, strength);
}

// Validate username format (client-side, mirrors Firestore rules)
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }
  
  const lower = username.toLowerCase();
  
  if (lower.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  if (lower.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or less' };
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(lower)) {
    return { isValid: false, error: 'Username must start with a letter or number and contain only letters, numbers, underscores, or hyphens' };
  }
  if (RESERVED_USERNAMES.has(lower)) {
    return { isValid: false, error: 'This username is reserved' };
  }
  
  return { isValid: true, error: null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  const fetchUserData = useCallback(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const data = await fetchUserData(firebaseUser.uid);
        if (!data || !data.username) {
          setUsernameModalOpen(true);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        return { 
          success: false, 
          error: 'An account already exists with this email. Try signing in with email and password.',
          code: 'account-exists'
        };
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Sign in with email/password - reduced email enumeration
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      
      // Generic error message to prevent email enumeration
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Sign up with email/password - reduced email enumeration
  const signUpWithEmail = async (email, password) => {
    try {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Password requirements not met: ${validation.errors.join(', ')}`,
          code: 'weak-password'
        };
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign up error:', error);
      
      // Generic error to reduce email enumeration
      if (error.code === 'auth/email-already-in-use') {
        return { 
          success: false, 
          error: 'Unable to create account with this email. Try signing in instead.',
          code: 'account-exists'
        };
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Password reset - already secure with generic message
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });
      return { success: true, message: 'If an account exists, a reset link has been sent.' };
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
      if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      
      return { success: true, message: 'If an account exists, a reset link has been sent.' };
    }
  };

  const verifyResetCode = async (code) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const confirmReset = async (code, newPassword) => {
    try {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Password requirements not met: ${validation.errors.join(', ')}`
        };
      }
      
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Confirm reset error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const changePassword = async (newPassword) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    try {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Password requirements not met: ${validation.errors.join(', ')}`
        };
      }
      
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        return { 
          success: false, 
          error: 'Please sign out and sign in again before changing your password.',
          code: 'requires-reauth'
        };
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const linkGoogleAccount = async () => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential) {
        await linkWithCredential(user, credential);
        return { success: true };
      }
      
      return { success: false, error: 'Could not link account' };
    } catch (error) {
      console.error('Link Google error:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        return { success: false, error: 'This Google account is already linked to another user.' };
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const linkEmailPassword = async (email, password) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    try {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Password requirements not met: ${validation.errors.join(', ')}`
        };
      }
      
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);
      return { success: true };
    } catch (error) {
      console.error('Link email error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  const getLinkedProviders = () => {
    if (!user) return [];
    return user.providerData.map(p => p.providerId);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  // Check username availability (with client-side validation)
  const checkUsernameAvailable = async (username) => {
    // Client-side validation first
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return false;
    }
    
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // ✅ FIXED: Use transaction to prevent race condition
  const createUserProfile = async (username) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Client-side validation
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const lowerUsername = username.toLowerCase();

    try {
      // Use a transaction to atomically check and create
      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', lowerUsername);
        const usernameDoc = await transaction.get(usernameRef);
        
        if (usernameDoc.exists()) {
          throw new Error('Username is already taken');
        }

        const userRef = doc(db, 'users', user.uid);
        const existingUser = await transaction.get(userRef);
        
        if (existingUser.exists()) {
          throw new Error('User profile already exists');
        }

        const defaultCard = getDefaultCard({
          name: user.displayName || 'Your Name',
          email: user.email || '',
        });

        // Create both documents atomically
        transaction.set(usernameRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        transaction.set(userRef, {
          username: lowerUsername,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          card: defaultCard,
          stats: { views: 0, downloads: 0 },
        });
      });

      // Fetch the newly created data
      await fetchUserData(user.uid);
      setUsernameModalOpen(false);
      return { success: true };
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      
      // Handle specific transaction errors
      if (error.message === 'Username is already taken') {
        return { success: false, error: 'Username is already taken' };
      }
      if (error.message === 'User profile already exists') {
        return { success: false, error: 'Profile already exists. Please refresh the page.' };
      }
      
      return { success: false, error: 'Failed to create profile. Please try again.' };
    }
  };

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const closeUsernameModal = () => {
    if (!userData?.username) {
      signOut();
    }
    setUsernameModalOpen(false);
  };

  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    hasUsername: !!userData?.username,
    username: userData?.username,
    
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    
    resetPassword,
    verifyResetCode,
    confirmReset,
    changePassword,
    validatePassword,
    
    linkGoogleAccount,
    linkEmailPassword,
    getLinkedProviders,
    
    checkUsernameAvailable,
    createUserProfile,
    
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    usernameModalOpen,
    closeUsernameModal,
    
    refreshUserData: () => user && fetchUserData(user.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'Unable to create account. Try signing in.',
    'auth/weak-password': 'Password is too weak',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign in was cancelled',
    'auth/cancelled-popup-request': 'Sign in was cancelled',
    'auth/credential-already-in-use': 'This credential is already linked to another account',
    'auth/expired-action-code': 'This reset link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This reset link is invalid or has already been used.',
  };
  
  return messages[code] || 'An error occurred. Please try again.';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;