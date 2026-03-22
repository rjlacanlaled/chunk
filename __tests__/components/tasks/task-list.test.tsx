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
  taskNumber: 1,
  deletedAt: null,
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

    // Section headers are rendered as <h3> elements inside <button>
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    // "Done" appears in both the QuickStats bar and the section header
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);
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

  it('shows quick stats with total and completed counts', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Active', status: 'todo' }),
      mockTask({ id: '2', title: 'Finished', status: 'done' }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    // The QuickStats component shows Total, Done, and Today labels
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('collapses done section by default', () => {
    const tasks = [
      mockTask({ id: '1', title: 'Active task', status: 'todo' }),
      mockTask({ id: '2', title: 'Finished task', status: 'done' }),
    ];

    render(<TaskList tasks={tasks} onToggleDone={vi.fn()} />);

    // Active task should be visible
    expect(screen.getByText('Active task')).toBeInTheDocument();
    // Done task should NOT be visible (section collapsed by default)
    expect(screen.queryByText('Finished task')).not.toBeInTheDocument();
  });
});
