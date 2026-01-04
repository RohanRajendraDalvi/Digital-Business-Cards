import QRCode from 'qrcode';

const DEFAULT_OPTIONS = {
  width: 200,
  margin: 0,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  errorCorrectionLevel: 'M',
};

/**
 * Generate a QR code as a data URL
 * @param {string} data - The data to encode
 * @param {object} options - Optional QRCode options
 * @returns {Promise<string|null>} - Data URL or null if failed
 */
export async function generateQRCodeDataURL(data, options = {}) {
  if (!data) return null;

  try {
    const dataUrl = await QRCode.toDataURL(data, {
      ...DEFAULT_OPTIONS,
      ...options,
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return null;
  }
}

/**
 * Load a QR code as an Image element
 * @param {string} data - The data to encode
 * @param {object} options - Optional QRCode options
 * @returns {Promise<HTMLImageElement|null>} - Image element or null
 */
export async function generateQRCodeImage(data, options = {}) {
  if (!data) return null;

  try {
    const dataUrl = await generateQRCodeDataURL(data, options);
    if (!dataUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Failed to generate QR code image:', error);
    return null;
  }
}