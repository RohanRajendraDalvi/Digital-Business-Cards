import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LIMITS, checkRateLimit } from '../utils/security';

const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const OUTPUT_SIZE = 256;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const UPLOAD_RATE_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

function validateImageMagicBytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
  
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  
  return null;
}

function createSilhouetteCanvas(img, size = 256) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  if (img.width <= 0 || img.height <= 0 || img.width > 10000 || img.height > 10000) {
    throw new Error('Invalid image dimensions');
  }

  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  const samplePixel = (x, y) => {
    const i = (y * size + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };

  const corners = [
    samplePixel(0, 0),
    samplePixel(size - 1, 0),
    samplePixel(0, size - 1),
    samplePixel(size - 1, size - 1),
  ];

  const bgR = (corners[0].r + corners[1].r + corners[2].r + corners[3].r) >> 2;
  const bgG = (corners[0].g + corners[1].g + corners[2].g + corners[3].g) >> 2;
  const bgB = (corners[0].b + corners[1].b + corners[2].b + corners[3].b) >> 2;
  const bgA = (corners[0].a + corners[1].a + corners[2].a + corners[3].a) >> 2;

  const colorThreshold = 2500;

  for (let i = 0; i < data.length; i += 4) {
    const pixA = data[i + 3];
    
    if (pixA < 30) {
      data[i + 3] = 0;
      continue;
    }

    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const colorDistSq = dr * dr + dg * dg + db * db;

    const isLogo = bgA < 128 ? pixA > 30 : colorDistSq > colorThreshold;

    if (isLogo) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Image load timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

function canvasToBase64(canvas) {
  return canvas.toDataURL('image/png');
}

export function useLogoUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);

  /**
   * Process logo image and return data for local state update.
   * Does NOT save to Firestore - caller should use updateLogo() and then save().
   * Returns { source, customData, uploadedAt } on success, null on failure.
   */
  const processLogo = useCallback(async (file) => {
    if (processingRef.current) {
      setError('Upload already in progress');
      return null;
    }

    if (!user?.uid) {
      setError('Must be logged in');
      return null;
    }

    // Rate limiting
    const rateCheck = checkRateLimit(`logo_upload_${user.uid}`, UPLOAD_RATE_LIMIT.max, UPLOAD_RATE_LIMIT.windowMs);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.retryAfter / 60000);
      setError(`Too many uploads. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}`);
      return null;
    }

    // File validation
    if (!file || !(file instanceof File)) {
      setError('Invalid file');
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Use PNG, JPEG, WebP, or GIF.');
      return null;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Invalid file extension');
      return null;
    }

    if (file.size > MAX_INPUT_SIZE) {
      setError(`File too large. Max size is ${MAX_INPUT_SIZE / 1024 / 1024}MB.`);
      return null;
    }

    // Deep validation
    processingRef.current = true;
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const detectedType = validateImageMagicBytes(arrayBuffer);
      
      if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
        throw new Error('File content does not match an allowed image type');
      }

      setProgress(20);

      const img = await loadImage(file);

      if (img.width < 10 || img.height < 10) {
        throw new Error('Image too small (minimum 10x10 pixels)');
      }
      if (img.width > 10000 || img.height > 10000) {
        throw new Error('Image too large (maximum 10000x10000 pixels)');
      }

      setProgress(50);

      const silhouetteCanvas = createSilhouetteCanvas(img, OUTPUT_SIZE);

      setProgress(70);

      const base64Data = canvasToBase64(silhouetteCanvas);
      
      if (base64Data.length > LIMITS.logoMaxBytes * 1.4) {
        throw new Error('Processed image too large');
      }

      setProgress(100);
      
      // Return data for local state update (not saved until user clicks Save)
      return {
        source: 'custom',
        customData: base64Data,
        customUrl: null,
        uploadedAt: new Date().toISOString(),
      };

    } catch (err) {
      console.error('Logo processing error:', err);
      setError(err.message || 'Processing failed');
      return null;
    } finally {
      processingRef.current = false;
      setUploading(false);
    }
  }, [user?.uid]);

  /**
   * Returns data to reset logo to default.
   * Does NOT save to Firestore - caller should use updateLogo() and then save().
   */
  const getResetLogoData = useCallback(() => {
    return {
      source: 'glasses',
      customData: null,
      customUrl: null,
      uploadedAt: null,
    };
  }, []);

  return {
    processLogo,
    getResetLogoData,
    uploading,
    progress,
    error,
    clearError: () => setError(null),
    // Expose limits for UI hints
    limits: {
      maxInputSizeMB: MAX_INPUT_SIZE / 1024 / 1024,
      allowedTypes: ALLOWED_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS,
    },
  };
}

export default useLogoUpload;