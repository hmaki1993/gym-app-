import { Search, Plus, CheckCircle, X } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  filteredExercises: string[];
  activeExercises: string[];
  onToggle: (name: string) => void;
  onAddCustom: (name: string) => void;
  onRemove: (name: string, isCustom: boolean) => void;
  isRtl: boolean;
  t: (k: any) => string;
  weightUnit: string;
  getLastSession: (name: string) => any;
  customExercises: string[];
}

export function ExercisePicker({
  search, onSearchChange, filteredExercises, activeExercises, onToggle,
  onAddCustom, onRemove, isRtl, t, weightUnit,
  getLastSession, customExercises
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="glass-input" style={{ paddingLeft: '40px' }} placeholder={t('searchExercise')} value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => {
            if (search.trim()) {
              onAddCustom(search.trim());
              onSearchChange('');
            } else {
              window.alert('Please enter an exercise name first!');
            }
          }}
          style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--glass-bg)', border: '1.5px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', cursor: 'pointer' }}
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredExercises.length === 0 && search && (
          <button
            onClick={() => { onAddCustom(search); onSearchChange(''); }}
            style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--accent-color-alpha)', borderRadius: '16px', color: 'var(--accent-color)', fontWeight: '700', cursor: 'pointer' }}
          >
            {t('addCustom')}: "{search}"
          </button>
        )}
        {filteredExercises.map(name => {
          const isSelected = activeExercises.includes(name);
          const lastData = getLastSession(name);
          const isCustom = customExercises?.includes(name);
          return (
            <div
              key={name}
              onClick={() => onToggle(name)}
              className="exercise-select-btn"
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 12px', background: 'transparent',
                border: 'none',
                borderBottom: `1.2px solid ${isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)'}`,
                width: '100%', cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', transition: 'color 0.3s ease' }}>{name}</div>
                {lastData && (
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600', opacity: 0.6 }}>
                    {t('lastSession')}: {lastData.sets[0]?.weight}{weightUnit} × {lastData.sets[0]?.reps}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isSelected && (
                  <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle size={18} strokeWidth={3} />
                  </div>
                )}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(name, isCustom);
                    }}
                    style={{ padding: '6px', background: 'rgba(255,51,102,0.1)', border: 'none', borderRadius: '8px', color: '#ff3366', cursor: 'pointer', display: 'flex', zIndex: 10, opacity: 0.6 }}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
