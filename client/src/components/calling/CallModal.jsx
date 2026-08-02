import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, AlertCircle } from 'lucide-react';

export default function CallModal({ callState, onAccept, onReject, mediaError }) {
  if (!callState || callState.status === 'idle') return null;

  const { isCaller, partnerName, callType, status } = callState;

  // Auto-decline/cancel call if unanswered for 30 seconds
  useEffect(() => {
    if (status !== 'ringing') return;
    const timeout = setTimeout(() => {
      onReject();
    }, 30000);
    return () => clearTimeout(timeout);
  }, [status, onReject]);

  if (status !== 'ringing') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

        {/* Media Access Permission Error Alert */}
        {mediaError && (
          <div className="mb-4 w-full bg-rose-500/20 border border-rose-500/40 p-3 rounded-2xl flex items-center gap-2.5 text-left text-xs text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-bold">Media Access Required</p>
              <p className="text-[11px] text-rose-300">
                {mediaError === 'permission_denied'
                  ? 'Camera/microphone access was denied in browser settings.'
                  : 'No camera or microphone device found on system.'}
              </p>
            </div>
          </div>
        )}

        {/* Pulsing Avatar Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl animate-pulse">
            {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-ping" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{partnerName}</h3>
        <p className="text-sm text-indigo-300 mb-6 flex items-center gap-1.5 justify-center font-medium">
          {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          {isCaller ? 'Calling... (Auto-cancels in 30s)' : `Incoming ${callType} call`}
        </p>

        {/* Control Buttons */}
        <div className="flex items-center gap-6 mt-2">
          {/* Reject / Hang up */}
          <button
            onClick={onReject}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-110 active:scale-95"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6 transform rotate-[135deg]" />
          </button>

          {/* Accept (only shown to Callee) */}
          {!isCaller && (
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 animate-bounce"
              title="Accept Call"
            >
              <Phone className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
