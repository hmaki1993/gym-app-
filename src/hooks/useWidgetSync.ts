import { useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';

export function useWidgetSync(
  isActive: boolean,
  activeExercise: string | null,
  completedSets: number,
  muscleGroup: string
) {
  // Use ref to avoid unneeded dependency triggers if we only want to sync on certain changes
  const stateRef = useRef({ isActive, activeExercise, completedSets, muscleGroup });

  useEffect(() => {
    stateRef.current = { isActive, activeExercise, completedSets, muscleGroup };

    const syncToNative = async () => {
      try {
        await Preferences.set({
          key: 'widget_state',
          value: JSON.stringify(stateRef.current)
        });
      } catch (e) {
        console.error('Failed to sync widget state', e);
      }
    };

    syncToNative();
  }, [isActive, activeExercise, completedSets, muscleGroup]);
}
