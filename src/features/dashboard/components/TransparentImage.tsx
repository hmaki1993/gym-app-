import React, { useState, useEffect } from 'react';

interface TransparentImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  threshold?: number;
  style?: React.CSSProperties;
}

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

async function getTransparentImage(src: string, threshold: number): Promise<string> {
  const cacheKey = `${src}_${threshold}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  if (pending.has(cacheKey)) return pending.get(cacheKey)!;

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If color is darker than threshold, make it transparent
        if (r < threshold && g < threshold && b < threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      cache.set(cacheKey, dataUrl);
      pending.delete(cacheKey);
      resolve(dataUrl);
    };
    img.onerror = () => {
      resolve(src);
      pending.delete(cacheKey);
    };
    img.src = src;
  });

  pending.set(cacheKey, promise);
  return promise;
}

export const TransparentImage: React.FC<TransparentImageProps> = ({ 
  src, alt, width, height, threshold = 50, style 
}) => {
  const cacheKey = `${src}_${threshold}`;
  const [displaySrc, setDisplaySrc] = useState<string | null>(cache.get(cacheKey) ?? null);

  useEffect(() => {
    if (cache.has(cacheKey)) {
      setDisplaySrc(cache.get(cacheKey)!);
      return;
    }
    getTransparentImage(src, threshold).then(setDisplaySrc);
  }, [cacheKey, src, threshold]);

  if (!displaySrc) {
    return <div style={{ width, height, borderRadius: '8px', background: 'rgba(var(--theme-rgb), 0.14)', ...style }} />;
  }

  return (
    <img 
      src={displaySrc} 
      alt={alt} 
      style={{ width, height, objectFit: 'contain', ...style }} 
    />
  );
};
