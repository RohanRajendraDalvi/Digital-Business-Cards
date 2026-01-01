import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook for fetching a public card by username
 * Used on the public card view page (/:username)
 */
export function usePublicCard(username) {
  const [cardData, setCardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    async function fetchCard() {
      try {
        setLoading(true);
        setError(null);

        const lowerUsername = username.toLowerCase();

        // Look up username to get userId
        const usernameDoc = await getDoc(doc(db, 'usernames', lowerUsername));
        
        if (!usernameDoc.exists()) {
          setError('not_found');
          setLoading(false);
          return;
        }

        const { userId } = usernameDoc.data();

        // Fetch user document
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('not_found');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        
        setUserData({
          username: data.username,
          displayName: data.displayName,
          photoURL: data.photoURL,
        });
        setCardData(data.card);

        // Increment view count (fire and forget)
        updateDoc(doc(db, 'users', userId), {
          'stats.views': increment(1),
        }).catch(console.error);

      } catch (err) {
        console.error('Error fetching card:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
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