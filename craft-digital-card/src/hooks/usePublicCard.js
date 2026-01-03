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

/**
 * Hook for fetching a public card by username
 * With protection against manipulation and invalid inputs
 */
export function usePublicCard(username) {
  const [cardData, setCardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewCountedRef = useRef(new Set());

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    // Sanitize and validate username
    const lowerUsername = String(username).toLowerCase().trim().slice(0, LIMITS.usernameMax);
    
    // Basic validation before DB query
    if (lowerUsername.length < LIMITS.usernameMin) {
      setLoading(false);
      setError('not_found');
      return;
    }
    
    // Check for path traversal and injection
    if (/[\/\\<>"'`;&|]/.test(lowerUsername) || lowerUsername.includes('..')) {
      setLoading(false);
      setError('not_found');
      return;
    }

    // Full validation
    if (!isValidUsername(lowerUsername)) {
      setLoading(false);
      setError('not_found');
      return;
    }

    let cancelled = false;

    async function fetchCard() {
      try {
        setLoading(true);
        setError(null);

        // Fetch username mapping
        const usernameDoc = await getDoc(doc(db, 'usernames', lowerUsername));
        
        if (cancelled) return;
        
        if (!usernameDoc.exists()) {
          setError('not_found');
          setLoading(false);
          return;
        }

        const { userId } = usernameDoc.data();
        
        // Validate userId
        if (!userId || typeof userId !== 'string' || userId.length > 128) {
          setError('not_found');
          setLoading(false);
          return;
        }

        // Fetch user document
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (cancelled) return;
        
        if (!userDoc.exists()) {
          setError('not_found');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        
        // Sanitize output data
        setUserData({
          username: sanitizeText(data.username, LIMITS.usernameMax) || lowerUsername,
          displayName: data.displayName ? sanitizeText(data.displayName, 100) : null,
          photoURL: data.photoURL?.startsWith('https://') ? data.photoURL : null,
        });
        
        // Sanitize card data
        const sanitizedCard = data.card ? sanitizeCardData(data.card) : null;
        setCardData(sanitizedCard);

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
        setError(sanitizeError(err));
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
    notFound: error === 'not_found',
  };
}

export default usePublicCard;