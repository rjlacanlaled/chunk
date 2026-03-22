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

  it('sorts tasks by priority then due date', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Low task', priority: 'low' }),
      mockTask({ id: '2', title: 'Urgent task', priority: 'urgent' }),
      mockTask({ id: '3', title: 'High task', priority: 'high' }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    const items = screen.getAllByText(/task$/i);
    expect(items[0]).toHaveTextContent('Urgent task');
    expect(items[1]).toHaveTextContent('High task');
    expect(items[2]).toHaveTextContent('Low task');
  });
});
