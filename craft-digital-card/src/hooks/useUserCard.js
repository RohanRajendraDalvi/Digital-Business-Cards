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

// Timing constants
const MIN_SAVE_INTERVAL = 3000;
const DEBOUNCE_DELAY = 2000;
const MAX_SAVES_PER_MINUTE = 10;

// Cache constants
const CACHE_KEY_PREFIX = 'cardCache_';
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Local storage cache helpers
 */
const cache = {
  get: (userId) => {
    try {
      const key = CACHE_KEY_PREFIX + userId;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      const { data, timestamp, version } = JSON.parse(raw);
      
      if (Date.now() - timestamp > CACHE_MAX_AGE) {
        localStorage.removeItem(key);
        return null;
      }
      
      return { 
        data, 
        timestamp, 
        isStale: Date.now() - timestamp > CACHE_TTL,
        version: version || 0,
      };
    } catch {
      return null;
    }
  },
  
  set: (userId, data, version = 0) => {
    try {
      const key = CACHE_KEY_PREFIX + userId;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        version,
      }));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  },
  
  clear: (userId) => {
    try {
      localStorage.removeItem(CACHE_KEY_PREFIX + userId);
    } catch {}
  },
  
  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  },
};

/**
 * Hook for managing current user's card data with caching
 */
export function useUserCard() {
  // ============================================
  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONS
  // ============================================
  
  // 1. Context hooks
  const { user } = useAuth();
  
  // 2. State hooks - always in same order
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // 3. Ref hooks - always in same order
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const dataHashRef = useRef('');
  const isMountedRef = useRef(true);
  const cacheVersionRef = useRef(0);
  const hasFetchedRef = useRef(false);

  // 4. Helper function (not a hook)
  const hashData = useCallback((data) => {
    try {
      return JSON.stringify(data);
    } catch {
      return Math.random().toString();
    }
  }, []);

  // 5. Fetch effect
  useEffect(() => {
    isMountedRef.current = true;
    hasFetchedRef.current = false;
    
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let cancelled = false;

    async function fetchCard() {
      const cached = cache.get(user.uid);
      
      if (cached?.data) {
        const sanitized = sanitizeCardData(cached.data);
        if (!cancelled) {
          setCardData(sanitized);
          setIsFromCache(true);
          setLoading(false);
        }
        dataHashRef.current = hashData(sanitized);
        cacheVersionRef.current = cached.version || 0;
        
        if (!cached.isStale) {
          return;
        }
      }

      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (cancelled) return;
        
        if (docSnap.exists()) {
          const card = docSnap.data().card;
          const sanitized = card ? sanitizeCardData(card) : null;
          
          const newHash = hashData(sanitized);
          if (newHash !== dataHashRef.current) {
            setCardData(sanitized);
            dataHashRef.current = newHash;
          }
          
          setIsFromCache(false);
          cacheVersionRef.current++;
          cache.set(user.uid, sanitized, cacheVersionRef.current);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch error:', err);
        if (!cached?.data) {
          setError(sanitizeError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCard();
    
    return () => { 
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [user?.uid, hashData]);

  // 6. Save to Firestore callback
  const saveToFirestore = useCallback(async (dataToSave) => {
    if (!user?.uid || !dataToSave || !isMountedRef.current) return;

    const rateCheck = checkRateLimit(`save_${user.uid}`, MAX_SAVES_PER_MINUTE, 60000);
    if (!rateCheck.allowed) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current && isMountedRef.current) {
          saveToFirestore(pendingChangesRef.current);
        }
      }, rateCheck.retryAfter + 100);
      return;
    }

    const newHash = hashData(dataToSave);
    if (newHash === dataHashRef.current) {
      pendingChangesRef.current = null;
      return;
    }

    const now = Date.now();
    if (now - lastSaveTimeRef.current < MIN_SAVE_INTERVAL) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current && isMountedRef.current) {
          saveToFirestore(pendingChangesRef.current);
        }
      }, MIN_SAVE_INTERVAL - (now - lastSaveTimeRef.current) + 100);
      return;
    }

    if (isMountedRef.current) setSaving(true);
    
    try {
      const sanitized = sanitizeCardData(dataToSave);
      if (!sanitized) throw new Error('Invalid card data');
      
      await updateDoc(doc(db, 'users', user.uid), {
        card: sanitized,
        updatedAt: serverTimestamp(),
      });
      
      lastSaveTimeRef.current = Date.now();
      dataHashRef.current = hashData(sanitized);
      pendingChangesRef.current = null;
      
      if (isMountedRef.current) {
        setCardData(sanitized);
        setError(null);
      }
      
      cacheVersionRef.current++;
      cache.set(user.uid, sanitized, cacheVersionRef.current);
      
    } catch (err) {
      console.error('Save error:', err);
      if (isMountedRef.current) setError(sanitizeError(err));
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }, [user?.uid, hashData]);

  // 7. Schedule save callback
  const scheduleSave = useCallback((newData) => {
    pendingChangesRef.current = newData;
    
    if (user?.uid) {
      cache.set(user.uid, newData, cacheVersionRef.current);
    }
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current && isMountedRef.current) {
        saveToFirestore(pendingChangesRef.current);
      }
    }, DEBOUNCE_DELAY);
  }, [user?.uid, saveToFirestore]);

  // 8. Update callbacks
  const updateContent = useCallback((field, value) => {
    let sanitizedValue;
    switch (field) {
      case 'email': sanitizedValue = sanitizeEmail(value); break;
      case 'phone': sanitizedValue = sanitizePhone(value); break;
      case 'linkUrl': sanitizedValue = sanitizeUrl(value); break;
      case 'onlineLinks': sanitizedValue = sanitizeArray(value, LIMITS.linksMaxItems, LIMITS.longText, sanitizeUrl); break;
      case 'tagline':
      case 'altTagline': sanitizedValue = sanitizeText(value, LIMITS.mediumText); break;
      case 'cardQrLabel':
      case 'linkQrLabel': sanitizedValue = sanitizeText(value, LIMITS.labelLength); break;
      default: sanitizedValue = sanitizeText(value, LIMITS.shortText);
    }
    
    setCardData(prev => {
      const newContent = { ...prev?.content, [field]: sanitizedValue };
      const newData = { ...prev, content: newContent };
      queueMicrotask(() => scheduleSave(newData));
      return newData;
    });
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
      const newData = { ...prev, content: newContent };
      queueMicrotask(() => scheduleSave(newData));
      return newData;
    });
  }, [scheduleSave]);

  const updateTheme = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const merged = { ...prev?.theme, ...updates };
      const sanitized = sanitizeTheme(merged);
      const newData = { ...prev, theme: sanitized };
      queueMicrotask(() => scheduleSave(newData));
      return newData;
    });
  }, [scheduleSave]);

  const updateMaterials = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const merged = { ...prev?.materials, ...updates };
      const sanitized = sanitizeMaterials(merged);
      const newData = { ...prev, materials: sanitized };
      queueMicrotask(() => scheduleSave(newData));
      return newData;
    });
  }, [scheduleSave]);

  const updateLogo = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    if (updates.customData && !isValidBase64Image(updates.customData)) return;
    
    setCardData(prev => {
      const merged = { ...prev?.logo, ...updates };
      const sanitized = sanitizeLogo(merged);
      const newData = { ...prev, logo: sanitized };
      queueMicrotask(() => scheduleSave(newData));
      return newData;
    });
  }, [scheduleSave]);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (pendingChangesRef.current) {
      lastSaveTimeRef.current = 0;
      saveToFirestore(pendingChangesRef.current);
    }
  }, [saveToFirestore]);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const card = docSnap.data().card;
        const sanitized = card ? sanitizeCardData(card) : null;
        setCardData(sanitized);
        dataHashRef.current = hashData(sanitized);
        setIsFromCache(false);
        cacheVersionRef.current++;
        cache.set(user.uid, sanitized, cacheVersionRef.current);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.uid, hashData]);

  const clearCache = useCallback(() => {
    if (user?.uid) cache.clear(user.uid);
  }, [user?.uid]);

  // 9. Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      if (pendingChangesRef.current && user?.uid) {
        const sanitized = sanitizeCardData(pendingChangesRef.current);
        if (sanitized) {
          cache.set(user.uid, sanitized, cacheVersionRef.current);
          updateDoc(doc(db, 'users', user.uid), {
            card: sanitized,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
      }
    };
  }, [user?.uid]);

  // 10. Return values
  return {
    cardData,
    loading,
    saving,
    error,
    isFromCache,
    updateContent,
    updateSection,
    updateTheme,
    updateMaterials,
    updateLogo,
    saveNow,
    refresh,
    clearCache,
    clearError: useCallback(() => setError(null), []),
    limits: LIMITS,
  };
}

export const cardCache = cache;
export default useUserCard;