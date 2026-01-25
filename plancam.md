# Added: Webcam Control

## Webcam Plugin (P1)

### Commands

```
# Capture
/cam                     - Quick webcam snapshot
/cam front               - Front camera (if multiple)
/cam back                - Back/external camera
/camlist                 - List available cameras

# Recording
/camvideo [seconds]      - Record video (default 10s, max 60s)
/camgif [seconds]        - Record as GIF (default 5s)
/camstream [interval]    - Periodic snapshots (default 30s)
/camstop                 - Stop streaming

# Settings
/camres [low|med|high]   - Set resolution
/camflip [h|v]           - Flip horizontal/vertical
/camlight                - Toggle camera LED (if supported)

# Security
/camwatch                - Motion detection → alert + snapshot
/camwatchstop            - Stop motion detection
/camalert [on|off]       - Alert when camera is accessed by other apps
```

---

## Implementation

```typescript
// apps/bot/src/plugins/webcam.ts

import { $ } from "bun";
import { bot, state } from "../bot";

// List cameras
async function listCameras(): Promise<string[]> {
  const result = await $`ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true`.text();
  const cameras: string[] = [];
  
  // Parse output for video devices
  const lines = result.split("\n");
  let inVideoSection = false;
  
  for (const line of lines) {
    if (line.includes("AVFoundation video devices")) inVideoSection = true;
    if (line.includes("AVFoundation audio devices")) inVideoSection = false;
    if (inVideoSection && line.includes("]")) {
      const match = line.match(/\[(\d+)\]\s+(.+)/);
      if (match) cameras.push(`${match[1]}: ${match[2]}`);
    }
  }
  
  return cameras;
}

// Take snapshot
async function captureSnapshot(cameraIndex = 0): Promise<string> {
  const filepath = `/tmp/webcam_${Date.now()}.jpg`;
  
  await $`ffmpeg -f avfoundation -framerate 30 -i "${cameraIndex}" -frames:v 1 -y ${filepath}`.quiet();
  
  return filepath;
}

// Record video
async function recordVideo(seconds = 10, cameraIndex = 0): Promise<string> {
  const filepath = `/tmp/webcam_${Date.now()}.mp4`;
  
  await $`ffmpeg -f avfoundation -framerate 30 -i "${cameraIndex}:0" -t ${seconds} -c:v libx264 -preset ultrafast -y ${filepath}`.quiet();
  
  return filepath;
}

// Record GIF
async function recordGif(seconds = 5, cameraIndex = 0): Promise<string> {
  const filepath = `/tmp/webcam_${Date.now()}.gif`;
  
  await $`ffmpeg -f avfoundation -framerate 15 -i "${cameraIndex}" -t ${seconds} -vf "fps=10,scale=480:-1:flags=lanczos" -y ${filepath}`.quiet();
  
  return filepath;
}

// Motion detection
async function startMotionDetection(chatId: number, cameraIndex = 0) {
  const interval = 2000; // Check every 2 seconds
  let previousFrame: Buffer | null = null;
  
  const watcher = setInterval(async () => {
    try {
      const filepath = await captureSnapshot(cameraIndex);
      const currentFrame = await Bun.file(filepath).arrayBuffer();
      
      if (previousFrame) {
        const diff = calculateFrameDiff(previousFrame, Buffer.from(currentFrame));
        
        if (diff > 0.15) { // 15% change threshold
          await bot.sendPhoto(chatId, filepath, { 
            caption: `🚨 Motion detected! (${new Date().toLocaleTimeString()})` 
          });
        }
      }
      
      previousFrame = Buffer.from(currentFrame);
    } catch (e) {
      console.error("Motion detection error:", e);
    }
  }, interval);
  
  state.motionWatchers.set(chatId, watcher);
}

// Simple frame difference (compare file sizes as rough approximation)
// For real motion detection, use proper image comparison
function calculateFrameDiff(prev: Buffer, curr: Buffer): number {
  // Simplified - in production use proper image diff
  const sizeDiff = Math.abs(prev.length - curr.length);
  return sizeDiff / Math.max(prev.length, curr.length);
}

// Camera access monitoring
async function watchCameraAccess(chatId: number) {
  // Monitor which apps are using camera
  const checkAccess = async () => {
    const result = await $`lsof | grep "AppleCamera" || true`.text();
    return result.trim();
  };
  
  let lastApps = await checkAccess();
  
  const watcher = setInterval(async () => {
    const currentApps = await checkAccess();
    if (currentApps !== lastApps && currentApps) {
      await bot.sendMessage(chatId, `📹 Camera accessed by:\n\`\`\`\n${currentApps}\n\`\`\``);
      lastApps = currentApps;
    }
  }, 5000);
  
  state.cameraAccessWatchers.set(chatId, watcher);
}

// Plugin export
export const webcamPlugin: Plugin = {
  name: "webcam",
  commands: [
    {
      command: "cam",
      description: "Webcam snapshot",
      usage: "/cam [front|back|<index>]",
      handler: async (msg, args) => {
        const cameraIndex = args[0] === "back" ? 1 : 0;
        
        await bot.sendMessage(msg.chat.id, "📸 Capturing...");
        
        try {
          const filepath = await captureSnapshot(cameraIndex);
          await bot.sendPhoto(msg.chat.id, filepath, {
            caption: `📹 Webcam ${new Date().toLocaleTimeString()}`
          });
        } catch (e) {
          await bot.sendMessage(msg.chat.id, `❌ Failed: ${e.message}`);
        }
      },
    },
    {
      command: "camlist",
      description: "List cameras",
      handler: async (msg) => {
        const cameras = await listCameras();
        await bot.sendMessage(msg.chat.id, 
          `📹 *Available Cameras*\n\n${cameras.join("\n") || "No cameras found"}`,
          { parse_mode: "Markdown" }
        );
      },
    },
    {
      command: "camvideo",
      description: "Record video",
      usage: "/camvideo [seconds]",
      handler: async (msg, args) => {
        const seconds = Math.min(parseInt(args[0]) || 10, 60);
        
        await bot.sendMessage(msg.chat.id, `🎬 Recording ${seconds}s video...`);
        
        try {
          const filepath = await recordVideo(seconds);
          await bot.sendVideo(msg.chat.id, filepath, {
            caption: `📹 ${seconds}s recording`
          });
        } catch (e) {
          await bot.sendMessage(msg.chat.id, `❌ Failed: ${e.message}`);
        }
      },
    },
    {
      command: "camgif",
      description: "Record GIF",
      usage: "/camgif [seconds]",
      handler: async (msg, args) => {
        const seconds = Math.min(parseInt(args[0]) || 5, 15);
        
        await bot.sendMessage(msg.chat.id, `🎬 Recording ${seconds}s GIF...`);
        
        try {
          const filepath = await recordGif(seconds);
          await bot.sendAnimation(msg.chat.id, filepath);
        } catch (e) {
          await bot.sendMessage(msg.chat.id, `❌ Failed: ${e.message}`);
        }
      },
    },
    {
      command: "camstream",
      description: "Periodic snapshots",
      usage: "/camstream [interval_seconds]",
      handler: async (msg, args) => {
        const interval = (parseInt(args[0]) || 30) * 1000;
        
        // Clear existing
        if (state.camStreamers.has(msg.chat.id)) {
          clearInterval(state.camStreamers.get(msg.chat.id));
        }
        
        await bot.sendMessage(msg.chat.id, `📹 Streaming every ${interval/1000}s...\n/camstop to stop`);
        
        const streamer = setInterval(async () => {
          try {
            const filepath = await captureSnapshot();
            await bot.sendPhoto(msg.chat.id, filepath, {
              caption: new Date().toLocaleTimeString()
            });
          } catch (e) {
            console.error("Stream error:", e);
          }
        }, interval);
        
        state.camStreamers.set(msg.chat.id, streamer);
      },
    },
    {
      command: "camstop",
      description: "Stop streaming",
      handler: async (msg) => {
        const streamer = state.camStreamers.get(msg.chat.id);
        if (streamer) {
          clearInterval(streamer);
          state.camStreamers.delete(msg.chat.id);
          await bot.sendMessage(msg.chat.id, "⏹ Stopped streaming");
        }
      },
    },
    {
      command: "camwatch",
      description: "Motion detection",
      handler: async (msg) => {
        await bot.sendMessage(msg.chat.id, "👁 Motion detection started...\n/camwatchstop to stop");
        await startMotionDetection(msg.chat.id);
      },
    },
    {
      command: "camwatchstop",
      description: "Stop motion detection",
      handler: async (msg) => {
        const watcher = state.motionWatchers.get(msg.chat.id);
        if (watcher) {
          clearInterval(watcher);
          state.motionWatchers.delete(msg.chat.id);
          await bot.sendMessage(msg.chat.id, "⏹ Motion detection stopped");
        }
      },
    },
    {
      command: "camalert",
      description: "Alert on camera access",
      usage: "/camalert [on|off]",
      handler: async (msg, args) => {
        const action = args[0]?.toLowerCase();
        
        if (action === "off") {
          const watcher = state.cameraAccessWatchers.get(msg.chat.id);
          if (watcher) {
            clearInterval(watcher);
            state.cameraAccessWatchers.delete(msg.chat.id);
          }
          await bot.sendMessage(msg.chat.id, "🔕 Camera access alerts disabled");
        } else {
          await watchCameraAccess(msg.chat.id);
          await bot.sendMessage(msg.chat.id, "🔔 Will alert when apps access camera");
        }
      },
    },
  ],
};
```

---

## Advanced: Imagesnap Alternative

For faster snapshots, use `imagesnap` (native Mac tool):

```bash
brew install imagesnap
```

```typescript
// Faster snapshot with imagesnap
async function captureSnapshot(cameraIndex = 0): Promise<string> {
  const filepath = `/tmp/webcam_${Date.now()}.jpg`;
  
  // imagesnap is faster than ffmpeg for single frames
  await $`imagesnap -d ${cameraIndex} ${filepath}`.quiet();
  
  return filepath;
}
```

---

## Use Cases

### Security Camera
```
You: /camwatch
Bot: 👁 Motion detection started...

[5 minutes later, someone walks by]

Bot: 🚨 Motion detected! (3:45 PM)
     [photo]
```

### Quick Check
```
You: /cam
Bot: 📸 Capturing...
     [photo of your room]
```

### Time-lapse
```
You: /camstream 60
Bot: 📹 Streaming every 60s...

[sends photo every minute]

You: /camstop
Bot: ⏹ Stopped streaming
```

### Privacy Monitor
```
You: /camalert on
Bot: 🔔 Will alert when apps access camera

[Zoom opens]

Bot: 📹 Camera accessed by:
     zoom.us 1234 user
```

---

## Updated Command Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                       WEBCAM COMMANDS                           │
├─────────────────────────────────────────────────────────────────┤
│ /cam [front|back]      - Quick snapshot                         │
│ /camlist               - List available cameras                 │
│ /camvideo [10s]        - Record video (max 60s)                │
│ /camgif [5s]           - Record GIF (max 15s)                  │
│ /camstream [30s]       - Periodic snapshots                    │
│ /camstop               - Stop streaming                        │
│ /camwatch              - Motion detection alerts               │
│ /camwatchstop          - Stop motion detection                 │
│ /camalert [on|off]     - Alert on camera access by apps        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Updated Plugin Count

| Plugin | Commands | Priority |
|--------|----------|----------|
| Terminal | 9 | P0 |
| Activity | 15 | P0 |
| Daemon | 10 | P0 |
| Unix | 25 | P0 |
| Input | 15 | P1 |
| Mac Control | 25 | P1 |
| Screen | 8 | P1 |
| **Webcam** | **9** | **P1** |
| Brew | 12 | P1 |
| OpenCode | 8 | P1 |
| Clipboard | 4 | P1 |
| Files | 8 | P1 |
| Apps | 5 | P2 |
| Git | 8 | P2 |
| Docker | 6 | P2 |
| Notifications | 4 | P2 |
| Shortcuts | 4 | P3 |
| Cron | 4 | P3 |
| Tunnel | 3 | P3 |
| **Total** | **~172** | |

---

## Dependencies

```bash
# For webcam
brew install ffmpeg       # Video capture
brew install imagesnap    # Fast snapshots (optional, faster)
```

---

**Ready to build? Say "go"** 🚀