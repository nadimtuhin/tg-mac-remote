import type { Command } from '@tg-mac-remote/plugins';
import { info, debug } from '@tg-mac-remote/core';

const commandMap = new Map<string, Command>();

/**
 * Register commands from plugins
 */
export function registerCommands(commands: Command[]): void {
  for (const command of commands) {
    commandMap.set(`/${command.name}`, command);
    debug(`Registered command: /${command.name}`);
  }

  info(`Registered ${commands.length} commands`);
}

/**
 * Setup commands on the bot
 */
export function setupCommands(bot: unknown, commands: Command[]): void {
  registerCommands(commands);

  const grammyBot = bot as {
    command: (name: string, handler: (context: unknown) => Promise<void> | void) => void;
    on: (event: string, handler: (context: unknown) => Promise<void> | void) => void;
  };

  for (const command of commands) {
    grammyBot.command(command.name, async (context) => {
      await handleCommand(context, command);
    });
  }

  grammyBot.on('callback_query:data', async (context) => {
    await handleCallbackQuery(context);
  });
}

/**
 * Handle a command
 */
async function handleCommand(context: unknown, command: Command): Promise<void> {
  const ctx = context as {
    from?: { id: number; username?: string };
    chat?: { id: number };
    message?: { text: string };
    reply: (text: string) => Promise<unknown>;
    replyWithPhoto: (path: string, caption?: string) => Promise<unknown>;
    replyWithVideo: (path: string, caption?: string) => Promise<unknown>;
    replyWithAnimation: (path: string, caption?: string) => Promise<unknown>;
  };

  const text = ctx.message?.text || '';
  const args = text.split(' ').slice(1);

  try {
    const result = await command.handler(
      {
        from: ctx.from || { id: 0, isBot: false },
        chat: ctx.chat || { id: 0, type: 'private' },
        messageId: 0,
        date: Date.now() / 1000,
        text,
      },
      args
    );

    // Send result back to Telegram if it's a string
    if (typeof result === 'string' && result) {
      await ctx.reply(result);
    }
  } catch (err) {
    info(`Error executing command /${command.name}:`, err);
    await ctx.reply(`Sorry, there was an error executing that command.`);
  }
}

/**
 * Handle callback query from inline keyboard
 */
async function handleCallbackQuery(context: unknown): Promise<void> {
  const ctx = context as {
    callbackQuery?: { data?: string };
    answerCallbackQuery: (text?: string) => Promise<unknown>;
    reply: (text: string) => Promise<unknown>;
  };

  const data = ctx.callbackQuery?.data;

  if (!data) {
    return;
  }

  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(`You clicked: ${data}`);
  } catch (err) {
    info(`Error handling callback query:`, err);
  }
}
