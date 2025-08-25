// Simple plugin system skeleton for AI modules
export type PluginRegistration = {
  id: string;
  name: string;
  description?: string;
  activate?: (opts?: any) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
  render?: (props: any) => any;
}

const plugins: Record<string, PluginRegistration> = {}

export const registerPlugin = (plugin: PluginRegistration) => {
  if (!plugin || !plugin.id) throw new Error('Plugin must include id')
  plugins[plugin.id] = plugin
}

export const unregisterPlugin = (id: string) => {
  delete plugins[id]
}

export const getPlugins = () => Object.values(plugins)

export const getPlugin = (id: string) => plugins[id]
