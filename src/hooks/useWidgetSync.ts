import { useEffect } from 'react';
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
  const stateStr = JSON.stringify({ isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor, activeExercises });

  useEffect(() => {
    syncWidgetState(JSON.parse(stateStr));
  }, [stateStr]);
}
