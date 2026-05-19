import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  threshold?: number;
}

// Module-level cache: processed images are stored ONCE, reused forever
const imageCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

function processImage(src: string, threshold: number): Promise<string> {
  const cacheKey = `${src}_${threshold}`;
  
  // Return cached result immediately
  if (imageCache.has(cacheKey)) {
    return Promise.resolve(imageCache.get(cacheKey)!);
  }

  // Return existing promise if already processing
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  // Process for the first time
  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(src); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r < threshold && g < threshold && b < threshold) {
          data[i + 3] = 0; // Make black pixels transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png');
      imageCache.set(cacheKey, result);
      pendingPromises.delete(cacheKey);
      resolve(result);
    };
    img.onerror = () => { resolve(src); pendingPromises.delete(cacheKey); };
    img.src = src;
  });

  pendingPromises.set(cacheKey, promise);
  return promise;
}

// Pre-warm: start processing all muscle icons as soon as this module is imported
export function preWarmImages(srcs: string[], threshold = 45) {
  srcs.forEach(src => processImage(src, threshold));
}

export function TransparentImage({ src, alt, width, height, style, threshold = 50 }: Props) {
  const cacheKey = `${src}_${threshold}`;
  
  // Check cache synchronously first — no loading state if already cached!
  const [dataUrl, setDataUrl] = useState<string | null>(
    imageCache.get(cacheKey) ?? null
  );

  useEffect(() => {
    if (imageCache.has(cacheKey)) {
      setDataUrl(imageCache.get(cacheKey)!);
      return;
    }
    processImage(src, threshold).then(setDataUrl);
  }, [cacheKey]);

  if (!dataUrl) {
    return (
      <div style={{
        width, height,
        borderRadius: '8px',
        background: 'rgba(var(--theme-rgb), 0.14)',
        ...style
      }} />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      style={{ width, height, objectFit: 'contain', ...style }}
    />
  );
}
export default TransparentImage;
