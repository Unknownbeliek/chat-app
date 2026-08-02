import React, { useState, useCallback } from 'react';

/**
 * AmbientAuroraBackground
 * 
 * An interactive, lightweight iOS-style frosted glass background component with 
 * a direct 1:1 spotlight glow underneath the user's cursor or touch point, combined 
 * with ambient backdrop aurora blobs and a frosted glass overlay.
 * 
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Content rendered above the frosted glass layer
 * @param {string} [props.className=''] - Additional custom Tailwind/CSS classes for the outer container
 */
export const AmbientAuroraBackground = ({ children, className = '' }) => {
  // 1. Unified Pointer Tracking State (Absolute client coordinates)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  
  // Active interaction state (true on hover/touch, false when idle)
  const [isInteracting, setIsInteracting] = useState(false);

  // Normalized offset for background ambient parallax (-0.5 to 0.5 ratio)
  const [normalizedOffset, setNormalizedOffset] = useState({ x: 0, y: 0 });

  // 2. Unified Pointer Event Handlers (Works seamlessly for mouse & touch)
  const handlePointerDown = useCallback((e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    setIsInteracting(true);
    setPointerPos({ x: clientX, y: clientY });
    setNormalizedOffset({
      x: (clientX - innerWidth / 2) / innerWidth,
      y: (clientY - innerHeight / 2) / innerHeight,
    });
  }, []);

  const handlePointerMove = useCallback((e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    setIsInteracting(true);
    setPointerPos({ x: clientX, y: clientY });
    setNormalizedOffset({
      x: (clientX - innerWidth / 2) / innerWidth,
      y: (clientY - innerHeight / 2) / innerHeight,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsInteracting(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsInteracting(false);
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`w-full h-screen relative overflow-hidden bg-slate-950 select-none ${className}`}
    >
      {/* ========================================================================= */}
      {/* LAYER 1: Ambient Blobs & 1:1 Interactive Cursor Spotlight                 */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        
        {/* 1:1 Direct Interactive Spotlight Glow (Sits exactly under cursor/finger) */}
        <div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-cyan-400/80 blur-3xl pointer-events-none transition-all duration-300 ease-out ${
            isInteracting
              ? 'opacity-100 scale-125'
              : 'opacity-0 scale-75'
          }`}
          style={{
            transform: `translate3d(${pointerPos.x}px, ${pointerPos.y}px, 0) translate(-50%, -50%)`,
          }}
        />

        {/* Ambient Aurora Blob 1: Purple Deep Fill */}
        <div
          className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] min-w-[350px] min-h-[350px] rounded-full bg-purple-600/70 mix-blend-screen transition-transform duration-700 ease-out blur-sm"
          style={{
            transform: `translate3d(${normalizedOffset.x * 120}px, ${normalizedOffset.y * 120}px, 0)`,
          }}
        />

        {/* Ambient Aurora Blob 2: Cyan Secondary Parallax */}
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[60vw] h-[60vw] min-w-[400px] min-h-[400px] rounded-full bg-cyan-500/60 mix-blend-screen transition-transform duration-1000 ease-out blur-sm"
          style={{
            transform: `translate3d(${normalizedOffset.x * -90}px, ${normalizedOffset.y * -90}px, 0)`,
          }}
        />

        {/* Ambient Aurora Blob 3: Pink Accent */}
        <div
          className="absolute top-[25%] left-[25%] w-[45vw] h-[45vw] min-w-[300px] min-h-[300px] rounded-full bg-pink-600/65 mix-blend-screen transition-transform duration-500 ease-out blur-sm"
          style={{
            transform: `translate3d(${normalizedOffset.x * 70}px, ${normalizedOffset.y * 140}px, 0)`,
          }}
        />

        {/* Ambient Aurora Blob 4: Indigo Anchor */}
        <div
          className="absolute bottom-[20%] left-[10%] w-[50vw] h-[50vw] min-w-[320px] min-h-[320px] rounded-full bg-indigo-600/50 mix-blend-screen transition-transform duration-1000 ease-out blur-sm"
          style={{
            transform: `translate3d(${normalizedOffset.x * -50}px, ${normalizedOffset.y * 80}px, 0)`,
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: Frosted Glass Overlay (iOS Glassmorphic Effect)                  */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full bg-slate-950/40 backdrop-blur-[100px] pointer-events-none z-10" />

      {/* ========================================================================= */}
      {/* LAYER 3: Interactive Children Container                                  */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default AmbientAuroraBackground;
