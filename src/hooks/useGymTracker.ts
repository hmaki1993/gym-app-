import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GymState, WorkoutLog, GymSettings, MuscleGroup, PersonalRecord, SetLog, MealLog, WeightUnit } from '../types';
import { THEME_COLORS, DEFAULT_EXERCISES } from '../data/exercises';

const STORAGE_KEY = 'gymlog_state_v1';

const DEFAULT_SETTINGS: GymSettings = {
  userName: '',
  userEmail: '',
  userPassword: '',
  weightUnit: 'kg',
  language: 'en',
  accentColor: THEME_COLORS[0].hex,
  accentSecondary: THEME_COLORS[0].secondary,
  themeMode: 'system',
  defaultRestSeconds: 90,
  soundEnabled: true,
  dailyCalorieGoal: 2500,
  n8nWebhookUrl: '',
};

const DEFAULT_STATE: GymState = {
  logs: [],
  prs: [],
  settings: DEFAULT_SETTINGS,
  customExercises: {
    chest: [], back: [], legs: [], shoulders: [],
    arms: [], abs: [], cardio: [],
  },
  hiddenExercises: {
    chest: [], back: [], legs: [], shoulders: [],
    arms: [], abs: [], cardio: [],
  },
  deletedExercises: {
    chest: [], back: [], legs: [], shoulders: [],
    arms: [], abs: [], cardio: [],
  },
  exerciseOrder: {
    chest: [], back: [], legs: [], shoulders: [],
    arms: [], abs: [], cardio: [],
  },
  customTranslations: {},
  nutritionLogs: [],
};

// deduplicateSets was removed — it caused silent data loss on legitimate workouts.
// Sets are now stored exactly as the user logs them.

function loadState(): GymState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as GymState;

    // --- DATA MIGRATION: Backfill missing 'unit' field on old set logs ---
    const savedUnit = parsed.settings?.weightUnit || DEFAULT_SETTINGS.weightUnit;
    const migratedLogs = (parsed.logs || []).map(log => ({
      ...log,
      // Ensure YYYY-MM-DD local date format on legacy ISO dates
      date: log.date.includes('T') ? getLocalDateStr(new Date(log.date)) : log.date,
      exercises: log.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({
          ...set,
          unit: set.unit || savedUnit,
        })),
      })),
    }));

    // --- COLOR MIGRATION: Eradicate dark green #326144 and replace with neon green #00E676 ---
    if (parsed.settings) {
      if (parsed.settings.accentColor === '#326144' || !parsed.settings.accentColor) {
        parsed.settings.accentColor = '#00E676';
      }
    }

    return {
      ...DEFAULT_STATE,
      ...parsed,
      logs: migratedLogs,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: GymState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota */ }
}

// Beep sound using Web Audio API
function playBeep(freq = 880, duration = 0.15, vol = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* silent */ }
}

export function playRestDoneSound() {
  playBeep(660, 0.12, 0.3);
  setTimeout(() => playBeep(880, 0.12, 0.3), 150);
  setTimeout(() => playBeep(1100, 0.2, 0.4), 300);
}

export function playSetDoneSound() {
  playBeep(440, 0.1, 0.2);
}

// Helper: get local date string YYYY-MM-DD (timezone-safe)
function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: check if a log's date matches today (handles both UTC ISO and local formats)
function isLogFromLocalDate(logDate: string, localDateStr: string): boolean {
  // Parse the stored date and check its local date
  const d = new Date(logDate);
  return getLocalDateStr(d) === localDateStr || logDate.startsWith(localDateStr);
}

// Unit conversion factors
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

export function convertWeight(weight: number, from: WeightUnit | undefined, to: WeightUnit): number {
  if (!from || from === to) return weight;
  
  // Convert from whatever to kg first
  let inKg = weight;
  if (from === 'lbs') inKg = weight * LBS_TO_KG;
  else if (from === 'balata') inKg = weight * 20; // assuming 20kg per plate

  // Convert from kg to target
  if (to === 'kg') return inKg;
  if (to === 'lbs') return inKg * KG_TO_LBS;
  if (to === 'balata') return inKg / 20;
  
  return weight;
}

export function useGymTracker() {
  const [state, setState] = useState<GymState>(loadState);
  const [lastDeletedLog, setLastDeletedLog] = useState<WorkoutLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  
  // Use state for sessionStartTime to ensure reactivity
  const [sessionStartTime, setSessionStartTimeState] = useState<number>(() => {
    const initialState = loadState();
    const today = getLocalDateStr();
    // Only resume if there's a log from EXACTLY today
    const todayLogs = initialState.logs.filter(l => isLogFromLocalDate(l.date, today));
    if (todayLogs.length > 0) {
      return Math.min(...todayLogs.map(l => new Date(l.startTime || l.date).getTime()));
    }
    return Date.now();
  });

  useEffect(() => {
    saveState(state);
    // Apply theme & color
    const root = document.documentElement;
    const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const actualTheme = state.settings.themeMode === 'system' ? (systemPrefersLight ? 'light' : 'dark') : state.settings.themeMode;
    const isLightMode = actualTheme === 'light';
    const baseAccent = (state.settings.accentColor || '#00E676').toUpperCase();
    const displayAccent = (isLightMode && baseAccent === '#00E676') ? '#166E36' : baseAccent;

    const theme = THEME_COLORS.find(c => c.hex === state.settings.accentColor);
    const secondaryColor = state.settings.accentSecondary || theme?.secondary || state.settings.accentColor;
    
    root.setAttribute('data-theme', actualTheme);
    root.style.setProperty('--accent-color', displayAccent);
    root.style.setProperty('--accent-secondary', secondaryColor);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${displayAccent}, ${secondaryColor})`);
    root.style.setProperty('--accent-color-alpha', `${displayAccent}25`);
    root.style.setProperty('--accent-color-alpha-heavy', `${displayAccent}50`);
  }, [state]);

  // Midnight Reset Logic: Clear session if day changed
  useEffect(() => {
    const checkNewDay = () => {
      const lastCheck = localStorage.getItem('gymlog_last_check');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastCheck && lastCheck !== today) {
        // IT IS A NEW DAY! Clear everything that shouldn't persist
        console.log('New day detected. Resetting session...');
        setSessionStartTimeState(Date.now());
      }
      localStorage.setItem('gymlog_last_check', today);
    };

    checkNewDay();
    // Also check when app comes back to focus
    window.addEventListener('focus', checkNewDay);
    return () => window.removeEventListener('focus', checkNewDay);
  }, []);

  // Initial sync to fix any "ghost" PRs from storage
  useEffect(() => {
    setState(prev => {
      const fixedPRs = syncPRsFromLogs(prev.logs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      return { ...prev, prs: fixedPRs };
    });
  }, []); // Run once on mount

  const setSettings = useCallback((s: Partial<GymSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const addCustomExercise = useCallback((muscle: MuscleGroup, name: string, translation?: string) => {
    setState(prev => ({
      ...prev,
      customExercises: {
        ...prev.customExercises,
        [muscle]: [...prev.customExercises[muscle], name],
      },
      customTranslations: translation ? {
        ...(prev.customTranslations || {}),
        [name]: translation
      } : prev.customTranslations
    }));
  }, []);

  const removeCustomExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => ({
      ...prev,
      customExercises: {
        ...prev.customExercises,
        [muscle]: prev.customExercises[muscle].filter(e => e !== name),
      },
    }));
  }, []);

  const hideDefaultExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => ({
      ...prev,
      hiddenExercises: {
        ...prev.hiddenExercises,
        [muscle]: [...(prev.hiddenExercises[muscle] || []), name],
      },
    }));
  }, []);

  const restoreExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => ({
      ...prev,
      hiddenExercises: {
        ...prev.hiddenExercises,
        [muscle]: (prev.hiddenExercises[muscle] || []).filter(e => e !== name),
      },
      deletedExercises: {
        ...prev.deletedExercises || {},
        [muscle]: (prev.deletedExercises?.[muscle] || []).filter((e: string) => e !== name)
      }
    }));
  }, []);

  const permanentlyDeleteExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => ({
      ...prev,
      customExercises: {
        ...prev.customExercises,
        [muscle]: (prev.customExercises[muscle] || []).filter(e => e !== name),
      },
      hiddenExercises: {
        ...prev.hiddenExercises,
        [muscle]: (prev.hiddenExercises[muscle] || []).filter(e => e !== name),
      },
      deletedExercises: {
        ...prev.deletedExercises || {},
        [muscle]: [...(prev.deletedExercises?.[muscle] || []), name]
      },
      customTranslations: (() => {
        const next = { ...(prev.customTranslations || {}) };
        delete next[name];
        return next;
      })()
    }));
  }, []);

  const renameExercise = useCallback((muscle: MuscleGroup, oldName: string, newName: string) => {
    setState(prev => {
      const isDefault = (DEFAULT_EXERCISES[muscle] || []).includes(oldName);
      
      let newCustom = [...(prev.customExercises[muscle] || [])];
      let newHidden = [...(prev.hiddenExercises?.[muscle] || [])];
      let newDeleted = { ...(prev.deletedExercises || {}) };
      let muscleDeleted = [...(newDeleted[muscle] || [])];

      if (isDefault) {
        if (!newHidden.includes(oldName)) newHidden.push(oldName);
        if (!newCustom.includes(newName)) newCustom.push(newName);
        // Move to deleted list so it skips the Archive section
        if (!muscleDeleted.includes(oldName)) muscleDeleted.push(oldName);
      } else {
        newCustom = newCustom.map(e => e === oldName ? newName : e);
        newHidden = newHidden.map(e => e === oldName ? newName : e);
      }

      const newLogs = prev.logs.map(log => ({
        ...log,
        exercises: log.exercises.map(ex => ex.name === oldName ? { ...ex, name: newName } : ex)
      }));

      const newOrder = prev.exerciseOrder?.[muscle] 
        ? prev.exerciseOrder[muscle].map(e => e === oldName ? newName : e) 
        : [];

      return {
        ...prev,
        logs: newLogs,
        customExercises: {
          ...prev.customExercises,
          [muscle]: newCustom,
        },
        hiddenExercises: {
          ...prev.hiddenExercises,
          [muscle]: newHidden
        },
        deletedExercises: {
          ...newDeleted,
          [muscle]: muscleDeleted
        },
        exerciseOrder: {
          ...prev.exerciseOrder,
          [muscle]: newOrder
        },
        customTranslations: {
          ...(prev.customTranslations || {}),
          [newName]: (prev.customTranslations || {})[oldName] || ''
        }
      };
    });
  }, []);

  const reorderExercises = useCallback((muscle: MuscleGroup, newOrder: string[]) => {
    setState(prev => ({
      ...prev,
      exerciseOrder: {
        ...prev.exerciseOrder,
        [muscle]: newOrder,
      },
    }));
  }, []);

  const getLastSession = useCallback((exerciseName: string): { sets: SetLog[]; date: string; bestSet: SetLog } | null => {
    for (const log of state.logs) {
      const ex = log.exercises.find(e => e.name === exerciseName);
      if (ex && ex.sets.length > 0) {
        // Find the BEST set in this specific session using normalized weight for comparison
        const bestSet = ex.sets.reduce((prev, curr) => {
          const prevInKg = convertWeight(prev.weight || 0, prev.unit || 'kg', 'kg');
          const currInKg = convertWeight(curr.weight || 0, curr.unit || 'kg', 'kg');
          return (currInKg > prevInKg || (currInKg === prevInKg && curr.reps > prev.reps)) ? curr : prev;
        }, ex.sets[0]);
        
        return { sets: ex.sets, date: log.date, bestSet: { ...bestSet, unit: bestSet.unit || 'kg' } };
      }
    }
    return null;
  }, [state.logs]);

  const getLastUsedUnit = useCallback((exerciseName: string): WeightUnit => {
    for (const log of state.logs) {
      const ex = log.exercises.find(e => e.name === exerciseName);
      if (ex && ex.sets.length > 0 && ex.sets[0].unit) {
        return ex.sets[0].unit;
      }
    }
    return state.settings.weightUnit;
  }, [state.logs, state.settings.weightUnit]);

  // Memoize the exercise-to-muscle mapping so it's built once per data change, not per call
  const exerciseToMuscleMap = useMemo(() => {
    const map: Record<string, MuscleGroup> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(e => { map[e.trim().toLowerCase()] = group as MuscleGroup; });
    });
    Object.entries(state.customExercises).forEach(([group, exercises]) => {
      exercises.forEach(e => { map[e.trim().toLowerCase()] = group as MuscleGroup; });
    });
    return map;
  }, [state.customExercises]);

  const getDisplayUnit = useCallback((exerciseName: string, muscle?: MuscleGroup): WeightUnit => {
    const nameKey = exerciseName.trim().toLowerCase();

    // 1. Check the exercise's specific last used unit first
    for (const log of state.logs) {
      const ex = log.exercises.find(e => e.name.trim().toLowerCase() === nameKey);
      if (ex && ex.sets.length > 0 && ex.sets[0].unit) {
        return ex.sets[0].unit;
      }
    }

    // Determine the muscle group if not provided
    const targetMuscle = muscle || exerciseToMuscleMap[nameKey];

    // 2. Fallback to the most recent set in the ENTIRE muscle group
    if (targetMuscle) {
      for (const log of state.logs) {
        for (const ex of log.exercises) {
          const group = ex.muscleGroup || exerciseToMuscleMap[ex.name.trim().toLowerCase()] || log.muscleGroup;
          if (group === targetMuscle && ex.sets.length > 0 && ex.sets[0].unit) {
            return ex.sets[0].unit;
          }
        }
      }
    }

    // 3. Fallback to global setting
    return state.settings.weightUnit;
  }, [state.logs, state.settings.weightUnit, exerciseToMuscleMap]);

  const getExercisesByMuscle = useCallback((muscle: MuscleGroup) => {
    const defaults = (DEFAULT_EXERCISES[muscle] || []).map(name => ({ name, isCustom: false }));
    const customs = (state.customExercises[muscle] || []).map(name => ({ name, isCustom: true }));
    return [...defaults, ...customs];
  }, [state.customExercises]);

  const getBestExercises = useCallback((muscle: MuscleGroup) => {
    return state.prs
      .filter(p => p.muscleGroup === muscle)
      .sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))
      .slice(0, 5)
      .map(p => ({
        name: p.exerciseName,
        bestSet: { weight: p.weight, reps: p.reps, unit: p.unit || 'kg' }
      }));
  }, [state.prs, state.settings.weightUnit]);

  // Plain function (no useCallback) — receives ALL data it needs as params to avoid stale closures
  const syncPRsFromLogs = (
    logs: WorkoutLog[],
    customExercises: Record<MuscleGroup, string[]>,
    hiddenExercises?: Record<MuscleGroup, string[]>,
    deletedExercises?: Record<MuscleGroup, string[]>
  ): PersonalRecord[] => {
    const prMap: Record<string, PersonalRecord> = {};
    
    const mapping: Record<string, MuscleGroup> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { mapping[ex.trim().toLowerCase()] = group as MuscleGroup; });
    });
    // Include all custom, hidden and deleted exercises for robust mapping
    const allCustomSources = [
      customExercises,
      hiddenExercises || {},
      deletedExercises || {}
    ];
    allCustomSources.forEach(source => {
      Object.entries(source).forEach(([group, exercises]) => {
        (exercises as string[]).forEach(ex => { mapping[ex.trim().toLowerCase()] = group as MuscleGroup; });
      });
    });

    // Process from oldest to newest to ensure we get the best record
    [...logs].reverse().forEach(log => {
      log.exercises.forEach(ex => {
        const exNameClean = ex.name.trim();
        const exNameKey = exNameClean.toLowerCase();
        if (!ex.sets || ex.sets.length === 0) return;
        
        let bestSet = ex.sets[0];
        let bestValInKg = convertWeight(bestSet.weight, bestSet.unit || 'kg', 'kg');

        ex.sets.forEach(s => {
          const currentValInKg = convertWeight(s.weight, s.unit || 'kg', 'kg');
          if (currentValInKg > bestValInKg || (currentValInKg === bestValInKg && s.reps > bestSet.reps)) {
            bestSet = s;
            bestValInKg = currentValInKg;
          }
        });

        const matchingSetsCount = ex.sets.filter(s => {
          const sInKg = convertWeight(s.weight, s.unit || 'kg', 'kg');
          return Math.abs(sInKg - bestValInKg) < 0.01 && s.reps === bestSet.reps;
        }).length;

        const existing = prMap[exNameClean];
        const existingValInKg = existing ? convertWeight(existing.weight, existing.unit || 'kg', 'kg') : 0;

        if (!existing || bestValInKg > existingValInKg || (bestValInKg === existingValInKg && bestSet.reps >= existing.reps)) {
          prMap[exNameClean] = { 
            exerciseName: exNameClean, 
            weight: bestSet.weight, 
            reps: bestSet.reps, 
            unit: bestSet.unit || 'kg',
            date: log.date,
            muscleGroup: ex.muscleGroup || mapping[exNameKey] || log.muscleGroup,
            setsCount: matchingSetsCount
          };
        }
      });
    });
    return Object.values(prMap);
  };

  const getExercisePR = useCallback((exerciseName: string): PersonalRecord | null => {
    return state.prs.find(p => p.exerciseName === exerciseName) ?? null;
  }, [state.prs]);

  const saveWorkout = useCallback((log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'startTime' | 'endTime'>, elapsedSeconds?: number) => {
    const now = Date.now();
    const start = sessionStartTime;

    setState(prev => {
      // FIX: Use the SESSION START TIME to determine the workout date, 
      // not the current time (which might be past midnight).
      const sessionDate = new Date(start);
      const today = getLocalDateStr(sessionDate);
      const existingLogIndex = prev.logs.findIndex(l => isLogFromLocalDate(l.date, today));

      let updatedLogs;
      if (existingLogIndex !== -1) {
        // MERGE: Update the existing log for the day the session started
        updatedLogs = [...prev.logs];
        const oldLog = updatedLogs[existingLogIndex];

        const mergedExercises = [...oldLog.exercises];
        log.exercises.forEach(newEx => {
          const exIdx = mergedExercises.findIndex(e => e.name === newEx.name);
          if (exIdx !== -1) {
            // FIX: Overwrite sets with the latest updated list to prevent duplication
            mergedExercises[exIdx] = {
              ...mergedExercises[exIdx],
              sets: newEx.sets
            };
          } else {
            mergedExercises.push(newEx);
          }
        });

        // Use elapsedSeconds from component if provided, otherwise keep old duration
        const totalDurationSeconds = elapsedSeconds ?? (oldLog.durationSeconds || oldLog.durationMinutes * 60);

        updatedLogs[existingLogIndex] = {
          ...oldLog,
          muscleGroup: log.muscleGroup,
          exercises: mergedExercises,
          endTime: new Date(now).toISOString(),
          durationMinutes: Math.round(totalDurationSeconds / 60),
          durationSeconds: totalDurationSeconds,
        };
      } else {
        // CREATE: First workout of the session date
        const durationSeconds = elapsedSeconds ?? Math.floor((now - start) / 1000);
        const newLog: WorkoutLog = {
          ...log,
          date: today, // Use local date string YYYY-MM-DD
          id: `wl_${now}`,
          startTime: sessionDate.toISOString(),
          endTime: new Date(now).toISOString(),
          durationMinutes: Math.round(durationSeconds / 60),
          durationSeconds,
        };
        updatedLogs = [newLog, ...prev.logs];
      }

      const updatedPRs = syncPRsFromLogs(updatedLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      const newState = { ...prev, logs: updatedLogs, prs: updatedPRs };

      // Trigger n8n Webhook for workout
      if (newState.settings.n8nWebhookUrl) {
        const lastLog = updatedLogs[existingLogIndex !== -1 ? existingLogIndex : 0];
        fetch(newState.settings.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'workout', workout: lastLog, user: newState.settings.userName })
        }).catch(err => console.warn('n8n Webhook failed:', err));
      }

      return newState;
    });

    setSessionStartTimeState(Date.now());
  }, [sessionStartTime]);

  const updateWorkoutUnit = useCallback((workoutId: string, newUnit: WeightUnit) => {
    setState(prev => {
      const newLogs = prev.logs.map(log => {
        if (log.id === workoutId) {
          return {
            ...log,
            exercises: log.exercises.map(ex => ({
              ...ex,
              sets: ex.sets.map(s => ({ ...s, unit: newUnit }))
            }))
          };
        }
        return log;
      });
      const newPRs = syncPRsFromLogs(newLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      return { ...prev, logs: newLogs, prs: newPRs };
    });
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setState(prev => {
      const logToDelete = prev.logs.find(l => l.id === id);
      if (logToDelete) setLastDeletedLog(logToDelete);
      
      const newLogs = prev.logs.filter(l => l.id !== id);
      const newPRs = syncPRsFromLogs(newLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      return { 
        ...prev, 
        logs: newLogs,
        prs: newPRs
      };
    });
  }, []);

  const restoreLastDeleted = useCallback(() => {
    if (!lastDeletedLog) return false;
    setState(prev => {
      if (prev.logs.find(l => l.id === lastDeletedLog.id)) return prev;
      const newLogs = [lastDeletedLog, ...prev.logs];
      const newPRs = syncPRsFromLogs(newLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      return { ...prev, logs: newLogs, prs: newPRs };
    });
    setLastDeletedLog(null);
    return true;
  }, [lastDeletedLog]);

  const resetSessionTimer = useCallback(() => {
    setSessionStartTimeState(Date.now());
  }, []);

  const addMealLog = useCallback((meal: Omit<MealLog, 'id' | 'date'> & { date?: string }) => {
    const newMeal: MealLog = {
      ...meal,
      id: `ml_${Date.now()}`,
      date: meal.date || new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      nutritionLogs: [newMeal, ...(prev.nutritionLogs || [])],
    }));

    // Trigger n8n Webhook
    if (state.settings.n8nWebhookUrl) {
      fetch(state.settings.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nutrition', meal: newMeal, user: state.settings.userName })
      }).catch(err => console.warn('n8n Webhook failed:', err));
    }

    return newMeal;
  }, [state.settings]);

  const updateMealLog = useCallback((id: string, updates: Partial<MealLog>) => {
    setState(prev => ({
      ...prev,
      nutritionLogs: (prev.nutritionLogs || []).map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, []);

  const deleteMealLog = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      nutritionLogs: (prev.nutritionLogs || []).filter(m => m.id !== id),
    }));
  }, []);

  // Stats
  const getWeeklyCount = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // History page uses 7-day slices of the month (1-7, 8-14, 15-21, 22-28, 29-31)
    const weekStartDay = Math.floor((currentDate - 1) / 7) * 7 + 1;
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weekEndDay = Math.min(weekStartDay + 6, totalDaysInMonth);
    
    // Count unique days within this slice where the user had a workout
    const workoutDays = new Set<number>();
    
    state.logs.forEach(l => {
      // All dates should now be YYYY-MM-DD format after migration
      const parts = l.date.split('T')[0].split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);

      if (y === currentYear && m === currentMonth) {
        if (d >= weekStartDay && d <= weekEndDay) {
          workoutDays.add(d);
        }
      }
    });
    
    return workoutDays.size;
  }, [state.logs]);

  const getTotalVolume = useCallback((log: WorkoutLog, targetUnit?: WeightUnit) => {
    // Detect target unit for the total volume display (fallback to first set's unit)
    const finalTargetUnit = targetUnit || log.exercises[0]?.sets[0]?.unit || state.settings.weightUnit || 'kg';
    
    return log.exercises.reduce((total, ex) =>
      total + ex.sets.reduce((s, set) => {
        // ALWAYS convert to target unit for accurate summation
        const weightInTarget = convertWeight(Number(set.weight) || 0, set.unit || 'kg', finalTargetUnit);
        return s + (weightInTarget * (Number(set.reps) || 0));
      }, 0), 0
    );
  }, [state.settings.weightUnit]);

  // CLEANUP: Remove any fake or dummy workouts previously generated
  useEffect(() => {
    setState(prev => {
      const hasFake = prev.logs.some(l => l.id.startsWith('fake_') || l.id.startsWith('dummy_wl_'));
      if (!hasFake) return prev;
      
      const filteredLogs = prev.logs.filter(l => !l.id.startsWith('fake_') && !l.id.startsWith('dummy_wl_'));
      const newPRs = syncPRsFromLogs(filteredLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);
      localStorage.removeItem('gymlog_fake_workouts_generated');
      return { ...prev, logs: filteredLogs, prs: newPRs };
    });
  }, []);

  return {
    state,
    settings: state.settings,
    logs: state.logs,
    prs: state.prs,
    customExercises: state.customExercises,
    hiddenExercises: state.hiddenExercises,
    exerciseOrder: state.exerciseOrder,
    setSettings,
    addCustomExercise,
    removeCustomExercise,
    hideDefaultExercise,
    restoreExercise,
    permanentlyDeleteExercise,
    renameExercise,
    reorderExercises,
    getLastSession,
    getLastUsedUnit,
    getDisplayUnit,
    getExercisePR,
    saveWorkout,
    updateWorkoutUnit,
    deleteWorkout,
    restoreLastDeleted,
    logToDelete,
    setLogToDelete,
    resetSessionTimer,
    setSessionStartTime: setSessionStartTimeState,
    sessionStartTime,
    getWeeklyCount,
    getTotalVolume,
    getLocalDateStr,
    isLogFromLocalDate,
    getExercisesByMuscle,
    getBestExercises,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    resetAllData,
    convertWeight,
    nutritionLogs: state.nutritionLogs || [],
    seedPastWorkouts: useCallback(() => {
      setState(prev => {
        const now = new Date();
        const createPastDate = (daysAgo: number) => {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 16, 0, 0);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return {
            dateStr: `${y}-${m}-${day}`,
            isoStr: d.toISOString()
          };
        };

        const pastWorkouts: WorkoutLog[] = [
          {
            id: `dummy_wl_1`,
            date: createPastDate(2).dateStr,
            muscleGroup: 'chest',
            durationMinutes: 45,
            durationSeconds: 2700,
            startTime: createPastDate(2).isoStr,
            endTime: new Date(new Date(createPastDate(2).isoStr).getTime() + 45 * 60000).toISOString(),
            exercises: [
              {
                name: 'Barbell Bench Press',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 60, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 70, reps: 8, unit: prev.settings.weightUnit },
                  { weight: 80, reps: 6, unit: prev.settings.weightUnit }
                ]
              },
              {
                name: 'Incline Dumbbell Press',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 24, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 26, reps: 8, unit: prev.settings.weightUnit }
                ]
              }
            ]
          },
          {
            id: `dummy_wl_2`,
            date: createPastDate(4).dateStr,
            muscleGroup: 'back',
            durationMinutes: 50,
            durationSeconds: 3000,
            startTime: createPastDate(4).isoStr,
            endTime: new Date(new Date(createPastDate(4).isoStr).getTime() + 50 * 60000).toISOString(),
            exercises: [
              {
                name: 'Lat Pulldown',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 55, reps: 12, unit: prev.settings.weightUnit },
                  { weight: 65, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 70, reps: 8, unit: prev.settings.weightUnit }
                ]
              },
              {
                name: 'Barbell Row',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 50, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 60, reps: 8, unit: prev.settings.weightUnit }
                ]
              }
            ]
          },
          {
            id: `dummy_wl_3`,
            date: createPastDate(6).dateStr,
            muscleGroup: 'legs',
            durationMinutes: 60,
            durationSeconds: 3600,
            startTime: createPastDate(6).isoStr,
            endTime: new Date(new Date(createPastDate(6).isoStr).getTime() + 60 * 60000).toISOString(),
            exercises: [
              {
                name: 'Barbell Squat',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 80, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 100, reps: 8, unit: prev.settings.weightUnit },
                  { weight: 110, reps: 6, unit: prev.settings.weightUnit }
                ]
              },
              {
                name: 'Leg Press',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 160, reps: 12, unit: prev.settings.weightUnit },
                  { weight: 200, reps: 10, unit: prev.settings.weightUnit }
                ]
              }
            ]
          },
          {
            id: `dummy_wl_4`,
            date: createPastDate(8).dateStr,
            muscleGroup: 'shoulders',
            durationMinutes: 40,
            durationSeconds: 2400,
            startTime: createPastDate(8).isoStr,
            endTime: new Date(new Date(createPastDate(8).isoStr).getTime() + 40 * 60000).toISOString(),
            exercises: [
              {
                name: 'Dumbbell Shoulder Press',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 18, reps: 10, unit: prev.settings.weightUnit },
                  { weight: 22, reps: 8, unit: prev.settings.weightUnit },
                  { weight: 24, reps: 6, unit: prev.settings.weightUnit }
                ]
              },
              {
                name: 'Lateral Raise',
                restSeconds: prev.settings.defaultRestSeconds || 90,
                sets: [
                  { weight: 10, reps: 15, unit: prev.settings.weightUnit },
                  { weight: 12, reps: 12, unit: prev.settings.weightUnit }
                ]
              }
            ]
          }
        ];

        // Filter out existing dummy logs to prevent duplication
        const cleanLogs = prev.logs.filter(l => !l.id.startsWith('dummy_wl_'));
        const updatedLogs = [...pastWorkouts, ...cleanLogs];
        const updatedPRs = syncPRsFromLogs(updatedLogs, prev.customExercises, prev.hiddenExercises, prev.deletedExercises);

        return {
          ...prev,
          logs: updatedLogs,
          prs: updatedPRs
        };
      });
    }, []),
  };
}
