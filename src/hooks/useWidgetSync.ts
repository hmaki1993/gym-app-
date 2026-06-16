import { useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';

const FloatingWidget = registerPlugin<any>('FloatingWidget');

export function useWidgetSync(
  isActive: boolean,
  activeExercise: string | null,
  completedSets: number,
  muscleGroup: string,
  loggedData: any,
  historyDates: string[] = [],
  isFinished: boolean = false,
  accentColor: string = '#00E676'
) {
  // Use ref to avoid unneeded dependency triggers if we only want to sync on certain changes
  const stateRef = useRef({ isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor });

  useEffect(() => {
    stateRef.current = { isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor };

    const syncToNative = async () => {
      try {
        await Preferences.set({
          key: 'widget_state',
          value: JSON.stringify(stateRef.current)
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
    };

    syncToNative();
  }, [isActive, activeExercise, completedSets, muscleGroup, loggedData, historyDates, isFinished, accentColor]);
}
