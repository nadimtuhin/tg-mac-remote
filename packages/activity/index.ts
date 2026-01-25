import { type BotContext } from '@tg-mac-remote/core';
import type { Plugin } from '@tg-mac-remote/core';
import * as os from 'node:os';

const plugin: Plugin = {
  name: 'activity',
  description: 'System activity monitor',
  commands: [
    {
      name: 'activity',
      description: 'Show system activity',
      handler: async () => {
        const cpu = os.cpus();
        const mem = os.totalmem();
        const free = os.freemem();

        return `📊 System Activity\n\nCPU: ${cpu[0].model}\nCores: ${cpu.length}\nMemory: ${Math.round((mem - free) / 1024 / 1024)}/${Math.round(mem / 1024 / 1024)} MB`;
      },
    },
    {
      name: 'cpu',
      description: 'Top CPU consumers',
      handler: async () => {
        return '🔥 Top CPU (Stub)\n1. Chrome 45%\n2. Node 23%';
      },
    },
    {
      name: 'mem',
      description: 'Top Memory consumers',
      handler: async () => {
        return '🧠 Top RAM (Stub)\n1. Chrome 2.1GB\n2. Slack 890MB';
      },
    },
  ],
  register(_bot: unknown): void {},
};

export default plugin;
