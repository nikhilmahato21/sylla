import { motion } from "framer-motion";

interface SubjectProgressItem {
  id: string;
  name: string;
  color: string;
  completion: number;
  completedTopics: number;
  totalTopics: number;
}

export function SubjectProgressList({ subjects }: { subjects: SubjectProgressItem[] }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">Subject Progress</h3>

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No subjects yet</p>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject, i) => (
            <div key={subject.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">{subject.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {subject.completion}%
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.completion}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
