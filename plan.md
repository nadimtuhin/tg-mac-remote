# PRD: Telegram Mac Terminal Controller

## 🎯 Vision

Control your Mac remotely via Telegram - terminal tabs, activity monitor, AI coding, self-updating daemon.

---

## Monorepo Structure

```
tg-mac-remote/
├── package.json              # Bun workspace root
├── tsconfig.base.json
├── .env.example
├── README.md
│
├── packages/
│   ├── core/                 # Shared utilities
│   │   └── src/
│   │       ├── auth.ts
│   │       ├── bot.ts
│   │       ├── config.ts
│   │       ├── logger.ts
│   │       └── types.ts
│   │
│   └── plugins/              # Plugin interface
│       └── src/
│           └── index.ts
│
├── apps/
│   └── bot/
│       └── src/
│           ├── index.ts
│           └── plugins/
│               ├── terminal.ts
│               ├── activity.ts
│               ├── unix.ts
│               ├── brew.ts
│               ├── clipboard.ts
│               ├── files.ts
│               ├── system.ts
│               ├── notifications.ts
│               ├── apps.ts
│               ├── screenshot.ts
│               ├── shortcuts.ts
│               ├── git.ts
│               ├── docker.ts
│               ├── cron.ts
│               ├── tunnel.ts
│               ├── opencode.ts
│               └── daemon.ts
│
└── scripts/
    ├── install.sh
    ├── update.sh
    └── com.tgmac.daemon.plist
```

---

## Plugins & Commands

### 1. Terminal (P0)

```
/new [name]       - Create tab
/tabs             - List tabs
/switch <id>      - Switch tab
/kill <id>        - Kill tab
/logs [n]         - Show output
/clear            - Clear buffer
/rename <name>    - Rename tab
/cwd              - Current directory
<text>            - Run command
```

### 2. Activity Monitor (P0)

```
/activity         - Full summary (CPU, RAM, disk, battery, top processes)
/cpu [n]          - Top CPU consumers
/mem [n]          - Top memory consumers
/energy [n]       - Battery drain culprits
/gpu              - GPU usage
/network          - Network by process
/diskio           - Disk I/O by process

/k <pid|name>     - Quick kill (fuzzy match)
/kk <pattern>     - Kill all matching
/k9 <pid|name>    - Force kill (SIGKILL)
/freeze <target>  - Pause process
/unfreeze <target>- Resume process

/hogs             - Processes >50% CPU or >1GB RAM
/zombies          - Find zombie processes
/runaway          - CPU >100% for 1min+
/watch            - Live updates every 5s
/watchstop        - Stop live updates
```

### 3. Daemon Self-Management (P0)

```
/status           - Daemon status, uptime, version
/update           - Pull latest, rebuild, restart
/restart          - Restart daemon
/stop             - Stop daemon (with confirm)
/logs daemon [n]  - Daemon logs
/config           - Show current config
/config set <k>=<v> - Update config
/version          - Current version + check for updates
/health           - Health check (memory, errors, uptime)
```

### 4. Unix Essentials (P0)

```
# Process
/ps               - Running processes
/top [n]          - Top n processes
/killport <port>  - Kill by port
/lsof <port>      - What's on port

# Disk
/df               - Disk usage
/du [path]        - Directory size
/space [path]     - Largest items

# Network
/ip               - Local + public IP
/ping <host>      - Ping
/ports            - Listening ports
/dns <domain>     - DNS lookup
/speedtest        - Speed test

# Text
/grep <p> <path>  - Search files
/find <path> <p>  - Find files
/tail <file> [n]  - Last n lines
/tailf <file>     - Follow in tab
/head <file> [n]  - First n lines

# System
/uptime           - Uptime
/env [var]        - Environment
/which <cmd>      - Command path
/history [n]      - Command history
```

### 5. Brew (P1)

```
/brew             - Status & info
/install <pkg>    - Install package
/uninstall <pkg>  - Uninstall
/upgrade [pkg]    - Upgrade one/all
/search <q>       - Search
/installed        - List installed
/outdated         - List outdated
/services         - List services
/service <action> <name> - start/stop/restart
/cleanup          - Clean cache
/doctor           - Diagnose
```

### 6. OpenCode (P1)

```
/code [prompt]    - Start/one-shot AI coding
/chat <msg>       - Continue conversation
/context <path>   - Add to context
/model [name]     - Get/set model
/approve          - Approve changes
/reject           - Reject changes
/diff             - Show pending changes
/codestop         - Stop session
```

### 7. Clipboard (P1)

```
/paste            - Get clipboard
/copy <text>      - Set clipboard
/copyfile <path>  - Copy file content
/history          - Last 10 items
```

### 8. Files (P1)

```
/ls [path]        - List directory
/cat <path>       - Read file
/download <path>  - Send file
/upload           - Receive file
/rm <path>        - Delete (confirm)
/mkdir <path>     - Create directory
/mv <src> <dst>   - Move/rename
/cp <src> <dst>   - Copy
```

### 9. System (P1)

```
/stats            - CPU, RAM, disk, battery
/volume [0-100]   - Get/set volume
/brightness [%]   - Get/set brightness
/sleep            - Sleep Mac
/lock             - Lock screen
/shutdown         - Shutdown (confirm)
/reboot           - Reboot (confirm)
/wifi             - WiFi status
/bluetooth        - Bluetooth devices
```

### 10. Notifications (P2)

```
/notify <msg>     - macOS notification
/say <text>       - Text-to-speech
/alert <msg>      - Modal dialog
/beep             - System beep
```

### 11. Apps (P2)

```
/apps             - Running apps
/open <app>       - Open app
/quit <app>       - Quit app
/focus <app>      - Bring to front
/url <url>        - Open in browser
```

### 12. Screenshot (P2)

```
/ss               - Full screenshot
/sswindow         - Active window
/sscrop           - Crop area (coords)
/webcam           - Webcam shot
```

### 13. Git (P2)

```
/repos            - Known repos
/gstatus [repo]   - Git status
/pull [repo]      - Git pull
/push [repo]      - Git push
/branches         - List branches
/checkout <b>     - Switch branch
/glog [n]         - Recent commits
/stash            - Stash changes
```

### 14. Docker (P2)

```
/containers       - List containers
/dstart <name>    - Start container
/dstop <name>     - Stop container
/dlogs <name>     - Container logs
/dexec <n> <cmd>  - Exec command
/images           - List images
```

### 15. Shortcuts (P3)

```
/shortcuts        - List shortcuts
/shortcut <name>  - Run shortcut
/addshortcut      - Create (multi-cmd)
/delshortcut <n>  - Delete
```

### 16. Cron (P3)

```
/schedule         - List scheduled
/at <time> <cmd>  - Run at time
/every <int> <cmd>- Recurring
/cancel <id>      - Cancel task
```

### 17. Tunnel (P3)

```
/tunnel <port>    - Expose port
/tunnels          - List active
/closetunnel <id> - Close tunnel
```

---

## Command Summary

| Plugin        | Commands | Priority |
| ------------- | -------- | -------- |
| Terminal      | 9        | P0       |
| Activity      | 15       | P0       |
| Daemon        | 10       | P0       |
| Unix          | 25       | P0       |
| Brew          | 12       | P1       |
| OpenCode      | 8        | P1       |
| Clipboard     | 4        | P1       |
| Files         | 8        | P1       |
| System        | 10       | P1       |
| Notifications | 4        | P2       |
| Apps          | 5        | P2       |
| Screenshot    | 4        | P2       |
| Git           | 8        | P2       |
| Docker        | 6        | P2       |
| Shortcuts     | 4        | P3       |
| Cron          | 4        | P3       |
| Tunnel        | 3        | P3       |
| **Total**     | **~139** |          |

---

## UI Patterns

### Activity Monitor Output

```
📊 Activity Monitor

CPU ████████░░ 78%
RAM ██████░░░░ 12.4/16 GB
SSD ████░░░░░░ 198/500 GB
🔋 67% discharging

🔥 Top CPU
│ 45% Chrome      /k 1234
│ 23% node        /k 5678
│ 8%  Spotlight   /k 901

🧠 Top RAM
│ 2.1GB Chrome    /k 1234
│ 890MB Slack     /k 4321
│ 654MB Docker    /k 8765
```

### Inline Keyboards

```
┌─────────────────────────────────┐
│ Kill Chrome (PID 1234)?         │
├─────────────────────────────────┤
│ [💀 Kill] [💀💀 Force] [❌ Cancel]│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📦 Update available: v1.2.0    │
├─────────────────────────────────┤
│ [⬆️ Update & Restart] [⏭ Skip] │
└─────────────────────────────────┘
```

### Tabs Output

```
📑 Tabs

→ #1 dev (active)
  #2 logs
  #3 docker

/switch <id> to change
```

---

## Daemon Self-Management

### Auto-start (launchd)

```xml
<!-- scripts/com.tgmac.daemon.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.tgmac.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/bun</string>
    <string>run</string>
    <string>/path/to/tg-mac-remote/apps/bot/src/index.ts</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/tgmac.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/tgmac.err</string>
</dict>
</plist>
```

### Update Flow

```
User: /update

Bot: 🔍 Checking for updates...

Bot: 📦 Update available: v1.1.0 → v1.2.0

     Changes:
     • Added /energy command
     • Fixed memory leak in watch
     • Improved kill confirmation

     [⬆️ Update Now] [📋 Changelog] [⏭ Skip]

User: [clicks Update Now]

Bot: ⏳ Updating...
     ✓ Pulled latest
     ✓ Installed dependencies
     ✓ Built successfully
     🔄 Restarting in 3s...

Bot: ✅ Updated to v1.2.0
     Uptime: 0s
```

---

## Security

| Layer          | Implementation                      |
| -------------- | ----------------------------------- |
| Auth           | Telegram user ID whitelist          |
| Secrets        | Env vars only                       |
| Dangerous cmds | Inline confirm (kill, rm, shutdown) |
| Rate limit     | Optional per-user throttle          |
| Audit          | Command log with timestamps         |

---

## Config

```bash
# .env
TELEGRAM_BOT_TOKEN=xxx
ALLOWED_USER_IDS=123456,789012

# Optional
LOG_LEVEL=info
ENABLED_PLUGINS=terminal,activity,unix,brew,daemon
OPENCODE_MODEL=zai-coding-plan/glm-4.7
ANTHROPIC_API_KEY=sk-ant-xxx
AUTO_UPDATE=false
```

---

## Roadmap

| Phase | Plugins                          | Days |
| ----- | -------------------------------- | ---- |
| v0.1  | Terminal, Activity, Daemon, Unix | 2    |
| v0.2  | + Brew, Clipboard, System        | 1    |
| v0.3  | + Files, Notifications           | 1    |
| v0.4  | + OpenCode                       | 2    |
| v1.0  | + Apps, Screenshot, Git, Docker  | 3    |
| v2.0  | + Shortcuts, Cron, Tunnel        | 2    |

**Total: ~11 days to full feature set**

---

## Success Criteria

- [ ] Control terminal from phone ✓
- [ ] Kill processes in 2 taps ✓
- [ ] Self-update remotely ✓
- [ ] Survives Mac restart ✓
- [ ] <100ms command response ✓

---

**Ready to build? Say "go"** 🚀
