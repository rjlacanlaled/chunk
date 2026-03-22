import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskList } from '@/components/tasks/task-list';
import type { Task } from '@/types/task';

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: null,
  guestId: 'guest-123',
  title: 'Test task',
  description: null,
  priority: 'medium',
  status: 'todo',
  position: 0,
  dueDate: null,
  parentTaskId: null,
  score: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('TaskList', () => {
  it('renders task titles', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Buy groceries' }),
      mockTask({ id: '2', title: 'Walk the dog' }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    render(<TaskList tasks={[]} onToggleDone={vi.fn()} />);

    expect(
      screen.getByText('No tasks yet. Start chatting to create some!'),
    ).toBeInTheDocument();
  });

  it('groups tasks by status section', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Todo task', status: 'todo' }),
      mockTask({ id: '2', title: 'Done task', status: 'done' }),
      mockTask({ id: '3', title: 'In progress task', status: 'in_progress' }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('sorts tasks by score (hardest first) within sections', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Easy task', score: 2 }),
      mockTask({ id: '2', title: 'Hard task', score: 8 }),
      mockTask({ id: '3', title: 'Medium task', score: 5 }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    const items = screen.getAllByText(/task$/i);
    expect(items[0]).toHaveTextContent('Hard task');
    expect(items[1]).toHaveTextContent('Medium task');
    expect(items[2]).toHaveTextContent('Easy task');
  });
});
