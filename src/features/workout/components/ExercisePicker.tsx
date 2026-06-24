import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, RotateCcw, Trash2, Pen, Play, PlusCircle, ImageIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGymTracker } from '../../../hooks/useGymTracker';
import { DEFAULT_EXERCISES, EXERCISE_TRANSLATIONS, EXERCISE_DETAILS } from '../../../data/exercises';
import { EXERCISE_YOUTUBE_VIDEOS } from '../../../data/exerciseVideos';
import { getExerciseGifUrl } from '../../../data/premiumGifs';
import type { MuscleGroup } from '../../../types';

const FastGif = React.memo(({ src, alt, play = false, ready = true, priority = false }: { src: string; alt: string; play?: boolean; ready?: boolean; priority?: boolean }) => {
  const [thumbError, setThumbError] = React.useState(false);

  React.useEffect(() => {
    setThumbError(false);
  }, [src]);

  const cleanUrl = src.replace(/^https?:\/\//, '');
  const thumbnailUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&n=1&w=150`;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '6px', position: 'relative' }}>
      {ready && (
        <>
          <img 
            src={thumbError ? src : thumbnailUrl} 
            alt={alt} 
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            onError={() => setThumbError(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain', 
              position: 'absolute',
              opacity: play && !thumbError ? 0 : 1,
              transition: 'opacity 0.2s ease',
              zIndex: 1
            }} 
          />
          {play && (
            <img 
              src={src} 
              alt={alt} 
              decoding="async"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                position: 'absolute',
                zIndex: 2
              }} 
            />
          )}
        </>
      )}
    </div>
  );
});

const CustomPlus = ({ size = 16, color = 'var(--accent-color)' }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
  </svg>
);

// ── Custom Premium Scrollbar ──
interface FastScrollProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const FastScroll: React.FC<FastScrollProps> = ({ scrollRef }) => {
  const [progress, setProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [thumbHeight, setThumbHeight] = React.useState(60);

  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragStartY = React.useRef(0);
  const dragStartScrollTop = React.useRef(0);

  const updateMetrics = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    setVisible(canScroll);
    if (canScroll) {
      const h = Math.max(40, Math.min(120, (el.clientHeight / el.scrollHeight) * el.clientHeight));
      setThumbHeight(h);
    }
  }, [scrollRef]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (dragStartY.current !== 0 && isDragging) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        setProgress(0);
      } else {
        setProgress(scrollTop / maxScroll);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    updateMetrics();
    handleScroll();

    const ro = new ResizeObserver(updateMetrics);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [scrollRef, isDragging, updateMetrics]);

  const handleStart = (clientY: number) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartScrollTop.current = el.scrollTop;

    const trackRect = track.getBoundingClientRect();
    const relativeY = clientY - trackRect.top;
    const clickRatio = (relativeY - thumbHeight / 2) / (trackRect.height - thumbHeight);
    const targetRatio = Math.max(0, Math.min(1, clickRatio));

    el.scrollTop = targetRatio * (el.scrollHeight - el.clientHeight);
    setProgress(targetRatio);
  };

  const handleMove = (clientY: number) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track || !dragStartY.current) return;

    const trackRect = track.getBoundingClientRect();
    const maxScroll = el.scrollHeight - el.clientHeight;
    const deltaY = clientY - dragStartY.current;
    const trackAvailableHeight = trackRect.height - thumbHeight;

    if (trackAvailableHeight <= 0) return;

    const scrollPerPixel = maxScroll / trackAvailableHeight;
    let newScrollTop = dragStartScrollTop.current + deltaY * scrollPerPixel;
    newScrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));

    el.scrollTop = newScrollTop;
    setProgress(newScrollTop / maxScroll);
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartY.current = 0;
  };

  if (!visible) return null;

  const topOffset = progress * (100 - (thumbHeight / (scrollRef.current?.clientHeight || 1)) * 100);

  return (
    <div
      ref={trackRef}
      style={{
        position: 'absolute',
        right: 0,
        top: 8,
        bottom: 8,
        width: 44, // Generous 44px hit target for effortless mobile touch!
        zIndex: 100,
        touchAction: 'none',
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        handleStart(e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        handleMove(e.touches[0].clientY);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        handleEnd();
      }}
      onTouchCancel={(e) => {
        e.stopPropagation();
        handleEnd();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleStart(e.clientY);

        const onMouseMove = (moveEvent: MouseEvent) => {
          handleMove(moveEvent.clientY);
        };
        const onMouseUp = () => {
          handleEnd();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }}
    >
      {/* Scrollbar Track background line - centered at 14px from right of screen */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 20, // 20px from right of 44px container = 20px from right of screen (centered inside 28px list gutter)
          width: 4,
          background: isDragging 
            ? 'rgba(var(--theme-rgb), 0.12)' 
            : 'rgba(var(--theme-rgb), 0.05)',
          borderRadius: 2,
          transition: 'background-color 0.2s',
        }}
      />
      {/* Scrollbar Draggable Thumb - centered at 14px from right of screen */}
      <div
        style={{
          position: 'absolute',
          top: `${topOffset}%`,
          right: isDragging ? 18 : 19.5, // Center align the thumb (18px + 8px/2 = 22px; 19.5px + 5px/2 = 22px) -> which is 22px from right of 44px container = 22px from right of screen. Oh wait, if the track is at 20px right with width 4, its center is 20 + 4/2 = 22px. Perfect!
          width: isDragging ? 8 : 5,
          height: thumbHeight,
          background: isDragging 
            ? 'linear-gradient(to bottom, #E67E22, #D35400)' 
            : 'linear-gradient(to bottom, rgba(230, 126, 34, 0.75), rgba(211, 84, 0, 0.75))',
          borderRadius: 4,
          boxShadow: isDragging 
            ? '0 0 10px rgba(230, 126, 34, 0.6)' 
            : '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'width 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), right 0.15s, background-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  );
};

// ── Memoized Exercise Card ──



interface ExerciseItemCardProps {
  name: string;
  isFirst: boolean;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
  isDragging: boolean;
  isLight: boolean;
  gifUrl: string | null;
  isCustom: boolean;
  customTranslation: string | undefined;
  ready: boolean;
  onToggle: (name: string) => void;
  onExpand: (name: string) => void;
  onRename: (name: string) => void;
  onAliasSelect: (name: string) => void;
  onHide: (name: string) => void;
  onDragStart: (name: string) => void;
  onDragEnd: () => void;
  onDragCancel: () => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  priority?: boolean;
}

const formatDisplayName = (text: string) => {
  if (!text) return '';
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  let result = words[0];
  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1];
    const curr = words[i];
    const isLast = i === words.length - 1;
    
    if (curr.length === 1 && isLast) {
      result += '\u00A0' + curr;
    } else if (prev.length === 1) {
      result += '\u00A0' + curr;
    } else {
      result += ' ' + curr;
    }
  }
  return result;
};




const ExerciseItemCard = React.memo(({ 
  name, isFirst, index, 
  isActive, isExpanded, isDragging, isLight, gifUrl,
  isCustom, customTranslation, ready,
  onToggle, onExpand, onRename, onAliasSelect, onHide,
  onDragStart, onDragEnd, onDragCancel, itemRefs,
  priority = false
}: ExerciseItemCardProps) => {

  const [localActive, setLocalActive] = React.useState(isActive);
  const [touchPressing, setTouchPressing] = React.useState(false);
  React.useEffect(() => {
    setLocalActive(isActive);
  }, [isActive]);



  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = React.useRef(false);

  const expandTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const expandTouchMovedRef = React.useRef(false);

  const btnRef = React.useRef<HTMLDivElement>(null);
  const heightRef = React.useRef(0);
  const prevExpandedRef = React.useRef(isExpanded);

  React.useLayoutEffect(() => {
    if (btnRef.current) {
      const currentHeight = btnRef.current.offsetHeight;
      if (prevExpandedRef.current !== isExpanded) {
        const oldHeight = heightRef.current || (isExpanded ? 89 : 220);
        const newHeight = currentHeight;
        
        prevExpandedRef.current = isExpanded;
        
        gsap.fromTo(btnRef.current, 
          { height: oldHeight }, 
          { height: newHeight, duration: 0.14, ease: 'power2.out', clearProps: 'height', force3D: true }
        );
      }
      heightRef.current = currentHeight;
    }
  }, [isExpanded]);

  // Fired instantly on touchStart to know if we toggled already
  const toggledOnStartRef = React.useRef(false);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMovedRef.current = false;
    toggledOnStartRef.current = false;

    // ⚡ INSTANT visual feedback only (no parent state update yet)
    setTouchPressing(true);
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    if (dx > 8 || dy > 8) {
      touchMovedRef.current = true;
      if (touchPressing) {
        setTouchPressing(false); // remove visual feedback because we are scrolling
      }
    }
  }, [touchPressing]);

  const handleTouchEnd = React.useCallback(() => {
    setTouchPressing(false);
    if (!touchStartRef.current) return;
    
    // If user tapped without scrolling, commit the selection
    if (!touchMovedRef.current) {
      // Prevent browser synthetic click from firing later
      toggledOnStartRef.current = true;
      setLocalActive(prev => !prev);
      onToggle(name);
    }
    
    touchStartRef.current = null;
  }, [name, onToggle]);

  const handleExpandTouchStart = React.useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    expandTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    expandTouchMovedRef.current = false;
  }, []);

  const handleExpandTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!expandTouchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - expandTouchStartRef.current.x);
    const dy = Math.abs(touch.clientY - expandTouchStartRef.current.y);
    if (dx > 6 || dy > 6) {
      expandTouchMovedRef.current = true;
    }
  }, []);

  const handleExpandTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (!expandTouchStartRef.current) return;
    expandTouchStartRef.current = null;
    if (!expandTouchMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      onExpand(name);
    }
  }, [name, onExpand]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    // Block synthetic click fired by browser after touchStart — already toggled on touch
    if (toggledOnStartRef.current) {
      e.preventDefault();
      e.stopPropagation();
      toggledOnStartRef.current = false; // reset so next real click works
      return;
    }
    // Real mouse click (desktop/web)
    setLocalActive(prev => !prev);
    onToggle(name);
  }, [name, onToggle]);

  // Show active OR pressing state instantly on touch
  const visuallyActive = localActive || touchPressing;

  const cardBg = isLight
    ? (visuallyActive ? 'linear-gradient(135deg, rgba(230, 126, 34, 0.15) 0%, rgba(245, 245, 250, 1) 100%)' : 'rgba(255, 255, 255, 1)')
    : (visuallyActive ? 'linear-gradient(135deg, rgba(230, 126, 34, 0.18) 0%, rgba(32, 32, 40, 1) 100%)' : 'rgba(30, 30, 38, 1)');

  const cardBorder = visuallyActive
    ? '2px solid #E67E22'
    : (isLight ? '2px solid rgba(0, 0, 0, 0.05)' : '2px solid rgba(255, 255, 255, 0.04)');

  const cardShadow = isDragging
    ? (isLight 
        ? '0 24px 48px -8px rgba(0,0,0,0.22), 0 0 0 3px #E67E22'
        : '0 24px 48px -8px rgba(0,0,0,0.65), 0 0 0 3px #E67E22')
    : (isLight
        ? '0 4px 16px -4px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.06), inset 0 1px 0 #ffffff'
        : '0 8px 28px -8px rgba(0,0,0,0.55), 0 4px 10px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)');

  const gifContainerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    bottom: 0,
    top: isExpanded ? undefined : 0,
    width: isExpanded ? 145 : 85,
    height: isExpanded ? 145 : undefined,
    background: gifUrl ? '#ffffff' : 'transparent', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRight: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderTopLeftRadius: isExpanded ? 0 : 10,
    borderBottomLeftRadius: isExpanded ? 20 : 10,
    transition: 'width 0.14s cubic-bezier(0.16, 1, 0.3, 1), height 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 5
  };

  const hasSubtitle = !!((EXERCISE_TRANSLATIONS[name] && EXERCISE_TRANSLATIONS[name] !== name) || (customTranslation && customTranslation !== name));

  const renderControls = () => (
    <div onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} 
      style={{ 
        position: 'absolute', 
        top: isExpanded ? (hasSubtitle ? '39px' : '29px') : '50%', 
        transform: 'translateY(-50%)',
        right: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        zIndex: 15,
        transition: 'top 0.14s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onTouchStart={handleExpandTouchStart}
          onTouchMove={handleExpandTouchMove}
          onTouchEnd={handleExpandTouchEnd}
          onClick={(e) => { 
            e.stopPropagation(); 
            onExpand(name); 
          }}
          style={{
            background: 'rgba(var(--accent-secondary-rgb, 230, 126, 34), 0.12)',
            border: '1px solid rgba(var(--accent-secondary-rgb, 230, 126, 34), 0.3)',
            padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 1,
            width: 40, height: 40,
            borderRadius: 12,
            boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.3)',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease'
          }}>
          <img 
            src="/assets/right-arrow.png" 
            alt="Toggle" 
            style={{ 
              width: 22, 
              height: 22, 
              objectFit: 'contain',
              transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
              transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
          />
        </button>
      <div
        onTouchStart={e => { e.stopPropagation(); onDragStart(name); }}
        onMouseDown={e => { e.stopPropagation(); onDragStart(name); }}
        onTouchEnd={e => { e.stopPropagation(); onDragEnd(); }}
        onTouchMove={() => onDragCancel()}
        onMouseUp={e => { e.stopPropagation(); onDragEnd(); }}
        onMouseLeave={e => { e.stopPropagation(); onDragEnd(); }}
        style={{ 
          touchAction: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          width: 40, height: 40,
          borderRadius: 12, 
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', 
          color: 'var(--text-primary)', flexShrink: 0, 
          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.3)'
        }}>
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
          {/* Column 1 */}
          <circle cx="6" cy="3" r="1.8" fill="#E67E22" />
          <circle cx="6" cy="8" r="1.8" fill="#E67E22" />
          <circle cx="6" cy="13" r="1.8" fill="#E67E22" />
          <circle cx="6" cy="18" r="1.8" fill="#E67E22" />
          <circle cx="6" cy="23" r="1.8" fill="#E67E22" />
          {/* Column 2 */}
          <circle cx="13" cy="3" r="1.8" fill="#E67E22" />
          <circle cx="13" cy="8" r="1.8" fill="#E67E22" />
          <circle cx="13" cy="13" r="1.8" fill="#E67E22" />
          <circle cx="13" cy="18" r="1.8" fill="#E67E22" />
          <circle cx="13" cy="23" r="1.8" fill="#E67E22" />
          {/* Column 3 */}
          <circle cx="20" cy="3" r="1.8" fill="#E67E22" />
          <circle cx="20" cy="8" r="1.8" fill="#E67E22" />
          <circle cx="20" cy="13" r="1.8" fill="#E67E22" />
          <circle cx="20" cy="18" r="1.8" fill="#E67E22" />
          <circle cx="20" cy="23" r="1.8" fill="#E67E22" />
        </svg>
      </div>
    </div>
  );

  return (
    <div 
      data-index={index} 
      ref={el => { if (el) itemRefs.current.set(name, el); else itemRefs.current.delete(name); }} 
      style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: isDragging ? 100 : (isExpanded ? 12 : (isActive ? 11 : index + 2)), 
        position: 'relative', 
        marginTop: isFirst ? '0px' : '8px',
      }}
    >
      <div 
        ref={btnRef}
        onClick={handleClick} 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="exercise-select-btn" 
        role="button" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'stretch', 
          background: cardBg, 
          border: cardBorder, 
          borderRadius: isExpanded ? 20 : 12, 
          cursor: 'pointer', 
          touchAction: 'manipulation', 
          outline: 'none', 
          WebkitTapHighlightColor: 'transparent', 
          boxShadow: cardShadow, 
          transition: 'background 0.05s, border 0.05s, transform 0.05s, border-radius 0.14s',
          transform: isDragging ? 'scale(1.04) rotate(-1.5deg)' : 'translate3d(0, 0, 0)', 
          WebkitTransform: isDragging ? 'scale(1.04) rotate(-1.5deg)' : 'translate3d(0, 0, 0)',
          opacity: isDragging ? 0.9 : 1,
          overflow: 'hidden',
          padding: 0,
          willChange: 'height, transform',
          position: 'relative',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {/* Absolute GIF Container */}
        <div style={gifContainerStyle}>
          {gifUrl ? (
            <FastGif src={gifUrl} alt={name} play={isExpanded} ready={ready} priority={priority} />
          ) : isCustom ? (
            <div 
              onClick={(e) => { e.stopPropagation(); onAliasSelect(name); }}
              onTouchStart={(e) => { e.stopPropagation(); }}
              style={{
                width: 'calc(100% - 24px)', height: 'calc(100% - 24px)',
                borderRadius: 12, background: 'rgba(var(--theme-rgb), 0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '1px solid rgba(var(--theme-rgb), 0.02)'
              }}
            >
              <PlusCircle size={24} color="var(--text-primary)" strokeWidth={2.5} style={{ opacity: 0.7 }} />
            </div>
          ) : (
            <Play size={32} color="rgba(var(--theme-rgb), 0.06)" fill="rgba(var(--theme-rgb), 0.06)" strokeWidth={0} />
          )}
          {localActive && (
            <div style={{ 
              position: 'absolute', top: 6, right: 6, width: 20, height: 20, 
              borderRadius: '50%', background: '#E67E22', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              zIndex: 2, border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(230, 126, 34, 0.35)'
            }}>
              <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                <path d="M1.5 5l2.5 2.5L10.5 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        {isExpanded ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%',
            animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            {/* Header section (premium row attached at the top) */}
            <div style={{
              width: '100%',
              padding: '20px 18px 16px 18px',
              background: isLight ? 'rgba(230, 126, 34, 0.06)' : 'rgba(230, 126, 34, 0.1)',
              borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left',
              paddingRight: 96,
              position: 'relative'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 950,
                color: 'var(--text-primary)',
                fontFamily: 'var(--heading-font)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.2
              }}>
                {formatDisplayName(name)}
              </div>
              {((EXERCISE_TRANSLATIONS[name] && EXERCISE_TRANSLATIONS[name] !== name) || (customTranslation && customTranslation !== name)) && (
                <div style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: localActive ? '#E67E22' : 'rgba(var(--theme-rgb), 0.45)',
                  fontFamily: 'var(--heading-font)',
                  lineHeight: 1.2
                }}>
                  {formatDisplayName(EXERCISE_TRANSLATIONS[name] || customTranslation || '')}
                </div>
              )}
            </div>

            {/* Body Row (leaving room for the absolute GIF on the left) */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'stretch', 
              width: '100%', 
              height: 145,
              boxSizing: 'border-box',
              paddingLeft: 145
            }}>
              {/* Actions list container on the right */}
              <div style={{ 
                padding: '12px 16px', 
                display: 'flex', flexDirection: 'column', 
                justifyContent: 'center',
                alignItems: 'flex-end',
                flex: 1, minWidth: 0, alignSelf: 'stretch',
                gap: 10
              }}>
                {isCustom && (
                  <button onClick={e => { e.stopPropagation(); onAliasSelect(name); }} onTouchStart={e => e.stopPropagation()} 
                    style={{ width: 'fit-content', background: 'rgba(var(--theme-rgb), 0.08)', border: '1.5px dashed rgba(var(--theme-rgb), 0.5)', borderRadius: 24, padding: '8px 20px', color: 'rgb(var(--theme-rgb))', cursor: 'pointer', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '1.2px', textTransform: 'uppercase', boxShadow: 'none', transition: 'transform 0.1s ease' }}>
                    <ImageIcon size={13} strokeWidth={2.5} /> {gifUrl ? 'Edit GIF' : 'Link GIF'}
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); onRename(name); }} onTouchStart={e => e.stopPropagation()} 
                  style={{ width: 'fit-content', background: 'rgba(var(--theme-rgb), 0.08)', border: '1.5px dashed rgba(var(--theme-rgb), 0.5)', borderRadius: 24, padding: '8px 20px', color: 'rgb(var(--theme-rgb))', cursor: 'pointer', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '1.2px', textTransform: 'uppercase', boxShadow: 'none', transition: 'transform 0.1s ease' }}>
                  <Pen size={13} strokeWidth={2.5} /> Rename
                </button>
                <button onClick={e => { e.stopPropagation(); onHide(name); }} onTouchStart={e => e.stopPropagation()} 
                  style={{ width: 'fit-content', background: 'rgba(231, 76, 60, 0.08)', border: '1.5px dashed rgba(231, 76, 60, 0.5)', borderRadius: 24, padding: '8px 20px', color: '#e74c3c', cursor: 'pointer', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '1.2px', textTransform: 'uppercase', boxShadow: 'none', transition: 'transform 0.1s ease' }}>
                  <Trash2 size={13} strokeWidth={2.5} /> Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            width: '100%',
            minHeight: 85,
            paddingLeft: 85,
            boxSizing: 'border-box',
            position: 'relative'
          }}>
            {/* Info & Actions */}
            <div style={{ 
              padding: '6px 8px', 
              display: 'flex', flexDirection: 'column', 
              justifyContent: 'center',
              flex: 1, minWidth: 0, alignSelf: 'stretch'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, 
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  paddingRight: 92
                }}>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: 800, color: 'var(--text-primary)', 
                    fontFamily: "var(--heading-font)", lineHeight: 1.2, 
                    whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word', width: '100%',
                    letterSpacing: '-0.3px', textAlign: 'center'
                  }}>
                    {formatDisplayName(name)}
                  </div>
                  {((EXERCISE_TRANSLATIONS[name] && EXERCISE_TRANSLATIONS[name] !== name) || (customTranslation && customTranslation !== name)) && (
                    <div style={{ 
                      fontSize: 11.5, 
                      color: localActive ? '#E67E22' : 'rgba(var(--theme-rgb), 0.45)', 
                      fontWeight: 800, fontFamily: "var(--heading-font)", 
                      whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word', width: '100%',
                      marginTop: 2, textAlign: 'center'
                    }}>
                      {formatDisplayName(EXERCISE_TRANSLATIONS[name] || customTranslation || '')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Controls outside the conditional blocks */}
        {renderControls()}
      </div>
    </div>
  );
});

const DEFAULT_EXERCISE_TO_MUSCLE_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  Object.entries(DEFAULT_EXERCISES).forEach(([mg, exs]) => {
    (exs as string[]).forEach(ex => {
      map[ex] = mg;
    });
  });
  return map;
})();

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  muscleGroup: string;
  activeExercises: string[];
  onToggle: (name: string) => void;
  tracker: ReturnType<typeof useGymTracker>;
  t: (key: string) => string;
  onRename?: (oldName: string, newName: string) => void;
}

const ExercisePickerInner = React.memo<Props>(({ search, onSearchChange, muscleGroup, activeExercises, onToggle, onRename, tracker, t }) => {
  const deferredMuscleGroup = muscleGroup;
  const lang = tracker.settings.language;
  const isRtl = lang === 'ar';
  const customTranslations = (tracker.state as any).customTranslations || {};
  const isLight = tracker.settings.themeMode === 'light';

  const [showSearch, setShowSearch] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [renamingExercise, setRenamingExercise] = useState<string | null>(null);
  const [aliasSelectorOpen, setAliasSelectorOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<string | null>(null);
  const [exercisesList, setExercisesList] = useState<any[] | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [localExerciseOrder, setLocalExerciseOrder] = useState<string[] | null>(null);
  const [prevMuscleGroup, setPrevMuscleGroup] = useState(deferredMuscleGroup);
  const [prevSearch, setPrevSearch] = useState(search);

  if (deferredMuscleGroup !== prevMuscleGroup || search !== prevSearch) {
    setPrevMuscleGroup(deferredMuscleGroup);
    setPrevSearch(search);
    setLocalExerciseOrder(null);
  }

  const localOrderRef = useRef<string[] | null>(null);
  useEffect(() => {
    localOrderRef.current = localExerciseOrder;
  }, [localExerciseOrder]);
  // True only after the modal slide-up animation finishes — prevents GIF fetch during animation
  const [modalReady, setModalReady] = useState(false);
  const modalReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickerReady = true;
  const renderFull = true;

  // Cache of already-preloaded GIF URLs so we never double-fetch
  const preloadedGifs = useRef<Set<string>>(new Set());
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: resolve GIF url for an exercise name
  const getGifUrl = (name: string): string | null => {
    return getExerciseGifUrl(name, tracker.state.exerciseAliases);
  };

  // Preload GIF silently in the background (called on play button hover/touchstart)
  const preloadGif = (name: string) => {
    if (EXERCISE_YOUTUBE_VIDEOS[name]) return;
    const url = getGifUrl(name);
    if (!url || preloadedGifs.current.has(url)) return;
    preloadedGifs.current.add(url);
    const img = new Image();
    img.src = url;
  };

  // Reset gif/modal state whenever exercise changes
  useEffect(() => {
    if (modalReadyTimer.current) clearTimeout(modalReadyTimer.current);
    if (selectedVideoExercise) {
      setModalReady(true);
    } else {
      setModalReady(false);
    }
    return () => { if (modalReadyTimer.current) clearTimeout(modalReadyTimer.current); };
  }, [selectedVideoExercise]);

  useEffect(() => {
    return () => {
      if (dragTimer.current) clearTimeout(dragTimer.current);
    };
  }, []);

  const handlePlayClick = async (name: string) => {
    setSelectedVideoExercise(name);
    if (exercisesList) return;

    setLoadingVideos(true);
    try {
      const res = await fetch('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json');
      if (res.ok) {
        const data = await res.json();
        setExercisesList(data);
      }
    } catch (err) {
      console.error('Error fetching exercise videos dataset:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const matchedExerciseData = React.useMemo(() => {
    if (!selectedVideoExercise || !exercisesList) return null;
    const cleanName = selectedVideoExercise.trim().toLowerCase();
    let match = exercisesList.find(e => e.name.toLowerCase() === cleanName);
    if (!match) {
      match = exercisesList.find(e => cleanName.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(cleanName));
    }
    return match;
  }, [selectedVideoExercise, exercisesList]);

  const hqGifUrl = React.useMemo(() => {
    if (!selectedVideoExercise) return null;
    return getExerciseGifUrl(selectedVideoExercise, tracker.state.exerciseAliases);
  }, [selectedVideoExercise, tracker.state.exerciseAliases]);

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchResultsRef = React.useRef<HTMLDivElement>(null);
  const mainListRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef(new Map<string, HTMLElement>());

  const { fullList, baseList, deletedExercises, hiddenExercises, customExercises } = React.useMemo(() => {
    const deleted = (tracker.state as any).deletedExercises?.[deferredMuscleGroup as MuscleGroup] || [];
    const hidden = tracker.hiddenExercises?.[deferredMuscleGroup as MuscleGroup] || [];
    const custom = tracker.customExercises[deferredMuscleGroup as MuscleGroup] || [];
    const base = (DEFAULT_EXERCISES[deferredMuscleGroup as MuscleGroup] || []).filter((e: string) => !hidden.includes(e) && !deleted.includes(e));
    const full = Array.from(new Set([...base, ...custom.filter((e: string) => !hidden.includes(e))]));
    return { fullList: full, baseList: base, deletedExercises: deleted, hiddenExercises: hidden, customExercises: custom };
  }, [tracker.state.deletedExercises, tracker.hiddenExercises, tracker.customExercises, deferredMuscleGroup]);

  // Search logic: should also find hidden default exercises
  const searchFullList = React.useMemo(() => {
    return Array.from(new Set([...(DEFAULT_EXERCISES[deferredMuscleGroup as MuscleGroup] || []), ...customExercises]));
  }, [deferredMuscleGroup, customExercises]);

  const filteredExercises = React.useMemo(() => {
    const exerciseOrder = tracker.exerciseOrder?.[deferredMuscleGroup as MuscleGroup];
    return [...fullList]
      .sort((a, z) => {
        const ai = exerciseOrder?.indexOf(a) ?? -1, bi = exerciseOrder?.indexOf(z) ?? -1;
        if (ai === -1 && bi === -1) return 0; if (ai === -1) return 1; if (bi === -1) return -1;
        return ai - bi;
      })
      .filter(e => e.toLowerCase().includes(search.toLowerCase()));
  }, [fullList, tracker.exerciseOrder, deferredMuscleGroup, search]);

  // Search results in the overlay should show EVERYTHING matching
  const searchFiltered = React.useMemo(() => {
    return searchFullList
      .filter(e => e.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.length - b.length);
  }, [searchFullList, search]);

  // Memoize custom exercise mapping to avoid rebuilding it on every log check
  const customExerciseMap = React.useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_EXERCISE_TO_MUSCLE_MAP };
    Object.entries(tracker.customExercises).forEach(([mg, exs]) => {
      exs.forEach(ex => { map[ex] = mg; });
    });
    return map;
  }, [tracker.customExercises]);

  // Archived exercises (highly optimized loops)
  const archivedExercises = React.useMemo(() => {
    const archived = new Set<string>([...hiddenExercises]);
    const len = tracker.logs.length;
    for (let i = 0; i < len; i++) {
      const log = tracker.logs[i];
      const exs = log.exercises;
      const exLen = exs.length;
      for (let j = 0; j < exLen; j++) {
        const ex = exs[j];
        const mg = ex.muscleGroup || customExerciseMap[ex.name] || log.muscleGroup;
        if (mg === deferredMuscleGroup) {
          archived.add(ex.name);
        }
      }
    }
    const visible = new Set([...baseList, ...customExercises.filter((e: string) => !hiddenExercises.includes(e))]);
    deletedExercises.forEach((e: string) => { if (!hiddenExercises.includes(e)) archived.delete(e); });
    visible.forEach((e: string) => archived.delete(e));
    return Array.from(archived).sort();
  }, [deferredMuscleGroup, tracker.logs, hiddenExercises, deletedExercises, customExercises, baseList, customExerciseMap]);

  // Custom exercise detection for search overlay
  const searchTrimmed = search.trim();
  const isNewExercise = !!searchTrimmed && !fullList.some(e => e.toLowerCase() === searchTrimmed.toLowerCase());
  const customGifUrl = isNewExercise ? getExerciseGifUrl(searchTrimmed, tracker.state.exerciseAliases) : null;

  useEffect(() => {
    if (showSearch && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out' });
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [showSearch]);

  // Removed gsap stagger animation on search results for performance

  const closeSearch = () => {
    if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in', onComplete: () => { setShowSearch(false); onSearchChange(''); } });
    else { setShowSearch(false); onSearchChange(''); }
  };

  const toggleWithAnim = (name: string) => {
    // If selecting from search and it was hidden/deleted, restore it to main list
    const isHidden = hiddenExercises.includes(name);
    const isDeleted = deletedExercises.includes(name);
    if (isHidden || isDeleted) {
      tracker.restoreExercise(muscleGroup as MuscleGroup, name);
    }

    onToggle(name);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) return;
    const t2 = e.touches[0];
    const el = document.elementFromPoint(t2.clientX, t2.clientY)?.closest('[data-index]');
    if (el) {
      const idx = parseInt(el.getAttribute('data-index') || '-1');
      if (idx !== -1 && idx !== draggingIndex) {
        setLocalExerciseOrder(prev => {
          const arr = [...(prev || filteredExercises)];
          const [item] = arr.splice(draggingIndex, 1);
          arr.splice(idx, 0, item);
          return arr;
        });
        setDraggingIndex(idx);
      }
    }
  };

  // Keep latest refs of props without triggering useCallback recreations
  const callbacksRef = React.useRef({ onToggle, onRename, tracker });
  callbacksRef.current = { onToggle, onRename, tracker };

  // Stable callbacks for ExerciseItemCard (so React.memo works)
  const stableOnToggle = React.useCallback((name: string) => {
    const { tracker: t, onToggle: toggle } = callbacksRef.current;
    const isHidden = (t.state as any).hiddenExercises?.[muscleGroup]?.includes(name);
    const isDeleted = (t.state as any).deletedExercises?.[muscleGroup]?.includes(name);
    if (isHidden || isDeleted) t.restoreExercise(muscleGroup as MuscleGroup, name);
    toggle(name);
  }, [muscleGroup]);

  const stableOnExpand = React.useCallback((name: string) => {
    setExpandedExercise(prev => prev === name ? null : name);
  }, []);

  const stableOnRename = React.useCallback((name: string) => {
    setRenamingExercise(name);
  }, []);

  const stableOnAliasSelect = React.useCallback((name: string) => {
    setAliasSelectorOpen(name);
  }, []);

  const stableOnHide = React.useCallback((name: string) => {
    callbacksRef.current.tracker.hideDefaultExercise(muscleGroup as MuscleGroup, name);
  }, [muscleGroup]);

  const stableOnDragStart = React.useCallback((name: string) => {
    const list = localOrderRef.current || filteredExercises;
    const idx = list.indexOf(name);
    if (idx !== -1) {
      setDraggingIndex(idx);
    }
  }, [filteredExercises]);

  const stableOnDragEnd = React.useCallback(() => {
    if (dragTimer.current) { clearTimeout(dragTimer.current); dragTimer.current = null; }
    setDraggingIndex(null);
    if (localOrderRef.current) {
      tracker.reorderExercises(muscleGroup as MuscleGroup, localOrderRef.current);
    }
  }, [muscleGroup, tracker]);

  const stableOnDragCancel = React.useCallback(() => {
    if (dragTimer.current) { clearTimeout(dragTimer.current); dragTimer.current = null; }
  }, []);

  const renderExerciseItem = (name: string, isFirst: boolean, index: number, priority = false) => {
    return (
      <ExerciseItemCard
        key={name}
        name={name}
        isFirst={isFirst}
        index={index}
        isActive={activeExercises.includes(name)}
        isExpanded={expandedExercise === name}
        isDragging={draggingIndex === index}
        isLight={isLight}
        gifUrl={getGifUrl(name)}
        isCustom={tracker.customExercises[muscleGroup as MuscleGroup]?.includes(name) || false}
        customTranslation={customTranslations[name]}
        ready={pickerReady}
        onToggle={stableOnToggle}
        onExpand={stableOnExpand}
        onRename={stableOnRename}
        onAliasSelect={stableOnAliasSelect}
        onHide={stableOnHide}
        onDragStart={stableOnDragStart}
        onDragEnd={stableOnDragEnd}
        onDragCancel={stableOnDragCancel}
        itemRefs={itemRefs}
        priority={priority}
      />
    );
  };

  // Split into recent (logged) and others (memoized, removing dead exerciseMap logic)
  const { recentNames, otherNames } = React.useMemo(() => {
    const recent: string[] = [];
    const other: string[] = [];
    const list = localExerciseOrder || filteredExercises;
    list.forEach(name => {
      if (tracker.getLastSession(name)) {
        recent.push(name);
      } else {
        other.push(name);
      }
    });
    return { recentNames: recent, otherNames: other };
  }, [localExerciseOrder, filteredExercises, tracker]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, userSelect: draggingIndex === null ? 'auto' : 'none' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slide-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .exercise-select-btn,
        .exercise-select-btn:focus {
          -webkit-tap-highlight-color: transparent !important;
          outline: none !important;
        }
        .exercise-select-btn:hover,
        .exercise-select-btn:hover::before {
          /* no hover effect on desktop */
        }
        .exercise-select-btn:active {
          transform: scale(0.99) !important;
        }
      `}</style>

      {selectedVideoExercise && ReactDOM.createPortal(
        <div 
          onClick={() => setSelectedVideoExercise(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 11000,
            background: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(10,10,12,0.45)', 
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          {/* Animate only this outer wrapper — keeps the inner card static so GIF compositing is clean */}
          <div
            style={{
              width: '100%', maxWidth: 400,
              animation: 'slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              width: '100%',
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(25,25,30,0.7)', 
              border: '1.5px solid var(--glass-border)',
              borderRadius: 32, padding: '24px 20px', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--elite-shadow)',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            {/* Header with names */}
            <div style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: '#E67E22', marginBottom: 6 }}>
                {t('motionGuide3d')}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-primary)', fontFamily: "var(--heading-font)", margin: 0, letterSpacing: -0.5 }}>
                {selectedVideoExercise}
              </h2>
              {((EXERCISE_TRANSLATIONS[selectedVideoExercise] && EXERCISE_TRANSLATIONS[selectedVideoExercise] !== selectedVideoExercise) || (customTranslations[selectedVideoExercise] && customTranslations[selectedVideoExercise] !== selectedVideoExercise)) && (
                <div style={{ fontSize: 16, color: '#D35400', fontWeight: 900, marginTop: 4 }}>
                  {EXERCISE_TRANSLATIONS[selectedVideoExercise] || customTranslations[selectedVideoExercise]}
                </div>
              )}
            </div>

            {/* Video / GIF Animation Container */}
            <div style={{ 
              width: '100%', height: 260, 
              borderRadius: 24, overflow: 'hidden', 
              background: selectedVideoExercise && EXERCISE_YOUTUBE_VIDEOS[selectedVideoExercise] ? '#000000' : '#ffffff',
              border: '1px solid rgba(var(--theme-rgb), 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)',
            }}>
              {selectedVideoExercise && EXERCISE_YOUTUBE_VIDEOS[selectedVideoExercise] ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${EXERCISE_YOUTUBE_VIDEOS[selectedVideoExercise]}?autoplay=1&mute=1&loop=1&playlist=${EXERCISE_YOUTUBE_VIDEOS[selectedVideoExercise]}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                  title={selectedVideoExercise || 'Exercise Video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : hqGifUrl ? (
                <>
                  {(!modalReady) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 2 }}>
                      <div style={{ width: 32, height: 32, border: '3px solid rgba(var(--theme-rgb), 0.1)', borderTopColor: '#E67E22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {t('loading3d')}
                      </span>
                    </div>
                  )}
                  {modalReady && (
                    <img 
                      src={hqGifUrl}
                      alt={selectedVideoExercise || ''}
                      onLoad={() => {}}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 3
                      }} 
                    />
                  )}
                </>
              ) : matchedExerciseData ? (
                <>
                  {(!modalReady || loadingVideos) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 2 }}>
                      <div style={{ width: 32, height: 32, border: '3px solid rgba(var(--theme-rgb), 0.1)', borderTopColor: '#E67E22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {t('loading3d')}
                      </span>
                    </div>
                  )}

                  {/* Clean ExerciseDB GIF */}
                  {modalReady && (
                    <img
                      src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${matchedExerciseData.gif_url}`}
                      alt={selectedVideoExercise || ''}
                      onLoad={() => {}}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 3
                      }} 
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Fallback for custom exercises not found in dataset */}
                  {!loadingVideos && (
                    <div style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>🏋️‍♂️</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {t('customExerciseYt')}
                      </span>
                      <a 
                        href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(selectedVideoExercise || '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          padding: '10px 16px', background: 'rgba(255, 0, 0, 0.12)', 
                          border: '1px solid #ff4444', borderRadius: 12, 
                          color: '#ff4444', fontWeight: 900, textDecoration: 'none',
                          fontSize: 12, display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        🎥 {t('searchYoutube')}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Muscle Details */}
            {matchedExerciseData && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(var(--theme-rgb), 0.08)', border: '1px solid rgba(var(--theme-rgb), 0.1)', padding: '4px 10px', borderRadius: 8, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  🎯 {t('targetLabel')} {matchedExerciseData.target}
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(var(--theme-rgb), 0.08)', border: '1px solid rgba(var(--theme-rgb), 0.1)', padding: '4px 10px', borderRadius: 8, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  ⚙️ {t('equipmentLabel')} {matchedExerciseData.equipment}
                </span>
              </div>
            )}

            {/* Instructions */}
            <div style={{ 
              maxHeight: 180, overflowY: 'auto', 
              background: 'rgba(var(--theme-rgb), 0.04)', borderRadius: 20, 
              padding: '14px 16px', border: '1px solid rgba(var(--theme-rgb), 0.06)'
            }} className="hide-scrollbar">
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                {t('howToPerform')}
              </div>
              {EXERCISE_DETAILS[selectedVideoExercise] ? (
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, textAlign: lang === 'ar' ? 'right' : 'left', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                  {EXERCISE_DETAILS[selectedVideoExercise][lang as 'en' | 'ar'] || EXERCISE_DETAILS[selectedVideoExercise].en}
                </p>
              ) : matchedExerciseData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                  {matchedExerciseData.instruction_steps?.en?.map((step: string, sIdx: number) => (
                    <div key={sIdx} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.35, display: 'flex', gap: 6 }}>
                      <span style={{ color: '#E67E22', fontWeight: 900 }}>{sIdx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  )) || (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
                      {matchedExerciseData.instructions?.en || matchedExerciseData.instructions || 'No details available.'}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 800, textAlign: 'center' }}>
                  {t('noInstructions')}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedVideoExercise(null)}
              style={{ 
                width: '100%', height: 48, borderRadius: 16,
                background: 'rgba(230, 126, 34, 0.08)',
                border: '1.5px solid rgba(230, 126, 34, 0.35)',
                color: '#E67E22', fontWeight: 950, fontSize: 13,
                cursor: 'pointer', fontFamily: "var(--heading-font)",
                letterSpacing: 1.5, textTransform: 'uppercase',
                transition: 'all 0.2s ease', outline: 'none'
              }}
            >
              {t('closeGuide')}
            </button>
          </div>
          </div>{/* end animation wrapper */}
        </div>,
        document.body
      )}

      {/* Search overlay portal */}
      {showSearch && ReactDOM.createPortal(
        <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: isLight ? 'rgba(246, 247, 249, 0.96)' : 'rgba(10, 10, 12, 0.96)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
          <button onClick={closeSearch} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', right: 20, background: 'none', border: 'none', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1, padding: 0 }}>
            <img src="/assets/close-custom.png" alt="Close" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          </button>
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#E67E22', marginBottom: 6 }}>POWER GRID</div>
              <div style={{ fontSize: 28, fontWeight: 950, color: 'var(--text-primary)', fontFamily: "var(--heading-font)", letterSpacing: -1, lineHeight: 1 }}>Find Exercise</div>
              <div style={{ width: 40, height: 2, background: 'linear-gradient(to right, transparent, var(--accent-color), transparent)', margin: '10px auto 0', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--theme-rgb), 0.14)', border: '1px solid rgba(var(--theme-rgb), 0.1)', borderBottom: '2px solid var(--accent-color)', borderRadius: 20, padding: '16px 20px' }}>
              <Search size={22} color="var(--accent-color)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <input ref={searchInputRef} value={search} onChange={e => onSearchChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && isNewExercise) { tracker.addCustomExercise(muscleGroup as MuscleGroup, searchTrimmed); onToggle(searchTrimmed); closeSearch(); } if (e.key === 'Escape') closeSearch(); }} placeholder="" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "var(--heading-font)" }} />
            </div>
            {isNewExercise && (
              <div onClick={() => { tracker.addCustomExercise(muscleGroup as MuscleGroup, searchTrimmed); onToggle(searchTrimmed); closeSearch(); }} style={{ marginTop: 12, padding: '14px 18px', background: 'rgba(var(--accent-rgb, 0, 230, 118), 0.15)', border: '1px dashed var(--accent-color)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                {customGifUrl && (
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
                    <img src={customGifUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <CustomPlus size={18} color="var(--accent-color)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-color)', fontFamily: "var(--heading-font)" }}>Add "{searchTrimmed}" as custom exercise</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
            <div ref={searchResultsRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 28px 0 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {searchFiltered.map(name => {
              const isActive = activeExercises.includes(name);
              const lastSession = tracker.getLastSession(name);
              const gifUrl = getExerciseGifUrl(name, tracker.state.exerciseAliases);
              return (
                <div key={name} className="search-result-item" onClick={() => { toggleWithAnim(name); if (!isActive) closeSearch(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isActive ? 'rgba(230, 126, 34, 0.28)' : 'rgba(var(--theme-rgb), 0.12)', border: isActive ? '1px solid rgba(230, 126, 34, 0.4)' : '1px solid rgba(var(--theme-rgb), 0.16)', borderLeft: isActive ? '3px solid #E67E22' : '3px solid transparent', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{
                    width: 55,
                    height: 55,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {gifUrl ? (
                      <FastGif src={gifUrl} alt={name} play={false} ready={true} priority={false} />
                    ) : (
                      <Play size={20} color="rgba(var(--theme-rgb), 0.06)" fill="rgba(var(--theme-rgb), 0.06)" strokeWidth={0} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isActive ? '#D35400' : 'var(--text-primary)', fontFamily: "var(--heading-font)" }}>{name}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClick(name);
                        }}
                        onMouseEnter={() => preloadGif(name)}
                        onTouchStart={(e) => { e.stopPropagation(); preloadGif(name); }}
                        style={{
                          background: 'rgba(230, 126, 34, 0.1)',
                          border: '1.5px solid rgba(230, 126, 34, 0.25)',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#E67E22',
                          padding: 0,
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          marginLeft: '4px'
                        }}
                      >
                        <Play size={8} fill="#E67E22" strokeWidth={0} />
                      </button>
                    </div>
                    {EXERCISE_TRANSLATIONS[name] && EXERCISE_TRANSLATIONS[name] !== name && <div style={{ fontSize: 13, color: '#D35400', opacity: 0.9, marginTop: 2, fontWeight: 900, fontFamily: "var(--heading-font)" }}>{EXERCISE_TRANSLATIONS[name]}</div>}
                    {lastSession && (() => {
                      const displayUnit = tracker.getDisplayUnit(name, muscleGroup as MuscleGroup);
                      const convertedWeight = tracker.convertWeight(lastSession.bestSet?.weight || 0, lastSession.bestSet?.unit || 'kg', displayUnit);
                      const roundedWeight = Number(convertedWeight.toFixed(1));
                      return (
                        <div style={{ fontSize: 10, color: isLight ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: 4, fontWeight: isLight ? 950 : 800, opacity: isLight ? 0.95 : 0.8, letterSpacing: '0.5px' }}>
                          {t('lastSession').toUpperCase()}: {roundedWeight} {t(displayUnit as any)} × {lastSession.bestSet?.reps}
                        </div>
                      );
                    })()}
                  </div>
                  {isActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); onToggle(name); }} style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 6, color: '#ff4444', cursor: 'pointer', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <img src="/assets/close-custom.png" alt="Remove" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(var(--theme-rgb), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CustomPlus size={14} color="rgba(var(--theme-rgb), 0.5)" />
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            <FastScroll scrollRef={searchResultsRef} />
          </div>
        </div>,
        document.body
      )}

      {/* Rename Bottom Sheet */}
      {renamingExercise && (
        <RenameSheet
          name={renamingExercise}
          isLight={isLight}
          onSave={(newName) => { 
            tracker.renameExercise(muscleGroup as MuscleGroup, renamingExercise, newName); 
            if (onRename) onRename(renamingExercise, newName);
            setRenamingExercise(null); 
          }}
          onClose={() => setRenamingExercise(null)}
        />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px 0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-color)',  }} />
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.9 }}>{t('exercises') || 'Exercises'}</div>
          {activeExercises.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 950, color: 'var(--accent-color)', background: 'rgba(var(--accent-rgb, 0, 230, 118), 0.06)', borderRadius: 10, padding: '2px 8px', lineHeight: '18px', fontFamily: "var(--heading-font)", letterSpacing: '0.5px' }}>{activeExercises.length}</div>
          )}
        </div>
        <button onClick={() => setShowSearch(true)} style={{ background: 'rgba(230, 126, 34,0.08)', border: '1.5px solid rgba(230, 126, 34,0.3)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#E67E22',  transition: 'all 0.2s ease' }}>
          <CustomPlus size={18} color="#E67E22" />
        </button>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div ref={mainListRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '0 28px 0 2px' }} onTouchMove={handleTouchMove} onTouchEnd={stableOnDragEnd}>

        {recentNames.length > 0 && (
          <>
            <div style={{ padding: '10px 4px 6px', display: 'flex', alignItems: 'center', gap: 8, background: 'transparent' }}>
              <RotateCcw size={14} color="#E67E22" strokeWidth={3} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#E67E22', letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'تمارينك السابقة' : 'My Recent Exercises'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(renderFull ? recentNames : recentNames.slice(0, 6)).map((name, idxInList) => {
                const isFirst = idxInList === 0;
                const isPriority = idxInList < 6;
                return renderExerciseItem(name, isFirst, (localExerciseOrder || filteredExercises).indexOf(name), isPriority);
              })}
            </div>
          </>
        )}
        {otherNames.length > 0 && recentNames.length > 0 && (
          <div style={{ padding: '12px 4px 6px', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)', opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'بقية التمارين' : 'All Other Exercises'}</span>
          </div>
        )}
        {otherNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(renderFull ? otherNames : otherNames.slice(0, 4)).map((name, idxInList) => {
              const isFirst = idxInList === 0;
              const isPriority = (recentNames.length + idxInList) < 6;
              return renderExerciseItem(name, isFirst, (localExerciseOrder || filteredExercises).indexOf(name), isPriority);
            })}
          </div>
        )}

        {/* Archive */}
        {archivedExercises.length > 0 && (
          <div style={{ marginTop: 24, paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase' }}>{isRtl ? 'الأرشيف' : 'ARCHIVE'}</div>
              </div>
            </div>
            {archivedExercises.map(name => (
              <div 
                key={name} 
                onClick={() => tracker.restoreExercise(muscleGroup as MuscleGroup, name)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'transparent', borderBottom: '1px solid rgba(var(--theme-rgb), 0.1)', transition: 'all 0.2s ease' }}
              >
                <div 
                  style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "var(--heading-font)", opacity: 0.7 }}
                >
                  {name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); setRenamingExercise(name); }} style={{ background: 'transparent', border: 'none', padding: 6, color: '#D35400', opacity: 1, cursor: 'pointer' }}>
                    <Pen size={14} strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); tracker.restoreExercise(muscleGroup as MuscleGroup, name); }} style={{ background: 'transparent', border: 'none', padding: 6, color: 'var(--accent-color)', opacity: 0.6, cursor: 'pointer' }}>
                    <RotateCcw size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm([name]); }} style={{ background: 'transparent', border: 'none', padding: 6, color: '#ff4444', opacity: 0.5, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          <div style={{ height: 'max(20px, env(safe-area-inset-bottom))', flexShrink: 0 }} />
        </div>
        <FastScroll scrollRef={mainListRef} />
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(10,10,12,0.45)', 
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ 
            width: '100%', maxWidth: 340, 
            background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(25,25,30,0.55)', 
            border: '1.5px solid var(--glass-border)',
            borderRadius: 32, padding: '40px 24px', textAlign: 'center',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'var(--elite-shadow)',
            animation: 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
            <div style={{ fontSize: 22, fontWeight: 950, color: 'var(--text-primary)', marginBottom: 8, fontFamily: "var(--heading-font)", letterSpacing: -0.5 }}>DELETE FOREVER</div>
            <div style={{ fontSize: 14, color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.6)', marginBottom: 32, fontWeight: 700, lineHeight: 1.4 }}>
              Are you sure you want to permanently delete "{deleteConfirm[0]}"?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                style={{ 
                  flex: 1, height: 54, borderRadius: 16, 
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)', 
                  border: isLight ? '1.5px solid rgba(0,0,0,0.1)' : '1.5px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-primary)', fontWeight: 900, cursor: 'pointer', fontSize: 15, fontFamily: "var(--heading-font)" 
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => { deleteConfirm.forEach(n => tracker.permanentlyDeleteExercise(muscleGroup as MuscleGroup, n)); setDeleteConfirm(null); }} 
                style={{ 
                  flex: 1, height: 54, borderRadius: 16, 
                  background: isLight ? 'rgba(255,50,50,0.1)' : 'rgba(255,50,50,0.2)', 
                  border: '1.5px solid #ff4444', 
                  color: '#ff4444', fontWeight: 950, cursor: 'pointer', fontSize: 15, fontFamily: "var(--heading-font)" 
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {aliasSelectorOpen && ReactDOM.createPortal(
        <div onClick={() => setAliasSelectorOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(25,25,32,0.85)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', padding: '28px 20px', borderRadius: 32, width: '100%', maxWidth: 460, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: isLight ? '0 30px 60px rgba(0,0,0,0.12)' : '0 30px 60px rgba(0,0,0,0.5)', border: isLight ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(var(--theme-rgb), 0.1)', color: 'rgb(var(--theme-rgb))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <ImageIcon size={24} strokeWidth={2.5} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontFamily: 'var(--heading-font)', fontSize: 24, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 950, letterSpacing: -0.5 }}>Link Animation</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600, lineHeight: 1.4 }}>
              Select a matching GIF for <br/><span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>"{aliasSelectorOpen}"</span>
            </p>
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'block', paddingBottom: 10, paddingRight: 4, paddingLeft: 4 }}>
              {DEFAULT_EXERCISES[muscleGroup as MuscleGroup]?.map(stdName => (
                <div 
                  key={stdName} 
                  onClick={() => { tracker.setExerciseAlias(aliasSelectorOpen, stdName); setAliasSelectorOpen(null); }}
                  style={{ 
                    marginBottom: 16,
                    background: isLight ? 'rgba(255, 255, 255, 1)' : 'rgba(40, 40, 50, 0.4)', 
                    border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)', 
                    borderRadius: 24, 
                    overflow: 'hidden',
                    cursor: 'pointer', 
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ width: '100%', height: 200, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.04) 100%)' }} />
                    <img src={getExerciseGifUrl(stdName) || ''} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', borderTop: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--heading-font)', lineHeight: 1.2 }}>
                      {stdName}
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(var(--theme-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--theme-rgb))' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setAliasSelectorOpen(null)} style={{ flex: 1, height: 44, padding: '0 12px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', borderRadius: 16, fontWeight: 900, border: isLight ? '1.5px solid rgba(0,0,0,0.08)' : '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'var(--heading-font)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Cancel
              </button>
              {tracker.state.exerciseAliases?.[aliasSelectorOpen] && (
                <button 
                  onClick={() => { tracker.setExerciseAlias(aliasSelectorOpen, ''); setAliasSelectorOpen(null); }} 
                  style={{ flex: 1, height: 44, padding: '0 12px', background: 'rgba(231, 76, 60, 0.08)', color: '#e74c3c', borderRadius: 16, fontWeight: 900, border: '1.5px dashed rgba(231, 76, 60, 0.4)', cursor: 'pointer', fontFamily: 'var(--heading-font)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Remove Link
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

// Premium Rename Bottom Sheet
const RenameSheet: React.FC<{ name: string; isLight: boolean; onSave: (n: string) => void; onClose: () => void }> = ({ name, isLight, onSave, onClose }) => {
  const [val, setVal] = React.useState(name);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (sheetRef.current) {
      gsap.fromTo(sheetRef.current, { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'power4.out' });
    }
  }, []);

  const handleSave = () => {
    if (val.trim() && val.trim() !== name) onSave(val.trim());
    else onClose();
  };

  const handleClose = () => {
    if (sheetRef.current) {
      gsap.to(sheetRef.current, { y: 200, opacity: 0, duration: 0.15, ease: 'power4.in', onComplete: onClose });
    } else onClose();
  };

  return ReactDOM.createPortal(
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div ref={sheetRef} onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 20, 25, 0.7)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: '24px 24px 0 0',
        padding: '16px 20px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: isLight ? '1.5px solid rgba(0, 0, 0, 0.12)' : '1.5px solid rgba(255, 255, 255, 0.12)',
        borderBottom: 'none',
        boxShadow: isLight ? '0 -10px 40px rgba(0, 0, 0, 0.05)' : '0 -10px 40px rgba(0, 0, 0, 0.3)',
      }}>
        <div onClick={handleClose} style={{ padding: '8px 0 16px', margin: '-8px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#E67E22', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16, opacity: 0.8, textAlign: 'center' }}>Rename Exercise</div>
        
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            ref={inputRef}
            value={val}
            dir="auto"
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleClose(); }}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '2px solid #E67E22',
              borderRadius: 16, padding: '16px 18px',
              color: 'var(--text-primary)', fontSize: 18, fontWeight: 800,
              outline: 'none', fontFamily: "var(--heading-font)",
              textAlign: 'start',
              userSelect: 'text', WebkitUserSelect: 'text',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <button 
          onClick={handleSave} 
          style={{ 
            width: '100%', 
            height: 44, 
            borderRadius: 12, 
            background: 'rgba(230, 126, 34, 0.08)', 
            border: '1.5px solid rgba(230, 126, 34, 0.35)', 
            color: '#E67E22', 
            fontWeight: 950, 
            fontSize: 13, 
            cursor: 'pointer', 
            fontFamily: "var(--heading-font)", 
            letterSpacing: 1.5, 
            textTransform: 'uppercase',
            boxShadow: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          Save Name
        </button>
      </div>
    </div>,
    document.body
  );
};



const ExercisePicker: React.FC<Props> = ({ search, onSearchChange, muscleGroup, activeExercises, onToggle, onRename, tracker, t }) => {
  return (
    <ExercisePickerInner
      search={search}
      onSearchChange={onSearchChange}
      muscleGroup={muscleGroup}
      activeExercises={activeExercises}
      onToggle={onToggle}
      onRename={onRename}
      tracker={tracker}
      t={t}
    />
  );
};

export default ExercisePicker;
export { ExercisePicker };
