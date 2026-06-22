import { useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';

const FloatingWidget = registerPlugin<any>('FloatingWidget');

export async function syncWidgetState(state: {
  isActive: boolean;
  activeExercise: string | null;
  completedSets: number;
  muscleGroup: string;
  loggedData: any;
  historyDates: string[];
  isFinished: boolean;
  accentColor: string;
  activeExercises?: string[];
}) {
  const stateStr = JSON.stringify(state);

  if ((window as any).AndroidStorage && (window as any).AndroidStorage.setWidgetState) {
    try {
      (window as any).AndroidStorage.setWidgetState(stateStr);
      return;
    } catch (err) {
      console.warn('Failed to sync widget state via AndroidStorage', err);
    }
  }

  try {
    await Preferences.set({
      key: 'widget_state',
      value: stateStr
    });
    
    // Tell the native Android widget to update its UI
    try {
      await FloatingWidget.syncWidget();
    } catch (err) {
      // Ignore if plugin not available (e.g. on web)
    }
  } catch (e) {
    console.error('Failed to sync widget state', e);
  }
}

export function useWidgetSync(
  isActive: boolean,
  activeExercise: string | null,
  completedSets: number,
  muscleGroup: string,
  loggedData: any,
  historyDates: string[] = [],
  isFinished: boolean = false,
  accentColor: string = '#00E676',
  activeExercises: string[] = []
) {
  const lastStateStrRef = useRef<string>('');
  const lastActiveRef = useRef<boolean>(false);

  useEffect(() => {
    // Only call the heavy native/preferences sync if:
    // - The session is active (isActive is true)
    // - OR if it just transitioned from active to inactive (isActive changed to false)
    // This completely bypasses bridge overhead during exercise picker setup.
    const shouldSync = isActive || lastActiveRef.current !== isActive;
    const stateStr = JSON.stringify({ isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor, activeExercises });
    
    if (stateStr !== lastStateStrRef.current) {
      lastStateStrRef.current = stateStr;
      if (shouldSync) {
        syncWidgetState(JSON.parse(stateStr));
      }
    }
    lastActiveRef.current = isActive;
  }, [isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor, activeExercises]);
}
