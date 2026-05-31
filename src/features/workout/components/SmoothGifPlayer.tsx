import React, { useState, useEffect, useRef } from 'react';

interface SmoothGifPlayerProps {
  src: string;
  alt?: string;
  onReady?: () => void;
  style?: React.CSSProperties;
}

interface CachedGif {
  w: number;
  h: number;
  canvases: HTMLCanvasElement[];
  delays: number[];
}

async function decodeGif(buf: ArrayBuffer): Promise<CachedGif> {
  const { parseGIF, decompressFrames } = await import('gifuct-js');
  const gif = parseGIF(buf);
  const frames = decompressFrames(gif, true);
  if (!frames || frames.length === 0) throw new Error('No frames');

  const W = gif.lsd?.width ?? Math.max(...frames.map((f: any) => f.dims.left + f.dims.width));
  const H = gif.lsd?.height ?? Math.max(...frames.map((f: any) => f.dims.top + f.dims.height));

  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d')!;
  const canvases: HTMLCanvasElement[] = [];
  const delays: number[] = [];

  for (const f of frames) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    temp.width = f.dims.width;
    temp.height = f.dims.height;
    const id = new ImageData(f.patch as any, f.dims.width, f.dims.height);
    tctx.putImageData(id, 0, 0);
    ctx.drawImage(temp, f.dims.left, f.dims.top);

    canvases.push(c);
    delays.push(f.delay || 100);
  }

  return { w: W, h: H, canvases, delays };
}

const SmoothGifPlayer: React.FC<SmoothGifPlayerProps> = ({ src, alt = '', onReady, style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    setState('loading');
    const controller = new AbortController();
    let cancelled = false;
    let animId = 0;
    let blobUrl: string | null = null;

    (async () => {
      try {
        /* Blob-preload for smooth playback */
        const resp = await fetch(src, { signal: controller.signal });
        const blob = await resp.blob();
        blobUrl = URL.createObjectURL(blob);

        const decoded = await decodeGif(await blob.arrayBuffer());
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setState('fallback'); return; }

        canvas.width = decoded.w;
        canvas.height = decoded.h;
        setState('ready');
        onReady?.();

        let idx = 0;
        let last = performance.now();
        let elapsed = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(decoded.canvases[0], 0, 0);

        const draw = (now: number) => {
          if (cancelled) return;
          const dt = now - last;
          last = now;
          elapsed += dt;

          if (elapsed >= decoded.delays[idx]) {
            elapsed -= decoded.delays[idx];
            idx = (idx + 1) % decoded.canvases.length;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(decoded.canvases[idx], 0, 0);
          animId = requestAnimationFrame(draw);
        };
        animId = requestAnimationFrame(draw);
      } catch {
        if (!cancelled) setState('fallback');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (state === 'fallback') {
    return <img src={src} alt={alt} style={{ ...style, backgroundColor: '#ffffff', display: 'block' }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...style,
        backgroundColor: '#ffffff',
        display: 'block',
        opacity: state === 'ready' ? 1 : 0.01,
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
};

export default SmoothGifPlayer;
