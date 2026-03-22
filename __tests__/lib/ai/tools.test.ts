import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/actions/tasks', () => ({
  createTask: vi.fn(),
  createTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  listTasks: vi.fn(),
  findTaskByName: vi.fn(),
}));

describe('taskTools', () => {
  it('should export all 5 tools', async () => {
    const { taskTools } = await import('@/lib/ai/tools');
    const toolNames = Object.keys(taskTools);

    expect(toolNames).toContain('createTask');
    expect(toolNames).toContain('createTasks');
    expect(toolNames).toContain('completeTask');
    expect(toolNames).toContain('updateTaskByName');
    expect(toolNames).toContain('deleteTaskByName');
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
