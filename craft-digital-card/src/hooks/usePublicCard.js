import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  isValidUsername, 
  sanitizeCardData, 
  sanitizeText,
  checkRateLimit,
  sanitizeError,
  LIMITS,
} from '../utils/security';

const VIEW_RATE_LIMIT = { max: 10, windowMs: 60000 };

// Cache constants
const CACHE_KEY_PREFIX = 'publicCard_';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for public cards (shorter since they can change)
const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour hard expiry
const MAX_CACHED_CARDS = 20; // Limit number of cached public cards

/**
 * Public card cache with LRU eviction
 */
const publicCardCache = {
  get: (username) => {
    try {
      const key = CACHE_KEY_PREFIX + username.toLowerCase();
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      const { cardData, userData, timestamp } = JSON.parse(raw);
      
      // Hard expiry
      if (Date.now() - timestamp > CACHE_MAX_AGE) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Update access time for LRU
      publicCardCache.touch(username);
      
      return { 
        cardData, 
        userData,
        timestamp, 
        isStale: Date.now() - timestamp > CACHE_TTL,
      };
    } catch {
      return null;
    }
  },
  
  set: (username, cardData, userData) => {
    try {
      // Enforce max cached cards (LRU eviction)
      publicCardCache.evictIfNeeded();
      
      const key = CACHE_KEY_PREFIX + username.toLowerCase();
      localStorage.setItem(key, JSON.stringify({
        cardData,
        userData,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Public card cache write failed:', e);
    }
  },
  
  touch: (username) => {
    // Update timestamp to mark as recently used
    try {
      const key = CACHE_KEY_PREFIX + username.toLowerCase();
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        data.lastAccess = Date.now();
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // Ignore
    }
  },
  
  evictIfNeeded: () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      
      if (keys.length >= MAX_CACHED_CARDS) {
        // Find oldest by lastAccess or timestamp
        let oldest = { key: null, time: Infinity };
        
        keys.forEach(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const time = data.lastAccess || data.timestamp || 0;
            if (time < oldest.time) {
              oldest = { key, time };
            }
          } catch {
            // Corrupted entry, remove it
            localStorage.removeItem(key);
          }
        });
        
        if (oldest.key) {
          localStorage.removeItem(oldest.key);
        }
      }
    } catch {
      // Ignore
    }
  },
  
  clear: (username) => {
    try {
      localStorage.removeItem(CACHE_KEY_PREFIX + username.toLowerCase());
    } catch {
      // Ignore
    }
  },
  
  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  },
};

/**
 * Hook for fetching a public card by username with caching
 */
export function usePublicCard(username) {
  const [cardData, setCardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const viewCountedRef = useRef(new Set());

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    // Sanitize and validate username
    const lowerUsername = String(username).toLowerCase().trim().slice(0, LIMITS.usernameMax);
    
    if (lowerUsername.length < LIMITS.usernameMin) {
      setLoading(false);
      setError('not_found');
      return;
    }
    
    if (/[\/\\<>"'`;&|]/.test(lowerUsername) || lowerUsername.includes('..')) {
      setLoading(false);
      setError('not_found');
      return;
    }

    if (!isValidUsername(lowerUsername)) {
      setLoading(false);
      setError('not_found');
      return;
    }

    let cancelled = false;

    async function fetchCard() {
      // 1. Try cache first
      const cached = publicCardCache.get(lowerUsername);
      
      if (cached?.cardData) {
        setCardData(cached.cardData);
        setUserData(cached.userData);
        setIsFromCache(true);
        
        // If cache is fresh, skip DB call
        if (!cached.isStale) {
          setLoading(false);
          return;
        }
        
        // Cache is stale - show it but fetch fresh in background
        setLoading(false);
      }

      // 2. Fetch from Firestore
      try {
        // Fetch username mapping
        const usernameDoc = await getDoc(doc(db, 'usernames', lowerUsername));
        
        if (cancelled) return;
        
        if (!usernameDoc.exists()) {
          // Clear invalid cache entry
          publicCardCache.clear(lowerUsername);
          setError('not_found');
          setLoading(false);
          return;
        }

        const { userId } = usernameDoc.data();
        
        if (!userId || typeof userId !== 'string' || userId.length > 128) {
          setError('not_found');
          setLoading(false);
          return;
        }

        // Fetch user document
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (cancelled) return;
        
        if (!userDoc.exists()) {
          publicCardCache.clear(lowerUsername);
          setError('not_found');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        
        // Sanitize output data
        const newUserData = {
          username: sanitizeText(data.username, LIMITS.usernameMax) || lowerUsername,
          displayName: data.displayName ? sanitizeText(data.displayName, 100) : null,
          photoURL: data.photoURL?.startsWith('https://') ? data.photoURL : null,
        };
        
        const newCardData = data.card ? sanitizeCardData(data.card) : null;
        
        setUserData(newUserData);
        setCardData(newCardData);
        setIsFromCache(false);
        
        // Update cache
        publicCardCache.set(lowerUsername, newCardData, newUserData);

        // Protected view counting
        if (!viewCountedRef.current.has(lowerUsername)) {
          const rateCheck = checkRateLimit('public_views', VIEW_RATE_LIMIT.max, VIEW_RATE_LIMIT.windowMs);
          
          if (rateCheck.allowed) {
            viewCountedRef.current.add(lowerUsername);
            
            updateDoc(doc(db, 'users', userId), {
              'stats.views': increment(1),
              'stats.lastViewed': new Date().toISOString(),
            }).catch(() => {});
          }
        }

      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching card:', err);
        
        // Only show error if we don't have cached data
        if (!cached?.cardData) {
          setError(sanitizeError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCard();
    
    return () => { cancelled = true; };
  }, [username]);

  return {
    cardData,
    userData,
    loading,
    error,
    isFromCache,
    notFound: error === 'not_found',
  };
}

// Export cache utilities
export { publicCardCache };

export default usePublicCard;