import { type BotContext } from '@tg-mac-remote/core';
import { getBot } from '@tg-mac-remote/core';
import type { Plugin } from '@tg-mac-remote/core';
import { spawn } from 'node:child_process';
import { unlink } from 'node:fs/promises';

interface Camera {
  index: number;
  name: string;
}

class WebcamManager {
  private streamers: Map<number, ReturnType<typeof setInterval>> = new Map();
  private motionWatchers: Map<number, ReturnType<typeof setInterval>> = new Map();
  private cameraAccessWatchers: Map<number, ReturnType<typeof setInterval>> = new Map();
  private previousFrame: Buffer | null = null;

  async listCameras(): Promise<Camera[]> {
    return new Promise((resolve) => {
      const child = spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', ''], {
        env: { ...process.env, FFREPORT: 'file=/dev/null' },
      });

      let output = '';
      child.stderr.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.on('close', () => {
        const cameras: Camera[] = [];
        const lines = output.split('\n');
        let inVideoSection = false;

        for (const line of lines) {
          if (line.includes('AVFoundation video devices')) {
            inVideoSection = true;
          }
          if (line.includes('AVFoundation audio devices')) {
            inVideoSection = false;
          }
          if (inVideoSection && line.includes(']')) {
            const match = line.match(/\[(\d+)\]\s+(.+)/);
            if (match) {
              cameras.push({ index: parseInt(match[1], 10), name: match[2].trim() });
            }
          }
        }

        resolve(cameras);
      });

      child.on('error', () => resolve([]));
    });
  }

  async captureSnapshot(cameraIndex = 0): Promise<string> {
    const filepath = `/tmp/webcam_${Date.now()}.jpg`;

    return new Promise((resolve, reject) => {
      const child = spawn('ffmpeg', [
        '-f',
        'avfoundation',
        '-framerate',
        '30',
        '-i',
        cameraIndex.toString(),
        '-frames:v',
        '1',
        '-y',
        filepath,
      ]);

      let stderrOutput = '';
      child.stderr.on('data', (data: Buffer) => {
        stderrOutput += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(filepath);
        } else {
          reject(new Error(`Failed to capture snapshot: ${stderrOutput}`));
        }
      });

      child.on('error', (err: Error) => reject(err));
    });
  }

  async recordVideo(seconds = 10, cameraIndex = 0): Promise<string> {
    const filepath = `/tmp/webcam_${Date.now()}.mp4`;

    return new Promise((resolve, reject) => {
      const child = spawn('ffmpeg', [
        '-f',
        'avfoundation',
        '-framerate',
        '30',
        '-i',
        `${cameraIndex}:0`,
        '-t',
        seconds.toString(),
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-y',
        filepath,
      ]);

      let stderrOutput = '';
      child.stderr.on('data', (data: Buffer) => {
        stderrOutput += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(filepath);
        } else {
          reject(new Error(`Failed to record video: ${stderrOutput}`));
        }
      });

      child.on('error', (err: Error) => reject(err));
    });
  }

  async recordGif(seconds = 5, cameraIndex = 0): Promise<string> {
    const filepath = `/tmp/webcam_${Date.now()}.gif`;

    return new Promise((resolve, reject) => {
      const child = spawn('ffmpeg', [
        '-f',
        'avfoundation',
        '-framerate',
        '15',
        '-i',
        cameraIndex.toString(),
        '-t',
        seconds.toString(),
        '-vf',
        'fps=10,scale=480:-1:flags=lanczos',
        '-y',
        filepath,
      ]);

      let stderrOutput = '';
      child.stderr.on('data', (data: Buffer) => {
        stderrOutput += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(filepath);
        } else {
          reject(new Error(`Failed to record GIF: ${stderrOutput}`));
        }
      });

      child.on('error', (err: Error) => reject(err));
    });
  }

  calculateFrameDiff(prev: Buffer, curr: Buffer): number {
    const sizeDiff = Math.abs(prev.length - curr.length);
    return sizeDiff / Math.max(prev.length, curr.length);
  }

  async startMotionDetection(chatId: number, cameraIndex = 0): Promise<void> {
    const interval = 2000;

    const watcher = setInterval(async () => {
      try {
        const filepath = await this.captureSnapshot(cameraIndex);
        const currentFrame = Buffer.from(
          await import('node:fs').then((fs) => fs.promises.readFile(filepath))
        );

        if (this.previousFrame) {
          const diff = this.calculateFrameDiff(this.previousFrame, currentFrame);

          if (diff > 0.15) {
            const bot = getBot() as any;
            await bot.api.sendPhoto(chatId, filepath, {
              caption: `🚨 Motion detected! (${new Date().toLocaleTimeString()})`,
            });
          }
        }

        this.previousFrame = currentFrame;
        await unlink(filepath).catch(() => {});
      } catch (e) {
        console.error('Motion detection error:', e);
      }
    }, interval);

    this.motionWatchers.set(chatId, watcher);
  }

  stopMotionDetection(chatId: number): void {
    const watcher = this.motionWatchers.get(chatId);
    if (watcher) {
      clearInterval(watcher);
      this.motionWatchers.delete(chatId);
    }
  }

  startCameraAccessMonitoring(chatId: number): void {
    let lastApps = '';

    const checkAccess = async (): Promise<string> => {
      return new Promise((resolve) => {
        const child = spawn('lsof');
        let output = '';

        child.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });

        child.on('close', () => {
          const cameraApps = output
            .split('\n')
            .filter((line) => line.includes('AppleCamera') || line.includes('VDC'))
            .map((line) => line.split(/\s+/).pop())
            .filter((item): item is string => Boolean(item))
            .join('\n');
          resolve(cameraApps);
        });

        child.on('error', () => resolve(''));
      });
    };

    const watcher = setInterval(async () => {
      const currentApps = await checkAccess();
      if (currentApps !== lastApps && currentApps) {
        const bot = getBot() as any;
        await bot.api.sendMessage(
          chatId,
          `📹 Camera accessed by:\n\`\`\`\n${currentApps}\n\`\`\``,
          {
            parse_mode: 'Markdown',
          }
        );
        lastApps = currentApps;
      }
    }, 5000);

    this.cameraAccessWatchers.set(chatId, watcher);
  }

  stopCameraAccessMonitoring(chatId: number): void {
    const watcher = this.cameraAccessWatchers.get(chatId);
    if (watcher) {
      clearInterval(watcher);
      this.cameraAccessWatchers.delete(chatId);
    }
  }

  startStreaming(chatId: number, intervalSeconds: number, cameraIndex = 0): void {
    if (this.streamers.has(chatId)) {
      clearInterval(this.streamers.get(chatId)!);
    }

    const streamer = setInterval(async () => {
      try {
        const filepath = await this.captureSnapshot(cameraIndex);
        const bot = getBot() as any;
        await bot.api.sendPhoto(chatId, filepath, {
          caption: new Date().toLocaleTimeString(),
        });
        await unlink(filepath).catch(() => {});
      } catch (e) {
        console.error('Stream error:', e);
      }
    }, intervalSeconds * 1000);

    this.streamers.set(chatId, streamer);
  }

  stopStreaming(chatId: number): void {
    const streamer = this.streamers.get(chatId);
    if (streamer) {
      clearInterval(streamer);
      this.streamers.delete(chatId);
    }
  }

  cleanup(chatId: number): void {
    this.stopStreaming(chatId);
    this.stopMotionDetection(chatId);
    this.stopCameraAccessMonitoring(chatId);
  }
}

const webcamManager = new WebcamManager();

const plugin: Plugin = {
  name: 'webcam',
  description: 'Webcam control plugin',
  commands: [
    {
      name: 'cam',
      description: 'Quick webcam snapshot',
      handler: async (ctx: BotContext, args: string[]): Promise<string> => {
        const cameraArg = args[0];
        const cameraIndex = cameraArg === 'back' ? 1 : 0;

        try {
          const filepath = await webcamManager.captureSnapshot(cameraIndex);
          const bot = getBot() as any;
          await bot.api.sendPhoto(ctx.chat.id, filepath, {
            caption: `📹 Webcam ${new Date().toLocaleTimeString()}`,
          });
          await unlink(filepath).catch(() => {});
          return '📸 Snapshot captured!';
        } catch (err) {
          return `❌ Failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      name: 'camlist',
      description: 'List available cameras',
      handler: async (): Promise<string> => {
        const cameras = await webcamManager.listCameras();
        if (cameras.length === 0) {
          return '❌ No cameras found';
        }

        let output = '📹 Available Cameras:\n\n';
        cameras.forEach((cam) => {
          output += `[${cam.index}] ${cam.name}\n`;
        });
        return output;
      },
    },
    {
      name: 'camvideo',
      description: 'Record video (default 10s, max 60s)',
      handler: async (ctx: BotContext, args: string[]): Promise<string> => {
        const seconds = Math.min(parseInt(args[0]) || 10, 60);

        try {
          const filepath = await webcamManager.recordVideo(seconds);
          const bot = getBot() as any;
          await bot.api.sendVideo(ctx.chat.id, filepath, {
            caption: `📹 ${seconds}s recording`,
          });
          await unlink(filepath).catch(() => {});
          return `✅ Video recorded: ${seconds}s`;
        } catch (err) {
          return `❌ Failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      name: 'camgif',
      description: 'Record GIF (default 5s, max 15s)',
      handler: async (ctx: BotContext, args: string[]): Promise<string> => {
        const seconds = Math.min(parseInt(args[0]) || 5, 15);

        try {
          const filepath = await webcamManager.recordGif(seconds);
          const bot = getBot() as any;
          await bot.api.sendAnimation(ctx.chat.id, filepath);
          await unlink(filepath).catch(() => {});
          return `✅ GIF recorded: ${seconds}s`;
        } catch (err) {
          return `❌ Failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      name: 'camstream',
      description: 'Periodic snapshots (default 30s)',
      handler: async (ctx: BotContext, args: string[]): Promise<string> => {
        const interval = parseInt(args[0]) || 30;

        webcamManager.startStreaming(ctx.chat.id, interval);

        return `📹 Streaming every ${interval}s...\n/camstop to stop`;
      },
    },
    {
      name: 'camstop',
      description: 'Stop streaming',
      handler: async (ctx: BotContext): Promise<string> => {
        webcamManager.stopStreaming(ctx.chat.id);
        return '⏹ Stopped streaming';
      },
    },
    {
      name: 'camwatch',
      description: 'Motion detection alerts',
      handler: async (ctx: BotContext): Promise<string> => {
        await webcamManager.startMotionDetection(ctx.chat.id);
        return '👁 Motion detection started...\n/camwatchstop to stop';
      },
    },
    {
      name: 'camwatchstop',
      description: 'Stop motion detection',
      handler: async (ctx: BotContext): Promise<string> => {
        webcamManager.stopMotionDetection(ctx.chat.id);
        return '⏹ Motion detection stopped';
      },
    },
    {
      name: 'camalert',
      description: 'Alert on camera access by apps',
      handler: async (ctx: BotContext, args: string[]): Promise<string> => {
        const action = args[0]?.toLowerCase();

        if (action === 'off') {
          webcamManager.stopCameraAccessMonitoring(ctx.chat.id);
          return '🔕 Camera access alerts disabled';
        }

        webcamManager.startCameraAccessMonitoring(ctx.chat.id);
        return '🔔 Will alert when apps access camera';
      },
    },
  ],
  register(_bot: unknown): void {},
};

export default plugin;
