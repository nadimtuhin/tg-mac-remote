import type { Plugin } from '@tg-mac-remote/core';
import { Registry } from './registry.js';

export interface PluginLoadConfig {
  enabledPlugins: string[];
  externalPlugins?: string[];
}

export interface LoadedPlugin {
  name: string;
  source: 'internal' | 'external';
  plugin: Plugin;
}

export class PluginLoader {
  private registry: Registry;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();

  constructor() {
    this.registry = new Registry();
  }

  async loadPlugins(config: PluginLoadConfig): Promise<LoadedPlugin[]> {
    const loaded: LoadedPlugin[] = [];

    // Load internal plugins from packages/
    for (const pluginName of config.enabledPlugins) {
      if (!pluginName) continue;
      const plugin = await this.loadSinglePlugin(pluginName);
      if (plugin) {
        loaded.push(plugin);
      }
    }

    // Load external plugins
    for (const externalPlugin of config.externalPlugins || []) {
      if (!externalPlugin) continue;
      const plugin = await this.loadExternalPlugin(externalPlugin);
      if (plugin) {
        loaded.push(plugin);
      }
    }

    return loaded;
  }

  private async loadSinglePlugin(pluginName: string): Promise<LoadedPlugin | null> {
    try {
      // Dynamic import from package
      // In monorepo, we import by package name @tg-mac-remote/<plugin>
      const packageName = `@tg-mac-remote/${pluginName}`;
      const pluginModule = await import(packageName);

      if (!pluginModule || !pluginModule.default) {
        console.error(`Failed to load internal plugin: ${packageName} (no default export)`);
        return null;
      }

      const pluginInstance: Plugin = pluginModule.default;
      this.validatePlugin(pluginInstance);

      this.registry.registerPlugin(pluginInstance);

      const loaded: LoadedPlugin = {
        name: pluginName,
        source: 'internal',
        plugin: pluginInstance,
      };

      this.loadedPlugins.set(pluginName, loaded);
      return loaded;
    } catch (err) {
      console.error(`Error loading plugin ${pluginName}:`, err);
      return null;
    }
  }

  private async loadExternalPlugin(packageName: string): Promise<LoadedPlugin | null> {
    try {
      const pluginModule = await import(packageName);
      if (!pluginModule || !pluginModule.default) {
        console.error(`Failed to load external plugin: ${packageName}`);
        return null;
      }

      const pluginInstance: Plugin = pluginModule.default;
      this.validatePlugin(pluginInstance);

      this.registry.registerPlugin(pluginInstance);

      const loaded: LoadedPlugin = {
        name: packageName,
        source: 'external',
        plugin: pluginInstance,
      };

      this.loadedPlugins.set(packageName, loaded);
      return loaded;
    } catch (err) {
      console.error(`Error loading external plugin ${packageName}:`, err);
      return null;
    }
  }

  private validatePlugin(plugin: Plugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error(`Plugin missing name: ${plugin.name}`);
    }
    if (!plugin.description || typeof plugin.description !== 'string') {
      throw new Error(`Plugin missing description: ${plugin.name}`);
    }
    if (!plugin.register || typeof plugin.register !== 'function') {
      throw new Error(`Plugin missing register function: ${plugin.name}`);
    }
  }

  getRegistry(): Registry {
    return this.registry;
  }

  getLoadedPlugins(): Map<string, LoadedPlugin> {
    return this.loadedPlugins;
  }
}
