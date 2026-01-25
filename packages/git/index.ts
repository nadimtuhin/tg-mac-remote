import { type BotContext } from '@tg-mac-remote/core';
import type { Plugin } from '@tg-mac-remote/core';
import { spawn } from 'node:child_process';

const plugin: Plugin = {
  name: 'git',
  description: 'Git integration',
  commands: [
    {
      name: 'gstatus',
      description: 'Git status',
      handler: async () => {
        return new Promise((resolve) => {
          const git = spawn('git', ['status']);
          let output = '';
          git.stdout.on('data', (d) => (output += d));
          git.on('close', () => resolve(`\`\`\`\n${output}\n\`\`\``));
        });
      },
    },
    {
      name: 'glog',
      description: 'Git log',
      handler: async () => {
        return new Promise((resolve) => {
          const git = spawn('git', ['log', '-n', '5', '--oneline']);
          let output = '';
          git.stdout.on('data', (d) => (output += d));
          git.on('close', () => resolve(`\`\`\`\n${output}\n\`\`\``));
        });
      },
    },
  ],
  register(_bot: unknown): void {},
};

export default plugin;
