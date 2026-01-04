import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import {
  LIMITS,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeArray,
  sanitizeCardData,
  sanitizeTheme,
  sanitizeMaterials,
  sanitizeLogo,
  checkRateLimit,
  isValidBase64Image,
  sanitizeError,
} from '../utils/security';

const MAX_SAVES_PER_MINUTE = 10;

// Cache constants
const CACHE_KEY_PREFIX = 'cardCache_';
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

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

export function useUserCard() {
  const { user } = useAuth();
  
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const dataHashRef = useRef('');
  const isMountedRef = useRef(true);
  const cacheVersionRef = useRef(0);
  const hasFetchedRef = useRef(false);

  const hashData = useCallback((data) => {
    try {
      return JSON.stringify(data);
    } catch {
      return Math.random().toString();
    }
  }, []);

  // Fetch effect
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

  // Save to Firestore
  const save = useCallback(async () => {
    if (!user?.uid || !cardData || !isMountedRef.current) return { success: false };

    const rateCheck = checkRateLimit(`save_${user.uid}`, MAX_SAVES_PER_MINUTE, 60000);
    if (!rateCheck.allowed) {
      setError('Too many saves. Please wait a moment.');
      return { success: false, error: 'rate_limited' };
    }

    setSaving(true);
    
    try {
      // sanitizeCardData will properly validate email, phone, URLs on save
      const sanitized = sanitizeCardData(cardData);
      if (!sanitized) throw new Error('Invalid card data');
      
      await updateDoc(doc(db, 'users', user.uid), {
        card: sanitized,
        updatedAt: serverTimestamp(),
      });
      
      dataHashRef.current = hashData(sanitized);
      
      if (isMountedRef.current) {
        setCardData(sanitized);
        setError(null);
        setHasUnsavedChanges(false);
      }
      
      cacheVersionRef.current++;
      cache.set(user.uid, sanitized, cacheVersionRef.current);
      
      return { success: true };
    } catch (err) {
      console.error('Save error:', err);
      if (isMountedRef.current) setError(sanitizeError(err));
      return { success: false, error: err.message };
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }, [user?.uid, cardData, hashData]);

  // Update callbacks - no validation during editing for email/phone/URLs
  // Validation happens on save via sanitizeCardData
  const updateContent = useCallback((field, value) => {
    let sanitizedValue;
    switch (field) {
      // Don't validate email during typing - just limit length
      // Validation will happen on save
      case 'email':
        sanitizedValue = sanitizeText(value, LIMITS.shortText);
        break;
      // Don't strictly validate phone during typing - just limit length and basic chars
      case 'phone':
        sanitizedValue = sanitizeText(value, LIMITS.phoneLength);
        break;
      // Don't validate URL during typing
      case 'linkUrl':
        sanitizedValue = sanitizeText(value, LIMITS.longText);
        break;
      // Don't validate URLs in array during typing
      case 'onlineLinks':
        sanitizedValue = sanitizeArray(value, LIMITS.linksMaxItems, LIMITS.longText, sanitizeText);
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
      return { ...prev, content: newContent };
    });
    setHasUnsavedChanges(true);
  }, []);

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
      return { ...prev, content: newContent };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateTheme = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const merged = { ...prev?.theme, ...updates };
      const sanitized = sanitizeTheme(merged);
      return { ...prev, theme: sanitized };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateMaterials = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    
    setCardData(prev => {
      const merged = { ...prev?.materials, ...updates };
      const sanitized = sanitizeMaterials(merged);
      return { ...prev, materials: sanitized };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateLogo = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') return;
    if (updates.customData && !isValidBase64Image(updates.customData)) return;
    
    setCardData(prev => {
      const merged = { ...prev?.logo, ...updates };
      const sanitized = sanitizeLogo(merged);
      return { ...prev, logo: sanitized };
    });
    setHasUnsavedChanges(true);
  }, []);

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
        setHasUnsavedChanges(false);
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

  const discardChanges = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const clearCache = useCallback(() => {
    if (user?.uid) cache.clear(user.uid);
  }, [user?.uid]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    cardData,
    loading,
    saving,
    error,
    isFromCache,
    hasUnsavedChanges,
    updateContent,
    updateSection,
    updateTheme,
    updateMaterials,
    updateLogo,
    save,
    refresh,
    discardChanges,
    clearCache,
    clearError: useCallback(() => setError(null), []),
    limits: LIMITS,
  };
}

export const cardCache = cache;
export default useUserCard;