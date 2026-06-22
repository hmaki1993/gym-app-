const fs = require('fs');
const filePath = 'f:/MyRestoredProjects/GymLog/src/features/history/HistoryPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = 'const exerciseToMuscle: Record<string, string> = {};';
const endMarker = '</div>\r\n            );\r\n          })\r\n        )}';

// Try finding with both \r\n and \n just in case
let cardStartIdx = content.indexOf(startMarker);
let cardEndIdx = content.indexOf(endMarker);

if (cardStartIdx === -1 || cardEndIdx === -1) {
  const endMarker2 = '</div>\n            );\n          })\n        )}';
  cardEndIdx = content.indexOf(endMarker2);
}

if (cardStartIdx === -1 || cardEndIdx === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const originalMapBody = content.substring(cardStartIdx, cardEndIdx);
const innerCardCodeIdx = originalMapBody.indexOf('const involvedGroups');
const innerCardCode = originalMapBody.substring(innerCardCodeIdx);

let cardCode = innerCardCode.replace(/expandedLogId === log\.id/g, 'isOpen');
cardCode = cardCode.replace(/setExpandedLogId\(expandedLogId === log\.id \? null : log\.id\)/g, 'onToggle(log.id)');

const componentCode = `
const WorkoutSessionCard = React.memo(({ 
  log, 
  isOpen, 
  onToggle, 
  onDeleteWorkout, 
  tracker, 
  lang, 
  isLight, 
  t, 
  exerciseToMuscle 
}: { 
  log: WorkoutLog, 
  isOpen: boolean, 
  onToggle: (id: string) => void, 
  onDeleteWorkout: (id: string) => void, 
  tracker: any, 
  lang: 'ar' | 'en', 
  isLight: boolean, 
  t: any, 
  exerciseToMuscle: Record<string, string> 
}) => {
  ${cardCode}
});
`;

const insertMarker = 'export const HistoryPage: React.FC<HistoryPageProps> = ({ tracker, isFloating, onClose }) => {';
content = content.replace(insertMarker, componentCode + '\n\n' + insertMarker);

const mapStartMarker = 'consolidatedLogs.map((log: WorkoutLog) => {';
const mapEndMarker = '</div>\r\n            );\r\n          })\r\n        )}';

let mapStartIdx = content.indexOf(mapStartMarker);
let mapEndIdx = content.indexOf(mapEndMarker);
let endMarkerLen = mapEndMarker.length;

if (mapEndIdx === -1) {
    const mapEndMarker2 = '</div>\n            );\n          })\n        )}';
    mapEndIdx = content.indexOf(mapEndMarker2);
    endMarkerLen = mapEndMarker2.length;
}

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
                onToggle={(id) => setExpandedLogId(prev => prev === id ? null : id)}
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

content = content.substring(0, mapStartIdx) + replacement.trim() + content.substring(mapEndIdx + endMarkerLen - 1);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactoring successful!');
