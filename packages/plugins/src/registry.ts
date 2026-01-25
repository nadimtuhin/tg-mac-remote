import type { Plugin, PluginRegistry, Command } from '@tg-mac-remote/core';

export class Registry implements PluginRegistry {
  readonly plugins = new Map<string, Plugin>();

  registerPlugin(plugin: Plugin): void {
    if (!this.validatePlugin(plugin)) {
      throw new Error(`Invalid plugin: ${plugin.name}`);
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getCommands(): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.commands) {
        commands.push(...plugin.commands);
      }
    }
    return commands;
  }

  validatePlugin(plugin: Plugin): boolean {
    return (
      typeof plugin.name === 'string' &&
      plugin.name.trim().length > 0 &&
      typeof plugin.description === 'string' &&
      typeof plugin.register === 'function'
    );
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  count(): number {
    return this.plugins.size;
  }
}
