import React from 'react';
import { GripVertical, Plus, Trophy } from 'lucide-react';
import type { SetLog } from '../../../types';

interface Props {
  activeExercises: string[];
  loggedData: Record<string, SetLog[]>;
  weightUnit: string;
  onOpenExercise: (name: string) => void;
  onSave: () => void;
  handleTouchStart: (index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  t: (k: any) => string;
}

export function SessionLogger({
  activeExercises, loggedData, weightUnit, onOpenExercise, onSave,
  handleTouchStart, handleTouchMove, handleTouchEnd, t
}: Props) {
  const loggedCount = Object.keys(loggedData).filter(k => activeExercises.includes(k)).length;
  const totalVolume = Object.values(loggedData).flat().reduce((s, set) => s + set.weight * set.reps, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">{t('todaySummary')}</div>
            <div style={{ fontSize: '22px', fontWeight: '900' }}>{loggedCount}/{activeExercises.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="section-label">{t('totalVolume')}</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-color)' }}>
              {totalVolume.toFixed(0)}{weightUnit}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeExercises.map((name, index) => (
          <div key={name} data-index={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              onTouchStart={() => handleTouchStart(index)} 
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd} 
              style={{ color: 'rgba(255,255,255,0.25)', padding: '10px' }}
            >
              <GripVertical size={20} />
            </div>
            <button 
              onClick={() => onOpenExercise(name)} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '14px 0', background: 'none', border: 'none', 
                borderBottom: `1px solid ${loggedData[name] ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`, 
                flex: 1, textAlign: 'left' 
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: loggedData[name] ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                  {loggedData[name] ? '✓ ' : ''}{name}
                </div>
              </div>
              <Plus size={16} color="var(--text-secondary)" />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <button onClick={onSave} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--accent-color-alpha-heavy)', color: 'var(--accent-color)', fontSize: '12px', fontWeight: '900', padding: '10px 28px', borderRadius: '14px' }}>
          <Trophy size={16} /> {t('finishSession')}
        </button>
      </div>
    </div>
  );
}
