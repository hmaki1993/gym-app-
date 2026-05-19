import React from 'react';
import { GripVertical } from 'lucide-react';
import type { SetLog } from '../../../types';
import { DEFAULT_EXERCISES } from '../../../data/exercises';

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

interface Props {
  activeExercises: string[];
  loggedData: Record<string, SetLog[]>;
  weightUnit?: string;
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
  activeExercises, loggedData, onOpenExercise, onSave,
  handleTouchStart, handleTouchMove, handleTouchEnd, draggingIndex, customExercises, t
}: Props) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>

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
                    fontFamily: "'Montserrat', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative'
                  }}>
                    {loggedData[name] && (
                      <img src="/assets/check-custom.png" alt="Done" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={loggedData[name] ? {
                        color: 'var(--accent-color)',
                        opacity: 0.9
                      } : { color: 'var(--text-primary)' }}>
                        {name}
                      </span>
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: '900', 
                        color: 'var(--text-secondary)', 
                        opacity: 0.7, 
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
                <CustomPlus size={16} color="#FF8C00" />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 max(24px, env(safe-area-inset-bottom)) 0', marginTop: '16px' }}>
        <img
          src="/assets/button-stop-rect.png"
          alt="Finish Session"
          onClick={onSave}
          style={{
            height: '55px',
            width: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
          onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
    </div>
  );
}
