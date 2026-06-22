import React, { useEffect, useState, useRef } from 'react';

const POPULAR_GIFS = [
  "/assets/muscles/chest.png",
  "/assets/muscles/back.png",
  "/assets/muscles/legs.png",
  "/assets/muscles/shoulders.png",
  "/assets/muscles/biceps.png",
  "/assets/muscles/abs.png",
  "/assets/muscles/cardio.png"
];

interface FloatingGif {
  id: number;
  src: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  zone: number;
  driftX: number;
  rotStart: number;
  rotEnd: number;
}

export const FloatingExercises: React.FC<{ themeMode: 'dark' | 'light' | 'system' | string }> = ({ themeMode }) => {
  // 8 possible zones around the center to prevent overlapping and avoid the center button
  const ZONES = React.useMemo(() => [
    { left: 15, top: 15 }, // TL
    { left: 50, top: 10 }, // TC (slightly higher to avoid button)
    { left: 85, top: 15 }, // TR
    { left: 15, top: 50 }, // ML
    { left: 85, top: 50 }, // MR
    { left: 15, top: 85 }, // BL
    { left: 50, top: 90 }, // BC (slightly lower to avoid button)
    { left: 85, top: 85 }, // BR
  ], []);

  const [gifs, setGifs] = useState<FloatingGif[]>(() => {
    const initialGifs: FloatingGif[] = [];
    const availableZones = [0, 1, 2, 3, 4, 5, 6, 7];
    const availableIcons = [...POPULAR_GIFS];

    for (let i = 0; i < 3; i++) {
      if (availableZones.length === 0 || availableIcons.length === 0) break;
      
      const zoneIdxOfArray = Math.floor(Math.random() * availableZones.length);
      const zoneIndex = availableZones[zoneIdxOfArray];
      availableZones.splice(zoneIdxOfArray, 1);
      
      const iconIdxOfArray = Math.floor(Math.random() * availableIcons.length);
      const src = availableIcons[iconIdxOfArray];
      availableIcons.splice(iconIdxOfArray, 1);
      
      const zone = ZONES[zoneIndex];
      const left = zone.left + (Math.random() * 6 - 3); 
      const top = zone.top + (Math.random() * 6 - 3);
      const size = Math.random() * 40 + 100;
      const duration = Math.random() * 2 + 3.5;

      initialGifs.push({
        id: -(i + 1), // Use negative IDs for preloads to avoid clashing with idCounter
        src,
        left,
        top,
        size,
        duration,
        zone: zoneIndex,
        driftX: Math.random() * 40 - 20,
        rotStart: Math.random() * 20 - 10,
        rotEnd: Math.random() * 30 - 15,
      });
    }
    return initialGifs;
  });

  const idCounter = useRef(0);

  useEffect(() => {
    if (POPULAR_GIFS.length === 0) return;

    // Register timeouts to remove the initial preloaded gifs
    gifs.forEach(gif => {
      if (gif.id < 0) {
        setTimeout(() => {
          setGifs(currentGifs => currentGifs.filter(g => g.id !== gif.id));
        }, gif.duration * 1000);
      }
    });

    const spawnGif = () => {
      setGifs(prev => {
        // Filter out zones and icons that are already active
        const availableZones = [0, 1, 2, 3, 4, 5, 6, 7].filter(z => !prev.some(g => g.zone === z));
        const availableIcons = POPULAR_GIFS.filter(src => !prev.some(g => g.src === src));
        
        if (availableZones.length === 0 || availableIcons.length === 0) return prev; 
        
        const zoneIndex = availableZones[Math.floor(Math.random() * availableZones.length)];
        const zone = ZONES[zoneIndex];
        
        idCounter.current += 1;
        
        // Add a tiny bit of randomness to the zone's base position
        const left = zone.left + (Math.random() * 6 - 3); 
        const top = zone.top + (Math.random() * 6 - 3);
        const size = Math.random() * 40 + 100; // 100px to 140px (Larger size as requested)
        const duration = Math.random() * 2 + 3.5; // 3.5s to 5.5s (Faster animation)

        const newGif: FloatingGif = {
          id: idCounter.current,
          src: availableIcons[Math.floor(Math.random() * availableIcons.length)],
          left,
          top,
          size,
          duration,
          zone: zoneIndex,
          driftX: Math.random() * 40 - 20, // -20px to 20px
          rotStart: Math.random() * 20 - 10, // -10deg to 10deg
          rotEnd: Math.random() * 30 - 15, // -15deg to 15deg
        };

        // Remove after duration
        setTimeout(() => {
          setGifs(currentGifs => currentGifs.filter(g => g.id !== newGif.id));
        }, duration * 1000);

        return [...prev, newGif];
      });
    };

    // Faster interval so they appear more frequently
    const interval = setInterval(spawnGif, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <style>{`
        @keyframes float-gif-anim {
          0% {
            opacity: 0;
            transform: translate3d(0, 40px, 0) scale(0.8) rotate(var(--rot-start));
          }
          8% {
            opacity: var(--max-opacity);
            transform: translate3d(calc(var(--drift-x) * 0.1), 30px, 0) scale(0.9) rotate(calc(var(--rot-start) * 0.8));
          }
          75% {
            opacity: var(--max-opacity);
            transform: translate3d(calc(var(--drift-x) * 0.75), -20px, 0) scale(1.05) rotate(calc(var(--rot-end) * 0.5));
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--drift-x), -60px, 0) scale(1.15) rotate(var(--rot-end));
          }
        }
      `}</style>
      
      {/* Preload images to avoid pop-in */}
      <div style={{ display: 'none' }}>
        {POPULAR_GIFS.map(src => <img key={src} src={src} alt="preload" />)}
      </div>

      {gifs.map((gif) => {
        const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        const actualTheme = themeMode === 'system' ? (systemPrefersLight ? 'light' : 'dark') : themeMode;
        const isDark = actualTheme === 'dark';

        return (
          <img
            key={gif.id}
            src={gif.src}
            alt="floating exercise"
            style={{
              position: 'absolute',
              left: `${gif.left}%`,
              top: `${gif.top}%`,
              width: `${gif.size}px`,
              height: `${gif.size}px`,
              objectFit: 'contain',
              marginLeft: `-${gif.size/2}px`,
              marginTop: `-${gif.size/2}px`,
              opacity: 0, // Starts at 0, animation handles it
              willChange: 'transform, opacity',
              animation: `float-gif-anim ${gif.duration}s ease-in-out forwards`,
              '--max-opacity': isDark ? 0.4 : 0.5,
              '--drift-x': `${gif.driftX}px`,
              '--rot-start': `${gif.rotStart}deg`,
              '--rot-end': `${gif.rotEnd}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
