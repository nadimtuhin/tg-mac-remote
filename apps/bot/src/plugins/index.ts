import { Registry } from '@tg-mac-remote/plugins';
import { info, warn, error } from '@tg-mac-remote/core';

const pluginCache = new Map<string, unknown>();

/**
 * Load plugins from enabled plugins list
 */
export async function loadPlugins(registry: Registry, pluginNames: string[]): Promise<void> {
  const loadedPlugins: string[] = [];
  const failedPlugins: Array<{ name: string; error: string }> = [];

  for (const pluginName of pluginNames) {
    try {
      const plugin = await importPlugin(pluginName);
      if (plugin) {
        registry.registerPlugin(plugin);
        loadedPlugins.push(pluginName);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      failedPlugins.push({ name: pluginName, error: errorMessage });
      error(`Failed to load plugin ${pluginName}:`, err);
    }
  }

  if (loadedPlugins.length > 0) {
    info(`Successfully loaded plugins: ${loadedPlugins.join(', ')}`);
  }

  if (failedPlugins.length > 0) {
    warn(`Failed to load ${failedPlugins.length} plugins:`);
    for (const { name, error: pluginError } of failedPlugins) {
      warn(`  - ${name}: ${pluginError}`);
    }
  }
}

/**
 * Import a plugin by name
 */
async function importPlugin(pluginName: string): Promise<unknown> {
  if (pluginCache.has(pluginName)) {
    return pluginCache.get(pluginName);
  }

  try {
    const pluginModule = await import(`@tg-mac-remote/plugins/${pluginName}`);
    const plugin = pluginModule.default || pluginModule;

    pluginCache.set(pluginName, plugin);
    return plugin;
  } catch (err) {
    throw new Error(`Could not import plugin "${pluginName}": ${err}`);
  }
}
