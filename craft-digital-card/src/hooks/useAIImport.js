import { useState, useCallback } from 'react';
import { auth } from '../services/firebase';

const CONFIG = {
  minTextLength: 50,
  maxTextLength: 15000,
  maxFileSizeMB: 10,
};

export function useAIImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const clearError = useCallback(() => setError(null), []);

  const importFromText = useCallback(async (text) => {
    setError(null);
    setProgress('Validating...');

    // Validation
    if (!text || typeof text !== 'string') {
      setError('Please provide some text');
      return null;
    }

    const trimmed = text.trim();
    if (trimmed.length < CONFIG.minTextLength) {
      setError(`Please provide at least ${CONFIG.minTextLength} characters`);
      return null;
    }

    if (trimmed.length > CONFIG.maxTextLength) {
      setError(`Text too long. Maximum ${CONFIG.maxTextLength} characters (you have ${trimmed.length})`);
      return null;
    }

    // Get auth token
    setProgress('Authenticating...');
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in first');
      return null;
    }

    let token;
    try {
      token = await user.getIdToken();
    } catch (err) {
      setError('Authentication failed. Please sign in again.');
      return null;
    }

    // Call API
    setLoading(true);
    setProgress('AI is analyzing your content...');

    try {
      const res = await fetch('/api/ai-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle rate limiting specially
        if (res.status === 429) {
          setError(`Rate limit reached. ${data.error}`);
        } else {
          setError(data.error || 'Something went wrong');
        }
        return null;
      }

      setProgress('Done!');
      return data;

    } catch (err) {
      console.error('AI Import error:', err);
      setError('Network error. Please check your connection.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromPDF = useCallback(async (file) => {
    setError(null);
    setProgress('Validating file...');

    // Validate file
    if (!file) {
      setError('Please select a file');
      return null;
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return null;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > CONFIG.maxFileSizeMB) {
      setError(`File too large. Maximum ${CONFIG.maxFileSizeMB}MB (yours is ${sizeMB.toFixed(1)}MB)`);
      return null;
    }

    // Extract text from PDF
    setProgress('Reading PDF...');
    setLoading(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path - use unpkg which has all versions
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      setProgress(`Extracting text (0/${pdf.numPages} pages)...`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
        setProgress(`Extracting text (${i}/${pdf.numPages} pages)...`);
      }

      if (fullText.trim().length < CONFIG.minTextLength) {
        setError('Could not extract enough text from PDF. Try pasting the content manually.');
        return null;
      }

      // Now process with AI
      setLoading(false);
      return await importFromText(fullText);

    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Failed to read PDF. Try pasting the content manually.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [importFromText]);

  const importFromLinkedIn = useCallback(async (input) => {
    setError(null);

    // Check if it's a URL or pasted text
    const isUrl = input.trim().toLowerCase().includes('linkedin.com');

    if (isUrl) {
      setError(
        'LinkedIn URLs cannot be imported directly due to privacy restrictions. ' +
        'Please copy your LinkedIn profile text and paste it here instead.\n\n' +
        'How to: Go to your LinkedIn profile → Click "More" → "Save to PDF" → Upload the PDF, ' +
        'or simply copy the text from your profile page.'
      );
      return null;
    }

    // It's pasted text, process it
    return await importFromText(input);
  }, [importFromText]);

  return {
    loading,
    error,
    progress,
    clearError,
    importFromText,
    importFromPDF,
    importFromLinkedIn,
    config: CONFIG,
  };
}

export default useAIImport;