import { useRef, useState, useEffect } from 'react';
import { useLogoUpload } from '../hooks/useLogoUpload';

export default function LogoUploader({ currentLogo, onLogoChange }) {
  const fileInputRef = useRef(null);
  const { uploadLogo, deleteLogo, uploading, progress, error, clearError } = useLogoUpload();
  const [preview, setPreview] = useState(null);
  const previewUrlRef = useRef(null);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // FIX: Check customData, not customUrl
  const hasCustomLogo = currentLogo?.source === 'custom' && currentLogo?.customData;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPreview(previewUrl);
    clearError();

    // Upload - hook saves directly to Firestore
    const base64Data = await uploadLogo(file);
    
    if (base64Data) {
      // FIX: Update local state to match what hook saved to Firestore
      // Use customData, not customUrl
      onLogoChange({ 
        source: 'custom', 
        customData: base64Data,
        customUrl: null 
      });
    }
    
    // Clear preview (base64 is now in state/Firestore)
    setPreview(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!hasCustomLogo) return;
    
    const success = await deleteLogo();
    if (success) {
      // FIX: Clear customData, not customUrl
      onLogoChange({ source: 'glasses', customData: null, customUrl: null });
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // FIX: Display priority: preview (during upload) → customData (saved)
  const displaySrc = preview || currentLogo?.customData;

  return (
    <div style={styles.container}>
      <label style={styles.label}>Custom Logo</label>
      
      <div style={styles.uploadArea}>
        {/* Preview / Current Logo */}
        <div style={styles.previewBox} onClick={handleClick}>
          {uploading ? (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <span style={styles.progressText}>{progress}%</span>
            </div>
          ) : displaySrc ? (
            <img 
              src={displaySrc} 
              alt="Logo" 
              style={styles.previewImage}
              onError={(e) => {
                console.error('Failed to load logo image');
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={styles.placeholder}>
              <span style={styles.placeholderIcon}>📁</span>
              <span style={styles.placeholderText}>Click to upload</span>
              <span style={styles.placeholderHint}>PNG, JPG, WebP • Max 5MB</span>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileSelect}
          style={styles.hiddenInput}
        />

        {/* Action buttons */}
        <div style={styles.actions}>
          <button
            onClick={handleClick}
            disabled={uploading}
            style={styles.uploadBtn}
          >
            {uploading ? 'Uploading...' : hasCustomLogo ? 'Change' : 'Upload'}
          </button>
          
          {hasCustomLogo && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              style={styles.deleteBtn}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Info text */}
      <p style={styles.infoText}>
        Your image will be converted to a silhouette and tinted with the theme color.
        Square images work best.
      </p>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '16px',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  previewBox: {
    width: '100%',
    height: '120px',
    borderRadius: '10px',
    border: '2px dashed rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  placeholderIcon: {
    fontSize: '28px',
    opacity: 0.6,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: '500',
  },
  placeholderHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
    borderRadius: '3px',
    transition: 'width 0.2s ease',
  },
  progressText: {
    color: '#00d4ff',
    fontSize: '12px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  uploadBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(0,212,255,0.3)',
    background: 'rgba(0,212,255,0.1)',
    color: '#00d4ff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,71,87,0.3)',
    background: 'rgba(255,71,87,0.1)',
    color: '#ff6b7a',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  hiddenInput: {
    display: 'none',
  },
  error: {
    marginTop: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255,71,87,0.15)',
    border: '1px solid rgba(255,71,87,0.3)',
    color: '#ff6b7a',
    fontSize: '12px',
  },
  infoText: {
    marginTop: '8px',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    lineHeight: '1.4',
  },
};