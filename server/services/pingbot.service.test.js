import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handlePingBotQuery } from './pingbot.service.js';
import * as broadcastService from './broadcast.service.js';

vi.mock('./broadcast.service.js', () => ({
  broadcast: vi.fn(),
}));

describe('pingbot.service.js', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('broadcasts PingBot answer to global chat when isGlobal is true', async () => {
    handlePingBotQuery('hello', 'global', 'alice', true, null);

    // Fast forward past the 400ms delay in handlePingBotQuery
    vi.advanceTimersByTime(450);

    expect(broadcastService.broadcast).toHaveBeenCalled();
    const messageObj = broadcastService.broadcast.mock.calls[0][0];
    expect(messageObj.type).toBe('global_chat');
    expect(messageObj.sender).toBe('PingBot');
    expect(messageObj.message).toMatch(/Hello @alice!/);
  });

  it('sends private response to requestor socket when isGlobal is false', async () => {
    const mockWs = { readyState: 1, send: vi.fn() };
    const activeUsersMap = new Map();
    activeUsersMap.set('alice', { ws: mockWs });

    handlePingBotQuery('what is websocket?', 'alice', 'alice', false, activeUsersMap);

    vi.advanceTimersByTime(450);

    expect(mockWs.send).toHaveBeenCalled();
    const sentObj = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(sentObj.type).toBe('private_chat');
    expect(sentObj.recipient).toBe('alice');
    expect(sentObj.message).toMatch(/WebSockets/);
  });

  it('responds with code snippet for help/code queries', async () => {
    const mockWs = { readyState: 1, send: vi.fn() };
    const activeUsersMap = new Map([['alice', { ws: mockWs }]]);

    handlePingBotQuery('help me with code', 'alice', 'alice', false, activeUsersMap);

    vi.advanceTimersByTime(450);

    expect(mockWs.send).toHaveBeenCalled();
    const sentObj = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(sentObj.message).toMatch(/```javascript/);
  });
});
