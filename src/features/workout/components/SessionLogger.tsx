import React from 'react';
import { GripVertical, Plus, Trophy, Check } from 'lucide-react';
import type { SetLog } from '../../../types';
import { DEFAULT_EXERCISES } from '../../../data/exercises';

interface Props {
  activeExercises: string[];
  loggedData: Record<string, SetLog[]>;
  weightUnit: string;
  onOpenExercise: (name: string) => void;
  onSave: () => void;
  handleTouchStart: (index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  draggingIndex: number | null;
  customExercises: Record<string, string[]>;
  t: (k: any) => string;
}

export function SessionLogger({
  activeExercises, loggedData, weightUnit, onOpenExercise, onSave,
  handleTouchStart, handleTouchMove, handleTouchEnd, draggingIndex, customExercises, t
}: Props) {
  const loggedCount = Object.keys(loggedData).filter(k => activeExercises.includes(k)).length;
  const totalVolume = Object.values(loggedData).flat().reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label" style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1.5px', marginBottom: '4px' }}>{t('todaySummary')}</div>
            <div style={{ fontSize: '22px', fontWeight: '900' }}>{loggedCount}/{activeExercises.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="section-label" style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1.5px', marginBottom: '4px' }}>{t('totalVolume')}</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-color)' }}>
              {totalVolume.toFixed(0)} {t(weightUnit as any)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeExercises.map((name, index) => {
          const isDragging = draggingIndex === index;
          return (
            <div 
              key={name} 
              data-index={index} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)',
                zIndex: isDragging ? 100 : 1,
                scale: isDragging ? 1.05 : 1,
                background: isDragging ? 'var(--glass-bg)' : 'transparent',
                borderRadius: isDragging ? '16px' : '0',
                boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--accent-color-alpha)' : 'none',
                padding: isDragging ? '0 12px' : '0',
                border: isDragging ? '1.5px solid var(--accent-color)' : 'none'
              }}
            >
              <div 
                onTouchStart={() => handleTouchStart(index)} 
                onTouchMove={handleTouchMove} 
                onTouchEnd={handleTouchEnd} 
                style={{ 
                  color: isDragging ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.25)', 
                  padding: '10px',
                  cursor: 'grab'
                }}
              >
                <GripVertical size={20} strokeWidth={isDragging ? 3 : 2} />
              </div>
              <button 
                onClick={() => onOpenExercise(name)} 
                disabled={isDragging}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '14px 0', background: 'none', border: 'none', 
                  flex: 1, textAlign: 'left',
                  pointerEvents: isDragging ? 'none' : 'auto'
                }}
              >
                <div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '900', 
                    color: loggedData[name] ? 'var(--accent-color)' : 'var(--text-primary)', 
                    fontFamily: 'Outfit, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative'
                  }}>
                    {loggedData[name] && (
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'rgba(255, 140, 0, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #FF8C00',
                        boxShadow: '0 0 10px rgba(255, 140, 0, 0.4)'
                      }}>
                        <Check size={14} color="#FF8C00" strokeWidth={4} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={loggedData[name] ? {
                        WebkitBackgroundClip: 'text',
                        backgroundImage: 'linear-gradient(90deg, var(--accent-color) 0%, #fff 50%, var(--accent-color) 100%)',
                        backgroundSize: '200% auto',
                        WebkitTextFillColor: 'transparent',
                        animation: 'text-shimmer 4s linear infinite',
                        opacity: 0.9
                      } : {}}>
                        {name}
                      </span>
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: '900', 
                        color: 'var(--accent-color)', 
                        opacity: 0.5, 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        marginTop: '2px',
                        WebkitTextFillColor: 'initial' // Ensure visibility
                      }}>
                        {(() => {
                          for (const [group, exercises] of Object.entries(DEFAULT_EXERCISES)) {
                            if ((exercises as string[]).includes(name)) return group;
                          }
                          for (const [group, exercises] of Object.entries(customExercises)) {
                            if ((exercises as string[]).includes(name)) return group;
                          }
                          return '';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                <Plus size={16} color="var(--text-secondary)" />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <button 
          onClick={onSave} 
          style={{ 
            background: 'rgba(var(--accent-rgb, 50, 97, 68), 0.1)',
            border: '1px solid var(--accent-color)',
            color: 'var(--accent-color)',
            padding: '12px 30px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '900',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px var(--accent-color-alpha)',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            touchAction: 'manipulation'
          }}
        >
          <Trophy size={16} strokeWidth={3} /> 
          {t('finishSession').toUpperCase()}
        </button>
      </div>
    </div>
  );
}
