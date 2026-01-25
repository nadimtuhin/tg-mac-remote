import { type BotContext } from '@tg-mac-remote/core';
import type { Plugin } from '@tg-mac-remote/core';
import { spawn } from 'node:child_process';

const plugin: Plugin = {
  name: 'unix',
  description: 'Unix system tools',
  commands: [
    {
      name: 'ps',
      description: 'List processes',
      handler: async () => {
        return new Promise((resolve) => {
          const ps = spawn('ps', ['-A', '-o', 'pid,pcpu,pmem,comm']);
          let output = '';
          ps.stdout.on('data', (d) => (output += d));
          ps.on('close', () => resolve(`\`\`\`\n${output.slice(0, 4000)}\n\`\`\``));
        });
      },
    },
    {
      name: 'uptime',
      description: 'Show system uptime',
      handler: async () => {
        return new Promise((resolve) => {
          const uptime = spawn('uptime');
          let output = '';
          uptime.stdout.on('data', (d) => (output += d));
          uptime.on('close', () => resolve(output));
        });
      },
    },
    {
      name: 'df',
      description: 'Disk usage',
      handler: async () => {
        return new Promise((resolve) => {
          const df = spawn('df', ['-h']);
          let output = '';
          df.stdout.on('data', (d) => (output += d));
          df.on('close', () => resolve(`\`\`\`\n${output}\n\`\`\``));
        });
      },
    },
  ],
  register(_bot: unknown): void {},
};

export default plugin;
