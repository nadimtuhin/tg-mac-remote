import { type BotContext } from '@tg-mac-remote/core';
import type { Plugin } from '@tg-mac-remote/core';
import { spawn } from 'node:child_process';

interface TerminalTab {
  id: number;
  name: string;
  process: any;
  buffer: string[];
  cwd: string;
}

class TerminalManager {
  private tabs: Map<number, TerminalTab> = new Map();
  private activeTabId: number | null = null;
  private nextId = 1;

  createTab(name?: string): number {
    const id = this.nextId++;
    const tabName = name || `Terminal ${id}`;

    // Stub implementation since original was lost
    const tab: TerminalTab = {
      id,
      name: tabName,
      process: null,
      buffer: [],
      cwd: process.cwd(),
    };

    this.tabs.set(id, tab);
    if (this.activeTabId === null) {
      this.activeTabId = id;
    }

    return id;
  }

  getTabs(): TerminalTab[] {
    return Array.from(this.tabs.values());
  }

  getActiveTab(): TerminalTab | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined;
  }

  switchTab(id: number): boolean {
    if (this.tabs.has(id)) {
      this.activeTabId = id;
      return true;
    }
    return false;
  }

  closeTab(id: number): boolean {
    if (this.tabs.has(id)) {
      this.tabs.delete(id);
      if (this.activeTabId === id) {
        const first = this.tabs.keys().next().value;
        this.activeTabId = first || null;
      }
      return true;
    }
    return false;
  }

  runCommand(command: string): Promise<string> {
    return new Promise((resolve) => {
      // Mock implementation
      resolve(`Executed: ${command}\n(Plugin restored from stub)`);
    });
  }
}

const terminalManager = new TerminalManager();

const plugin: Plugin = {
  name: 'terminal',
  description: 'Terminal management plugin',
  commands: [
    {
      name: 'new',
      description: 'Create new terminal tab',
      handler: async (_ctx: BotContext, args: string[]) => {
        const id = terminalManager.createTab(args[0]);
        return `✅ Created tab #${id}`;
      },
    },
    {
      name: 'tabs',
      description: 'List terminal tabs',
      handler: async () => {
        const tabs = terminalManager.getTabs();
        if (tabs.length === 0) return 'No open tabs';
        return tabs
          .map(
            (t) =>
              `#${t.id} ${t.name} ${terminalManager.getActiveTab()?.id === t.id ? '(active)' : ''}`
          )
          .join('\n');
      },
    },
    {
      name: 'switch',
      description: 'Switch to tab',
      handler: async (_ctx: BotContext, args: string[]) => {
        const id = parseInt(args[0]);
        if (terminalManager.switchTab(id)) {
          return `✅ Switched to tab #${id}`;
        }
        return '❌ Tab not found';
      },
    },
    {
      name: 'kill',
      description: 'Close tab',
      handler: async (_ctx: BotContext, args: string[]) => {
        const id = parseInt(args[0]);
        if (terminalManager.closeTab(id)) {
          return `✅ Closed tab #${id}`;
        }
        return '❌ Tab not found';
      },
    },
  ],
  register(_bot: unknown): void {},
};

export default plugin;
