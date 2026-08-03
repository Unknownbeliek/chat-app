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
  const [isSwapped, setIsSwapped] = useState(false);

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

  // Attach streams to video elements dynamically based on swapped state
  const mainStream = isSwapped ? localStream : remoteStream;
  const miniStream = isSwapped ? remoteStream : localStream;
  const isMainMuted = isSwapped ? isVideoMuted : false;
  const isMiniMuted = isSwapped ? false : isVideoMuted;

  useEffect(() => {
    if (remoteVideoRef.current && mainStream) {
      remoteVideoRef.current.srcObject = mainStream;
      remoteVideoRef.current.play().catch(err => console.error('Main video play error:', err));
    }
    if (ambientVideoRef.current && mainStream) {
      ambientVideoRef.current.srcObject = mainStream;
      ambientVideoRef.current.play().catch(err => console.error('Ambient video play error:', err));
    }
  }, [mainStream, callType, isSwapped]);

  useEffect(() => {
    if (localVideoRef.current && miniStream) {
      localVideoRef.current.srcObject = miniStream;
      localVideoRef.current.play().catch(err => console.error('Mini video play error:', err));
    }
  }, [miniStream, callType, isSwapped, isVideoMuted]);

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
                className="w-full h-full object-cover"
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
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg z-20">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-200">{partnerName}</span>
        <span className="text-xs text-slate-400 font-mono font-semibold">| {formatTime(seconds)}</span>
        <button
          onClick={() => setIsMinimized(true)}
          className="ml-1 p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Minimize Call"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Connection State Reconnecting Overlay Toast */}
      {isReconnecting && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md z-30 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Reconnecting Video Stream...</span>
        </div>
      )}

      {/* 3. Main Canvas: Ambient Dual-Video Blur Background & Primary Foreground Video */}
      <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {mainStream && callType === 'video' && !isMainMuted ? (
          <>
            {/* Ambient Background Video */}
            <video
              ref={ambientVideoRef}
              autoPlay
              playsInline
              muted={true}
              className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none ${
                isSwapped ? 'transform -scale-x-100' : ''
              }`}
            />
            {/* Primary Foreground Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`relative z-10 max-h-full max-w-full object-contain rounded-xl shadow-2xl ${
                isSwapped ? 'transform -scale-x-100' : ''
              }`}
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
        {miniStream && callType === 'video' && (
          <div
            onClick={() => setIsSwapped(!isSwapped)}
            className="absolute bottom-24 right-6 w-36 h-52 sm:w-44 sm:h-60 rounded-xl overflow-hidden border border-slate-600/80 shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-105 hover:border-indigo-400 bg-slate-950 z-10 cursor-pointer group"
            title="Click to swap video streams"
          >
            {!isMiniMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted={!isSwapped}
                className={`w-full h-full object-cover ${!isSwapped ? 'transform -scale-x-100' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-semibold">
                Camera Off
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
              <RefreshCw className="w-4 h-4" />
              <span>Swap</span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Floating Glass Control Dock */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 z-20">
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

        {/* Swap Streams Button */}
        {callType === 'video' && (
          <button
            onClick={() => setIsSwapped(!isSwapped)}
            className="w-11 h-11 rounded-full bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-center transition-all"
            title="Swap Video Streams"
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
