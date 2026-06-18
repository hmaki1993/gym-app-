import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, RotateCcw, Trash2, Pen, Play, PlusCircle, ImageIcon, Shrink } from 'lucide-react';
import gsap from 'gsap';
import { useGymTracker } from '../../../hooks/useGymTracker';
import { DEFAULT_EXERCISES, EXERCISE_TRANSLATIONS, EXERCISE_DETAILS } from '../../../data/exercises';
import { EXERCISE_YOUTUBE_VIDEOS } from '../../../data/exerciseVideos';
import { getExerciseGifUrl } from '../../../data/premiumGifs';
import type { MuscleGroup } from '../../../types';

const FastGif = React.memo(({ src, alt, play = false }: { src: string; alt: string; play?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!play && img && canvas) {
      const draw = () => {
        if (!canvas || !img.complete || img.naturalWidth === 0) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           canvas.width = img.naturalWidth;
           canvas.height = img.naturalHeight;
           ctx.drawImage(img, 0, 0);
        }
      };
      
      if (img.complete && img.naturalWidth > 0) {
        draw();
      } else {
        img.addEventListener('load', draw);
        return () => img.removeEventListener('load', draw);
      }
    }
  }, [src, play]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: '6px', position: 'relative' }}>
      <img 
        ref={imgRef}
        src={src} 
        alt={alt} 
        loading="lazy" 
        style={{ 
          width: play ? '100%' : 1, 
          height: play ? '100%' : 1, 
          objectFit: 'contain', 
          visibility: play ? 'visible' : 'hidden',
          position: play ? 'relative' : 'absolute',
          opacity: play ? 1 : 0
        }} 
      />
      {!play && (
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
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

// ── Memoized Exercise Card ──
// Only re-renders when THIS card's props change (not when sibling cards change)
const getFontSize = (text: string) => {
  if (text.length <= 12) return 21;
  if (text.length <= 18) return 19;
  if (text.length <= 25) return 17;
  return 15;
};

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
  onToggle: (name: string) => void;
  onExpand: (name: string) => void;
  onRename: (name: string) => void;
  onAliasSelect: (name: string) => void;
  onHide: (name: string) => void;
  onDragStart: (name: string) => void;
  onDragEnd: () => void;
  onDragCancel: () => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

const ExerciseItemCard = React.memo(({ 
  name, isFirst, index, 
  isActive, isExpanded, isDragging, isLight, gifUrl,
  isCustom, customTranslation, 
  onToggle, onExpand, onRename, onAliasSelect, onHide,
  onDragStart, onDragEnd, onDragCancel, itemRefs
}: ExerciseItemCardProps) => {

  const [localActive, setLocalActive] = React.useState(isActive);
  React.useEffect(() => {
    setLocalActive(isActive);
  }, [isActive]);

  const handleToggle = React.useCallback(() => {
    setLocalActive(!isActive);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onToggle(name);
      });
    });
  }, [isActive, name, onToggle]);

  const cardBg = isLight
    ? (localActive ? 'linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(245, 245, 250, 1) 100%)' : 'rgba(255, 255, 255, 1)')
    : (localActive ? 'linear-gradient(135deg, rgba(52, 152, 219, 0.18) 0%, rgba(32, 32, 40, 1) 100%)' : 'rgba(30, 30, 38, 1)');

  const cardBorder = localActive
    ? '2px solid #3498db'
    : (isLight ? '2px solid rgba(0, 0, 0, 0.05)' : '2px solid rgba(255, 255, 255, 0.04)');

  const cardShadow = isDragging
    ? (isLight 
        ? '0 24px 48px -8px rgba(0,0,0,0.22), 0 0 0 3px #3498db'
        : '0 24px 48px -8px rgba(0,0,0,0.65), 0 0 0 3px #3498db')
    : (isLight
        ? '0 4px 16px -4px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.06), inset 0 1px 0 #ffffff'
        : '0 8px 28px -8px rgba(0,0,0,0.55), 0 4px 10px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)');

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
        onClick={handleToggle} 
        className="exercise-select-btn" 
        role="button" 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'stretch', 
          background: cardBg, 
          border: cardBorder, 
          borderRadius: isExpanded ? 20 : 12, 
          cursor: 'pointer', 
          touchAction: 'manipulation', 
          outline: 'none', 
          WebkitTapHighlightColor: 'transparent', 
          boxShadow: cardShadow, 
          transition: 'background 0.05s, border 0.05s, transform 0.05s',
          transform: isDragging ? 'scale(1.04) rotate(-1.5deg)' : 'none', 
          opacity: isDragging ? 0.9 : 1,
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* GIF container */}
        <div style={{ 
          width: isExpanded ? 130 : 85, 
          minHeight: isExpanded ? 130 : 85,
          flexShrink: 0, 
          background: gifUrl ? '#ffffff' : 'transparent', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          borderRight: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
          alignSelf: 'stretch',
          overflow: 'hidden',
          borderTopLeftRadius: isExpanded ? 18 : 10,
          borderBottomLeftRadius: isExpanded ? 18 : 10
        }}>
          {gifUrl ? (
            <FastGif src={gifUrl} alt={name} play={isExpanded} />
          ) : isCustom ? (
            <div 
              onClick={(e) => { e.stopPropagation(); onAliasSelect(name); }}
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
              position: 'absolute', top: 8, right: 8, width: 22, height: 22, 
              borderRadius: '50%', background: '#3498db', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              zIndex: 2, border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(52,152,219,0.35)'
            }}>
              <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                <path d="M1.5 5l2.5 2.5L10.5 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div style={{ 
          padding: isExpanded ? '8px 8px' : '6px 8px', 
          display: 'flex', flexDirection: 'column', 
          justifyContent: isExpanded ? 'space-between' : 'center',
          flex: 1, minWidth: 0, alignSelf: 'stretch'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, 
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              paddingRight: 92
            }}>
              <div style={{ 
                fontSize: isExpanded ? getFontSize(name) : Math.max(11, getFontSize(name) - 3), 
                fontWeight: 800, color: 'var(--text-primary)', 
                fontFamily: "var(--heading-font)", lineHeight: 1.2, 
                whiteSpace: 'normal', wordBreak: 'break-word', width: '100%',
                letterSpacing: '-0.3px', textAlign: 'center'
              }}>
                {name}
              </div>
              {(EXERCISE_TRANSLATIONS[name] || customTranslation) && (
                <div style={{ 
                  fontSize: isExpanded ? 13.5 : 11.5, 
                  color: localActive ? '#2980b9' : 'rgba(var(--theme-rgb), 0.45)', 
                  fontWeight: 800, fontFamily: "var(--heading-font)", 
                  whiteSpace: 'normal', wordBreak: 'break-word', width: '100%',
                  marginTop: 2, textAlign: 'center'
                }}>
                  {EXERCISE_TRANSLATIONS[name] || customTranslation}
                </div>
              )}
            </div>
          </div>

          {isExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', marginTop: 12, alignItems: 'flex-end' }}>
              {gifUrl && isCustom && (
                <button onClick={e => { e.stopPropagation(); onAliasSelect(name); }} 
                  style={{ width: 'fit-content', background: 'rgba(52, 152, 219, 0.1)', border: '1.5px solid #3498db', borderRadius: 12, padding: '8px 16px', color: '#3498db', cursor: 'pointer', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '0.2px' }}>
                  <ImageIcon size={13} strokeWidth={2.5} /> Edit GIF
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); onRename(name); }} 
                style={{ width: 'fit-content', background: 'rgba(230, 126, 34, 0.1)', border: '1.5px solid #E67E22', borderRadius: 12, padding: '8px 16px', color: '#E67E22', cursor: 'pointer', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '0.2px' }}>
                <Pen size={13} strokeWidth={2.5} /> Rename
              </button>
              <button onClick={e => { e.stopPropagation(); onHide(name); }} 
                style={{ width: 'fit-content', background: 'rgba(231, 76, 60, 0.1)', border: '1.5px solid #e74c3c', borderRadius: 12, padding: '8px 16px', color: '#e74c3c', cursor: 'pointer', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "var(--heading-font)", letterSpacing: '0.2px' }}>
                <Trash2 size={13} strokeWidth={2.5} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div onClick={e => e.stopPropagation()} 
          style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, zIndex: 15 }}>
            <button onClick={(e) => { 
              e.stopPropagation(); 
              onExpand(name); 
            }}
              style={{
                background: isExpanded ? 'rgba(52, 152, 219, 0.1)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'),
                border: isExpanded ? '1px solid rgba(52, 152, 219, 0.3)' : (isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'),
                padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isExpanded ? '#3498db' : 'var(--text-primary)',
                opacity: isExpanded ? 1 : 0.7,
                width: 40, height: 40,
                borderRadius: 12,
                boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.3)',
                outline: 'none', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease'
              }}>
              {isExpanded ? (
                <Shrink size={22} strokeWidth={2.5} color="#3498db" />
              ) : (
                <img src="/assets/maximize.png" alt="More" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              )}
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
            <img src="/assets/dotted-line.png" alt="Drag" style={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </div>
  );
});

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

const ExercisePicker: React.FC<Props> = ({ search, onSearchChange, muscleGroup, activeExercises, onToggle, onRename, tracker, t }) => {
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
  // True only after the modal slide-up animation finishes — prevents GIF fetch during animation
  const [modalReady, setModalReady] = useState(false);
  const modalReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // Wait for modal animation (300ms) before allowing GIF to start fetching
  useEffect(() => {
    setModalReady(false);
    if (modalReadyTimer.current) clearTimeout(modalReadyTimer.current);
    if (selectedVideoExercise) {
      modalReadyTimer.current = setTimeout(() => setModalReady(true), 310);
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const deletedExercises = (tracker.state as any).deletedExercises?.[muscleGroup as MuscleGroup] || [];
  const hiddenExercises = tracker.hiddenExercises?.[muscleGroup as MuscleGroup] || [];
  const customExercises = tracker.customExercises[muscleGroup as MuscleGroup] || [];

  const b = DEFAULT_EXERCISES;
  const baseList = (b[muscleGroup as MuscleGroup] || []).filter((e: string) => !hiddenExercises.includes(e) && !deletedExercises.includes(e));
  const fullList = Array.from(new Set([...baseList, ...customExercises.filter((e: string) => !hiddenExercises.includes(e))]));
  
  // Search logic: should also find hidden default exercises
  const searchFullList = Array.from(new Set([...(b[muscleGroup as MuscleGroup] || []), ...customExercises]));
  
  const exerciseOrder = tracker.exerciseOrder?.[muscleGroup as MuscleGroup];
  const filteredExercises = [...fullList]
    .sort((a, z) => {
      const ai = exerciseOrder?.indexOf(a) ?? -1, bi = exerciseOrder?.indexOf(z) ?? -1;
      if (ai === -1 && bi === -1) return 0; if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    })
    .filter(e => e.toLowerCase().includes(search.toLowerCase()));

  // Search results in the overlay should show EVERYTHING matching
  const searchFiltered = searchFullList
    .filter(e => e.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.length - b.length);

  // Archived exercises
  const archivedExercises = React.useMemo(() => {
    const exerciseMap: Record<string, string> = {};
    Object.entries(b).forEach(([mg, exs]) => (exs as string[]).forEach(ex => { exerciseMap[ex] = mg; }));
    Object.entries(tracker.customExercises).forEach(([mg, exs]) => exs.forEach(ex => { exerciseMap[ex] = mg; }));
    const archived = new Set<string>([...hiddenExercises]);
    tracker.logs.forEach(log => {
      log.exercises.forEach((ex: any) => {
        const mg = ex.muscleGroup || exerciseMap[ex.name] || log.muscleGroup;
        if (mg === muscleGroup) archived.add(ex.name);
      });
    });
    const visible = new Set([...baseList, ...customExercises.filter((e: string) => !hiddenExercises.includes(e))]);
    deletedExercises.forEach((e: string) => { if (!hiddenExercises.includes(e)) archived.delete(e); });
    visible.forEach((e: string) => archived.delete(e));
    return Array.from(archived).sort();
  }, [muscleGroup, tracker.logs, hiddenExercises, deletedExercises, customExercises]);

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

  const stableOnDragStart = React.useCallback((_name: string) => {
    // drag start handled externally
  }, []);

  const stableOnDragEnd = React.useCallback(() => {
    if (dragTimer.current) { clearTimeout(dragTimer.current); dragTimer.current = null; }
    setDraggingIndex(null);
  }, []);

  const stableOnDragCancel = React.useCallback(() => {
    if (dragTimer.current) { clearTimeout(dragTimer.current); dragTimer.current = null; }
  }, []);

  const renderExerciseItem = (name: string, isFirst: boolean, index: number) => {
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
        onToggle={stableOnToggle}
        onExpand={stableOnExpand}
        onRename={stableOnRename}
        onAliasSelect={stableOnAliasSelect}
        onHide={stableOnHide}
        onDragStart={stableOnDragStart}
        onDragEnd={stableOnDragEnd}
        onDragCancel={stableOnDragCancel}
        itemRefs={itemRefs}
      />
    );
  };

  // Split into recent (logged) and others
  const exerciseMap: Record<string, string> = {};
  Object.entries(DEFAULT_EXERCISES).forEach(([mg, exs]) => (exs as string[]).forEach(ex => { exerciseMap[ex] = mg; }));
  Object.entries(tracker.customExercises).forEach(([mg, exs]) => exs.forEach(ex => { exerciseMap[ex] = mg; }));
  const recentNames: string[] = [], otherNames: string[] = [];
  (localExerciseOrder || filteredExercises).forEach(name => { tracker.getLastSession(name) ? recentNames.push(name) : otherNames.push(name); });

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
              {(EXERCISE_TRANSLATIONS[selectedVideoExercise] || customTranslations[selectedVideoExercise]) && (
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
          <div ref={searchResultsRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {searchFiltered.map(name => {
              const isActive = activeExercises.includes(name);
              const lastSession = tracker.getLastSession(name);
              return (
                <div key={name} className="search-result-item" onClick={() => { toggleWithAnim(name); if (!isActive) closeSearch(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isActive ? 'rgba(230, 126, 34, 0.28)' : 'rgba(var(--theme-rgb), 0.12)', border: isActive ? '1px solid rgba(230, 126, 34, 0.4)' : '1px solid rgba(var(--theme-rgb), 0.16)', borderLeft: isActive ? '3px solid #E67E22' : '3px solid transparent', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ flex: 1 }}>
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
                    {EXERCISE_TRANSLATIONS[name] && <div style={{ fontSize: 13, color: '#D35400', opacity: 0.9, marginTop: 2, fontWeight: 900, fontFamily: "var(--heading-font)" }}>{EXERCISE_TRANSLATIONS[name]}</div>}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
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
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }} onTouchMove={handleTouchMove} onTouchEnd={() => setDraggingIndex(null)}>
        {recentNames.length > 0 && (
          <>
            <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 8, background: 'transparent' }}>
              <RotateCcw size={14} color="#E67E22" strokeWidth={3} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#E67E22', letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'تمارينك السابقة' : 'My Recent Exercises'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 6px' }}>
              {recentNames.map((name, idxInList) => {
                const isFirst = idxInList === 0;
                return renderExerciseItem(name, isFirst, (localExerciseOrder || filteredExercises).indexOf(name));
              })}
            </div>
          </>
        )}
        {otherNames.length > 0 && recentNames.length > 0 && (
          <div style={{ padding: '12px 12px 6px', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)', opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'بقية التمارين' : 'All Other Exercises'}</span>
          </div>
        )}
        {otherNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 6px' }}>
            {otherNames.map((name, idxInList) => {
              const isFirst = idxInList === 0;
              return renderExerciseItem(name, isFirst, (localExerciseOrder || filteredExercises).indexOf(name));
            })}
          </div>
        )}

        {/* Archive */}
        {archivedExercises.length > 0 && (
          <div style={{ marginTop: 24, paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase' }}>{isRtl ? 'الأرشيف' : 'ARCHIVE'}</div>
              </div>
            </div>
            {archivedExercises.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'transparent', borderBottom: '1px solid rgba(var(--theme-rgb), 0.1)', transition: 'all 0.2s ease' }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--primary-bg)', padding: '24px 16px', borderRadius: 28, width: '100%', maxWidth: 460, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--heading-font)', fontSize: 22, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 900 }}>Link GIF</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 500 }}>Select the matching animation for "{aliasSelectorOpen}"</p>
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'block', paddingBottom: 10, paddingRight: 4, paddingLeft: 4 }}>
              {DEFAULT_EXERCISES[muscleGroup as MuscleGroup]?.map(stdName => (
                <div 
                  key={stdName} 
                  onClick={() => { tracker.setExerciseAlias(aliasSelectorOpen, stdName); setAliasSelectorOpen(null); }}
                  style={{ 
                    marginBottom: 16,
                    background: 'rgba(var(--theme-rgb), 0.03)', 
                    border: '1px solid rgba(var(--theme-rgb), 0.08)', 
                    borderRadius: 24, 
                    overflow: 'hidden',
                    cursor: 'pointer', 
                    display: 'block', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ width: '100%', height: 220, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(var(--theme-rgb), 0.04)', padding: 12 }}>
                    <img src={getExerciseGifUrl(stdName) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
                  </div>
                  <div style={{ padding: '16px 12px', fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--heading-font)', textAlign: 'center', lineHeight: 1.3 }}>
                    {stdName}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {tracker.state.exerciseAliases?.[aliasSelectorOpen] && (
                <button 
                  onClick={() => { tracker.setExerciseAlias(aliasSelectorOpen, ''); setAliasSelectorOpen(null); }} 
                  style={{ flex: 1, padding: '18px', background: 'rgba(255,50,50,0.1)', color: '#ff4444', borderRadius: 20, fontWeight: 900, border: 'none', cursor: 'pointer', fontFamily: 'var(--heading-font)', fontSize: 16 }}
                >
                  Remove Link
                </button>
              )}
              <button onClick={() => setAliasSelectorOpen(null)} style={{ flex: 1, padding: '18px', background: 'rgba(var(--theme-rgb), 0.08)', color: 'var(--text-primary)', borderRadius: 20, fontWeight: 900, border: 'none', cursor: 'pointer', fontFamily: 'var(--heading-font)', fontSize: 16 }}>Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

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
              borderRadius: 16, padding: '16px 48px 16px 18px',
              color: 'var(--text-primary)', fontSize: 18, fontWeight: 800,
              outline: 'none', fontFamily: "var(--heading-font)",
              textAlign: 'start',
              userSelect: 'text', WebkitUserSelect: 'text',
              transition: 'all 0.2s ease',
            }}
          />
          {val && (
            <button 
              onClick={() => { setVal(''); inputRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', padding: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: 0.8,
                zIndex: 1
              }}
            >
              <img src="/assets/close-custom.png" alt="Clear" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
            </button>
          )}
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

export default ExercisePicker;
export { ExercisePicker };
