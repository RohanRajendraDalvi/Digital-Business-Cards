import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing current user's card data with auto-save
 * Used in the Editor page
 */
export function useUserCard() {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for debounced save
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Only update if we don't have pending local changes
          if (!pendingChangesRef.current) {
            setCardData(data.card);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to card:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Debounced save function
  const saveToFirestore = useCallback(async (newCardData) => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        card: newCardData,
        updatedAt: serverTimestamp(),
      });
      pendingChangesRef.current = null;
    } catch (err) {
      console.error('Error saving card:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [user?.uid]);

  // Update with debounce
  const updateCard = useCallback((updates) => {
    const newCardData = { ...cardData, ...updates };
    setCardData(newCardData);
    pendingChangesRef.current = newCardData;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save (1.5 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      saveToFirestore(newCardData);
    }, 1500);
  }, [cardData, saveToFirestore]);

  // Update content fields (name, title, email, etc.)
  const updateContent = useCallback((field, value) => {
    const newContent = { ...cardData?.content, [field]: value };
    updateCard({ content: newContent });
  }, [cardData, updateCard]);

  // Update a specific section
  const updateSection = useCallback((sectionKey, updates) => {
    const currentSections = cardData?.content?.sections || {};
    const currentSection = currentSections[sectionKey] || {};
    const newSections = {
      ...currentSections,
      [sectionKey]: { ...currentSection, ...updates },
    };
    const newContent = { ...cardData?.content, sections: newSections };
    updateCard({ content: newContent });
  }, [cardData, updateCard]);

  // Update theme settings - FIXED: properly merge with existing theme
  const updateTheme = useCallback((updates) => {
    const currentTheme = cardData?.theme || { mode: 'dark', variant: 'cyber' };
    const newTheme = { ...currentTheme, ...updates };
    updateCard({ theme: newTheme });
  }, [cardData, updateCard]);

  // Update materials settings - FIXED: properly merge with existing materials
  const updateMaterials = useCallback((updates) => {
    const currentMaterials = cardData?.materials || {
      frontPattern: 'grid',
      backPattern: 'waves',
      frontPatternSpacing: 40,
      backPatternSpacing: 80,
      preset: 'default',
    };
    const newMaterials = { ...currentMaterials, ...updates };
    updateCard({ materials: newMaterials });
  }, [cardData, updateCard]);

  // Update logo settings - FIXED: properly merge with existing logo
  const updateLogo = useCallback((updates) => {
    const currentLogo = cardData?.logo || { source: 'glasses' };
    const newLogo = { ...currentLogo, ...updates };
    updateCard({ logo: newLogo });
  }, [cardData, updateCard]);

  // Force immediate save
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (pendingChangesRef.current) {
      saveToFirestore(pendingChangesRef.current);
    }
  }, [saveToFirestore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes on unmount
      if (pendingChangesRef.current && user?.uid) {
        updateDoc(doc(db, 'users', user.uid), {
          card: pendingChangesRef.current,
          updatedAt: serverTimestamp(),
        }).catch(console.error);
      }
    };
  }, [user?.uid]);

  return {
    cardData,
    loading,
    saving,
    error,
    updateCard,
    updateContent,
    updateSection,
    updateTheme,
    updateMaterials,
    updateLogo,
    saveNow,
  };
}

export default useUserCard;