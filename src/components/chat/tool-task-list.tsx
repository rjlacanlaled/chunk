'use client';

import { Check, Trash2 } from 'lucide-react';

interface TaskItem {
  taskNumber?: number;
  title: string;
  status: string;
  score?: number | null;
  dueDate?: string | null;
  parentTaskId?: string | null;
}

function sendAction(msg: string) {
  window.dispatchEvent(new CustomEvent('chunk-action', { detail: msg }));
}

function MiniTask({ task }: { task: TaskItem }) {
  const isDone = task.status === 'done';
  const num = task.taskNumber;

  return (
    <div className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
      isDone ? 'opacity-50' : ''
    } ${task.parentTaskId ? 'ml-4' : ''}`}>
      <button
        type="button"
        onClick={() => num && sendAction(`complete task ${num}`)}
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          isDone
            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
            : 'border-border/60 hover:border-primary/50 hover:bg-primary/10'
        }`}
        disabled={isDone}
      >
        {isDone && <Check className="size-2.5" />}
      </button>
      <span className={`flex-1 truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {num && <span className="text-muted-foreground mr-1">#{num}</span>}
        {task.title}
      </span>
      {task.score && !task.parentTaskId && (
        <span className="text-[10px] text-muted-foreground">{task.score}pts</span>
      )}
      {!isDone && (
        <button
          type="button"
          onClick={() => num && sendAction(`delete task ${num}`)}
          className="text-muted-foreground/40 hover:text-red-400 transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}

export function ToolTaskList({ output }: { output: unknown }) {
  if (!output) return null;

  // Handle paginated result from listTasks
  let tasks: TaskItem[] = [];
  if (Array.isArray(output)) {
    tasks = output;
  } else if (typeof output === 'object' && 'tasks' in (output as Record<string, unknown>)) {
    tasks = (output as { tasks: TaskItem[] }).tasks;
  }

  if (tasks.length === 0) return null;

  // Separate root tasks and subtasks
  const roots = tasks.filter((t) => !t.parentTaskId);
  const children = tasks.filter((t) => t.parentTaskId);

  // Show max 10 tasks in mini list
  const display = roots.slice(0, 10);
  const remaining = roots.length - display.length;

  return (
    <div className="rounded-lg border border-border/30 bg-card/50 overflow-hidden">
      <div className="divide-y divide-border/20">
        {display.map((task, i) => (
          <div key={task.taskNumber ?? i}>
            <MiniTask task={task} />
            {children
              .filter((c) => roots.some((r) => c.parentTaskId && task.taskNumber === roots.find((rt) => rt.title === task.title)?.taskNumber))
              .slice(0, 3)
              .map((child, j) => (
                <MiniTask key={child.taskNumber ?? j} task={child} />
              ))}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-center border-t border-border/20">
          +{remaining} more tasks
        </div>
      )}
    </div>
  );
}
