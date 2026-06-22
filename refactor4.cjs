const fs = require('fs');
let code = fs.readFileSync('src/features/history/HistoryPage.tsx', 'utf8');

const stateDecl = 'const [expandedLogId, setExpandedLogId] = useState<string | null>(null);';
const hooksCode = `\n\n  const handleToggleLog = React.useCallback((id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  }, []);

  const exerciseToMuscle = React.useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { map[ex] = group; });
    });
    return map;
  }, []);\n`;

code = code.replace(stateDecl, stateDecl + hooksCode);

const mapStartStr = 'consolidatedLogs.map((log: WorkoutLog) => {';
const mapStartIdx = code.indexOf(mapStartStr);

let mapEndIdx = code.indexOf('</div>\r\n            );\r\n          })\r\n        )}');
let mapEndLen = 48; 
if (mapEndIdx === -1) {
    const altMapEnd = '</div>\n            );\n          })\n        )}';
    mapEndIdx = code.indexOf(altMapEnd);
    mapEndLen = altMapEnd.length;
}

if (mapStartIdx === -1 || mapEndIdx === -1) {
    console.error('Map block not found');
    process.exit(1);
}

const mapBody = code.substring(mapStartIdx, mapEndIdx);
const logicStartIdx = mapBody.indexOf('const involvedGroups = new Set<string>();');
let cardLogic = mapBody.substring(logicStartIdx); 
cardLogic += '\n</div>';

cardLogic = cardLogic.replace(/expandedLogId === log\.id/g, 'isOpen');
cardLogic = cardLogic.replace(/setExpandedLogId\(expandedLogId === log\.id \? null : log\.id\)/g, 'onToggle(log.id)');
cardLogic = cardLogic.replace(/setExpandedLogId\(isOpen \? null : log\.id\)/g, 'onToggle(log.id)');

const cardComponent = `\nconst WorkoutSessionCard = React.memo(({ 
  log, tracker, lang, isLight, t, isOpen, onToggle, onDeleteWorkout, exerciseToMuscle 
}: any) => {
  ${cardLogic}
  );
});\n\n`;

const replacement = `consolidatedLogs.map((log: WorkoutLog) => (
            <WorkoutSessionCard
              key={log.id}
              log={log}
              tracker={tracker}
              lang={lang}
              isLight={isLight}
              t={t}
              isOpen={expandedLogId === log.id}
              onToggle={handleToggleLog}
              onDeleteWorkout={onDeleteWorkout}
              exerciseToMuscle={exerciseToMuscle}
            />
          ))
        )}`;

code = code.substring(0, mapStartIdx) + replacement + code.substring(mapEndIdx + mapEndLen);

const exportIdx = code.indexOf('export const HistoryPage: React.FC<HistoryPageProps> = ({ tracker, isFloating, onClose }) => {');
code = code.substring(0, exportIdx) + cardComponent + code.substring(exportIdx);

fs.writeFileSync('src/features/history/HistoryPage.tsx', code, 'utf8');
console.log('Successfully refactored HistoryPage.tsx');
