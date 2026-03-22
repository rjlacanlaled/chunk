export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId: string | null;
  guestId: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  position: number;
  dueDate: Date | null;
  parentTaskId: string | null;
  score: number | null;
  taskNumber: number;
  deletedAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: Date;
  parentTaskId?: string;
  score?: number;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  position?: number;
  dueDate?: Date | null;
  score?: number | null;
}

export type ResolveResult =
  | { match: Task }
  | { matches: Pick<Task, 'id' | 'taskNumber' | 'title' | 'score' | 'status' | 'parentTaskId'>[] }
  | { error: string };

export type CompletionResult = {
  completed: string[];
  ambiguous: { name: string; matches: { taskNumber: number; title: string }[] }[];
  notFound: string[];
};

export type DeletionResult = {
  deleted: number;
  titles: string[];
};

export type PaginatedTasks = {
  tasks: Task[];
  nextCursor: string | null;
};
