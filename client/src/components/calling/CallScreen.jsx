import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, RefreshCw, AlertTriangle } from 'lucide-react';
import { MicIcon, VideoIcon, EndCallIcon } from '../animated-icons';

export default function CallScreen({
  callState,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  iceState,
  onToggleAudio,
  onToggleVideo,
  onEndCall
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const ambientVideoRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [rotation, setRotation] = useState(0);

  const { partnerName, callType, status } = callState;

  // Toggle rotation through 0 -> 90 -> 180 -> 270 -> 0
  const toggleRotation = () => {
    setRotation(prev => (prev + 90) % 360);
  };

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

  // Attach remote stream to remote & ambient video elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => console.error('Remote video play error:', err));
    }
    if (ambientVideoRef.current && remoteStream) {
      ambientVideoRef.current.srcObject = remoteStream;
      ambientVideoRef.current.play().catch(err => console.error('Ambient video play error:', err));
    }
  }, [remoteStream, callType]);

  // Attach local stream to local PIP video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => console.error('Local video play error:', err));
    }
  }, [localStream, callType, isVideoMuted]);

  if (status !== 'connected') return null;

  const isReconnecting = iceState === 'disconnected' || iceState === 'reconnecting';

  // ---------------------------------------------------------------------------
  // MINIMIZED FLOATING CARD UI
  // ---------------------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-72 sm:w-80 bg-slate-900/90 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl border border-slate-700/60 flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h4 className="font-bold text-xs text-slate-200 truncate max-w-[120px]">{partnerName}</h4>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">{formatTime(seconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
              title="Expand Call"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onEndCall}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Small Video Preview */}
        {callType === 'video' && (
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ transform: `rotate(${rotation}deg)` }}
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out"
              />
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium">
                Audio Call Connected
              </div>
            )}

            {isReconnecting && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-[11px] text-amber-300 font-semibold gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Reconnecting...</span>
              </div>
            )}
          </div>
        )}

        {/* Mini Quick Controls */}
        <div className="flex items-center justify-around pt-1 border-t border-slate-800">
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-xl transition-all border ${
              isAudioMuted ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700/80'
            }`}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`p-2 rounded-xl transition-all border ${
                isVideoMuted ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700/80'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULLSCREEN CALL SCREEN UI
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* 2. Sleek Call Info Pill Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/70 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-white shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-slate-200">{partnerName}</span>
        <span className="text-slate-400 font-mono font-semibold">| {formatTime(seconds)}</span>
        <button
          onClick={() => setIsMinimized(true)}
          className="ml-1 p-1 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          title="Minimize Call"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Connection State Reconnecting Overlay Toast */}
      {isReconnecting && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md z-30 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Reconnecting Video Stream...</span>
        </div>
      )}

      {/* 3. Main Canvas: Ambient Dual-Video Blur Background & Primary Foreground Video */}
      <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {remoteStream && callType === 'video' ? (
          <>
            {/* Ambient Background Video */}
            <video
              ref={ambientVideoRef}
              autoPlay
              playsInline
              muted={true}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="transition-transform duration-300 ease-in-out absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none"
            />
            {/* Primary Foreground Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ transform: `rotate(${rotation}deg)` }}
              className="transition-transform duration-300 ease-in-out relative z-10 max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 z-10">
            {/* Glowing Ripples Audio Visualizer */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full bg-indigo-500/15 animate-ping duration-1000" />
              <div className="absolute w-36 h-36 rounded-full bg-purple-500/20 animate-pulse duration-700" />
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-[0_0_50px_rgba(99,102,241,0.4)] z-10">
                {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-slate-100 tracking-wide">{partnerName}</h2>
              <p className="text-sm text-slate-400 font-medium">
                {callType === 'video' ? 'Camera Paused' : 'Voice Call Connected'}
              </p>
            </div>
          </div>
        )}

        {/* 4. Self-View Picture-in-Picture (PiP) Thumbnail */}
        {localStream && callType === 'video' && (
          <div className="absolute bottom-6 right-6 w-36 h-52 md:w-44 md:h-60 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl z-30 bg-slate-900">
            {!isVideoMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-semibold">
                Camera Off
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Floating Glass Control Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-3 rounded-full shadow-2xl flex items-center gap-3">
        {/* Toggle Mic */}
        <button
          onClick={onToggleAudio}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isAudioMuted
              ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
              : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/50'
          }`}
          title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          <MicIcon isMuted={isAudioMuted} className="w-5 h-5" />
        </button>

        {/* Toggle Camera (Only for video calls) */}
        {callType === 'video' && (
          <button
            onClick={onToggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isVideoMuted
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/50'
            }`}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            <VideoIcon isMuted={isVideoMuted} className="w-5 h-5" />
          </button>
        )}

        {/* Rotate / Refresh Video Button */}
        {callType === 'video' && (
          <button
            onClick={toggleRotation}
            className="w-11 h-11 rounded-full bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center transition-all"
            title="Rotate Video"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all hover:scale-105 active:scale-95"
          title="End Call"
        >
          <EndCallIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

