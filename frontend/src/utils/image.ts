/**
 * Compress base64 image using HTML5 canvas.
 * Maintains aspect ratio and compresses to jpeg format with the specified quality.
 */
export function compressImage(
  base64Str: string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a data URL (e.g. mock absolute URL or already compressed URL), return it as-is
    if (!base64Str || !base64Str.startsWith('data:')) {
      return resolve(base64Str);
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(base64Str);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as image/jpeg with defined quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      // Return original base64 if loading/resizing fails
      resolve(base64Str);
    };
  });
}
