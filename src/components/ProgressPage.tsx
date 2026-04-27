import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { translations } from '../translations';
import { TrendingUp, Award, BarChart2 } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}

function MiniChart({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  if (data.length < 2) return null;
  const W = 280, H = 70;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((d.value - min) / range) * (H - 20);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `10,${H - 10} ${points} ${(data.length - 1) / (data.length - 1) * (W - 20) + 10},${H - 10}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area */}
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      {(() => {
        const lastPt = points.split(' ').pop()!.split(',');
        return <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
      })()}
    </svg>
  );
}

export function ProgressPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  // Weekly bar data
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const weekCounts = weekDays.map(day =>
    tracker.logs.filter(l => new Date(l.date).toDateString() === day).length
  );

  // Exercise progress data (top 5 by frequency)
  const exerciseFreq: Record<string, number> = {};
  for (const log of tracker.logs) {
    for (const ex of log.exercises) {
      exerciseFreq[ex.name] = (exerciseFreq[ex.name] ?? 0) + 1;
    }
  }
  const topExercises = Object.entries(exerciseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const getExerciseHistory = (name: string) => {
    const history: { date: string; value: number }[] = [];
    for (const log of [...tracker.logs].reverse()) {
      const ex = log.exercises.find(e => e.name === name);
      if (ex && ex.sets.length > 0) {
        const max = Math.max(...ex.sets.map(s => s.weight));
        history.push({ date: log.date, value: max });
      }
    }
    return history;
  };

  const totalWorkouts = tracker.logs.length;
  const weeklyCount = tracker.getWeeklyCount();
  const totalVolume = tracker.logs.reduce((s, l) => s + tracker.getTotalVolume(l), 0);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: t('thisWeek'), value: weeklyCount, sub: t('workouts'), icon: '📅' },
          { label: t('allTime'), value: totalWorkouts, sub: t('workouts'), icon: '🏆' },
          { label: t('totalVolume'), value: `${(totalVolume / 1000).toFixed(1)}T`, sub: unit, icon: '📈' },
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{card.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-1px' }}>{card.value}</div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart2 size={16} color="var(--accent-color)" />
          <span className="section-label">{t('thisWeek')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
          {weekDays.map((day, i) => {
            const isToday = new Date().toDateString() === day;
            const count = weekCounts[i];
            const height = count > 0 ? Math.max(20, count * 30) : 4;
            const dayLabel = new Date(day).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' });
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%', height: `${height}px`,
                  background: count > 0
                    ? `linear-gradient(180deg, var(--accent-color), var(--accent-secondary))`
                    : 'rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  boxShadow: count > 0 ? '0 2px 10px rgba(0,229,160,0.3)' : 'none',
                  border: isToday ? '1px solid var(--accent-color)' : '1px solid transparent',
                  transition: 'height 0.6s ease',
                }} />
                <span style={{ fontSize: '9px', fontWeight: '700', color: isToday ? 'var(--accent-color)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {dayLabel.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Records */}
      {tracker.prs.length > 0 && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Award size={16} color="#ffd700" />
            <span className="section-label">{t('personalRecord')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tracker.prs.map(pr => (
              <div key={pr.exerciseName} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '12px',
                background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{pr.exerciseName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pr-badge">🏆 {pr.weight}{unit}×{pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Charts */}
      {topExercises.length > 0 && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--accent-color)" />
            <span className="section-label">{t('progress')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topExercises.map(name => {
              const history = getExerciseHistory(name);
              if (history.length < 2) return null;
              const latest = history[history.length - 1].value;
              const first = history[0].value;
              const diff = latest - first;
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-color)' }}>{latest}{unit}</span>
                      {diff !== 0 && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: diff > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          {diff > 0 ? '+' : ''}{diff}{unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <MiniChart data={history} color="var(--accent-color)" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tracker.logs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: '14px' }}>
          {t('noData')}
        </div>
      )}
    </div>
  );
}
