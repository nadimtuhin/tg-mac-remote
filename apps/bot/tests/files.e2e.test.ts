import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test';
import { generateMockToken } from './server';

describe('Files Plugin - E2E Tests', () => {
  const mockToken = generateMockToken();
  let server: any = null;

  beforeAll(async () => {
    server = Bun.spawn(['bun', 'run', 'start'], {
      cwd: './tests/mock-telegram',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (server) {
      server.kill();
    }
  });

  describe('Navigation Commands', () => {
    it('should handle /ls command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/ls',
            chat_id: 123456789,
          },
        }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.ok).toBe(true);
      expect(data.result).toBeDefined();
    });

    it('should handle /cd command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/cd /tmp',
            chat_id: 123456789,
          },
        }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.ok).toBe(true);
    });

    it('should handle /pwd command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/pwd',
            chat_id: 123456789,
          },
        }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.ok).toBe(true);
    });
  });

  describe('View Commands', () => {
    it('should handle /cat command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/cat file.txt',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle /find command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/find pattern',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('File Operations', () => {
    it('should handle /touch command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/touch newfile.txt',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle /mkdir command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/mkdir newdir',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle /rm command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/rm oldfile.txt',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle /bookmark command', async () => {
      const response = await fetch('http://localhost:8080/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mockToken,
          message: {
            text: '/bookmark mydir',
            chat_id: 123456789,
          },
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Server Health', () => {
    it('should return server health', async () => {
      const response = await fetch('http://localhost:8080/health');

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.port).toBe(8080);
    });
  });
});
