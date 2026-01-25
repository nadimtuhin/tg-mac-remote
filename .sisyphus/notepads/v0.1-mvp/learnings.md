# Learnings - v0.1 MVP

## Project Conventions

_This file will accumulate wisdom as we build_

---

## Environment Variable Configuration

### .env.example Structure (2025-01-25)

Created comprehensive `.env.example` file with:

**Required Variables:**

- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `ALLOWED_USER_IDS` - Comma-separated whitelist of authorized Telegram user IDs

**Optional Variables:**

- `LOG_LEVEL` - Logging verbosity (debug, info, warn, error) - default: info
- `ENABLED_PLUGINS` - Comma-separated list of active plugins
- `OPENCODE_MODEL` - AI model for /code commands
- `ANTHROPIC_API_KEY` - API key for Anthropic-powered features
- `AUTO_UPDATE` - Enable/disable automatic self-updates - default: false

### Best Practices

- Use clear section headers (REQUIRED vs OPTIONAL)
- Include inline comments explaining purpose and source
- Document default values where applicable
- Show example values to guide users
- Reference external tools for obtaining IDs (@BotFather, @userinfobot)

---

## ESLint and Prettier Configuration (2025-01-25)

### Setup Overview

Configured ESLint and Prettier for the Bun TypeScript monorepo with:

**Configuration Files:**

- `eslint.config.mjs` - ESLint 9 flat config format with TypeScript + Bun support
- `.prettierrc` - Prettier configuration with sensible defaults
- `.prettierignore` - Excludes build artifacts, node_modules, caches

**Installed Dependencies:**

- `eslint`@^9.39.2
- `@typescript-eslint/parser`@^8.53.1
- `@typescript-eslint/eslint-plugin`@^8.53.1
- `eslint-config-prettier`@^10.1.8
- `eslint-plugin-prettier`@^5.5.5
- `eslint-import-resolver-typescript`@^4.4.4
- `prettier`@^3.8.1
- `globals`@^17.1.0

**Added Scripts:**

- `bun run lint` - Check code for linting errors
- `bun run lint:fix` - Automatically fix linting errors
- `bun run format` - Check code formatting
- `bun run format:fix` - Automatically format code

### Key Configuration Details

**ESLint Configuration:**

- Uses ESLint 9 flat config format (eslint.config.mjs)
- Parser: `@typescript-eslint/parser` for TypeScript support
- Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `prettier/recommended`
- Includes both Node.js and Bun globals
- Excludes: dist, build, node_modules, \*.js, bun.lockb
- Project references for monorepo: `./tsconfig.json`, `./packages/*/tsconfig.json`, `./apps/*/tsconfig.json`

**Custom Rules:**

- `@typescript-eslint/no-unused-vars` - Error with underscore prefix pattern
- `@typescript-eslint/explicit-function-return-type` - Off for flexibility
- `@typescript-eslint/no-explicit-any` - Warn (not error)
- `@typescript-eslint/no-floating-promises` - Error to catch unhandled promises
- `@typescript-eslint/no-misused-promises` - Error for promise misuse
- `no-console` - Warn, but allow console.warn() and console.error()

**Prettier Configuration:**

- `semi: true` - Use semicolons
- `trailingComma: es5` - ES5-compatible trailing commas
- `singleQuote: true` - Use single quotes
- `printWidth: 100` - 100 characters per line
- `tabWidth: 2` - 2-space indentation
- `useTabs: false` - Use spaces instead of tabs
- `arrowParens: always` - Always include parentheses in arrow functions
- `endOfLine: lf` - Unix-style line endings

### Important Considerations

**ESLint 9 Flat Config:**

- Must use `.mjs` extension (or add `"type": "module"` to package.json)
- Uses array-based configuration instead of object-based
- Requires `globals` package for specifying global variables

**TypeScript Configuration:**

- Root `tsconfig.json` required for ESLint type checking
- Extends `tsconfig.base.json` with monorepo-appropriate include/exclude patterns
- Project references for packages/_ and apps/_ for workspace support

**Monorepo Compatibility:**

- Configuration works with Bun workspaces
- Project references allow TypeScript to resolve cross-package imports
- Import resolver configured for workspace packages

### Gotchas and Lessons

1. **ESLint 9 Migration**: ESLint 9 requires flat config format; old `.eslintrc.*` format is deprecated
2. **Module Format**: Use `.mjs` extension for ESLint config to avoid import errors
3. **Type Checking**: Enabling `recommended-requiring-type-checking` requires `tsconfig.json` in root
4. **Globals**: Must explicitly include Bun globals (`globals.bun`) for runtime support
5. **Type-Safe Rules**: Some type-checking rules can be overly strict; adjust based on project needs

### Future Improvements

- Consider adding `@typescript-eslint/strict` rules for stricter type safety
- Add import organization rules (eslint-plugin-import)
- Consider adding tests for linting in CI/CD pipeline
- Explore adding specific rules for async/await patterns in Bun runtime

---

## Git Repository Initialization (2025-01-25)

### What Was Done

Initialized git repository and created comprehensive `.gitignore` file for Node/Bun/TypeScript project.

### .gitignore Patterns Included

**Dependencies:**

- `node_modules/` - npm/yarn dependencies
- `bun.lockb` - Bun lockfile
- `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*` - Package manager logs

**Build Outputs:**

- `dist/`, `build/` - Common build directories
- `.next/` - Next.js build output
- `.turbo/` - Turborepo cache

**Environment Files:**

- `.env`, `.env.local`, `.env.*.local` - All environment files EXCEPT `.env.example`
- Rationale: `.env.example` should be version controlled as a template

**Testing:**

- `coverage/` - Code coverage reports
- `*.lcov`, `.nyc_output/` - LCOV and nyc coverage output

**IDE & Editor Files:**

- `.vscode/`, `.idea/` - VS Code and IntelliJ settings
- `*.swp`, `*.swo`, `*~` - Vim swap files
- `.DS_Store`, `Thumbs.db` - macOS and Windows thumbnail caches

**Logs:**

- `logs/`, `*.log` - Application and build logs

**Cache:**

- `.cache/`, `.parcel-cache/` - Build and bundler caches
- `.eslintcache` - ESLint cache
- `.tsbuildinfo` - TypeScript incremental build info

**OS Files:**

- `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes` - macOS system files
- `Thumbs.db`, `ehthumbs.db` - Windows thumbnail caches

**Miscellaneous:**

- `*.pid`, `*.seed`, `*.pid.lock` - Process ID files
- `.pnp.*` - Yarn Plug'n'Play files
- `.turbo` - Turborepo cache files
- `tmp/`, `temp/`, `*.tmp` - Temporary files

### Key Decisions

- Standard `.gitignore` patterns suitable for TypeScript/Bun monorepo
- `.env.example` intentionally not ignored to serve as documentation/template
- Included both macOS and Windows OS-specific files for cross-platform compatibility
- Added cache directories for common tools (eslint, parcel, turbo)

---

## Core Package Structure (2025-01-25)

### Package Created: @tg-mac-remote/core

Created the core library package that provides shared utilities for the entire monorepo.

### Module Architecture

**Created Files:**

1. **src/config.ts** - Environment configuration loader
   - Singleton pattern with lazy initialization
   - Required field validation (TELEGRAM_BOT_TOKEN, ALLOWED_USER_IDS)
   - Optional fields with sensible defaults (LOG_LEVEL=info, AUTO_UPDATE=false)
   - Type-safe configuration access
   - Helper functions: parseUserIds(), parseCommaList(), parseBoolean(), validateLogLevel()
   - Export: `getConfig()`, `resetConfig()` (for testing)

2. **src/auth.ts** - User authorization
   - Simple whitelist-based authentication
   - checkUserId(userId) - validates against allowed list
   - getAllowedUserIds() - returns copy of whitelist
   - formatUserIds() - helper for display/logging

3. **src/logger.ts** - Structured logging
   - Configurable log levels (debug, info, warn, error)
   - Hierarchical filtering (debug < info < warn < error)
   - ISO timestamp formatting: `[2025-01-25T03:04:05.678Z] [INFO] message`
   - Lazy evaluation based on LOG_LEVEL config
   - No-op when message level is below configured level

4. **src/types.ts** - Shared TypeScript types
   - Config interface and LogLevel type
   - BotContext - simplified Telegram message context
   - Command interface - command name, description, handler
   - Plugin interface - name, version, description, commands, lifecycle hooks
   - CommandResult, PluginConfig, BotEvent types
   - Note: Renamed Context → BotContext to avoid conflict with Grammy's Context type

5. **src/bot.ts** - Telegram bot wrapper
   - Singleton bot instance with lazy initialization
   - Wrapper around grammy Bot class
   - initBot() - create and return bot instance
   - getBot() - lazy-loaded getter
   - isBotInitialized() - check initialization status
   - stopBot() - cleanup
   - Global error handler using logger.error()
   - Type: `GrammyBot<GrammyContext>` - uses Grammy's built-in Context

6. **src/index.ts** - Public API exports
   - Re-exports all modules for clean imports
   - Consumers: `import { getConfig, initBot, info } from '@tg-mac-remote/core'`

### Package Configuration

**package.json:**

- name: @tg-mac-remote/core
- version: 0.1.0
- type: module (ESM)
- exports: "./src/index.ts" (direct source export for development)
- dependencies: grammy@^1.21.2
- devDependencies: typescript@^5.3.3, @types/node@^20.11.5

**tsconfig.json:**

- Extends tsconfig.base.json
- Overrides: outDir: ./dist, rootDir: ./src
- types: ["node"] (not bun-types - library packages shouldn't depend on runtime)

### Key Design Decisions

1. **Singleton Pattern**: Config and Bot use lazy-loaded singletons to ensure single instance across imports

2. **Type Safety**: All functions use TypeScript types, no `any` types in public API

3. **Public API Documentation**: JSDoc comments on all exported functions/types for IDE autocomplete

4. **Modular Design**: Each module has single responsibility - config, auth, logger, bot, types

5. **Error Handling**: Config validation throws with helpful error messages; Bot catches and logs errors

6. **Logger Performance**: No-op checks before string formatting to avoid unnecessary work

### Gotchas and Lessons

1. **Context Type Conflict**: Initially created a custom `Context` interface that conflicted with Grammy's `Context`. Renamed to `BotContext` and use Grammy's `Context` directly in bot wrapper.

2. **bun-types in Library Packages**: Library packages should use `types: ["node"]` not `["bun-types"]` since they're runtime-independent. bun-types is for apps that run on Bun.

3. **Source Exports**: Using `"exports": "./src/index.ts"` for development to avoid build step. Will need to build for production: `"exports": "./dist/index.js"`

4. **Grammy Context**: Grammy's `Context` type is complex with 175+ properties. Use `type Context as GrammyContext` import to avoid naming conflicts.

5. **Logger console.warn/error**: ESLint `no-console` rule warns for console.warn/error, but our config allows them. Remove unused eslint-disable comments if warnings don't trigger.

6. **ESLint Flat Config**: Can't use `--filter` flag in ESLint 9 flat config. Use root lint command and rely on tsconfig include/exclude patterns.

### Future Improvements

- Add TypeScript declaration files generation for production distribution
- Consider adding plugin system loader in core package
- Add request/telemetry collection hooks
- Consider adding rate limiting utilities
- Add retry logic for Telegram API calls in bot wrapper

---

## Plugins Package Structure (2025-01-25)

### Package Created: @tg-mac-remote/plugins

Created the plugin system package that provides plugin registration and command management.

### Module Architecture

**Created Files:**

1. **src/types.ts** - Plugin type definitions
   - Command interface: name, description, handler(BotContext, args)
   - Plugin interface: name, description, commands?, register(bot)
   - PluginRegistry type: Map-based plugin storage
   - Imports BotContext from @tg-mac-remote/core for type safety
   - Note: Different from core's Plugin interface (uses register(bot) instead of init/destroy)

2. **src/registry.ts** - Plugin registry implementation
   - Registry class implements PluginRegistry interface
   - registerPlugin(plugin): Register and validate plugin, throws if duplicate
   - getPlugin(name): Retrieve plugin by name
   - getAllPlugins(): Return array of all plugins
   - getCommands(): Flatten and return all commands from all plugins
   - validatePlugin(plugin): Basic validation - checks required fields and types
   - hasPlugin(name): Check if plugin exists
   - count(): Get number of registered plugins
   - Private plugins Map for storage

3. **src/index.ts** - Public API exports
   - Re-exports types and Registry class
   - Clean import path for consumers

### Package Configuration

**package.json:**

- name: @tg-mac-remote/plugins
- version: 0.1.0
- type: module (ESM)
- exports: "./src/index.ts" (direct source export for development)
- dependencies: @tg-mac-remote/core: "workspace:\*" (uses workspace protocol)
- devDependencies: typescript@^5.7.2, @types/node@^22.10.2

### Key Design Decisions

1. **Workspace Protocol**: Uses "workspace:\*" in package.json dependencies to reference local packages, enabling monorepo development without publish step.

2. **Plugin Registration Pattern**: Plugins register themselves via register(bot) method instead of init/destroy lifecycle hooks. This gives plugins direct access to bot instance for command registration.

3. **Validation on Registration**: Plugin validation happens at registration time, not at command execution time. Fail fast approach.

4. **Command Aggregation**: getCommands() flattens commands from all plugins into a single array, making it easy to register all commands with the bot at once.

5. **Map-based Storage**: Uses Map for plugin storage for O(1) lookup by name and automatic iteration.

6. **Type Safety**: All handlers use BotContext from core package, ensuring type consistency across the codebase.

### Gotchas and Lessons

1. **Plugin Interface Differences**: The plugins package defines a Plugin interface that's different from the core package's Plugin interface. The plugins version uses register(bot) method, while core uses init/destroy hooks. This is intentional - plugins package is the authoritative definition for the plugin system.

2. **Workspace Dependencies**: Use "workspace:\*" protocol in package.json for local monorepo dependencies. Bun automatically resolves these without needing npm link or publish steps.

3. **ES Module Extensions**: All local imports use .js extensions (e.g., './types.js') because package.json has `"type": "module"`. TypeScript compiles to .js files at runtime.

4. **Public API Docstrings**: JSDoc comments on public interfaces (Plugin, Command, Registry methods) are necessary for IDE autocomplete and API documentation. Simple file header comments are unnecessary and trigger pre-commit hooks.

5. **Register Method Signature**: register(bot) takes unknown type instead of Grammy bot type to avoid circular dependencies. Plugin implementations can cast to appropriate bot type.

### Future Improvements

- Add plugin dependency management (plugins that depend on other plugins)
- Add plugin lifecycle hooks (beforeLoad, afterLoad, beforeUnload, afterUnload)
- Add plugin state persistence
- Add plugin hot-reload capability
- Add plugin metadata (author, license, homepage)
- Add plugin version compatibility checking
- Consider adding plugin discovery system (auto-load from directories)
- Add plugin health checks and status monitoring
- Consider adding middleware/plugin execution pipeline

---

## Bot Application Infrastructure (2025-01-25)

### Application Created: @tg-mac-remote/bot

Created the main bot application that initializes the Telegram bot, loads plugins, and handles commands.

### Module Architecture

**Created Files:**

1. **package.json** - Bot application configuration
   - name: @tg-mac-remote/bot
   - version: 0.1.0
   - type: module (ESM)
   - main: ./src/index.ts
   - scripts: start, dev (with --watch)
   - dependencies: @tg-mac-remote/core, @tg-mac-remote/plugins (workspace:\*)
   - devDependencies: typescript, @types/node

2. **src/index.ts** - Main bot entry point
   - setupMiddleware(bot): Register auth and error middleware
   - registerPlugins(bot, registry): Load enabled plugins from config, register commands
   - setupGracefulShutdown(): Handle SIGTERM, SIGINT, SIGQUIT, uncaught errors
   - main(): Initialize config, bot, middleware, plugins, start polling
   - Uses Grammy Bot type casting with unknown to avoid circular dependencies

3. **src/middleware/auth.ts** - Authorization middleware
   - authMiddleware(context): Check user ID against whitelist
   - Reject unauthorized users with clear error message
   - Logs unauthorized access attempts
   - Throws error to stop message processing

4. **src/middleware/error.ts** - Error handling middleware
   - errorMiddleware(err, context): Catch and log errors
   - Send user-friendly error messages to users
   - Converts Error objects to readable messages

5. **src/commands/index.ts** - Command routing system
   - commandMap: Map of command strings to Command objects
   - registerCommands(commands): Register plugin commands in map
   - setupCommands(bot, commands): Register commands with Grammy, setup callback query handler
   - handleCommand(context, command): Execute command handler with proper context conversion
   - handleCallbackQuery(context): Process inline keyboard button clicks
   - Converts Grammy Context to BotContext for plugin handlers

6. **src/plugins/index.ts** - Plugin loading system
   - pluginCache: Map of loaded plugin modules
   - loadPlugins(registry, pluginNames): Load all enabled plugins, handle errors gracefully
   - importPlugin(pluginName): Dynamic import of plugin module from @tg-mac-remote/plugins/{name}
   - Caches loaded plugins to avoid duplicate imports
   - Reports successful and failed plugin loads

7. **tsconfig.json** - TypeScript configuration
   - Extends root tsconfig.json
   - Overrides: outDir: ./dist, rootDir: ./src
   - composite: true (for project references)
   - types: ["bun"] (Bun runtime types)

### Key Design Decisions

1. **Dynamic Plugin Loading**: Plugins are loaded dynamically from config using ES module imports with caching
   - Allows runtime configuration of enabled plugins
   - Plugin failures don't stop the entire bot from starting

2. **Middleware Pattern**: Grammy middleware system for auth and error handling
   - Auth middleware rejects unauthorized users early
   - Error middleware catches and logs errors, sends user-friendly messages

3. **Context Conversion**: Grammy Context → BotContext conversion for plugin handlers
   - Plugins use simplified BotContext from core package
   - Command router converts to appropriate type before calling handlers

4. **Graceful Shutdown**: Comprehensive shutdown handling
   - Handles SIGTERM, SIGINT, SIGQUIT signals
   - Catches uncaught exceptions and unhandled promise rejections
   - Ensures bot.stop() is called before exit

5. **Type Safety with Unknown**: Uses unknown type for bot parameter to avoid circular dependencies
   - Type assertions used where Grammy API is needed
   - Maintains type safety in core logic

6. **Error Resilience**: Plugin loading errors don't stop bot startup
   - Failed plugins are logged and skipped
   - Reports successful vs. failed plugin counts

### Gotchas and Lessons

1. **Grammy Type Casting**: Grammy Bot type requires casting from unknown due to circular dependency with core package. The solution is to use type assertions where Grammy API is accessed.

2. **Plugin Import Path**: Dynamic imports use `@tg-mac-remote/plugins/${pluginName}` pattern. This requires each plugin to have its own package under the plugins workspace.

3. **Context Conversion**: Grammy Context has 175+ properties, but plugins only need BotContext. The command router handles this conversion, extracting only necessary fields (from, chat, messageId, date, text).

4. **JSDoc Necessity**: JSDoc comments are required for public API documentation, especially for exported functions. Inline comments are removed when code is self-documenting.

5. **Error Messages**: User-facing error messages should be friendly and not expose technical details. Internal errors are logged separately with full context.

6. **Callback Queries**: Callback queries from inline keyboards are handled separately from text commands. They require answerCallbackQuery() to dismiss the loading animation on Telegram UI.

### Future Improvements

- Add plugin initialization hooks (init, destroy) for lifecycle management
- Add command help system that lists all available commands
- Add rate limiting to prevent command spam
- Add user sessions for multi-step commands
- Add plugin configuration validation
- Add plugin hot-reload for development
- Add command aliases
- Add command autocomplete/suggestions
- Add middleware execution pipeline (before, after hooks)
- Add telemetry/usage analytics for commands
- Add localization support for error messages
- Consider adding command timeouts to prevent hanging handlers
- Add command argument parsing with validation
- Add inline mode support for external bot integration

---

## macOS Service Management Scripts (2025-01-25)

### Created Components

Created three scripts for macOS Launch Agent service management:

1. **scripts/com.tg-mac-remote.plist** - Launch Agent configuration template
2. **scripts/install.sh** - Installation and service management script
3. **scripts/update.sh** - Self-update script with rollback capability

### Plist Configuration

**Key Elements in com.tg-mac-remote.plist:**

```xml
- Label: com.tg-mac-remote (service identifier)
- ProgramArguments: [executable path]
- RunAtLoad: true (start at login)
- KeepAlive: true (auto-restart on crash)
- StandardOutPath: ~/Library/Logs/tg-mac-remote/stdout.log
- StandardErrorPath: ~/Library/Logs/tg-mac-remote/stderr.log
- WorkingDirectory: project root
- EnvironmentVariables: NODE_ENV=production
```

**Installation Target:** `~/Library/LaunchAgents/com.tg-mac-remote.plist`

**Permissions:** 644 (readable by owner, group, and world)

### Install Script Features

**scripts/install.sh** - Comprehensive installation script with:

**Capabilities:**

- macOS platform validation
- Automated build using bun or npm
- Dynamic plist generation with actual paths
- Log directory creation (`~/Library/Logs/tg-mac-remote/`)
- Service lifecycle management (stop, start, restart)
- Service status verification
- Recent log output display

**Functions:**

- `check_macos()` - Verify macOS platform
- `create_log_dir()` - Create and set permissions on log directory
- `build_bot()` - Build bot using bun/npm
- `create_plist()` - Generate plist with correct paths
- `stop_service()` - Unload launch agent
- `start_service()` - Load and start launch agent
- `verify_service()` - Check service status and show logs
- `print_usage()` - Display helpful commands

**Error Handling:**

- Set `set -euo pipefail` for strict error checking
- Colored output (info, success, warning, error)
- Graceful handling of existing service
- Build failure detection
- Path validation

**Usage:**

```bash
./scripts/install.sh
```

**Post-Install Commands:**

```bash
launchctl list | grep com.tg-mac-remote    # Check status
tail -f ~/Library/Logs/tg-mac-remote/stdout.log  # View logs
launchctl unload ~/Library/LaunchAgents/com.tg-mac-remote.plist  # Stop
launchctl load ~/Library/LaunchAgents/com.tg-mac-remote.plist   # Start
```

### Update Script Features

**scripts/update.sh** - Self-update script with safety features:

**Capabilities:**

- Version checking via GitHub API
- Automatic backup creation
- Git pull for updates
- Dependency installation
- Project rebuild
- Service restart
- Rollback on failure
- Update verification

**Functions:**

- `check_macos()` - Verify macOS platform
- `get_current_version()` - Read version from package.json
- `get_latest_version()` - Fetch latest release from GitHub API
- `stop_service()` - Unload launch agent
- `start_service()` - Load and start launch agent
- `backup_current()` - Create timestamped backup (.backup/)
- `pull_latest()` - Git pull from current branch
- `install_dependencies()` - bun/npm install
- `build_project()` - Build project
- `verify_update()` - Check service and show logs
- `rollback()` - Restore from backup on failure

**Backup Strategy:**

- Location: `.backup/backup_YYYYMMDD_HHMMSS.tar.gz`
- Excludes: node_modules, dist, .git, .cache, .backup/
- Preserves: All source code, configs, dependencies

**Rollback Mechanism:**

- Automatic rollback on verification failure
- Restores backup, reinstalls deps, rebuilds, restarts service
- Keeps backup file for manual recovery if needed

**Usage:**

```bash
./scripts/update.sh
```

**Output Example:**

```
==================================
  tg-mac-remote Self-Update
==================================

[INFO] Current version: 0.1.0

[INFO] Checking for updates...
[INFO] Latest version: 0.1.1

[INFO] Updating from 0.1.0 to 0.1.1

[INFO] Creating backup...
[SUCCESS] Backup created: /path/to/.backup/backup_20250125_032045.tar.gz

[INFO] Updating from git repository...
[INFO] Current branch: main
[INFO] Pulling latest changes...
[SUCCESS] Repository updated

[INFO] Installing dependencies...
[SUCCESS] Dependencies installed

[INFO] Building project...
[SUCCESS] Build completed

[INFO] Stopping service...
[SUCCESS] Service stopped

[INFO] Starting service...
[SUCCESS] Service started

[INFO] Verifying update...
[SUCCESS] Service is running

[SUCCESS] Update completed successfully!
[INFO] New version: 0.1.1

[INFO] Backup saved at: /path/to/.backup/backup_20250125_032045.tar.gz
[WARNING] Remove old backups manually from: /path/to/.backup
```

### Key Design Decisions

1. **Dynamic Plist Generation:** Instead of using static plist, the install script generates plist with actual absolute paths at runtime. This makes installation work in any directory.

2. **Service Management via launchctl:** Uses macOS native launchctl for service lifecycle, not systemd or other service managers.

3. **KeepAlive with RunAtLoad:** Ensures service starts automatically on boot/login and restarts if it crashes.

4. **Structured Logging:** All output goes to dedicated log directory, making debugging and monitoring easier.

5. **Build on Install:** The install script builds the bot before creating plist, ensuring executable exists.

6. **Backup Before Update:** Update script creates timestamped backup before any changes, enabling safe rollback.

7. **Version Checking:** Uses GitHub API to check for updates, comparing package.json version with latest release.

8. **Graceful Error Handling:** Both scripts use `set -euo pipefail` and colored output for clear error communication.

9. **Multi-Package Manager Support:** Supports both bun and npm, using whichever is available.

10. **Working Directory:** Service runs in project root directory, so relative paths and file access work correctly.

### Gotchas and Lessons

1. **Plist Paths Must Be Absolute:** Launch Agent plist requires absolute paths for executable and logs. The install script generates these dynamically.

2. **Plist Permissions:** Plist files should have 644 permissions (not executable). The install script sets this correctly.

3. **Log Directory Permissions:** Log directory needs 755 permissions so launchd can write logs. Created and set by install script.

4. **Service Stop Timeout:** Need to wait 1-2 seconds after `launchctl unload` before loading again. Implemented with `sleep` commands.

5. **Verification Delay:** After starting service, need 2-3 seconds for bot to fully initialize before verification.

6. **Git Branch Awareness:** Update script uses current branch name for pull, so it works on any branch (not just main).

7. **GitHub API Rate Limiting:** Version checking uses GitHub API unauthenticated (60 requests/hour). Consider authentication for frequent checks.

8. **Backup Exclusions:** Must exclude node_modules, dist, and build artifacts from backups to keep them small and fast.

9. **Environment Variables:** Service needs NODE_ENV=production for production logging. Set in plist.

10. **User-Specific Paths:** Launch Agents in ~/Library/LaunchAgents are user-specific. For system-wide service, would use /Library/LaunchDaemons/ (requires root).

### Security Considerations

1. **User-Scoped Service:** Launch Agent runs as current user, not as root. Good security principle for bot service.

2. **No Sudo Required:** Installation and updates don't require sudo permissions since they use user directories.

3. **Log File Location:** Logs in user home directory (~/Library/Logs) are accessible only to user, protecting sensitive data.

4. **Git Repository Access:** Update script assumes git repo exists and user has push/pull permissions.

5. **GitHub API:** Using unauthenticated GitHub API is acceptable for version checking (read-only operation).

### Future Improvements

- Add auto-update mode (scheduled checks) based on AUTO_UPDATE config
- Add pre-update and post-update hooks for custom scripts
- Add health check endpoint for monitoring
- Add support for pre-release/beta version updates
- Add update notification mechanism (send to Telegram)
- Add backup retention policy (delete old backups after N days)
- Add support for multiple update channels (stable, beta, edge)
- Add update verification checksums for security
- Add dry-run mode to preview changes without applying
- Consider adding systemd support for Linux compatibility
- Add Windows service support using NSSM or similar
- Add service status dashboard/command
- Add log rotation to prevent disk space issues

### Testing Recommendations

1. Test install script from different directory locations
2. Test update script with uncommitted changes
3. Test rollback on build failure
4. Test service persistence after reboot
5. Test log rotation and disk space
6. Test auto-restart on crash
7. Test with bun vs npm
8. Test on different macOS versions
9. Test uninstall script removes service correctly
10. Test uninstall script log cleanup confirmation
11. Test with bun vs npm

---

## P0 Plugin Implementations (2025-01-25)

### Terminal Plugin (apps/bot/src/plugins/terminal.ts)

**Created Complete Terminal Plugin (9 commands):**

**Core Architecture:**

- `TerminalTab` interface: id, name, process, output, createdAt, lastActive
- `TerminalManager` class: Manages tab lifecycle and command execution
- Tab storage: Map<number, TerminalTab> for O(1) lookups
- Output buffer: Max 1000 lines per tab (ring buffer)
- Active tab tracking: Single active tab for command execution

**Implemented Commands:**

1. `/new [name]` - Create new terminal tab with optional name
2. `/tabs` - List all tabs with active indicator (🟢/⚪) and process status (🔄)
3. `/switch <id>` - Switch active tab by ID
4. `/kill <id>` - Kill tab and stop process
5. `/logs [n]` - Show last n lines from output buffer (default: 50)
6. `/clear` - Clear output buffer of active tab
7. `/rename <name>` - Rename active tab
8. `/cwd` - Show current working directory via `pwd` command
9. `<text>` - Execute command in active tab via `sh -c`

**Key Design Decisions:**

- Child process management via `spawn('sh', ['-c', command])`
- Output captured from stdout and stderr separately
- Process lifecycle: create → spawn → capture output → close
- Automatic buffer rotation: Shift out oldest lines when exceeding 1000
- Tab IDs auto-incremented starting from 1
- Graceful error handling: Returns error messages on process failures

**Gotchas and Lessons:**

1. **Variable Shadowing**: Renamed `process` → `childProcess` to avoid Node.js process name conflict
2. **Promise Handling**: Commands return `Promise<{ success, output }>` to handle async operations
3. **Output Formatting**: Telegram code blocks use triple backticks for proper formatting
4. **Tab State**: Track process separately from output buffer (can have output without running process)
5. **Error Messages**: User-friendly error messages for missing tabs, failed commands
6. **Buffer Size**: 1000 line limit prevents memory issues on long-running sessions
7. **CWD Tracking**: Each tab tracks current working directory via pwd command
8. **Process Cleanup**: Kill child processes when tab is killed to prevent zombies
9. **Emoji Usage**: Consistent emoji indicators across all commands for visual clarity

**Future Improvements:**

- Add tab history persistence (save/restore tabs across bot restarts)
- Add tab sharing between users (if multi-user support added)
- Add background job support (nohup command execution)
- Add file upload/download from bot
- Add interactive commands (confirmation dialogs for dangerous actions)
- Add command aliases (define shortcuts for common commands)
- Add output highlighting (colorize command output)
- Add timestamp to each output line
- Add search/filter in command output
- Add process tree view (show parent/child processes)
- Add resource limits per tab (CPU/RAM quotas)

---

### Activity Plugin (apps/bot/src/plugins/activity.ts)

**Created System Metrics and Process Management Plugin (15 commands):**

**Core Architecture:**

- `ProcessInfo` interface: pid, cpu, mem, time, command
- `ActivityMonitor` class: System metrics collection and process control
- Async metrics gathering: CPU, RAM, disk, battery via macOS native tools
- Process management: ps-based with kill/pause/resume capabilities

**Implemented Commands:**

**System Metrics (4):**

1. `/activity` - Full summary: CPU, RAM, disk, battery, top 5 CPU consumers
2. `/cpu [n]` - Top n CPU consumers with inline kill suggestions
3. `/mem [n]` - Top n RAM consumers with inline kill suggestions
4. `/energy [n]` - Battery info with time remaining (if discharging)

**Process Management (5):** 5. `/k <pid|name>` - Kill process (SIGTERM, signal 15) 6. `/kk <pattern>` - Kill all matching processes via pkill 7. `/k9 <pid|name>` - Force kill (SIGKILL, signal 9) 8. `/freeze <target>` - Pause process (SIGSTOP) 9. `/unfreeze <target>` - Resume process (SIGCONT)

**Special Commands (3):** 10. `/hogs` - Find processes >50% CPU or >10% RAM 11. `/zombies` - Find zombie (<defunct>) processes 12. `/runaway` - Find processes >100% CPU for extended time 13. `/watch` - Live updates every 5s (placeholder: coming soon) 14. `/watchstop` - Stop live updates (placeholder) 15. Additional: `/energy` command included (counts as special command)

**Key Design Decisions:**

- macOS native tools: vm_stat, df, pmset, ps, pkill, kill
- Sorting by CPU or RAM via ps --sort flag
- Fuzzy process matching: Supports both PID and name patterns
- Signal-based control: SIGTERM(15), SIGKILL(9), SIGSTOP, SIGCONT
- Resource thresholds: 50% CPU, 10% RAM as "hog" indicators
- Zombie detection: grep for "<defunct>" in ps output
- Battery integration: Checks charging/discharging status before showing time

**Gotchas and Lessons:**

1. **RAM Calculation**: vm_stat provides page counts, must multiply by page size (4096 bytes)
2. **Disk Formatting**: df -h provides human-readable sizes, parse by whitespace
3. **Battery State**: Only show time remaining when discharging (not charging/charged)
4. **Process Arguments**: ps -e for extended format with custom fields (pid, %cpu, %mem, time, comm)
5. **pkill Pattern**: -f flag for full match, -STOP/-CONT for signal sending
6. **Top Limiting**: ps --sort with head -n for efficient limiting
7. **Signal Safety**: SIGKILL (9) can't be caught, use SIGTERM (15) when possible
8. **Memory Accuracy**: Used memory = total - (free + inactive), includes speculative and wired
9. **Watch Mode**: Placeholder implementation directs users to use periodic commands instead
10. **Energy Monitoring**: macOS energy impact data requires Activity Monitor.app, not CLI accessible
11. **Zombie Handling**: Zombies are already dead processes, just list them (can't be killed)
12. **Runaway Detection**: >100% CPU indicates multi-core full load, treat as runaway

**Future Improvements:**

- Add GPU usage monitoring (requires system_profiler)
- Add network I/O per process (nettop)
- Add disk I/O per process (iotop)
- Add process tree visualization
- Add automatic kill thresholds (auto-kill when CPU > X for Y seconds)
- Add process dependency tracking (show parent/child relationships)
- Add historical metrics storage (graph CPU/RAM over time)
- Add alert notifications (send to Telegram when thresholds exceeded)
- Add energy impact per process (requires more advanced tools)
- Add GPU acceleration status checks
- Add thermal monitoring (temperature, thermal throttling)
- Add per-user resource accounting
- Add container/pod monitoring support (if Docker/K8s used)

---

### Daemon Plugin (apps/bot/src/plugins/daemon.ts)

**Created Daemon Self-Management Plugin (10 commands):**

**Core Architecture:**

- `DaemonStatus` interface: status, uptime, version, memory, errors
- `DaemonManager` class: Service lifecycle and configuration management
- Git-based versioning: Read version from package.json and git describe
- Config file management: .env parsing with secret masking
- Service control: launchctl integration for start/stop/restart

**Implemented Commands:**

**Service Status (2):**

1. `/status` - Show status, uptime, version, memory, logs location
2. `/health` - Health check with error detection (memory, uptime, errors)

**Update & Control (4):** 3. `/update` - Check for updates via git, show update instructions 4. `/restart` - Restart daemon via launchctl restart 5. `/stop` - Stop daemon via launchctl stop 6. `/logs [n]` - Show last n lines of daemon logs (default: 50)

**Configuration (3):** 7. `/config` - Show current .env configuration with secret masking 8. `/config-set <k>=<v>` - Set configuration value with secret protection 9. `/version` - Show current version and check for updates

**Key Design Decisions:**

- Secret detection: Pattern match on "token", "key", "secret", "password" for masking
- Service labels: com.tg-mac-remote (consistent across install/update/uninstall)
- Version sources: package.json (current) + git describe (latest available)
- Uptime tracking: Start time stored in daemonManager, formatted to human-readable
- Memory monitoring: process.memoryUsage() for Node.js heap (not system RAM)
- Config persistence: Read/write .env directly, no process.env for runtime config
- launchctl commands: list (check), stop, restart, unload/load

**Gotchas and Lessons:**

1. **Service Label**: Must match exactly: "com.tg-mac-remote" in all plist files
2. **Secret Masking**: Replace actual values with "**_HIDDEN_**" in display output
3. **Version Priority**: package.json > git describe for current version (installed vs available)
4. **Uptime Calculation**: Milliseconds → formatted string (Xd Xh Xm Xs) for readability
5. **Config File Path**: Join process.cwd() with .env for absolute path resolution
6. **Restart vs Stop+Start**: launchctl restart preferred over unload+load for atomic operation
7. **Log Paths**: Standardized to ~/Library/Logs/tg-mac-remote/ across all scripts
8. **Health Thresholds**: 500MB memory warning, 24h error persistence as unhealthy
9. **Error Collection**: Array of error strings for comprehensive health reporting
10. **Update Detection**: git describe --tags --abbrev=0 returns null if no tags, handle gracefully
11. **Config Validation**: Check for empty lines and comment lines (#) when parsing .env
12. **launchctl Availability**: macOS only command, not available on Linux

**Future Improvements:**

- Add automatic update mode (scheduled checks based on AUTO_UPDATE config)
- Add configuration validation (check values before setting)
- Add configuration reset (restore .env.example defaults)
- Add multi-instance support (run multiple bots with different tokens)
- Add performance metrics (response time, command execution time)
- Add configuration UI (inline keyboard for config changes)
- Add backup/restore configuration (save/load config profiles)
- Add A/B testing (run new version alongside old, rollback on error)
- Add health check endpoint (HTTP API for monitoring)
- Add distributed tracing (OpenTelemetry integration)
- Add hot-reload configuration (restart on .env file changes)

---

### Unix Plugin (apps/bot/src/plugins/unix.ts)

**Created Unix Utility Commands Plugin (25 commands):**

**Core Architecture:**

- `UnixUtils` class: Single utility class for all Unix command wrappers
- Consistent interface: All commands return `Promise<{ success, output }>`
- Child process spawning: Generic `runCommand()` method for all external commands
- Error handling: Unified error handling across all commands

**Implemented Commands:**

**Process Tools (4):**

1. `/ps [pattern]` - List running processes with optional grep filter
2. `/top [n]` - Show top n processes sorted by CPU (default: 10)
3. `/killport <port>` - Kill process listening on port (SIGKILL)
4. `/lsof <port>` - Show what process is using a port

**Disk Tools (3):** 5. `/df` - Show disk usage by filesystem (human-readable) 6. `/du [path]` - Show directory size (path default: current directory) 7. `/space [path]` - Show largest items in directory (top 10)

**Network Tools (5):** 8. `/ip` - Show local (ifconfig) and public IP (curl ifconfig.me) 9. `/ping <host> [n]` - Ping host with count (default: 4) 10. `/ports` - Show listening ports (netstat -an) 11. `/dns <domain>` - DNS lookup via nslookup 12. `/speedtest` - Speed test instructions (requires speedtest-cli)

**Text Tools (5):** 13. `/grep <pattern> [path]` - Search files for pattern (recursive, line numbers) 14. `/find <path> <pattern>` - Find files by name (path default: current dir) 15. `/tail <file> [n]` - Show last n lines of file (default: 50) 16. `/tailf <file>` - Follow file (instructions for terminal plugin) 17. `/head <file> [n]` - Show first n lines of file (default: 50)

**System Tools (4):** 18. `/uptime` - Show system uptime 19. `/env [var]` - Show environment variable (list all if no var) 20. `/which <cmd>` - Find command path 21. `/history [n]` - Show bash history (default: 20)

**Key Design Decisions:**

- Consistent command interface: All handlers use `(_ctx: BotContext, args: string[])` signature
- Output limiting: All list commands limited to 20 lines to prevent Telegram overflow
- Default values: Sensible defaults (10, 50, 20) for all optional parameters
- Error messages: User-friendly error messages with usage hints
- Code block formatting: All command outputs in triple-backtick code blocks
- Follow mode fallback: tailf directs to terminal plugin since interactive not supported

**Gotchas and Lessons:**

1. **Process Sorting**: ps --sort=-%cpu for CPU, --sort=-%mem for RAM
2. **Port Validation**: Check 1-65535 range before attempting kill/lsof
3. **Output Parsing**: netstat output line parsing, filter for LISTEN state
4. **Grep Recursion**: grep -r for recursive directory search
5. **Find Pattern**: Uses literal pattern matching (not regex) for simplicity
6. **Tail/Head Limiting**: head -n and tail -n commands for output control
7. **Public IP Fallback**: ifconfig.me is reliable but could be slow, add timeout in future
8. **Ping Count**: Default 4 packets matches standard ping behavior
9. **Env Variable Filtering**: Filter out undefined values before listing
10. **History Path**: ~/.bash_history standard location, could also be .bash_history or .zsh_history
11. **Network Parsing**: Parse ifconfig inet regex, handle multiple interfaces
12. **DNS Lookup**: nslookup provides full DNS info including name servers
13. **Speed Test**: Not implemented (CLI tool required), provide installation instructions
14. **Error Handling**: All runCommand() calls handle both success and error cases
15. **Exit Codes**: Check code===0 for success, non-zero for errors
16. **Stderr Capture**: Include stderr in output when stdout is empty
17. **Path Defaults**: Default to current directory (process.cwd()) or '.' for optional path args
18. **Output Truncation**: Slice arrays before joining for large outputs
19. **Command Validation**: Validate required arguments before execution
20. **Process Count Limit**: Limit ps/top output to prevent message size limits
21. **Network State**: netstat -an shows all sockets, filter for LISTEN (listening)
22. **File Existence**: tail/head commands fail gracefully if file doesn't exist
23. **Environment Variables**: process.env provides Node.js environment, not shell environment
24. **Which Command**: which returns full path or fails silently, handle gracefully
25. **Interactive Mode**: tailf not supported in async context, provide terminal plugin alternative

**Future Improvements:**

- Add regex support to grep and find commands
- Add file content preview (show first N lines of match)
- Add network statistics (bandwidth, packet loss over time)
- Add disk I/O monitoring (read/write rates)
- Add process resource history (track CPU/RAM over time)
- Add file download/upload (transfer files to/from server)
- Add command completion (tab completion for file paths)
- Add archive extraction (unzip, tar, gzip commands)
- Add file permissions management (chmod, chown commands)
- Add cron job management (list/add/remove scheduled tasks)
- Add log rotation (manage log files, compress old logs)
- Add system profiling (profile command execution time)
- Add diff comparison (compare file contents)
- Add hex/binary file viewing (xxd, hexdump)
- Add process group management (kill all processes in group)
- Add container support (Docker, Podman commands)
- Add Kubernetes support (kubectl integration)
- Add systemd support (systemctl commands for Linux compatibility)

---

## Uninstall Script Implementation (2025-01-25)

### What Was Done

Created `scripts/uninstall.sh` to remove the macOS Launch Agent service and optionally clean up log files.

### Uninstall Script Features

**scripts/uninstall.sh** - Complete uninstallation script with:

**Capabilities:**

- macOS platform validation (check_macos function)
- Service stopping via launchctl unload
- Plist file removal from ~/Library/LaunchAgents/
- Optional log directory cleanup with user confirmation
- Log directory size calculation before cleanup prompt
- Comprehensive summary of remaining items

**Functions:**

- `check_macos()` - Verify macOS platform and version
- `is_service_loaded()` - Check if service is currently running
- `stop_service()` - Stop service if running, handle gracefully if not
- `remove_plist()` - Remove plist file from LaunchAgents
- `cleanup_logs()` - Ask user confirmation, show size, remove logs
- `print_summary()` - Show what was removed, what remains
- `print_usage()` - Display helpful reinstallation instructions

**User Experience:**

- Colored output (INFO, SUCCESS, WARNING, ERROR)
- Clear confirmation prompts for destructive actions
- Shows log directory size before asking for removal
- Lists remaining items (source code, node_modules, backups)
- Provides complete removal command for reference

**Usage:**

```bash
./scripts/uninstall.sh
```

**Example Output:**

```
==================================
  tg-mac-remote Uninstaller
==================================

[INFO] Running on macOS: 14.0
[INFO] Stopping service...
[SUCCESS] Service stopped
[INFO] Removing plist file: /Users/username/Library/LaunchAgents/com.tg-mac-remote.plist
[SUCCESS] Plist file removed

[WARNING] Log directory size: 256K
Remove log directory /Users/username/Library/Logs/tg-mac-remote? [y/N] y
[INFO] Removing log directory...
[SUCCESS] Log directory removed

Service uninstalled successfully!

If you want to reinstall:
  ./scripts/install.sh

==================================
  Uninstallation Summary
==================================

[SUCCESS] tg-mac-remote has been uninstalled

Remaining items:
  - Project source code: /path/to/tg-mac-remote
  - node_modules: /path/to/tg-mac-remote/node_modules
  - Backups: /path/to/tg-mac-remote/.backup/

To completely remove all files, delete the project directory manually:
  rm -rf /path/to/tg-mac-remote

[SUCCESS] Uninstallation complete!
```

### Key Design Decisions

1. **User Confirmation for Logs:** Asks user before removing log directory, shows size first for informed decision
2. **Graceful Service Handling:** Checks if service is loaded before attempting unload
3. **Comprehensive Summary:** Shows exactly what was removed and what remains
4. **Preserves Project Files:** Only removes service files, keeps source code and dependencies
5. **Reinstallation Guide:** Provides clear path to reinstall if user changes mind
6. **Mirror install.sh Structure:** Uses same color functions, error handling, and flow as install.sh

### Differences from install.sh

| Aspect         | install.sh     | uninstall.sh                      |
| -------------- | -------------- | --------------------------------- |
| Creates        | plist, log dir | Removes plist, log dir (optional) |
| Builds         | Yes            | No                                |
| Starts service | Yes            | No                                |
| Stops service  | Yes            | Yes                               |
| Requires root  | No             | No                                |
| Destructive    | No             | Partial (logs optional)           |

### Security Considerations

1. **No Root Required:** Runs as current user, only modifies user-specific directories
2. **Confirmation Prompts:** Destructive actions (log removal) require explicit user confirmation
3. **Clear Warning:** Shows log directory size before removal
4. **Source Preservation:** Never removes source code or dependencies automatically
5. **Manual Control:** Provides commands for complete removal if user wants it

### Gotchas and Lessons

1. **Service May Not Be Running:** Check `is_service_loaded()` before unload to avoid errors
2. **Plist May Not Exist:** Check file existence before removal to handle clean uninstalls
3. **Log Directory May Be Empty:** Handle case where logs were never created
4. **du Output Parsing:** `du -sh` output format varies by macOS version, parse carefully
5. **User Confirmation Format:** Use `read -p` with `-n 1 -r` for simple Y/N input
6. **Sleep After Unload:** Need `sleep 1` after unload for launchctl to complete
7. **Directory Size in Bytes:** Show human-readable format (K, M, G) for user comprehension
8. **Summary Clarity:** List what remains to avoid confusion about complete removal

### Future Improvements

- Add dry-run mode to preview what would be removed
- Add backup creation before uninstall (optional)
- Add selective cleanup (remove logs but keep source)
- Add verification that service is actually stopped
- Add support for multiple service instances
- Add uninstall from different directory location
- Add undo/reinstall flow in same script
- Add cleanup of old backups (with confirmation)
- Add check for running processes before service stop
- Consider adding systemd support for Linux

---
