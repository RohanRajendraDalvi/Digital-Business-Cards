import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  GithubAuthProvider,
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
const githubProvider = new GithubAuthProvider();

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
        
        // If user exists but has no username, show username modal
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
      return { success: false, error: error.message };
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('GitHub sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign up error:', error);
      return { success: false, error: error.message };
    }
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

  // Check if username is available
  const checkUsernameAvailable = async (username) => {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Create user profile with username
  const createUserProfile = async (username) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const lowerUsername = username.toLowerCase();

    try {
      // Check availability one more time
      const isAvailable = await checkUsernameAvailable(lowerUsername);
      if (!isAvailable) {
        return { success: false, error: 'Username is already taken' };
      }

      // Create default card with user info
      const defaultCard = getDefaultCard({
        name: user.displayName || 'Your Name',
        email: user.email || '',
      });

      // Create user document
      const userDocData = {
        username: lowerUsername,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        card: defaultCard,
        stats: {
          views: 0,
          downloads: 0,
        },
      };

      // Create username reservation document
      const usernameDocData = {
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      // Write both documents
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), userDocData),
        setDoc(doc(db, 'usernames', lowerUsername), usernameDocData),
      ]);

      // Update local state
      setUserData(userDocData);
      setUsernameModalOpen(false);

      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Open auth modal
  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  // Close username modal (only if user signs out)
  const closeUsernameModal = () => {
    if (!userData?.username) {
      // User must set username, sign them out instead
      signOut();
    }
    setUsernameModalOpen(false);
  };

  const value = {
    // State
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    hasUsername: !!userData?.username,
    username: userData?.username,
    
    // Auth methods
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    
    // Username methods
    checkUsernameAvailable,
    createUserProfile,
    
    // Modal controls
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    usernameModalOpen,
    closeUsernameModal,
    
    // Data refresh
    refreshUserData: () => user && fetchUserData(user.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;