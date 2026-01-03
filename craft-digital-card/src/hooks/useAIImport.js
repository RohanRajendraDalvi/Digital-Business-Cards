import { useState, useCallback, useRef, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  LIMITS, 
  sanitizeText, 
  checkRateLimit, 
  stripHtml,
  sanitizeError,
} from '../utils/security';

const CONFIG = {
  minTextLength: LIMITS.aiTextMin,
  maxTextLength: LIMITS.aiTextMax,
  maxFileSizeMB: LIMITS.pdfMaxMB,
  maxPdfPages: 50,
  requestTimeoutMs: 30000,
};

const AI_RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export function useAIImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const safeSetState = useCallback((setter, value) => {
    if (isMountedRef.current) setter(value);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    safeSetState(setLoading, false);
    safeSetState(setProgress, '');
  }, [safeSetState]);

  const importFromText = useCallback(async (text) => {
    safeSetState(setError, null);
    safeSetState(setProgress, 'Validating...');

    // Input validation
    if (!text || typeof text !== 'string') {
      safeSetState(setError, 'Please provide some text');
      return null;
    }

    const stripped = stripHtml(text);
    const trimmed = stripped.trim();
    
    if (trimmed.length < CONFIG.minTextLength) {
      safeSetState(setError, `Please provide at least ${CONFIG.minTextLength} characters of actual text`);
      return null;
    }

    if (trimmed.length > CONFIG.maxTextLength) {
      safeSetState(setError, `Text too long. Maximum ${CONFIG.maxTextLength} characters (you have ${trimmed.length})`);
      return null;
    }

    // Check for suspicious content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\{\{.*\}\}/,
      /\$\{.*\}/,
      /__proto__/i,
      /constructor\s*\(/i,
    ];
    
    if (suspiciousPatterns.some(p => p.test(text))) {
      safeSetState(setError, 'Invalid content detected');
      return null;
    }

    // Auth check
    safeSetState(setProgress, 'Authenticating...');
    const user = auth.currentUser;
    if (!user) {
      safeSetState(setError, 'Please sign in first');
      return null;
    }

    // Rate limiting
    const rateCheck = checkRateLimit(`ai_import_${user.uid}`, AI_RATE_LIMIT.max, AI_RATE_LIMIT.windowMs);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.retryAfter / 60000);
      safeSetState(setError, `Rate limit reached. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}`);
      return null;
    }

    let token;
    try {
      token = await user.getIdToken(true);
    } catch (err) {
      safeSetState(setError, 'Authentication failed. Please sign in again.');
      return null;
    }

    // API call with timeout
    safeSetState(setLoading, true);
    safeSetState(setProgress, 'AI is analyzing your content...');

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, CONFIG.requestTimeoutMs);

    try {
      const res = await fetch('/api/ai-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text: sanitizeText(trimmed, CONFIG.maxTextLength),
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          safeSetState(setError, `Rate limit reached. ${data.error || 'Please try again later.'}`);
        } else if (res.status === 401) {
          safeSetState(setError, 'Session expired. Please sign in again.');
        } else if (res.status >= 500) {
          safeSetState(setError, 'Server error. Please try again later.');
        } else {
          safeSetState(setError, data.error || 'Something went wrong');
        }
        return null;
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data');
      }

      safeSetState(setProgress, 'Done!');
      return data;

    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        safeSetState(setError, 'Request timed out. Please try again.');
      } else {
        console.error('AI Import error:', err);
        safeSetState(setError, 'Network error. Please check your connection.');
      }
      return null;
    } finally {
      abortControllerRef.current = null;
      safeSetState(setLoading, false);
    }
  }, [safeSetState]);

  const importFromPDF = useCallback(async (file) => {
    safeSetState(setError, null);
    safeSetState(setProgress, 'Validating file...');

    // File validation
    if (!file) {
      safeSetState(setError, 'Please select a file');
      return null;
    }

    if (file.type !== 'application/pdf') {
      safeSetState(setError, 'Please upload a PDF file');
      return null;
    }

    if (!file.name?.toLowerCase().endsWith('.pdf')) {
      safeSetState(setError, 'Invalid file extension');
      return null;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > CONFIG.maxFileSizeMB) {
      safeSetState(setError, `File too large. Maximum ${CONFIG.maxFileSizeMB}MB (yours is ${sizeMB.toFixed(1)}MB)`);
      return null;
    }

    // PDF extraction
    safeSetState(setProgress, 'Reading PDF...');
    safeSetState(setLoading, true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      
      // Validate PDF header
      const header = new Uint8Array(arrayBuffer.slice(0, 5));
      const headerStr = String.fromCharCode(...header);
      if (!headerStr.startsWith('%PDF-')) {
        throw new Error('Invalid PDF file');
      }

      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        disableFontFace: true,
        isEvalSupported: false,
      }).promise;

      const numPages = Math.min(pdf.numPages, CONFIG.maxPdfPages);
      if (pdf.numPages > CONFIG.maxPdfPages) {
        safeSetState(setProgress, `Processing first ${CONFIG.maxPdfPages} pages...`);
      }
      
      let fullText = '';
      
      for (let i = 1; i <= numPages; i++) {
        safeSetState(setProgress, `Extracting text (${i}/${numPages} pages)...`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .slice(0, 50000);
        
        fullText += pageText + '\n';
        
        if (fullText.length > CONFIG.maxTextLength * 1.5) {
          fullText = fullText.slice(0, CONFIG.maxTextLength);
          break;
        }
      }

      if (fullText.trim().length < CONFIG.minTextLength) {
        safeSetState(setError, 'Could not extract enough text from PDF. Try pasting the content manually.');
        return null;
      }

      safeSetState(setLoading, false);
      return await importFromText(fullText);

    } catch (err) {
      console.error('PDF extraction error:', err);
      
      if (err.message?.includes('Invalid PDF')) {
        safeSetState(setError, 'Invalid or corrupted PDF file');
      } else if (err.message?.includes('password')) {
        safeSetState(setError, 'Password-protected PDFs are not supported');
      } else {
        safeSetState(setError, 'Failed to read PDF. Try pasting the content manually.');
      }
      return null;
    } finally {
      safeSetState(setLoading, false);
    }
  }, [importFromText, safeSetState]);

  const importFromLinkedIn = useCallback(async (input) => {
    safeSetState(setError, null);

    if (!input || typeof input !== 'string') {
      safeSetState(setError, 'Please provide LinkedIn profile text');
      return null;
    }

    const trimmed = input.trim();
    const isUrl = /linkedin\.com/i.test(trimmed);

    if (isUrl) {
      safeSetState(setError,
        'LinkedIn URLs cannot be imported directly due to privacy restrictions. ' +
        'Please copy your LinkedIn profile text and paste it here, or download your profile as PDF.'
      );
      return null;
    }

    return await importFromText(trimmed);
  }, [importFromText, safeSetState]);

  return {
    loading,
    error,
    progress,
    clearError,
    cancel,
    importFromText,
    importFromPDF,
    importFromLinkedIn,
    config: CONFIG,
  };
}

export default useAIImport;