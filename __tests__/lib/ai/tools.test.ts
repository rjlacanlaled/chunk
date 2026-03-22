import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/actions/tasks', () => ({
  createTasks: vi.fn(),
  resolveTask: vi.fn(),
  updateTasksByIds: vi.fn(),
  completeWithDescendants: vi.fn(),
  deleteByIds: vi.fn(),
  deleteByFilter: vi.fn(),
  listTasks: vi.fn(),
  searchTasks: vi.fn(),
}));

describe('taskTools', () => {
  it('should export all 6 tools', async () => {
    const { makeTaskTools } = await import('@/lib/ai/tools');
    const taskTools = makeTaskTools({ guestId: 'test' });
    const toolNames = Object.keys(taskTools);

    expect(toolNames).toContain('createTasks');
    expect(toolNames).toContain('completeTasks');
    expect(toolNames).toContain('updateTasks');
    expect(toolNames).toContain('deleteTasks');
    expect(toolNames).toContain('searchTasks');
    expect(toolNames).toContain('listTasks');
    expect(toolNames).not.toContain('breakDownTask');
    expect(toolNames).toHaveLength(6);
  });

  it('each tool should have a description defined', async () => {
    const { makeTaskTools } = await import('@/lib/ai/tools');
    const taskTools = makeTaskTools({ guestId: 'test' });

    for (const [name, toolDef] of Object.entries(taskTools)) {
      expect(toolDef.description, `${name} should have a description`).toBeDefined();
      expect(typeof toolDef.description).toBe('string');
      expect(toolDef.description!.length).toBeGreaterThan(0);
    }
  });

  it('each tool should have an input schema defined', async () => {
    const { makeTaskTools } = await import('@/lib/ai/tools');
    const taskTools = makeTaskTools({ guestId: 'test' });

    for (const [name, toolDef] of Object.entries(taskTools)) {
      expect(toolDef.inputSchema, `${name} should have an input schema`).toBeDefined();
    }
  });
});
