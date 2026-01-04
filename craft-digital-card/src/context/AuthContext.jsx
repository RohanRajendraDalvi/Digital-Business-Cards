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
  fetchSignInMethodsForEmail,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getDefaultCard } from '../config/defaultCard';

const AuthContext = createContext(null);

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Set to true if you want special chars required
};

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

// Calculate password strength (0-4)
function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  return Math.min(4, strength);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  // Fetch user data from Firestore
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

  // Listen to auth state changes
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
        const email = error.customData?.email;
        if (email) {
          return { 
            success: false, 
            error: `An account already exists with ${email}. Please sign in with your email and password first.`,
            code: 'account-exists'
          };
        }
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      
      if (error.code === 'auth/user-not-found') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
            return { 
              success: false, 
              error: 'This email is registered with Google. Please use "Continue with Google" to sign in.',
              code: 'use-google'
            };
          }
        } catch {
          // Ignore
        }
      }
      
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email, password) => {
    try {
      // Validate password
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Password requirements not met: ${validation.errors.join(', ')}`,
          code: 'weak-password'
        };
      }

      // Check if email exists with another method
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      if (methods.length > 0) {
        if (methods.includes('google.com')) {
          return { 
            success: false, 
            error: 'This email is already registered with Google. Please use "Continue with Google" to sign in.',
            code: 'use-google'
          };
        }
        if (methods.includes('password')) {
          return { 
            success: false, 
            error: 'An account already exists with this email. Please sign in instead.',
            code: 'account-exists'
          };
        }
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign up error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Replace your resetPassword function in AuthContext.js with this:

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });
      
      // Always return generic message for security (don't reveal if email exists)
      return { success: true, message: 'If an account exists, a reset link has been sent.' };
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
      
      if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      
      // For other errors, still return generic message for security
      return { success: true, message: 'If an account exists, a reset link has been sent.' };
    }
  };;

  // Verify password reset code (for custom reset page)
  const verifyResetCode = async (code) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    }
  };

  // Confirm password reset (for custom reset page)
  const confirmReset = async (code, newPassword) => {
    try {
      // Validate new password
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

  // Change password (for logged in users)
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

  // Link Google account
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

  // Link email/password
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

  // Get linked providers
  const getLinkedProviders = () => {
    if (!user) return [];
    return user.providerData.map(p => p.providerId);
  };

  // Sign out
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

  // Check username availability
  const checkUsernameAvailable = async (username) => {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Create user profile
  const createUserProfile = async (username) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const lowerUsername = username.toLowerCase();

    try {
      const isAvailable = await checkUsernameAvailable(lowerUsername);
      if (!isAvailable) {
        return { success: false, error: 'Username is already taken' };
      }

      const defaultCard = getDefaultCard({
        name: user.displayName || 'Your Name',
        email: user.email || '',
      });

      const userDocData = {
        username: lowerUsername,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        card: defaultCard,
        stats: { views: 0, downloads: 0 },
      };

      const usernameDocData = {
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(db, 'users', user.uid), userDocData),
        setDoc(doc(db, 'usernames', lowerUsername), usernameDocData),
      ]);

      setUserData(userDocData);
      setUsernameModalOpen(false);

      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Modal controls
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
    
    // Auth methods
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    
    // Password management
    resetPassword,
    verifyResetCode,
    confirmReset,
    changePassword,
    validatePassword,
    
    // Account linking
    linkGoogleAccount,
    linkEmailPassword,
    getLinkedProviders,
    
    // Username
    checkUsernameAvailable,
    createUserProfile,
    
    // Modals
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
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'An account already exists with this email',
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