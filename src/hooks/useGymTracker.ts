import { useState, useEffect, useCallback, useRef } from 'react';
import type { GymState, WorkoutLog, GymSettings, MuscleGroup, PersonalRecord, SetLog, MealLog } from '../types';
import { THEME_COLORS } from '../data/exercises';

const STORAGE_KEY = 'gymlog_state_v1';

const DEFAULT_SETTINGS: GymSettings = {
  userName: '',
  weightUnit: 'kg',
  language: 'en',
  accentColor: THEME_COLORS[0].hex,
  themeMode: 'dark',
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
  nutritionLogs: [
    {
      id: 'mock-1',
      name: 'Grilled Chicken & Rice',
      calories: 550,
      protein: 45,
      carbs: 60,
      fats: 12,
      date: new Date().toISOString(),
      portion: 350
    }
  ],
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

export function useGymTracker() {
  const [state, setState] = useState<GymState>(loadState);
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    saveState(state);
    // Apply theme & color
    const root = document.documentElement;
    const theme = THEME_COLORS.find(c => c.hex === state.settings.accentColor);
    
    root.setAttribute('data-theme', state.settings.themeMode);
    root.style.setProperty('--accent-color', state.settings.accentColor);
    root.style.setProperty('--accent-color-alpha', `${state.settings.accentColor}25`);
    root.style.setProperty('--accent-color-alpha-heavy', `${state.settings.accentColor}50`);
    if (theme) root.style.setProperty('--accent-secondary', theme.secondary);
  }, [state]);

  // Initial sync to fix any "ghost" PRs from storage
  useEffect(() => {
    const fixedPRs = syncPRsFromLogs(state.logs);
    // Only update if there's a difference to avoid loops
    if (JSON.stringify(fixedPRs) !== JSON.stringify(state.prs)) {
      setState(prev => ({ ...prev, prs: fixedPRs }));
    }
  }, []); // Run once on mount

  const setSettings = useCallback((s: Partial<GymSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
  }, []);

  const addCustomExercise = useCallback((muscle: MuscleGroup, name: string) => {
    setState(prev => ({
      ...prev,
      customExercises: {
        ...prev.customExercises,
        [muscle]: [...prev.customExercises[muscle], name],
      },
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

  const reorderExercises = useCallback((muscle: MuscleGroup, newOrder: string[]) => {
    setState(prev => ({
      ...prev,
      exerciseOrder: {
        ...prev.exerciseOrder,
        [muscle]: newOrder,
      },
    }));
  }, []);

  const getLastSession = useCallback((exerciseName: string): { sets: SetLog[]; date: string } | null => {
    for (const log of state.logs) {
      const ex = log.exercises.find(e => e.name === exerciseName);
      if (ex && ex.sets.length > 0) {
        return { sets: ex.sets, date: log.date };
      }
    }
    return null;
  }, [state.logs]);

  const syncPRsFromLogs = useCallback((logs: WorkoutLog[]) => {
    const prMap: Record<string, PersonalRecord> = {};
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
            date: log.date 
          };
        }
      });
    });
    return Object.values(prMap);
  }, []);

  const getExercisePR = useCallback((exerciseName: string): PersonalRecord | null => {
    return state.prs.find(p => p.exerciseName === exerciseName) ?? null;
  }, [state.prs]);

  const saveWorkout = useCallback((log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'startTime' | 'endTime'>) => {
    const now = Date.now();
    const start = sessionStartRef.current;
    const durationMinutes = Math.round((now - start) / 60000);
    const newLog: WorkoutLog = {
      ...log,
      id: `wl_${now}`,
      startTime: new Date(start).toISOString(),
      endTime: new Date(now).toISOString(),
      durationMinutes: Math.max(1, durationMinutes),
    };

    setState(prev => {
      const updatedLogs = [newLog, ...prev.logs];
      const updatedPRs = syncPRsFromLogs(updatedLogs);
      return {
        ...prev,
        logs: updatedLogs,
        prs: updatedPRs,
      };
    });

    sessionStartRef.current = Date.now();
    return newLog;
  }, [syncPRsFromLogs]);

  const deleteWorkout = useCallback((id: string) => {
    setState(prev => {
      const newLogs = prev.logs.filter(l => l.id !== id);
      const newPRs = syncPRsFromLogs(newLogs);
      return { 
        ...prev, 
        logs: newLogs,
        prs: newPRs
      };
    });
  }, [syncPRsFromLogs]);

  const resetSessionTimer = useCallback(() => {
    sessionStartRef.current = Date.now();
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
    reorderExercises,
    getLastSession,
    getExercisePR,
    saveWorkout,
    deleteWorkout,
    resetSessionTimer,
    getWeeklyCount,
    getTotalVolume,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    nutritionLogs: state.nutritionLogs || [],
  };
}
