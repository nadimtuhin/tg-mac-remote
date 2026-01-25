# Mock Telegram Server for E2E Testing

A lightweight mock Telegram Bot API server for end-to-end testing of tg-mac-remote.

## Features

- Simulates Telegram Bot API endpoints
- Configurable bot token and allowed users
- Message storage and retrieval
- Webhook and polling support
- File upload/download simulation

## Installation

```bash
cd apps/bot/tests/mock-telegram
bun run server
```

Server will start on `http://localhost:8080`

## Configuration

The mock token contains encoded configuration:

```javascript
const config = {
  token: 'mock_token',
  allowedUserIds: [123456789],
};

const token = `123456:${btoa(JSON.stringify(config))}`;
```

## API Endpoints

### Health & Info

- `GET /health` - Server health check
- `GET /getMe?token=XXX` - Get bot information
- `GET /getChat?token=XXX` - Get chat information

### Messages

- `GET /messages?token=XXX` - Retrieve all messages for a user
- `GET /getUpdates?token=XXX&offset=0` - Poll for updates (like Telegram)
- `GET /sendMessage?token=XXX` - Send a text message
- `GET /sendDocument?token=XXX` - Send a document

### Files

- `GET /getFile?token=XXX&file_id=123` - Get file information

### Callbacks

- `POST /callback?token=XXX` - Handle inline keyboard callback queries

## Usage in Tests

```typescript
import { startMockServer, stopMockServer } from './server';

// Start server
await startMockServer();

// Get mock token
const mockToken = getMockToken();

// Configure bot to use mock server
process.env.TELEGRAM_BOT_TOKEN = mockToken;
process.env.TELEGRAM_API_URL = 'http://localhost:8080';

// Run tests...

// Stop server
await stopMockServer();
```

## Example Test

```typescript
import { describe, it, expect } from 'bun:test';
import { startMockServer, getMockToken } from '../mock-telegram/server';

describe('E2E - Files Plugin', () => {
  let server: any;

  beforeEach(async () => {
    server = await startMockServer();
    process.env.TELEGRAM_BOT_TOKEN = getMockToken();
    process.env.TELEGRAM_API_URL = 'http://localhost:8080';
  });

  afterEach(async () => {
    await stopMockServer(server);
  });

  it('should list directory', async () => {
    // Send message to mock server
    const response = await fetch('http://localhost:8080/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: getMockToken(),
        message: {
          text: '/ls',
          chat_id: 123456789,
        },
      }),
    });

    expect(response.ok).toBe(true);
  });
});
```

## Response Format

All responses follow Telegram Bot API format:

```json
{
  "ok": true,
  "result": {
    /* actual data */
  },
  "description": "Error description if not ok"
}
```
