const fs = require('fs');
const filePath = 'f:/MyRestoredProjects/GymLog/src/features/history/HistoryPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = 'const exerciseToMuscle: Record<string, string> = {};';
const endMarker = '</div>\r\n            );\r\n          })\r\n        )}';
const altEndMarker = '</div>\n            );\n          })\n        )}';

let cardStartIdx = content.indexOf(startMarker);
let cardEndIdx = content.indexOf(endMarker);
let endMarkerLen = endMarker.length;
if (cardEndIdx === -1) {
  cardEndIdx = content.indexOf(altEndMarker);
  endMarkerLen = altEndMarker.length;
}

if (cardStartIdx === -1 || cardEndIdx === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const originalMapBody = content.substring(cardStartIdx, cardEndIdx);
const innerCardCodeIdx = originalMapBody.indexOf('const involvedGroups');
let innerCardCode = originalMapBody.substring(innerCardCodeIdx);

innerCardCode = innerCardCode.replace(/expandedLogId === log\.id/g, 'isOpen');
innerCardCode = innerCardCode.replace(/setExpandedLogId\(expandedLogId === log\.id \? null : log\.id\)/g, 'onToggle(log.id)');

const newComponentCode = `import React from 'react';
import type { WorkoutLog } from '../../types';
import { MUSCLE_GROUPS } from '../../data/exercises';
import { Trash2 } from 'lucide-react';
import { TransparentImage } from '../workout/components/TransparentImage';
import { formatDate, formatTime, formatDuration } from './HistoryPage';

interface Props {
  log: WorkoutLog;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onDeleteWorkout: (id: string) => void;
  tracker: any;
  lang: 'ar' | 'en';
  isLight: boolean;
  t: (k: any) => string;
  exerciseToMuscle: Record<string, string>;
}

export const WorkoutSessionCard = React.memo(({
  log, isOpen, onToggle, onDeleteWorkout, tracker, lang, isLight, t, exerciseToMuscle
}: Props) => {
  ${innerCardCode}
});
`;

fs.writeFileSync('f:/MyRestoredProjects/GymLog/src/features/history/WorkoutSessionCard.tsx', newComponentCode, 'utf-8');

const mapStartMarker = 'consolidatedLogs.map((log: WorkoutLog) => {';
let mapStartIdx = content.indexOf(mapStartMarker);

const replacement = `          {(() => {
            const exerciseToMuscle: Record<string, string> = {};
            Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
              exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
            });
            return consolidatedLogs.map((log: WorkoutLog) => (
              <WorkoutSessionCard
                key={log.id}
                log={log}
                isOpen={expandedLogId === log.id}
                onToggle={handleToggleLog}
                onDeleteWorkout={onDeleteWorkout}
                tracker={tracker}
                lang={lang}
                isLight={isLight}
                t={t}
                exerciseToMuscle={exerciseToMuscle}
              />
            ));
          })()}
        )}
`;

content = content.substring(0, mapStartIdx - 10) + replacement + content.substring(cardEndIdx + endMarkerLen);

content = content.replace("import { TransparentImage } from '../workout/components/TransparentImage';", "import { TransparentImage } from '../workout/components/TransparentImage';\nimport { WorkoutSessionCard } from './WorkoutSessionCard';");

const stateDeclaration = 'const [expandedLogId, setExpandedLogId] = useState<string | null>(null);';
const stateIdx = content.indexOf(stateDeclaration);
const toggleLogic = `\n\n  const handleToggleLog = React.useCallback((id: string) => {\n    setExpandedLogId(prev => prev === id ? null : id);\n  }, []);`;
content = content.substring(0, stateIdx + stateDeclaration.length) + toggleLogic + content.substring(stateIdx + stateDeclaration.length);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactoring completed successfully!');
