import { type BotContext, type Plugin } from '@tg-mac-remote/core';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

interface FileManagerState {
  cwd: string;
  history: string[];
  bookmarks: Map<string, string>;
  clipboard: {
    paths: string[];
    operation: 'copy' | 'cut';
  } | null;
  editMode: {
    file: string;
    content: string;
  } | null;
  uploadTarget: string | null;
}

class FileManager {
  private state: Map<number, FileManagerState> = new Map();

  private getState(chatId: number): FileManagerState {
    if (!this.state.has(chatId)) {
      this.state.set(chatId, {
        cwd: process.env.HOME || '/',
        history: [],
        bookmarks: new Map([
          ['home', process.env.HOME || '/'],
          ['desktop', `${process.env.HOME}/Desktop`],
          ['downloads', `${process.env.HOME}/Downloads`],
          ['documents', `${process.env.HOME}/Documents`],
        ]),
        clipboard: null,
        editMode: null,
        uploadTarget: null,
      });
    }
    return this.state.get(chatId)!;
  }

  private resolvePath(chatId: number, inputPath: string): string {
    const s = this.getState(chatId);

    if (inputPath.startsWith('~')) {
      inputPath = inputPath.replace('~', process.env.HOME || '');
    }

    if (path.isAbsolute(inputPath)) {
      return path.normalize(inputPath);
    }

    return path.normalize(path.resolve(s.cwd, inputPath));
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  private formatMode(mode: number): string {
    const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = perms[(mode >> 6) & 7];
    const group = perms[(mode >> 3) & 7];
    const other = perms[mode & 7];
    return owner + group + other;
  }

  async ls(chatId: number, args: string[]): Promise<string> {
    const detailed = args.includes('-la') || args.includes('-l');
    const targetPath = this.resolvePath(chatId, args.find((a) => !a.startsWith('-')) || '.');

    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });

      let output = `📂 *${targetPath}*\n\n`;

      if (detailed) {
        for (const entry of entries.slice(0, 50)) {
          const fullPath = path.join(targetPath, entry.name);
          const stats = await fs.stat(fullPath).catch(() => null);

          if (stats) {
            const icon = entry.isDirectory() ? '📁' : '📄';
            const perms = this.formatMode(stats.mode);
            const size = entry.isDirectory() ? '-' : this.formatSize(stats.size);
            output += `${icon} \`${perms}\` ${size.padStart(8)} ${entry.name}\n`;
          }
        }
      } else {
        const dirs = entries.filter((e) => e.isDirectory()).map((e) => `📁 ${e.name}`);
        const files = entries.filter((e) => !e.isDirectory()).map((e) => `📄 ${e.name}`);
        output += dirs.join('\n') + '\n' + files.join('\n');
      }

      if (entries.length > 50) {
        output += `\n... and ${entries.length - 50} more`;
      }

      return output;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async cd(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    const targetPath = this.resolvePath(chatId, args.join(' ') || '~');

    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isDirectory()) {
        return '❌ Not a directory';
      }

      s.history.push(s.cwd);
      if (s.history.length > 20) s.history.shift();
      s.cwd = targetPath;

      return `📂 ${targetPath}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async pwd(chatId: number): Promise<string> {
    const s = this.getState(chatId);
    return `📂 ${s.cwd}`;
  }

  async back(chatId: number): Promise<string> {
    const s = this.getState(chatId);
    if (s.history.length > 0) {
      s.cwd = s.history.pop()!;
      return `📂 ${s.cwd}`;
    }
    return '❌ No history';
  }

  async tree(chatId: number, args: string[]): Promise<string> {
    const targetPath = this.resolvePath(chatId, args[0] || '.');
    const depth = parseInt(args[1]) || 2;

    return new Promise((resolve) => {
      const child = spawn('tree', ['-L', depth.toString(), '--noreport', targetPath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          const truncated = output.split('\n').slice(0, 100).join('\n');
          resolve(`\`\`\`\n${truncated}\n\`\`\``);
        } else {
          resolve(`❌ Failed to generate tree`);
        }
      });

      child.on('error', () => {
        resolve('❌ tree command not available. Install: brew install tree');
      });
    });
  }

  async gotoBookmark(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    const name = args[0];

    if (s.bookmarks.has(name)) {
      s.history.push(s.cwd);
      s.cwd = s.bookmarks.get(name)!;
      return `📂 ${s.cwd}`;
    }
    return `❌ Bookmark "${name}" not found`;
  }

  async cat(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (content.length > 4000) {
        return `📄 ${filePath}`;
      }

      return `\`\`\`\n${content}\n\`\`\``;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async head(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);
    const n = parseInt(args[1]) || 10;

    return new Promise((resolve) => {
      const child = spawn('head', ['-n', n.toString(), filePath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(`📄 First ${n} lines:\n\n\`\`\`\n${output}\n\`\`\``);
        } else {
          resolve(`❌ Failed to read file`);
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async tail(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);
    const n = parseInt(args[1]) || 10;

    return new Promise((resolve) => {
      const child = spawn('tail', ['-n', n.toString(), filePath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(`📄 Last ${n} lines:\n\n\`\`\`\n${output}\n\`\`\``);
        } else {
          resolve(`❌ Failed to read file`);
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async file(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('file', [filePath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(`📄 ${output.trim()}`);
        } else {
          resolve(`❌ Failed to determine file type`);
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async stat(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    try {
      const stats = await fs.stat(filePath);
      const isDir = stats.isDirectory();
      const isFile = stats.isFile();

      let output = `📊 ${path.basename(filePath)}\n\n`;
      output += `Type: ${isDir ? 'Directory' : isFile ? 'File' : 'Other'}\n`;
      output += `Size: ${this.formatSize(stats.size)}\n`;
      output += `Modified: ${new Date(stats.mtime).toLocaleString()}\n`;
      output += `Permissions: ${this.formatMode(stats.mode)}\n`;
      output += `Inode: ${stats.ino}\n`;

      return output;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async find(chatId: number, args: string[]): Promise<string> {
    let searchPath = this.getState(chatId).cwd;
    let pattern = args[0];

    if (args.length > 1) {
      searchPath = this.resolvePath(chatId, args[0]);
      pattern = args[1];
    }

    return new Promise((resolve) => {
      const child = spawn('find', [searchPath, '-name', `*${pattern}*`, '-maxdepth', '5']);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr.on('data', () => {
      });

      child.on('close', () => {
        const lines = output.split('\n').filter((l) => l).slice(0, 30);
        resolve(
          `🔍 *Results for "${pattern}"*\n\n\`\`\`\n${lines.join('\n') || 'No matches'}\n\`\`\``
        );
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async grep(chatId: number, args: string[]): Promise<string> {
    const pattern = args[0];
    const targetPath = args[1] || '.';

    if (!pattern) {
      return '❌ Pattern required. Usage: /grep <pattern> [path]';
    }

    return new Promise((resolve) => {
      const child = spawn('grep', ['-r', '-n', pattern, targetPath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const lines = output.split('\n').slice(0, 20);
        resolve(
          `🔍 *Search Results (${pattern})*\n\n\`\`\`\n${lines.join('\n') || 'No matches'}\n\`\`\``
        );
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async locate(chatId: number, args: string[]): Promise<string> {
    const query = args.join(' ');

    return new Promise((resolve) => {
      const child = spawn('mdfind', ['-name', query]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const lines = output.split('\n').slice(0, 20);
        resolve(
          `🔍 *Results for "${query}"*\n\n\`\`\`\n${lines.join('\n') || 'No matches'}\n\`\`\``
        );
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async touch(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    try {
      await fs.writeFile(filePath, '');
      return `✅ Created: ${path.basename(filePath)}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async mkdir(chatId: number, args: string[]): Promise<string> {
    const dirPath = this.resolvePath(chatId, args.join(' '));

    try {
      await fs.mkdir(dirPath);
      return `✅ Created directory: ${path.basename(dirPath)}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async mkdirp(chatId: number, args: string[]): Promise<string> {
    const dirPath = this.resolvePath(chatId, args.join(' '));

    try {
      await fs.mkdir(dirPath, { recursive: true });
      return `✅ Created directories: ${dirPath}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async write(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);
    const content = args.slice(1).join(' ');

    if (!content) {
      return '❌ No content provided. Usage: /write <file> <text>';
    }

    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return `✅ Wrote to ${path.basename(filePath)}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async append(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);
    const content = args.slice(1).join(' ');

    if (!content) {
      return '❌ No content provided. Usage: /append <file> <text>';
    }

    try {
      await fs.appendFile(filePath, content + '\n', 'utf-8');
      return `✅ Appended to ${path.basename(filePath)}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async cp(chatId: number, args: string[]): Promise<string> {
    const src = this.resolvePath(chatId, args[0]);
    const dst = this.resolvePath(chatId, args[1]);

    if (!src || !dst) {
      return '❌ Usage: /cp <src> <dst>';
    }

    try {
      const srcStats = await fs.stat(src);
      if (srcStats.isDirectory()) {
        return new Promise((resolve) => {
          const child = spawn('cp', ['-r', src, dst]);
          child.on('close', (code) => {
            if (code === 0) {
              resolve(`✅ Copied ${path.basename(src)} → ${dst}`);
            } else {
              resolve('❌ Copy failed');
            }
          });
        });
      }
      await fs.copyFile(src, dst);
      return `✅ Copied ${path.basename(src)} → ${dst}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async mv(chatId: number, args: string[]): Promise<string> {
    const src = this.resolvePath(chatId, args[0]);
    const dst = this.resolvePath(chatId, args[1]);

    if (!src || !dst) {
      return '❌ Usage: /mv <src> <dst>';
    }

    try {
      await fs.rename(src, dst);
      return `✅ Moved ${path.basename(src)} → ${dst}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async rm(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));
    const basename = path.basename(filePath);

    return `⚠️ Delete *${basename}*?\n\n⚠️ This action is destructive.\nTo proceed, use: /rmrf ${filePath}`;
  }

  async rmrf(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('rm', ['-rf', filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Deleted: ${filePath}`);
        } else {
          resolve('❌ Delete failed');
        }
      });
    });
  }

  async trash(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('mv', [filePath, `${process.env.HOME}/.Trash/`]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`🗑 Moved to Trash: ${path.basename(filePath)}`);
        } else {
          resolve('❌ Move to trash failed');
        }
      });
    });
  }

  async bookmark(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    const name = args[0];
    const targetPath = args[1] ? this.resolvePath(chatId, args[1]) : s.cwd;

    if (!name) {
      return '❌ Bookmark name required. Usage: /bookmark <name> [path]';
    }

    s.bookmarks.set(name, targetPath);
    return `🔖 Saved: ${name} → ${targetPath}`;
  }

  async listBookmarks(chatId: number): Promise<string> {
    const s = this.getState(chatId);

    let output = '🔖 *Bookmarks*\n\n';
    for (const [name, bookmarkPath] of s.bookmarks) {
      output += `• *${name}*: ${bookmarkPath}\n`;
    }

    return output;
  }

  async unbookmark(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    const name = args[0];

    if (s.bookmarks.has(name)) {
      s.bookmarks.delete(name);
      return `✅ Removed bookmark: ${name}`;
    }
    return `❌ Bookmark "${name}" not found`;
  }

  async df(): Promise<string> {
    return new Promise((resolve) => {
      const child = spawn('df', ['-h']);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        resolve(`💾 Disk Usage:\n\n\`\`\`\n${output}\n\`\`\``);
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async du(chatId: number, args: string[]): Promise<string> {
    const targetPath = this.resolvePath(chatId, args[0] || '.');

    return new Promise((resolve) => {
      const child = spawn('du', ['-sh', targetPath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        resolve(`📁 Directory Size:\n\n\`\`\`\n${output}\n\`\`\``);
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async space(chatId: number, args: string[]): Promise<string> {
    const targetPath = this.resolvePath(chatId, args[0] || '.');

    return new Promise((resolve) => {
      const child = spawn('du', ['-sh', targetPath, '*', '.*']);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const lines = output
          .split('\n')
          .filter((l) => l)
          .sort((a, b) => {
            const sizeA = parseInt(a.trim().split(/\s+/)[0] || '0');
            const sizeB = parseInt(b.trim().split(/\s+/)[0] || '0');
            return sizeB - sizeA;
          })
          .slice(0, 10);

        resolve(`📦 Largest items:\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``);
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async open(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('open', [filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Opened: ${path.basename(filePath)}`);
        } else {
          resolve('❌ Failed to open');
        }
      });
    });
  }

  async reveal(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('open', ['-R', filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Revealed in Finder: ${path.basename(filePath)}`);
        } else {
          resolve('❌ Failed to reveal');
        }
      });
    });
  }

  async less(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);

    return new Promise((resolve) => {
      const child = spawn('less', ['-F', '-R', filePath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        if (output.length > 4000) {
          resolve(`📄 ${filePath}`);
        } else {
          resolve(`📄 File contents:\n\n\`\`\`\n${output}\n\`\`\``);
        }
      });

      child.on('error', () => {
        resolve('❌ less command not available. Install: brew install less');
      });
    });
  }

  async hexdump(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args[0]);
    const n = parseInt(args[1]) || 256;

    return new Promise((resolve) => {
      const child = spawn('hexdump', ['-C', n.toString(), filePath]);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          const lines = output.split('\n').slice(0, 50);
          resolve(`📄 Hex dump (first ${n} bytes):\n\n\`\`\n${lines.join('\n')}\n\`\`\``);
        } else {
          resolve('❌ Failed to create hex dump');
        }
      });

      child.on('error', () => {
        resolve('❌ hexdump command not available. Use: xxd (built-in)');
      });
    });
  }

  async preview(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));
    const ext = path.extname(filePath).toLowerCase();

    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        return '❌ Preview not supported for directories. Use /ls instead.';
      }

      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return `📄 ${filePath}`;
      } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
        return `📄 ${filePath}`;
      } else if (['.mp3', '.wav', '.m4a'].includes(ext)) {
        return `📄 ${filePath}`;
      } else if (ext === '.pdf') {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.length > 1000) {
          return `📄 ${filePath}`;
        }
        return `📄 First page preview:\n\n\`\`\`\n${content.slice(0, 1000)}\n\`\`\``;
      } else {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.length > 2000) {
          return `📄 ${filePath}`;
        }
        return `📄 Preview:\n\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\``;
      }
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async edit(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    const filePath = this.resolvePath(chatId, args[0]);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      s.editMode = {
        file: filePath,
        content,
      };
      return `📝 Editing: ${path.basename(filePath)}\n\nSend text lines to append. Send /done to save.`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async nano(chatId: number, args: string[]): Promise<string> {
    return `📝 Use terminal plugin instead:\n\n/new ${args[0]}\ncd ${path.dirname(args[0])}\nnano ${args[0]}`;
  }

  async rmdir(chatId: number, args: string[]): Promise<string> {
    const dirPath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('rmdir', [dirPath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Removed directory: ${path.basename(dirPath)}`);
        } else {
          resolve(`❌ Directory not empty or not found: ${path.basename(dirPath)}`);
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async restore(chatId: number, args: string[]): Promise<string> {
    const name = args[0] || args.join(' ');

    return `📝 Restore feature:\n\nTo restore "${name}", use Terminal plugin:\nls ~/.Trash\nmv ~/.Trash/<path> <destination>`;
  }

  async download(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        return `📦 ${path.basename(filePath)} is a directory. Use /downloadzip instead.`;
      }

      if (stats.size > 50 * 1024 * 1024) {
        return `❌ File too large (${this.formatSize(stats.size)}). Use /share for download link.`;
      }

      return `📄 ${filePath}`;
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async downloadzip(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));
    const zipPath = `/tmp/${path.basename(filePath)}.zip`;

    return new Promise((resolve) => {
      const child = spawn('zip', ['-r', zipPath, filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`📦 ${zipPath}`);
        } else {
          resolve('❌ Failed to create zip');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async upload(chatId: number, _args: string[]): Promise<string> {
    const s = this.getState(chatId);
    s.uploadTarget = s.cwd;

    return `📤 Send me a file. Will save to:\n${s.cwd}`;
  }

  async uploadto(chatId: number, args: string[]): Promise<string> {
    const s = this.getState(chatId);
    s.uploadTarget = this.resolvePath(chatId, args.join(' '));

    return `📤 Send me a file. Will save to:\n${s.uploadTarget}`;
  }

  async share(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return `🔗 Share link:\n\nFor sharing, use ngrok to expose a local HTTP server.\n\n1. Start server: python3 -m http.server 8000\n2. Expose with ngrok: ngrok http 8000\n\nThis is for manual setup.`;
  }

  async qr(chatId: number, args: string[]): Promise<string> {
    return `📱 QR Code:\n\nQR codes are generated for share links. First create a share link with /share, then use a QR code generator service.`;
  }

  async recent(chatId: number, args: string[]): Promise<string> {
    const n = parseInt(args[0]) || 20;
    const searchPath = this.resolvePath(chatId, args[1] || this.getState(chatId).cwd);

    return new Promise((resolve) => {
      const child = spawn('find', [searchPath, '-type', 'f', '-mtime', '-7d', '-exec', 'ls -ld {} \\;']);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const lines = output.split('\n').filter((l) => l).slice(0, n);
        resolve(`📅 Recent files (${n} days):\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``);
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async large(chatId: number, args: string[]): Promise<string> {
    const n = parseInt(args[0]) || 20;
    const searchPath = this.resolvePath(chatId, args[1] || this.getState(chatId).cwd;

    return new Promise((resolve) => {
      const child = spawn('find', [searchPath, '-type', 'f', '-exec', 'ls -lS {} + 2>/dev/null \\;']);
      let output = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const lines = output.split('\n').filter((l) => l).slice(0, n);
        resolve(`🐘 Largest files (${n}):\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``);
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async duplicates(chatId: number, args: string[]): Promise<string> {
    const searchPath = this.resolvePath(chatId, args.join(' ') || '.');

    return `🔍 Duplicate detection:\n\nFor full duplicate detection, use:\n\nfind "${searchPath}" -type f -exec md5sum {} \\; | sort | uniq -d\n\nThis is for manual setup.`;
  }

  async chmod(chatId: number, args: string[]): Promise<string> {
    const mode = args[0];
    const filePath = this.resolvePath(chatId, args.slice(1).join(' '));

    if (!mode || !filePath) {
      return '❌ Usage: /chmod <mode> <path>\n\nExample: /chmod 755 file.txt';
    }

    return new Promise((resolve) => {
      const child = spawn('chmod', [mode, filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Changed permissions of ${path.basename(filePath)} to ${mode}`);
        } else {
          resolve('❌ Failed to change permissions');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async chown(chatId: number, args: string[]): Promise<string> {
    const owner = args[0];
    const filePath = this.resolvePath(chatId, args.slice(1).join(' '));

    if (!owner || !filePath) {
      return '❌ Usage: /chown <owner> <path>\n\nExample: /chown user file.txt';
    }

    return new Promise((resolve) => {
      const child = spawn('chown', [owner, filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Changed owner of ${path.basename(filePath)} to ${owner}`);
        } else {
          resolve('❌ Failed to change owner');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async chgrp(chatId: number, args: string[]): Promise<string> {
    const group = args[0];
    const filePath = this.resolvePath(chatId, args.slice(1).join(' '));

    if (!group || !filePath) {
      return '❌ Usage: /chgrp <group> <path>\n\nExample: /chgrp staff file.txt`;
    }

    return new Promise((resolve) => {
      const child = spawn('chgrp', [group, filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Changed group of ${path.basename(filePath)} to ${group}`);
        } else {
          resolve('❌ Failed to change group');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async zip(chatId: number, args: string[]): Promise<string> {
    const archiveName = args[0];
    const paths = args.slice(1);

    if (!archiveName || paths.length === 0) {
      return '❌ Usage: /zip <name> <paths...>\n\nExample: /zip backup.txt file1.txt file2.txt';
    }

    return new Promise((resolve) => {
      const child = spawn('zip', ['-r', archiveName, ...paths]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Created archive: ${archiveName}.zip`);
        } else {
          resolve('❌ Failed to create zip');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async unzip(chatId: number, args: string[]): Promise<string> {
    const archivePath = this.resolvePath(chatId, args[0]);
    const dest = args[1] || '.';

    return new Promise((resolve) => {
      const child = spawn('unzip', ['-o', dest, archivePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Extracted ${path.basename(archivePath)} to ${dest}`);
        } else {
          resolve('❌ Failed to extract');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async tar(chatId: number, args: string[]): Promise<string> {
    const archiveName = args[0];
    const paths = args.slice(1);

    if (!archiveName || paths.length === 0) {
      return '❌ Usage: /tar <name> <paths...>\n\nExample: /tar backup.tar.gz dir1 dir2';
    }

    return new Promise((resolve) => {
      const child = spawn('tar', ['-czf', `${archiveName}.tar.gz`, ...paths]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Created archive: ${archiveName}.tar.gz`);
        } else {
          resolve('❌ Failed to create tar');
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async untar(chatId: number, args: string[]): Promise<string> {
    const archivePath = this.resolvePath(chatId, args[0]);
    const dest = args[1] || '.';

    return new Promise((resolve) => {
      const child = spawn('tar', ['-xzf', archivePath, '-C', dest]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Extracted ${path.basename(archivePath)} to ${dest}`);
        } else {
          resolve('❌ Failed to extract`);
        }
      });

      child.on('error', (e: any) => {
        resolve(`❌ ${e.message}`);
      });
    });
  }

  async compress(chatId: number, args: string[]): Promise<string> {
    const targetPath = this.resolvePath(chatId, args.join(' '));
    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
      const archivePath = `/tmp/${path.basename(targetPath)}.tar.gz`;
      return new Promise((resolve) => {
        const child = spawn('tar', ['-czf', archivePath, targetPath]);
        child.on('close', (code) => {
          if (code === 0) {
            resolve(`📦 ${archivePath}`);
          } else {
            resolve(`❌ Failed to compress`);
          }
        });

        child.on('error', (e: any) => {
          resolve(`❌ ${e.message}`);
        });
      });
    } else {
      const archivePath = `/tmp/${path.basename(targetPath)}.zip`;
      return new Promise((resolve) => {
        const child = spawn('zip', archivePath, targetPath]);
        child.on('close', (code) => {
          if (code === 0) {
            resolve(`📦 ${archivePath}`);
          } else {
            resolve(`❌ Failed to compress`);
          }
        });

        child.on('error', (e: any) => {
          resolve(`❌ ${e.message}`);
        });
      });
    }
  }

  async extract(chatId: number, args: string[]): Promise<string> {
    const archivePath = this.resolvePath(chatId, args[0]);
    const dest = args[1] || '.';
    const ext = path.extname(archivePath).toLowerCase();

    if (ext === '.zip') {
      return new Promise((resolve) => {
        const child = spawn('unzip', ['-o', dest, archivePath]);
        child.on('close', (code) => {
          if (code === 0) {
            resolve(`✅ Extracted ${path.basename(archivePath)} to ${dest}`);
          } else {
            resolve('❌ Failed to extract`);
          }
        });

        child.on('error', (e: any) => {
          resolve(`❌ ${e.message}`);
        });
      });
    } else if (ext === '.tar' || ext === '.tgz' || ext === '.gz') {
      return new Promise((resolve) => {
        const child = spawn('tar', ['-xzf', archivePath, '-C', dest]);
        child.on('close', (code) => {
          if (code === 0) {
            resolve(`✅ Extracted ${path.basename(archivePath)} to ${dest}`);
          } else {
            resolve('❌ Failed to extract`);
          }
        });

        child.on('error', (e: any) => {
          resolve(`❌ ${e.message}`);
        });
      });
    } else {
      return `❌ Unsupported archive format: ${ext}\n\nSupported: .zip, .tar, .tgz, .gz`;
    }
  }

  async cleanup(chatId: number, args: string[]): Promise<string> {
    const searchPath = this.resolvePath(chatId, args.join(' ') || this.getState(chatId).cwd;

    const candidates = [
      'node_modules',
      '.DS_Store',
      'npm-debug.log',
      '.git',
      '.vscode',
      'Thumbs.db',
      '*.log',
      '*.tmp',
    ];

    let output = `🧹 Cleanup candidates in ${searchPath}:\n\n`;
    for (const candidate of candidates) {
      output += `  ${candidate}\n`;
    }
    output += `\nTo remove:\n/find "${searchPath}" -name "${candidates.join('" -o -name "')}" -delete`;

    return output;
  }

  async emptytrash(chatId: number, _args: string[]): Promise<string> {
    return `🗑 Empty Trash:\n\nTo empty trash:\nrm -rf ~/.Trash/*\n\n⚠️ This cannot be undone!`;
  }

  async quicklook(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn('qlmanage', ['-p', filePath]);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(`✅ Quick Look opened for ${path.basename(filePath)}`);
        } else {
          resolve('❌ Failed to open Quick Look');
        }
      });

      child.on('error', () => {
        resolve('❌ Quick Look not available. This is macOS only.');
      });
    });
  }

  async clipBoard(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return new Promise((resolve) => {
        const child = spawn('osascript', ['-e', `set the clipboard to "${content}"`]);
        child.on('close', (code) => {
          if (code === 0) {
            resolve(`✅ Copied ${path.basename(filePath)} to clipboard`);
          } else {
            resolve(`❌ Failed to copy to clipboard`);
          }
        });

        child.on('error', (e: any) => {
          resolve(`❌ ${e.message}`);
        });
      });
    });
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }

  async airdrop(chatId: number, args: string[]): Promise<string> {
    const filePath = this.resolvePath(chatId, args.join(' '));

    return `📲 AirDrop:\n\nTo send via AirDrop:\n1. Control-click file in Finder\n2. Share > AirDrop\n\nThis is a manual system action.`;
  }
}

const fileManager = new FileManager();

const plugin: Plugin = {
  name: 'files',
  version: '1.0.0',
  description: 'Full file system access via Telegram',

  commands: [
    {
      name: 'ls',
      description: 'List directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.ls(0, args),
    },
    {
      name: 'cd',
      description: 'Change directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.cd(0, args),
    },
    {
      name: 'pwd',
      description: 'Print working directory',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.pwd(0),
    },
    {
      name: 'back',
      description: 'Go back',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.back(0),
    },
    {
      name: 'home',
      description: 'Go to home directory',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.cd(0, ['~']),
    },
    {
      name: 'desktop',
      description: 'Go to Desktop',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.cd(0, [`${process.env.HOME}/Desktop`]),
    },
    {
      name: 'downloads',
      description: 'Go to Downloads',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.cd(0, [`${process.env.HOME}/Downloads`]),
    },
    {
      name: 'documents',
      description: 'Go to Documents',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.cd(0, [`${process.env.HOME}/Documents`]),
    },
    {
      name: 'tree',
      description: 'Tree view',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.tree(0, args),
    },
    {
      name: 'cat',
      description: 'View file',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.cat(0, args),
    },
    {
      name: 'head',
      description: 'First n lines',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.head(0, args),
    },
    {
      name: 'tail',
      description: 'Last n lines',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.tail(0, args),
    },
    {
      name: 'file',
      description: 'File type info',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.file(0, args),
    },
    {
      name: 'stat',
      description: 'File stats',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.stat(0, args),
    },
    {
      name: 'find',
      description: 'Find files',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.find(0, args),
    },
    {
      name: 'grep',
      description: 'Search content',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.grep(0, args),
    },
    {
      name: 'locate',
      description: 'Fast search',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.locate(0, args),
    },
    {
      name: 'touch',
      description: 'Create empty file',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.touch(0, args),
    },
    {
      name: 'mkdir',
      description: 'Create directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.mkdir(0, args),
    },
    {
      name: 'mkdirp',
      description: 'Create nested directories',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.mkdirp(0, args),
    },
    {
      name: 'write',
      description: 'Write to file',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.write(0, args),
    },
    {
      name: 'append',
      description: 'Append to file',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.append(0, args),
    },
    {
      name: 'cp',
      description: 'Copy file/directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.cp(0, args),
    },
    {
      name: 'mv',
      description: 'Move/rename',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.mv(0, args),
    },
    {
      name: 'rm',
      description: 'Delete (with confirm)',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.rm(0, args),
    },
    {
      name: 'rmrf',
      description: 'Delete recursively',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.rmrf(0, args),
    },
    {
      name: 'trash',
      description: 'Move to Trash',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.trash(0, args),
    },
    {
      name: 'bookmark',
      description: 'Save bookmark',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.bookmark(0, args),
    },
    {
      name: 'bookmarks',
      description: 'List bookmarks',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.listBookmarks(0),
    },
    {
      name: 'goto',
      description: 'Go to bookmark',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.gotoBookmark(0, args),
    },
    {
      name: 'unbookmark',
      description: 'Remove bookmark',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.unbookmark(0, args),
    },
    {
      name: 'df',
      description: 'Disk usage',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.df(),
    },
    {
      name: 'du',
      description: 'Directory size',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.du(0, args),
    },
    {
      name: 'space',
      description: 'Largest items',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.space(0, args),
    },
    {
      name: 'open',
      description: 'Open with default app',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.open(0, args),
    },
    {
      name: 'reveal',
      description: 'Reveal in Finder',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.reveal(0, args),
    },
    {
      name: 'less',
      description: 'Paginated view',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.less(0, args),
    },
    {
      name: 'hexdump',
      description: 'Hex view',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.hexdump(0, args),
    },
    {
      name: 'preview',
      description: 'Smart preview',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.preview(0, args),
    },
    {
      name: 'edit',
      description: 'Edit file',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.edit(0, args),
    },
    {
      name: 'nano',
      description: 'Interactive edit',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.nano(0, args),
    },
    {
      name: 'rmdir',
      description: 'Remove empty directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.rmdir(0, args),
    },
    {
      name: 'restore',
      description: 'Restore from trash',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.restore(0, args),
    },
    {
      name: 'download',
      description: 'Send file to Telegram',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.download(0, args),
    },
    {
      name: 'downloadzip',
      description: 'Zip and send directory',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.downloadzip(0, args),
    },
    {
      name: 'upload',
      description: 'Receive file',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.upload(0, []),
    },
    {
      name: 'uploadto',
      description: 'Upload to path',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.uploadto(0, args),
    },
    {
      name: 'share',
      description: 'Create download link',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.share(0, args),
    },
    {
      name: 'qr',
      description: 'QR code for link',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.qr(0, args),
    },
    {
      name: 'recent',
      description: 'Recently modified',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.recent(0, args),
    },
    {
      name: 'large',
      description: 'Largest files',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.large(0, args),
    },
    {
      name: 'duplicates',
      description: 'Find duplicate files',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.duplicates(0, args),
    },
    {
      name: 'chmod',
      description: 'Change permissions',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.chmod(0, args),
    },
    {
      name: 'chown',
      description: 'Change owner',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.chown(0, args),
    },
    {
      name: 'chgrp',
      description: 'Change group',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.chgrp(0, args),
    },
    {
      name: 'zip',
      description: 'Create zip archive',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.zip(0, args),
    },
    {
      name: 'unzip',
      description: 'Extract zip archive',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.unzip(0, args),
    },
    {
      name: 'tar',
      description: 'Create tar archive',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.tar(0, args),
    },
    {
      name: 'untar',
      description: 'Extract tar archive',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.untar(0, args),
    },
    {
      name: 'compress',
      description: 'Smart compress',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.compress(0, args),
    },
    {
      name: 'extract',
      description: 'Smart extract',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.extract(0, args),
    },
    {
      name: 'cleanup',
      description: 'Find cleanup candidates',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.cleanup(0, args),
    },
    {
      name: 'emptytrash',
      description: 'Empty Trash',
      handler: async (_ctx: BotContext, _args: string[]) => fileManager.emptytrash(0, args),
    },
    {
      name: 'quicklook',
      description: 'Quick Look preview',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.quicklook(0, args),
    },
    {
      name: 'clipboard',
      description: 'Copy to clipboard',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.clipBoard(0, args),
    },
    {
      name: 'airdrop',
      description: 'Send via AirDrop',
      handler: async (_ctx: BotContext, args: string[]) => fileManager.airdrop(0, args),
    },
  ],
};

export default plugin;
