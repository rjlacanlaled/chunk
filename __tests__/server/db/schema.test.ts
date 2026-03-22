import { describe, it, expect } from 'vitest';
import { tasks, chatMessages } from '@/server/db/schema';

describe('database schema', () => {
  describe('tasks table', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(tasks);
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('guestId');
      expect(columns).toContain('title');
      expect(columns).toContain('description');
      expect(columns).toContain('priority');
      expect(columns).toContain('status');
      expect(columns).toContain('position');
      expect(columns).toContain('dueDate');
      expect(columns).toContain('metadata');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });
  });

  describe('chat_messages table', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(chatMessages);
      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('guestId');
      expect(columns).toContain('sessionId');
      expect(columns).toContain('role');
      expect(columns).toContain('content');
      expect(columns).toContain('toolInvocations');
      expect(columns).toContain('createdAt');
    });
  });
});
