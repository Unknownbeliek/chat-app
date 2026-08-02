import { activeUsers } from '../services/activeUsers.service.js';

export function handleCall(ws, data, currentUsername) {
  const { type, to, from, sdp, candidate, callType, roomId, reason } = data;
  if (!to) return;

  const targetKey = to.toLowerCase();
  const recipientUser = activeUsers.get(targetKey);

  if (recipientUser && recipientUser.ws.readyState === 1) {
    recipientUser.ws.send(JSON.stringify({
      type,
      from: currentUsername || from,
      to,
      callType,
      roomId,
      sdp,
      candidate,
      reason
    }));
  } else {
    // Target user is offline, notify caller if it's an invitation
    if (type === 'call_invite' && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'call_rejected',
        from: to,
        to: currentUsername,
        reason: 'User is offline'
      }));
    }
  }
}
