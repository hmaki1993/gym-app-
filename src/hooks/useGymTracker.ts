import { useState, useEffect, useCallback } from 'react';
import type { GymState, WorkoutLog, GymSettings, MuscleGroup, PersonalRecord, SetLog, MealLog } from '../types';
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
  themeMode: 'light',
  defaultRestSeconds: 90,
  soundEnabled: true,
  dailyCalorieGoal: 2500,
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
  exerciseOrder: {
    chest: [], back: [], legs: [], shoulders: [],
    arms: [], abs: [], cardio: [],
  },
  customTranslations: {},
  nutritionLogs: [],
};

function loadState(): GymState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as GymState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      customExercises: { ...DEFAULT_STATE.customExercises, ...parsed.customExercises },
      hiddenExercises: { ...DEFAULT_STATE.hiddenExercises, ...parsed.hiddenExercises },
      exerciseOrder: { ...DEFAULT_STATE.exerciseOrder, ...parsed.exerciseOrder },
      customTranslations: { ...DEFAULT_STATE.customTranslations, ...parsed.customTranslations },
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

export function useGymTracker() {
  const [state, setState] = useState<GymState>(loadState);
  
  // Use state for sessionStartTime to ensure reactivity
  const [sessionStartTime, setSessionStartTimeState] = useState<number>(() => {
    const initialState = loadState();
    const today = getLocalDateStr();
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
    const theme = THEME_COLORS.find(c => c.hex === state.settings.accentColor);
    const secondaryColor = state.settings.accentSecondary || theme?.secondary || state.settings.accentColor;
    
    root.setAttribute('data-theme', state.settings.themeMode);
    root.style.setProperty('--accent-color', state.settings.accentColor);
    root.style.setProperty('--accent-secondary', secondaryColor);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${state.settings.accentColor}, ${secondaryColor})`);
    root.style.setProperty('--accent-color-alpha', `${state.settings.accentColor}25`);
    root.style.setProperty('--accent-color-alpha-heavy', `${state.settings.accentColor}50`);
  }, [state]);

  // Midnight Reset Logic: Clear session if day changed
  useEffect(() => {
    const checkNewDay = () => {
      const lastCheck = localStorage.getItem('gymlog_last_check');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastCheck && lastCheck !== today) {
        // IT IS A NEW DAY! Clear everything that shouldn't persist
        console.log('New day detected. Resetting session...');
        // If there's a specific 'current workout' state in future, reset it here
        // For now, we ensure 'today' logs are fresh by the natural date check
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
    const fixedPRs = syncPRsFromLogs(state.logs, state.customExercises);
    // Only update if there's a difference to avoid loops
    if (JSON.stringify(fixedPRs) !== JSON.stringify(state.prs)) {
      setState(prev => ({ ...prev, prs: fixedPRs }));
    }
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
    }));
  }, []);

  const permanentlyDeleteExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => {
      return {
        ...prev,
        customExercises: {
          ...prev.customExercises,
          [muscle]: prev.customExercises[muscle].filter(e => e !== name),
        },
        // Also ensure it's not in hidden/deleted if we want to be thorough
        state: {
          ...(prev as any).state,
          deletedExercises: {
            ...((prev as any).state?.deletedExercises || {}),
            [muscle]: [...((prev as any).state?.deletedExercises?.[muscle] || []), name]
          }
        }
      };
    });
  }, []);

  const renameExercise = useCallback((muscle: MuscleGroup, oldName: string, newName: string) => {
    setState(prev => ({
      ...prev,
      customExercises: {
        ...prev.customExercises,
        [muscle]: prev.customExercises[muscle].map(e => e === oldName ? newName : e),
      },
      customTranslations: {
        ...(prev.customTranslations || {}),
        [newName]: (prev.customTranslations || {})[oldName] || ''
      }
    }));
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
        // Find the BEST set in this specific session to display on the picker
        const bestSet = ex.sets.reduce((prev, curr) => {
          const prevW = prev.weight || 0;
          const currW = curr.weight || 0;
          return (currW > prevW || (currW === prevW && curr.reps > prev.reps)) ? curr : prev;
        }, ex.sets[0]);
        
        return { sets: ex.sets, date: log.date, bestSet: { ...bestSet, unit: bestSet.unit || 'kg' } };
      }
    }
    return null;
  }, [state.logs]);

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
        bestSet: { weight: p.weight, reps: p.reps, unit: state.settings.weightUnit }
      }));
  }, [state.prs, state.settings.weightUnit]);

  const syncPRsFromLogs = useCallback((logs: WorkoutLog[], customExercises: Record<MuscleGroup, string[]>) => {
    const prMap: Record<string, PersonalRecord> = {};
    
    // Create a reverse mapping of exercise name to muscle group
    const exerciseToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex.toLowerCase()] = group; });
    });
    Object.entries(customExercises).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex.toLowerCase()] = group; });
    });

    // Process from oldest to newest to ensure we get the best record
    [...logs].reverse().forEach(log => {
      log.exercises.forEach(ex => {
        if (!ex.sets || ex.sets.length === 0) return;
        
        let bestSet = ex.sets[0];
        ex.sets.forEach(s => {
          if (s.weight > bestSet.weight || (s.weight === bestSet.weight && s.reps > bestSet.reps)) {
            bestSet = s;
          }
        });

        const existing = prMap[ex.name];
        if (!existing || bestSet.weight > existing.weight || (bestSet.weight === existing.weight && bestSet.reps > existing.reps)) {
          prMap[ex.name] = { 
            exerciseName: ex.name, 
            weight: bestSet.weight, 
            reps: bestSet.reps, 
            date: log.date,
            muscleGroup: exerciseToMuscle[ex.name.toLowerCase()] || log.muscleGroup
          };
        }
      });
    });
    return Object.values(prMap);
  }, []);

  const getExercisePR = useCallback((exerciseName: string): PersonalRecord | null => {
    return state.prs.find(p => p.exerciseName === exerciseName) ?? null;
  }, [state.prs]);

  const saveWorkout = useCallback((log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'startTime' | 'endTime'>, elapsedSeconds?: number) => {
    const now = Date.now();
    const start = sessionStartTime;

    setState(prev => {
      const today = getLocalDateStr();
      const existingLogIndex = prev.logs.findIndex(l => isLogFromLocalDate(l.date, today));

      let updatedLogs;
      if (existingLogIndex !== -1) {
        // MERGE: Update the existing log for today
        updatedLogs = [...prev.logs];
        const oldLog = updatedLogs[existingLogIndex];

        const mergedExercises = [...oldLog.exercises];
        log.exercises.forEach(newEx => {
          const exIdx = mergedExercises.findIndex(e => e.name === newEx.name);
          if (exIdx !== -1) mergedExercises[exIdx] = newEx;
          else mergedExercises.push(newEx);
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
        // CREATE: First workout of the day
        const durationSeconds = elapsedSeconds ?? Math.floor((now - start) / 1000);
        const newLog: WorkoutLog = {
          ...log,
          id: `wl_${now}`,
          startTime: new Date(start).toISOString(),
          endTime: new Date(now).toISOString(),
          durationMinutes: Math.round(durationSeconds / 60),
          durationSeconds,
        };
        updatedLogs = [newLog, ...prev.logs];
      }

      const updatedPRs = syncPRsFromLogs(updatedLogs, prev.customExercises);
      return { ...prev, logs: updatedLogs, prs: updatedPRs };
    });

    setSessionStartTimeState(Date.now());
  }, [syncPRsFromLogs, sessionStartTime]);

  const deleteWorkout = useCallback((id: string) => {
    setState(prev => {
      const newLogs = prev.logs.filter(l => l.id !== id);
      const newPRs = syncPRsFromLogs(newLogs, prev.customExercises);
      return { 
        ...prev, 
        logs: newLogs,
        prs: newPRs
      };
    });
  }, [syncPRsFromLogs]);

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
    return newMeal;
  }, []);

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
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return state.logs.filter(l => new Date(l.date) >= weekAgo).length;
  }, [state.logs]);

  const getTotalVolume = useCallback((log: WorkoutLog) => {
    return log.exercises.reduce((total, ex) =>
      total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
    );
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
    getExercisePR,
    saveWorkout,
    deleteWorkout,
    resetSessionTimer,
    setSessionStartTime: setSessionStartTimeState,
    sessionStartTime,
    getWeeklyCount,
    getTotalVolume,
    getExercisesByMuscle,
    getBestExercises,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    resetAllData,
    nutritionLogs: state.nutritionLogs || [],
  };
}
