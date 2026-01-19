import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sanitizeCardData, sanitizeError } from '../utils/security';

// Short TTL cache for public cards - only to prevent rapid re-fetches
const PUBLIC_CACHE_TTL = 30 * 1000; // 30 seconds
const publicCardCache = new Map();

export function usePublicCard(username) {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    
    const currentFetchId = ++fetchIdRef.current;
    
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    const normalizedUsername = username.toLowerCase().trim();
    const cacheKey = `public_${normalizedUsername}`;
    
    // Check cache - but only use if very fresh
    const cached = publicCardCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < PUBLIC_CACHE_TTL) {
      setCardData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchPublicCard() {
      setLoading(true);
      
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef, 
          where('username', '==', normalizedUsername),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!isMountedRef.current || currentFetchId !== fetchIdRef.current) {
          return;
        }
        
        if (querySnapshot.empty) {
          setError('Card not found');
          setCardData(null);
          setLoading(false);
          return;
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const card = userData?.card;
        
        if (!card) {
          setError('Card not found');
          setCardData(null);
          setLoading(false);
          return;
        }
        
        const sanitized = sanitizeCardData(card);
        
        publicCardCache.set(cacheKey, {
          data: sanitized,
          timestamp: Date.now(),
        });
        
        if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
          setCardData(sanitized);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching public card:', err);
        if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
          setError(sanitizeError(err));
          setCardData(null);
        }
      } finally {
        if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchPublicCard();

    return () => {
      isMountedRef.current = false;
    };
  }, [username]);

  return { cardData, loading, error };
}

// Clear cache for a specific username (call after saving)
export function clearPublicCardCache(username) {
  if (username) {
    const cacheKey = `public_${username.toLowerCase().trim()}`;
    publicCardCache.delete(cacheKey);
  }
}

// Clear all public card cache
export function clearAllPublicCardCache() {
  publicCardCache.clear();
}

export default usePublicCard;