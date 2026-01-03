import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import {
  LIMITS,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeArray,
  sanitizeCardData,
  sanitizeTheme,
  sanitizeMaterials,
  sanitizeLogo,
  checkRateLimit,
  isValidBase64Image,
  sanitizeError,
} from '../utils/security';

const MIN_SAVE_INTERVAL = 3000;
const DEBOUNCE_DELAY = 2000;
const MAX_SAVES_PER_MINUTE = 10;

/**
 * Hook for managing current user's card data with security hardening
 */
export function useUserCard() {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const dataHashRef = useRef('');
  const isMountedRef = useRef(true);

  const safeSetState = useCallback((setter, value) => {
    if (isMountedRef.current) setter(value);
  }, []);

  const hashData = (data) => {
    try {
      return JSON.stringify(data);
    } catch {
      return Math.random().toString();
    }
  };

  // Fetch card on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCard() {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (cancelled) return;
        
        if (docSnap.exists()) {
          const card = docSnap.data().card;
          const sanitized = card ? sanitizeCardData(card) : null;
          safeSetState(setCardData, sanitized);
          dataHashRef.current = hashData(sanitized);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch error:', err);
        safeSetState(setError, sanitizeError(err));
      } finally {
        if (!cancelled) safeSetState(setLoading, false);
      }
    }

    fetchCard();
    
    return () => { 
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [user?.uid, safeSetState]);

  // Save to Firestore with rate limiting
  const saveToFirestore = useCallback(async (dataToSave) => {
    if (!user?.uid || !dataToSave) return;

    const rateCheck = checkRateLimit(`save_${user.uid}`, MAX_SAVES_PER_MINUTE, 60000);
    if (!rateCheck.allowed) {
      console.warn(`Rate limited. Retry in ${rateCheck.retryAfter}ms`);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current) saveToFirestore(pendingChangesRef.current);
      }, rateCheck.retryAfter + 100);
      return;
    }

    const newHash = hashData(dataToSave);
    if (newHash === dataHashRef.current) {
      pendingChangesRef.current = null;
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    
    if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current) saveToFirestore(pendingChangesRef.current);
      }, MIN_SAVE_INTERVAL - timeSinceLastSave + 100);
      return;
    }

    safeSetState(setSaving, true);
    
    try {
      const sanitized = sanitizeCardData(dataToSave);
      
      if (!sanitized) {
        throw new Error('Invalid card data');
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        card: sanitized,
        updatedAt: serverTimestamp(),
      });
      
      lastSaveTimeRef.current = Date.now();
      dataHashRef.current = hashData(sanitized);
      pendingChangesRef.current = null;
      
      safeSetState(setCardData, sanitized);
      safeSetState(setError, null);
      
    } catch (err) {
      console.error('Save error:', err);
      safeSetState(setError, sanitizeError(err));
    } finally {
      safeSetState(setSaving, false);
    }
  }, [user?.uid, safeSetState]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current) saveToFirestore(pendingChangesRef.current);
    }, DEBOUNCE_DELAY);
  }, [saveToFirestore]);

  const updateContent = useCallback((field, value) => {
    let sanitizedValue;
    
    switch (field) {
      case 'email':
        sanitizedValue = sanitizeEmail(value);
        break;
      case 'phone':
        sanitizedValue = sanitizePhone(value);
        break;
      case 'linkUrl':
        sanitizedValue = sanitizeUrl(value);
        break;
      case 'onlineLinks':
        sanitizedValue = sanitizeArray(value, LIMITS.linksMaxItems, LIMITS.longText, sanitizeUrl);
        break;
      case 'tagline':
      case 'altTagline':
        sanitizedValue = sanitizeText(value, LIMITS.mediumText);
        break;
      case 'cardQrLabel':
      case 'linkQrLabel':
        sanitizedValue = sanitizeText(value, LIMITS.labelLength);
        break;
      default:
        sanitizedValue = sanitizeText(value, LIMITS.shortText);
    }
    
    setCardData(prev => {
      const newContent = { ...prev?.content, [field]: sanitizedValue };
      const newCardData = { ...prev, content: newContent };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  const updateSection = useCallback((sectionKey, updates) => {
    const validKeys = ['front1', 'front2', 'back3', 'back4', 'back5', 'skills1', 'skills2', 'skills3'];
    if (!validKeys.includes(sectionKey)) return;
    
    const maxItems = sectionKey.startsWith('skills') ? LIMITS.skillsMaxItems : LIMITS.arrayMaxItems;
    
    const sanitizedSection = {
      title: sanitizeText(updates?.title, LIMITS.mediumText),
      items: sanitizeArray(updates?.items, maxItems, LIMITS.arrayItemText),
    };
    
    setCardData(prev => {
      const currentSections = prev?.content?.sections || {};
      const newSections = { ...currentSections, [sectionKey]: sanitizedSection };
      const newContent = { ...prev?.content, sections: newSections };
      const newCardData = { ...prev, content: newContent };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  const updateTheme = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const currentTheme = prev?.theme || {};
      const merged = { ...currentTheme, ...updates };
      const sanitized = sanitizeTheme(merged);
      const newCardData = { ...prev, theme: sanitized };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  const updateMaterials = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const currentMaterials = prev?.materials || {};
      const merged = { ...currentMaterials, ...updates };
      const sanitized = sanitizeMaterials(merged);
      const newCardData = { ...prev, materials: sanitized };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  const updateLogo = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    if (updates.customData && !isValidBase64Image(updates.customData)) {
      console.warn('Invalid logo data rejected');
      return;
    }
    
    setCardData(prev => {
      const currentLogo = prev?.logo || {};
      const merged = { ...currentLogo, ...updates };
      const sanitized = sanitizeLogo(merged);
      const newCardData = { ...prev, logo: sanitized };
      pendingChangesRef.current = newCardData;
      return newCardData;
    });
    scheduleSave();
  }, [scheduleSave]);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (pendingChangesRef.current) {
      lastSaveTimeRef.current = 0;
      saveToFirestore(pendingChangesRef.current);
    }
  }, [saveToFirestore]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      if (pendingChangesRef.current && user?.uid) {
        const sanitized = sanitizeCardData(pendingChangesRef.current);
        if (sanitized) {
          updateDoc(doc(db, 'users', user.uid), {
            card: sanitized,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      }
    };
  }, [user?.uid]);

  return {
    cardData,
    loading,
    saving,
    error,
    updateContent,
    updateSection,
    updateTheme,
    updateMaterials,
    updateLogo,
    saveNow,
    clearError: () => setError(null),
    limits: LIMITS,
  };
}

export default useUserCard;