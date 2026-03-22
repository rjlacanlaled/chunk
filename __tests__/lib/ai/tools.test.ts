import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/actions/tasks', () => ({
  createTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  listTasks: vi.fn(),
  findTaskByName: vi.fn(),
  searchTasks: vi.fn(),
}));

describe('taskTools', () => {
  it('should export all 7 tools', async () => {
    const { taskTools } = await import('@/lib/ai/tools');
    const toolNames = Object.keys(taskTools);

    expect(toolNames).toContain('createTasks');
    expect(toolNames).toContain('completeTasks');
    expect(toolNames).toContain('updateTasks');
    expect(toolNames).toContain('deleteTasks');
    expect(toolNames).toContain('searchTasks');
    expect(toolNames).toContain('listTasks');
    expect(toolNames).toContain('breakDownTask');
    expect(toolNames).toHaveLength(7);
  });

  it('each tool should have a description defined', async () => {
    const { taskTools } = await import('@/lib/ai/tools');

    for (const [name, toolDef] of Object.entries(taskTools)) {
      expect(toolDef.description, `${name} should have a description`).toBeDefined();
      expect(typeof toolDef.description).toBe('string');
      expect(toolDef.description!.length).toBeGreaterThan(0);
    }
  });

  it('each tool should have an input schema defined', async () => {
    const { taskTools } = await import('@/lib/ai/tools');

    for (const [name, toolDef] of Object.entries(taskTools)) {
      expect(toolDef.inputSchema, `${name} should have an input schema`).toBeDefined();
    }
  });
});
