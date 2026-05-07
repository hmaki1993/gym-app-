import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, X, ChevronRight, GripVertical, Search } from 'lucide-react';
import { EXERCISE_TRANSLATIONS } from '../../../data/exercises';
import gsap from 'gsap';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  filteredExercises: string[];
  activeExercises: string[];
  onToggle: (name: string) => void;
  onAddCustom: (name: string, translation?: string) => void;
  onRemove: (name: string, isCustom: boolean) => void;
  onReorder: (newOrder: string[]) => void;
  isRtl: boolean;
  t: (k: any) => string;
  weightUnit: string;
  getLastSession: (name: string) => any;
  customExercises: string[];
  customTranslations?: Record<string, string>;
}

export function ExercisePicker({
  search, onSearchChange, filteredExercises, activeExercises, onToggle,
  onAddCustom, onRemove, onReorder, isRtl, t, weightUnit,
  getLastSession, customExercises, customTranslations
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Animate overlay in
  useEffect(() => {
    if (showSearch && overlayRef.current && searchBarRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      gsap.fromTo(searchBarRef.current,
        { y: -40, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.05 }
      );
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [showSearch]);

  // Animate results in when they appear
  useEffect(() => {
    if (showSearch && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('.search-result-item');
      if (items.length > 0) {
        gsap.fromTo(items,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.04, duration: 0.25, ease: 'power2.out' }
        );
      }
    }
  }, [search, showSearch]);

  const closeSearch = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in',
        onComplete: () => {
          setShowSearch(false);
          onSearchChange('');
        }
      });
    } else {
      setShowSearch(false);
      onSearchChange('');
    }
  };

  const handleToggleWithAnimation = (name: string, el: HTMLDivElement | null) => {
    if (el) {
      const isCurrentlySelected = activeExercises.includes(name);
      if (!isCurrentlySelected) {
        gsap.timeline()
          .to(el, { scale: 0.94, duration: 0.06, ease: 'power2.in' })
          .to(el, { scale: 1.04, duration: 0.12, ease: 'power3.out' })
          .to(el, { scale: 1.0, duration: 0.2, ease: 'elastic.out(1.2, 0.5)' });
      } else {
        gsap.timeline()
          .to(el, { scale: 0.96, duration: 0.08, ease: 'power2.in' })
          .to(el, { scale: 1.0, duration: 0.15, ease: 'power2.out' });
      }
    }
    onToggle(name);
  };

  const handleTouchStart = (index: number) => setDraggingIndex(index);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) return;
    const touchY = e.touches[0].clientY;
    const targetElement = document.elementFromPoint(e.touches[0].clientX, touchY);
    const targetItem = targetElement?.closest('[data-index]');
    if (targetItem) {
      const targetIndex = parseInt(targetItem.getAttribute('data-index') || '-1');
      if (targetIndex !== -1 && targetIndex !== draggingIndex) {
        const newOrder = [...filteredExercises];
        const item = newOrder[draggingIndex];
        newOrder.splice(draggingIndex, 1);
        newOrder.splice(targetIndex, 0, item);
        onReorder(newOrder);
        setDraggingIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => setDraggingIndex(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, userSelect: draggingIndex !== null ? 'none' : 'auto' }}>

      {showSearch && ReactDOM.createPortal(
        <div
          ref={overlayRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
          }}
        >
          {/* X Button - Top Right */}
          <button
            onClick={closeSearch}
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top) + 20px)',
              right: '20px',
              background: 'rgba(255, 0, 0, 0.15)',
              border: '1.5px solid rgba(255, 0, 0, 0.35)',
              borderRadius: '50%',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#ff4444', zIndex: 1,
              boxShadow: '0 0 16px rgba(255,0,0,0.2)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(255,0,0,0.5)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,0,0,0.15)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255,0,0,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={18} strokeWidth={3} />
          </button>

          {/* Search Bar */}
          <div ref={searchBarRef} style={{ padding: '0 20px 20px' }}>
            {/* Premium Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '5px', textTransform: 'uppercase', color: '#ff5e00', marginBottom: '6px' }}>
                POWER GRID
              </div>
              <div style={{ fontSize: '28px', fontWeight: '950', color: '#fff', fontFamily: 'Outfit, sans-serif', letterSpacing: '-1px', lineHeight: 1 }}>
                Find Exercise
              </div>
              <div style={{ width: '40px', height: '2px', background: 'linear-gradient(to right, transparent, var(--accent-color), transparent)', margin: '10px auto 0', borderRadius: '2px' }} />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '2px solid var(--accent-color)',
              borderRadius: '20px',
              padding: '16px 20px',
              boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 30px var(--accent-color-alpha), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <Search size={22} color="var(--accent-color)" strokeWidth={2.5} style={{ flexShrink: 0, filter: 'drop-shadow(0 0 6px var(--accent-color))' }} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && search.trim() && filteredExercises.length === 0) {
                    onAddCustom(search.trim());
                    closeSearch();
                  }
                  if (e.key === 'Escape') closeSearch();
                }}
                placeholder=""
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: '20px', fontWeight: '700', color: '#fff',
                  fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px'
                }}
              />
            </div>

            {/* Add Custom Hint */}
            {search.trim() && filteredExercises.length === 0 && (
              <div
                onClick={() => { onAddCustom(search.trim()); closeSearch(); }}
                style={{
                  marginTop: '12px', padding: '14px 18px',
                  background: 'rgba(var(--accent-rgb, 50, 97, 68), 0.15)',
                  border: '1px dashed var(--accent-color)',
                  borderRadius: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <Plus size={18} color="var(--accent-color)" strokeWidth={3} />
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>
                  Add "{search.trim()}" as custom exercise
                </span>
              </div>
            )}
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="hide-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)', display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            {filteredExercises.map((name, _i) => {
              const isSelected = activeExercises.includes(name);
              const lastData = getLastSession(name);
              const isCustom = customExercises?.includes(name);

              return (
                <div
                  key={name}
                  className="search-result-item"
                  onClick={() => {
                    handleToggleWithAnimation(name, null);
                    if (!isSelected) closeSearch();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: isSelected
                      ? 'rgba(255, 61, 0, 0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: isSelected
                      ? '1px solid rgba(255, 61, 0, 0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderLeft: isSelected ? '3px solid #ff3d00' : '3px solid transparent',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px', fontWeight: '800',
                      color: isSelected ? '#ff3d00' : '#fff',
                      fontFamily: 'Outfit, sans-serif'
                    }}>{name}</div>
                    {(EXERCISE_TRANSLATIONS[name] || customTranslations?.[name]) && (
                      <div style={{
                        fontSize: '12px', color: isSelected ? 'rgba(255,61,0,0.7)' : 'rgba(255,255,255,0.4)',
                        fontWeight: '700', marginTop: '2px', fontFamily: 'Outfit, sans-serif'
                      }}>
                        {EXERCISE_TRANSLATIONS[name] || customTranslations?.[name]}
                      </div>
                    )}
                    {lastData && (
                      <div style={{
                        fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                        marginTop: '4px', fontWeight: '800', letterSpacing: '0.5px'
                      }}>
                        {t('lastSession').toUpperCase()}: {lastData.sets[0]?.weight} {t(weightUnit as any)} × {lastData.sets[0]?.reps}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSelected && (
                      <>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#ff3d00', boxShadow: '0 0 8px #ff3d00'
                        }} />
                        <button
                          onClick={e => { e.stopPropagation(); onRemove(name, isCustom); }}
                          style={{
                            padding: '4px 8px', background: 'rgba(255,0,0,0.1)',
                            border: '1px solid rgba(255,0,0,0.25)', borderRadius: '6px',
                            color: '#ff4444', cursor: 'pointer', fontSize: '10px',
                            fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px'
                          }}
                        >
                          <X size={10} strokeWidth={3} /> Remove
                        </button>
                      </>
                    )}
                    {!isSelected && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: '1.5px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Plus size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* ── SECTION HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
          <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.6 }}>
            {t('exercises') || 'Exercises'}
          </div>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          style={{
            background: 'rgba(255,61,0,0.08)',
            border: '1.5px solid rgba(255,61,0,0.3)',
            borderRadius: '50%',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#ff3d00',
            boxShadow: '0 0 12px rgba(255,61,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,61,0,0.18)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,61,0,0.4)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,61,0,0.08)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(255,61,0,0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {/* ── EXERCISE LIST ── */}
      <div
        className="hide-scroll"
        style={{ flex: 1, overflowY: draggingIndex !== null ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {filteredExercises.map((name, index) => {
          const isSelected = activeExercises.includes(name);
          const lastData = getLastSession(name);
          const isCustom = customExercises?.includes(name);
          const isDragging = draggingIndex === index;

          return (
            <div
              key={name}
              data-index={index}
              ref={(el) => { if (el) itemRefs.current.set(name, el); else itemRefs.current.delete(name); }}
              style={{
                display: 'flex', flexDirection: 'column',
                zIndex: isDragging ? 100 : 1,
                opacity: isDragging ? 0.7 : 1,
                transition: isDragging ? 'none' : 'opacity 0.2s ease',
                boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.4)' : 'none'
              }}
            >
              <div
                onClick={() => handleToggleWithAnimation(name, itemRefs.current.get(name) ?? null)}
                className="exercise-select-btn"
                role="button"
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 12px 12px 20px',
                  background: isSelected ? 'rgba(255, 61, 0, 0.06)' : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${isSelected ? 'rgba(255, 61, 0, 0.2)' : 'rgba(var(--theme-rgb), 0.06)'}`,
                  borderLeft: isSelected ? '3px solid #ff3d00' : '3px solid transparent',
                  width: '100%', cursor: 'pointer',
                  borderRadius: '0px',
                  transition: 'all 0.2s ease',
                  marginBottom: '0',
                  touchAction: 'manipulation'
                }}
              >
                <div
                  onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(index); }}
                  style={{
                    touchAction: 'none', padding: '8px',
                    marginRight: isRtl ? '0' : '4px', marginLeft: isRtl ? '4px' : '0',
                    color: isDragging ? 'var(--accent-color)' : 'var(--text-secondary)',
                    opacity: isDragging ? 1 : 0.3,
                    transition: 'color 0.2s ease'
                  }}
                >
                  <GripVertical size={20} />
                </div>

                <div style={{ textAlign: isRtl ? 'right' : 'left', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '18px', fontWeight: '800',
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)',
                      transition: 'color 0.3s ease', fontFamily: 'Outfit, sans-serif'
                    }}>{name}</div>
                  </div>
                  {(EXERCISE_TRANSLATIONS[name] || customTranslations?.[name]) && (
                    <div style={{
                      fontSize: '14px',
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                      fontWeight: '700', marginTop: '1px', opacity: 0.6, fontFamily: 'Outfit, sans-serif'
                    }}>
                      {EXERCISE_TRANSLATIONS[name] || customTranslations?.[name]}
                    </div>
                  )}
                  {lastData && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '800', opacity: 0.5, letterSpacing: '0.5px' }}>
                      {t('lastSession').toUpperCase()}: {lastData.sets[0]?.weight} {t(weightUnit as any)} × {lastData.sets[0]?.reps}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSelected && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 6px #ff3d00', flexShrink: 0 }} />
                  )}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(name, isCustom); }}
                      style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '6px', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '900', opacity: 0.7 }}
                    >
                      <X size={11} strokeWidth={3} /> Remove
                    </button>
                  )}
                  {!isSelected && <ChevronRight size={16} style={{ opacity: 0.15 }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
