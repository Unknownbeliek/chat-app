import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export default function CallScreen({
  callState,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onEndCall
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  const { partnerName, callType, status } = callState;

  // Track call duration timer
  useEffect(() => {
    if (status !== 'connected') return;
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => console.error('Local video play error:', err));
    }
  }, [localStream, callType, isVideoMuted]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => console.error('Remote video play error:', err));
    }
  }, [remoteStream, callType]);

  if (status !== 'connected') return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header Pill with Timer */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 glass-card px-5 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-xl z-20 backdrop-blur-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-white">{partnerName}</span>
        <span className="text-xs text-zinc-400 font-mono">| {formatTime(seconds)}</span>
      </div>
      {/* Background Remote Video or Audio Avatar */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
        {remoteStream && callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl animate-pulse">
              {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
            </div>
            <h2 className="text-2xl font-bold text-white">{partnerName}</h2>
            <p className="text-sm text-indigo-400 font-medium">
              {callType === 'video' ? 'Video Stream Connecting...' : 'Voice Call Connected'}
            </p>
          </div>
        )}

        {/* Local Stream Picture-in-Picture Thumbnail */}
        {localStream && callType === 'video' && (
          <div className="absolute bottom-24 right-6 w-40 h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-zinc-900 z-10">
            {!isVideoMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400 text-xs font-semibold">
                Camera Off
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glass-card px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/10 z-20 backdrop-blur-xl">
        {/* Toggle Mic */}
        <button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isAudioMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Camera (Only for video calls) */}
        {callType === 'video' && (
          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all hover:scale-105 active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6 transform rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
