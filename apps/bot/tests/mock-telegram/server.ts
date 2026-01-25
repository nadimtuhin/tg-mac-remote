import { serve } from 'bun';

interface Message {
  message_id: number;
  from: {
    id: number;
    is_bot: false;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  document?: any;
  callback_query?: any;
}

interface BotConfig {
  token: string;
  allowedUserIds: number[];
}

const messages: Message[] = [];
let messageIdCounter = 1;
let botConfig: BotConfig | null = null;

function parseConfig(token: string): BotConfig | null {
  try {
    const base64 = token.split(':')[1];
    const configStr = atob(base64);
    return JSON.parse(configStr) as BotConfig;
  } catch {
    return null;
  }
}

function createResponse(ok: boolean, result: any, description?: string) {
  return {
    ok,
    result,
    description,
  };
}

function getUser(token: string) {
  const config = parseConfig(token);
  if (config && config.allowedUserIds.length > 0) {
    return {
      id: config.allowedUserIds[0],
      is_bot: false,
      first_name: 'Test User',
      username: 'testuser',
    };
  }
  return {
    id: 123456789,
    is_bot: false,
    first_name: 'Test User',
    username: 'testuser',
  };
}

function getChat(token: string) {
  const config = parseConfig(token);
  if (config && config.allowedUserIds.length > 0) {
    return {
      id: config.allowedUserIds[0],
      type: 'private',
    };
  }
  return {
    id: 123456789,
    type: 'private',
  };
}

async function handleSendMessage(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  const body = req.json ? await req.json() : {};

  const user = getUser(token);
  const chat = getChat(token);

  const message: Message = {
    message_id: messageIdCounter++,
    from: user,
    chat,
    date: Math.floor(Date.now() / 1000),
    text: body.text,
    document: body.document,
  };

  messages.push(message);

  return new Response(JSON.stringify(createResponse(true, message)), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleGetUpdates(req: Request): Response {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const userMessages = messages.filter((m) => m.chat && m.chat.id === getUser(token).id);

  const result = userMessages.slice(offset, offset + 100);
  const nextOffset = offset + result.length;

  return new Response(
    JSON.stringify({
      ok: true,
      result: result,
      next_offset: nextOffset < userMessages.length ? nextOffset : undefined,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function handleGetFile(req: Request): Response {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const fileId = url.pathname.split('/').pop();

  return new Response(
    JSON.stringify(
      createResponse(true, {
        file_id: fileId,
        file_unique_id: 'unique_' + fileId,
        file_size: 1024,
        file_path: 'test/file.txt',
      })
    ),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleSendDocument(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  const body = req.json ? await req.json() : {};

  const user = getUser(token);
  const chat = getChat(token);

  const message: Message = {
    message_id: messageIdCounter++,
    from: user,
    chat,
    date: Math.floor(Date.now() / 1000),
    document: body.document,
  };

  messages.push(message);

  return new Response(JSON.stringify(createResponse(true, message)), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAnswerCallbackQuery(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  const body = req.json ? await req.json() : {};

  return new Response(JSON.stringify(createResponse(true, true)), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleGetMe(req: Request): Response {
  const botInfo = {
    id: 123456789,
    is_bot: true,
    first_name: 'Test Bot',
    username: 'test_bot',
  };

  return new Response(JSON.stringify(botInfo), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleGetChat(req: Request): Response {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  const chat = getChat(token);

  return new Response(
    JSON.stringify(
      createResponse(true, {
        id: chat.id,
        type: chat.type,
        title: 'Test Chat',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
      })
    ),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleWebhook(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.pathname.split('/').pop();

  const body = req.json ? await req.json() : {};

  const user = getUser(token);
  const chat = getChat(token);

  if (body.message) {
    const message: Message = {
      message_id: messageIdCounter++,
      from: user,
      chat,
      date: Math.floor(Date.now() / 1000),
      text: body.message.text,
      document: body.message.document,
    };

    messages.push(message);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', port: 8080 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'GET' && pathname === '/messages') {
    const userToken = url.searchParams.get('token') || '';
    const user = getUser(userToken);
    const userMessages = messages.filter((m) => m.chat && m.chat.id === user.id);
    return new Response(JSON.stringify({ ok: true, result: userMessages }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && pathname === '/messages') {
    const userToken = url.searchParams.get('token') || '';
    const body = req.json ? await req.json() : {};

    const user = getUser(userToken);
    const chat = getChat(userToken);

    const message: Message = {
      message_id: messageIdCounter++,
      from: user,
      chat,
      date: Math.floor(Date.now() / 1000),
      text: body.text,
      document: body.document,
    };

    messages.push(message);

    return new Response(JSON.stringify(createResponse(true, message)), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && pathname === '/callback') {
    return handleAnswerCallbackQuery(req);
  }

  if (req.method === 'GET') {
    if (pathname.startsWith('/getMe')) {
      return handleGetMe(req);
    }
    if (pathname.startsWith('/sendMessage')) {
      return handleSendMessage(req);
    }
    if (pathname.startsWith('/getUpdates')) {
      return handleGetUpdates(req);
    }
    if (pathname.startsWith('/getFile')) {
      return handleGetFile(req);
    }
    if (pathname.startsWith('/getChat')) {
      return handleGetChat(req);
    }
  }

  if (req.method === 'POST') {
    if (pathname.startsWith('/sendMessage')) {
      return await handleSendMessage(req);
    }
    if (pathname.startsWith('/sendDocument')) {
      return await handleSendDocument(req);
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function generateMockToken(): string {
  const config: BotConfig = {
    token: 'mock_token',
    allowedUserIds: [123456789],
  };

  const configStr = JSON.stringify(config);
  const base64 = btoa(configStr);

  return `123456:${base64}`;
}

console.log('Mock Telegram Server starting on port 8080...');
console.log('Mock token:', generateMockToken());
console.log('\nEndpoints:');
console.log('  GET  /health                    - Server health check');
console.log('  GET  /messages?token=XXX       - Get all messages');
console.log('  POST /messages?token=XXX       - Send message');
console.log('  POST /callback?token=XXX        - Handle callback queries');
console.log('  GET  /getMe?token=XXX          - Get bot info');
console.log('  GET  /sendMessage?token=XXX    - Send message');
console.log('  GET  /getUpdates?token=XXX    - Get updates');
console.log('  GET  /getFile?token=XXX         - Get file info');
console.log('  GET  /getChat?token=XXX         - Get chat info');
console.log('\nMock token:', generateMockToken());

serve({
  port: 8080,
  fetch: handler,
});
