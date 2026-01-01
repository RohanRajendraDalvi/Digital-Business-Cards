import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing current user's card data with auto-save
 * No real-time listener to avoid state conflicts during editing
 */
export function useUserCard() {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);

  // Fetch once on mount (no real-time listener)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchCard() {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setCardData(docSnap.data().card);
        }
      } catch (err) {
        console.error('Error fetching card:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [user?.uid]);

  // Save to Firestore
  const saveToFirestore = useCallback(async (dataToSave) => {
    if (!user?.uid || !dataToSave) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        card: dataToSave,
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

  // Schedule a debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current) {
        saveToFirestore(pendingChangesRef.current);
      }
    }, 1500);
  }, [saveToFirestore]);

  // Update content fields
  const updateContent = useCallback((field, value) => {
    setCardData(prev => {
      const newContent = { ...prev?.content, [field]: value };
      const newCardData = { ...prev, content: newContent };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Update a specific section
  const updateSection = useCallback((sectionKey, updates) => {
    setCardData(prev => {
      const currentSections = prev?.content?.sections || {};
      const currentSection = currentSections[sectionKey] || {};
      const newSections = {
        ...currentSections,
        [sectionKey]: { ...currentSection, ...updates },
      };
      const newContent = { ...prev?.content, sections: newSections };
      const newCardData = { ...prev, content: newContent };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Update theme settings
  const updateTheme = useCallback((updates) => {
    setCardData(prev => {
      const currentTheme = prev?.theme || { mode: 'dark', variant: 'cyber' };
      const newTheme = { ...currentTheme, ...updates };
      const newCardData = { ...prev, theme: newTheme };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Update materials settings
  const updateMaterials = useCallback((updates) => {
    setCardData(prev => {
      const currentMaterials = prev?.materials || {
        frontPattern: 'grid',
        backPattern: 'waves',
        frontPatternSpacing: 40,
        backPatternSpacing: 80,
        preset: 'default',
      };
      const newMaterials = { ...currentMaterials, ...updates };
      const newCardData = { ...prev, materials: newMaterials };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Update logo settings
  const updateLogo = useCallback((updates) => {
    setCardData(prev => {
      const currentLogo = prev?.logo || { source: 'glasses' };
      const newLogo = { ...currentLogo, ...updates };
      const newCardData = { ...prev, logo: newLogo };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Generic update
  const updateCard = useCallback((updates) => {
    setCardData(prev => {
      const newCardData = { ...prev, ...updates };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Force immediate save
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (pendingChangesRef.current) {
      saveToFirestore(pendingChangesRef.current);
    }
  }, [saveToFirestore]);

  // Cleanup on unmount - save pending changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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