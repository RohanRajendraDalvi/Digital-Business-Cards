import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const MAX_INPUT_SIZE = 5 * 1024 * 1024; // 5MB max input
const OUTPUT_SIZE = 256;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function createSilhouetteCanvas(img, size = 256) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

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
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

/**
 * Convert canvas to base64 data URL
 */
function canvasToBase64(canvas) {
  return canvas.toDataURL('image/png');
}

export function useLogoUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadLogo = useCallback(async (file) => {
    if (!user?.uid) {
      setError('Must be logged in');
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Use PNG, JPEG, WebP, or GIF.');
      return null;
    }

    if (file.size > MAX_INPUT_SIZE) {
      setError(`File too large. Max size is ${MAX_INPUT_SIZE / 1024 / 1024}MB.`);
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(20);
      const img = await loadImage(file);

      setProgress(50);
      const silhouetteCanvas = createSilhouetteCanvas(img, OUTPUT_SIZE);

      setProgress(70);
      const base64Data = canvasToBase64(silhouetteCanvas);

      // Store base64 directly in Firestore (much faster retrieval)
      setProgress(90);
      await updateDoc(doc(db, 'users', user.uid), {
        'card.logo.source': 'custom',
        'card.logo.customData': base64Data, // Store base64 directly
        'card.logo.customUrl': null, // Clear old URL if any
        'card.logo.uploadedAt': new Date().toISOString(),
      });

      setProgress(100);
      return base64Data;
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [user?.uid]);

  const deleteLogo = useCallback(async () => {
    if (!user?.uid) {
      setError('Must be logged in');
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'card.logo.source': 'glasses',
        'card.logo.customData': null,
        'card.logo.customUrl': null,
        'card.logo.uploadedAt': null,
      });

      return true;
    } catch (err) {
      console.error('Logo delete error:', err);
      setError(err.message || 'Delete failed');
      return false;
    } finally {
      setUploading(false);
    }
  }, [user?.uid]);

  return {
    uploadLogo,
    deleteLogo,
    uploading,
    progress,
    error,
    clearError: () => setError(null),
  };
}

export default useLogoUpload;