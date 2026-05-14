import React from 'react';
import { GripVertical, Plus, Trophy } from 'lucide-react';

interface Props {
  activeExercises: string[];
  loggedData: Record<string, any[]>;
  weightUnit: string;
  onOpenExercise: (name: string) => void;
  onSave: () => void;
  handleTouchStart: (idx: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  draggingIndex: number | null;
  t: (k: string) => string;
}

const SessionLogger: React.FC<Props> = ({ activeExercises, loggedData, weightUnit, onOpenExercise, onSave, handleTouchStart, handleTouchMove, handleTouchEnd, draggingIndex, t }) => {
  const completedCount = Object.keys(loggedData).filter(k => activeExercises.includes(k)).length;
  const totalVolume = Object.values(loggedData).flat().reduce((sum, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
      {/* Summary header */}
      <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(var(--theme-rgb), 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">{t('todaySummary')}</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{completedCount}/{activeExercises.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="section-label">{t('totalVolume')}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-color)' }}>{totalVolume.toFixed(0)} {t(weightUnit)}</div>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {activeExercises.map((name, idx) => {
          const isDragging = draggingIndex === idx;
          const isDone = !!loggedData[name];
          return (
            <div key={name} data-index={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)', zIndex: isDragging ? 100 : 1, scale: isDragging ? 1.05 : 1, background: isDragging ? 'var(--glass-bg)' : 'transparent', borderRadius: isDragging ? 16 : 0, boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--accent-color-alpha)' : 'none', padding: isDragging ? '0 12px' : 0, border: isDragging ? '1.5px solid var(--accent-color)' : 'none' }}>
              <div onTouchStart={() => handleTouchStart(idx)} style={{ color: isDragging ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.25)', padding: 10, cursor: 'grab' }}>
                <GripVertical size={20} strokeWidth={isDragging ? 3 : 2} />
              </div>
              <button onClick={() => onOpenExercise(name)} disabled={isDragging} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'none', border: 'none', borderBottom: isDragging ? 'none' : `1px solid ${isDone ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.05)'}`, flex: 1, textAlign: 'left', pointerEvents: isDragging ? 'none' : 'auto' }}>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: isDone ? 'var(--accent-color)' : 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {isDone ? '✓ ' : ''}{name}
                  </div>
                </div>
                <Plus size={16} color="var(--text-secondary)" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Finish button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <button onClick={onSave} style={{ background: 'rgba(var(--accent-rgb, 50, 97, 68), 0.1)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '12px 30px', borderRadius: 12, fontSize: 12, fontWeight: 900, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 15px var(--accent-color-alpha)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', touchAction: 'manipulation' }}>
          <Trophy size={16} strokeWidth={3} />
          {t('finishSession').toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default SessionLogger;
export { SessionLogger };
