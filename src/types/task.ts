export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  userId: string | null;
  guestId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  position: number;
  dueDate: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  position?: number;
  dueDate?: Date | null;
}
