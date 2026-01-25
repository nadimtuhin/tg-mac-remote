# Telegram Mac Terminal Controller

> Remote control your Mac from Telegram 📱💻

## Overview

tg-mac-remote is a Telegram bot that allows you to control your macOS machine remotely. Execute terminal commands, monitor system resources, manage processes, and more - all from your phone!

## Features

### 🖥 Terminal Plugin (9 commands)

- Create and manage multiple terminal tabs
- Execute commands in active tab
- View command output and history
- Switch between tabs seamlessly

### 📊 Activity Monitor Plugin (15 commands)

- System metrics: CPU, RAM, disk, battery
- Process management: kill, freeze, resume processes
- Resource monitoring: find hogs, zombies, runaway processes
- Top CPU and RAM consumers with one-tap kill

### 🤖 Daemon Management Plugin (10 commands)

- Service status and health monitoring
- Self-update from git
- Configuration management
- Log viewing

### 🐧 Unix Essentials Plugin (25 commands)

- Process tools: ps, top, kill by port
- Disk utilities: df, du, largest items
- Network tools: IP, ping, DNS, ports
- Text tools: grep, find, tail, head
- System tools: uptime, env, which, history

### 🔧 Additional Features

- macOS Launch Agent integration (auto-start on boot)
- Auto-restart on crash
- Self-update capability
- Comprehensive logging
- User authentication (whitelist)

## Installation

### Prerequisites

- **macOS** 10.15+ (Catalina or later)
- **Bun** runtime: `curl -fsSL https://bun.sh/install | bash`
- **Git** (for updates): `brew install git`
- **Telegram Bot Token**: From [@BotFather](https://t.me/BotFather)
- **Telegram User ID**: From [@userinfobot](https://t.me/userinfobot)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/tg-mac-remote.git
cd tg-mac-remote

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your bot token and user ID

# Install and start daemon
./scripts/install.sh
```

### Configuration

Create a `.env` file in the project root:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_USER_IDS=123456789,987654321

# Optional
LOG_LEVEL=info                    # debug, info, warn, error (default: info)
ENABLED_PLUGINS=terminal,activity,daemon,unix  # Comma-separated list
AUTO_UPDATE=false                  # Enable automatic updates (default: false)
```

**Getting Your Credentials:**

1. **Bot Token**: Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot`
2. **User ID**: Message [@userinfobot](https://t.me/userinfobot) on Telegram

## Usage

### Command Categories

#### 🖥 Terminal Commands

| Command          | Description             | Usage               |
| ---------------- | ----------------------- | ------------------- |
| `/new [name]`    | Create new terminal tab | `/new server`       |
| `/tabs`          | List all tabs           | `/tabs`             |
| `/switch <id>`   | Switch to tab           | `/switch 1`         |
| `/kill <id>`     | Kill tab                | `/kill 2`           |
| `/logs [n]`      | Show last n lines       | `/logs 50`          |
| `/clear`         | Clear output buffer     | `/clear`            |
| `/rename <name>` | Rename tab              | `/rename my-server` |
| `/cwd`           | Show directory          | `/cwd`              |
| `<text>`         | Execute command         | `npm start`         |

#### 📊 Activity Commands

| Command              | Description         | Usage                  |
| -------------------- | ------------------- | ---------------------- | ---------- |
| `/activity`          | Full system summary | `/activity`            |
| `/cpu [n]`           | Top CPU consumers   | `/cpu 10`              |
| `/mem [n]`           | Top RAM consumers   | `/mem 10`              |
| `/energy [n]`        | Battery info        | `/energy`              |
| `/k <pid             | name>`              | Kill process (SIGTERM) | `/k 1234`  |
| `/kk <pattern>`      | Kill all matching   | `/kk node`             |
| `/k9 <pid            | name>`              | Force kill (SIGKILL)   | `/k9 1234` |
| `/freeze <target>`   | Pause process       | `/freeze 1234`         |
| `/unfreeze <target>` | Resume process      | `/unfreeze 1234`       |
| `/hogs`              | Find resource hogs  | `/hogs`                |
| `/zombies`           | Find zombies        | `/zombies`             |
| `/runaway`           | Find runaway        | `/runaway`             |
| `/watch`             | Live updates        | `/watch`               |
| `/watchstop`         | Stop updates        | `/watchstop`           |

#### 🤖 Daemon Commands

| Command               | Description    | Usage                         |
| --------------------- | -------------- | ----------------------------- |
| `/status`             | Daemon status  | `/status`                     |
| `/update`             | Check updates  | `/update`                     |
| `/restart`            | Restart daemon | `/restart`                    |
| `/stop`               | Stop daemon    | `/stop`                       |
| `/logs [n]`           | Daemon logs    | `/logs 100`                   |
| `/config`             | Show config    | `/config`                     |
| `/config-set <k>=<v>` | Set config     | `/config-set LOG_LEVEL=debug` |
| `/version`            | Show version   | `/version`                    |
| `/health`             | Health check   | `/health`                     |

#### 🐧 Unix Commands

| Command                  | Description       | Usage                        |
| ------------------------ | ----------------- | ---------------------------- |
| `/ps [pattern]`          | List processes    | `/ps node`                   |
| `/top [n]`               | Top processes     | `/top 15`                    |
| `/killport <port>`       | Kill by port      | `/killport 3000`             |
| `/lsof <port>`           | Show port usage   | `/lsof 8080`                 |
| `/df`                    | Disk usage        | `/df`                        |
| `/du [path]`             | Dir size          | `/du /var/log`               |
| `/space [path]`          | Largest items     | `/space /tmp`                |
| `/ip`                    | Show IP addresses | `/ip`                        |
| `/ping <host> [n]`       | Ping host         | `/ping google.com 4`         |
| `/ports`                 | Listening ports   | `/ports`                     |
| `/dns <domain>`          | DNS lookup        | `/dns example.com`           |
| `/speedtest`             | Speed test        | `/speedtest`                 |
| `/grep <pattern> [path]` | Search files      | `/grep error /var/log`       |
| `/find <path> <pattern>` | Find files        | `/find /tmp *.log`           |
| `/tail <file> [n]`       | Last n lines      | `/tail /var/log/app.log 100` |
| `/tailf <file>`          | Follow file       | `/tailf /var/log/app.log`    |
| `/head <file> [n]`       | First n lines     | `/head /var/log/app.log 50`  |
| `/uptime`                | System uptime     | `/uptime`                    |
| `/env [var]`             | Environment vars  | `/env PATH`                  |
| `/which <cmd>`           | Find command path | `/which python3`             |
| `/history [n]`           | Bash history      | `/history 50`                |

#### 📦 Git Plugin (18 commands)

| Command | Description | Usage |
|---------|-------------|--------|
| `/status` | Show git status | `/status` |
| `/branch` | Show current branch | `/branch` |
| `/remote` | Show git remotes | `/remote` |
| `/log [n]` | Show git log [n] | `/log 50` |
| `/pull [branch]` | Pull changes [branch] | `/pull main` |
| `/push [branch]` | Push changes [branch] | `/push main` |
| `/add <path>` | Add files to staging | `/add src/newfile.ts` |
| `/commit "msg"` | Commit changes with message | `/commit "Add feature"` |
| `/reset <soft|hard>` | Reset changes [soft|hard] | `/reset soft` |
| `/checkout <branch>` | Switch branch | `/checkout develop` |
| `/createBranch <name>` | Create branch | `/createBranch feature` |
| `/merge <branch>` | Merge branch | `/merge feature` |
| `/stash [msg]` | Stash changes [msg] | `/stash "WIP"` |
| `/stash-pop` | Pop stashed changes | `/stash-pop` |
| `/stash-list` | List stashes | `/stash-list` |
| `/diff [branch]` | Show changes [branch] | `/diff main` |
| `/changes` | Show uncommitted changes | `/changes` |
| `/history [n]` | Commit history [n] | `/history 20` |
| `/git-info` | Git repository info | `/git-info` |

```bash
./scripts/install.sh
```

This will:

1. Build the bot application
2. Create macOS Launch Agent configuration
3. Start the service with auto-restart
4. Enable start at login/boot

### Check Service Status

```bash
# Check if service is running
launchctl list | grep com.tg-mac-remote

# View daemon logs
tail -f ~/Library/Logs/tg-mac-remote/stdout.log
```

### Update Service

```bash
# Self-update (pulls latest from git)
./scripts/update.sh
```

Update script includes:

- Version checking via git
- Automatic backup before update
- Rollback on failure
- Service restart after update

### Uninstall Service

```bash
./scripts/uninstall.sh
```

## Troubleshooting

### Bot Not Responding

1. **Check service status**:

   ```bash
   launchctl list | grep com.tg-mac-remote
   ```

2. **View error logs**:

   ```bash
   tail -f ~/Library/Logs/tg-mac-remote/stderr.log
   ```

3. **Restart service**:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.tg-mac-remote.plist
   launchctl load ~/Library/LaunchAgents/com.tg-mac-remote.plist
   ```

### Unauthorized Access

**Error**: `Unauthorized access attempt`

**Solution**:

1. Get your Telegram User ID: [@userinfobot](https://t.me/userinfobot)
2. Update `.env` file:
   ```bash
   ALLOWED_USER_IDS=your_user_id_here
   ```
3. Restart daemon: `/restart` or `launchctl unload/load`

### Plugin Not Loading

**Error**: Plugin failed to load

**Solution**:

1. Check `.env`:
   ```bash
   ENABLED_PLUGINS=terminal,activity,daemon,unix
   ```
2. Verify plugin file exists: `apps/bot/src/plugins/*.ts`
3. Check logs for specific error

### Commands Not Working

**Error**: Command not recognized

**Solution**:

1. Use `/tabs` or `/activity` to verify plugins are loaded
2. Check `.env` has correct `ENABLED_PLUGINS` list
3. Restart service after changing config

### High Memory Usage

**Error**: Memory consumption high (>500 MB)

**Solution**:

1. Check `/health` command output
2. Restart daemon: `/restart`
3. If persists, limit terminal tab output buffer size
4. Check for memory leaks in commands

## Development

### Project Structure

```
tg-mac-remote/
├── apps/
│   └── bot/                    # Main bot application
│       ├── src/
│       │   ├── plugins/           # Plugin implementations
│       │   ├── commands/         # Command routing
│       │   ├── middleware/        # Auth, error handling
│       │   └── index.ts           # Entry point
│       └── package.json
├── packages/
│   ├── core/                    # Shared utilities
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   ├── bot.ts
│   │   └── types.ts
│   └── plugins/                 # Plugin system
│       ├── types.ts
│       ├── registry.ts
│       └── index.ts
├── scripts/
│   ├── install.sh               # Service installation
│   ├── uninstall.sh             # Service removal
│   └── update.sh               # Self-update
├── .env.example                # Configuration template
└── package.json
```

### Running in Development

```bash
# Install dependencies
bun install

# Set up .env file
cp .env.example .env
# Edit with your credentials

# Run in dev mode (auto-reload)
cd apps/bot
bun run dev

# Or run from root
bun run --filter=@tg-mac-remote/bot dev
```

### Adding a New Plugin

1. Create plugin file: `apps/bot/src/plugins/myplugin.ts`
2. Implement Plugin interface:

   ```typescript
   import { type BotContext, type Plugin } from '@tg-mac-remote/core';

   const plugin: Plugin = {
     name: 'myplugin',
     description: 'My awesome plugin',
     commands: [
       {
         name: 'mycommand',
         description: 'My command description',
         handler: async (ctx: BotContext, args: string[]): Promise<string> => {
           return 'Hello from my command!';
         },
       },
     ],
     register(_bot: unknown): void {},
   };

   export default plugin;
   ```

3. Add to `.env`: `ENABLED_PLUGINS=...,myplugin`
4. Restart bot

### Running Tests

```bash
# Run type checking
bun run lint

# Check TypeScript types
bunx tsc --noEmit
```

## Security

### Best Practices

1. **Use strong bot token**: Keep token secret, never commit to git
2. **Limit allowed users**: Only add trusted user IDs to whitelist
3. **Use HTTPS**: Ensure git repository uses HTTPS
4. **Regular updates**: Keep dependencies and daemon updated
5. **Monitor logs**: Check logs for suspicious activity
6. **Sensitive data**: Mask tokens, keys, passwords in config output

### Permissions

The bot runs as your macOS user with the following permissions:

- **File system**: Read/write files in user directories
- **Process management**: Kill, pause, inspect processes
- **System info**: CPU, RAM, disk, battery, network
- **Network**: Run network commands, access system network info

**Does NOT require**: root/sudo access (user-space only)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Run tests: `bun run lint`
5. Commit: `git commit -am`
6. Push: `git push origin my-feature`
7. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/tg-mac-remote/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/tg-mac-remote/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/tg-mac-remote/discussions)

## Acknowledgments

- [Grammy](https://grammy.dev/) - Telegram bot framework
- [Bun](https://bun.sh/) - JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [macOS launchd](https://developer.apple.com/documentation/bundler/) - Service management

#### 📊 Git Plugin (18 commands)

| Command | Description | Usage |
|---------|-------------|--------|
| `/status` | Show git status | `/status` |
| `/branch` | Show current branch | `/branch` |
| `/remote` | Show git remotes | `/remote` |
| `/log [n]` | Show git log [n] | `/log 50` |
| `/pull [branch]` | Pull changes [branch] | `/pull main` |
| `/push [branch]` | Push changes [branch] | `/push main` |
| `/add <path>` | Add files to staging | `/add src/newfile.ts` |
| `/commit "msg"` | Commit changes with message | `/commit "Add feature"` |
| `/reset <soft|hard>` | Reset changes [soft|hard] | `/reset soft` |
| `/checkout <branch>` | Switch branch | `/checkout develop` |
| `/createBranch <name>` | Create branch | `/createBranch feature` |
| `/merge <branch>` | Merge branch | `/merge feature` |
| `/stash [msg]` | Stash changes [msg] | `/stash "WIP"` |
| `/stash-pop` | Pop stashed changes | `/stash-pop` |
| `/stash-list` | List stashes | `/stash-list` |
| `/diff [branch]` | Show changes [branch] | `/diff main` |
| `/changes` | Show uncommitted changes | `/changes` |
| `/history [n]` | Commit history [n] | `/history 20` |
| `/git-info` | Git repository info | `/git-info` |


EOF'