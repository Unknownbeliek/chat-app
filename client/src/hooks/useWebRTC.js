import { useState, useRef, useCallback } from 'react';
import { DeepFilterNet3Core } from 'deepfilternet3-noise-filter';

// Alias for standard named interface matching specs
const DeepFilterNet3Processor = DeepFilterNet3Core;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useWebRTC({ sendSignal }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = useState(false);
  const [iceState, setIceState] = useState('new');
  const [mediaError, setMediaError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const rawStreamRef = useRef(null);
  const noiseProcessorRef = useRef(null);
  const audioContextRef = useRef(null);
  const cleanStreamRef = useRef(null);

  // Core setup function for AI Noise Cancellation
  const setupNoiseCancellation = useCallback(async (rawAudioStream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 48000 });
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      const proc = new DeepFilterNet3Processor({ sampleRate: 48000, noiseReductionLevel: 50 });
      await proc.initialize();
      noiseProcessorRef.current = proc;

      const node = await proc.createAudioWorkletNode(ctx);
      const source = ctx.createMediaStreamSource(rawAudioStream);
      const destination = ctx.createMediaStreamDestination();

      source.connect(node);
      node.connect(destination);

      cleanStreamRef.current = destination.stream;
      return destination.stream;
    } catch (err) {
      console.error('Failed to setup AI noise cancellation:', err);
      // Fall back to raw stream if noise processing setup fails
      return rawAudioStream;
    }
  }, []);

  // Teardown noise processor
  const destroyNoiseCancellation = useCallback(() => {
    if (noiseProcessorRef.current) {
      try {
        noiseProcessorRef.current.destroy();
      } catch (err) {
        console.error('Error destroying noise processor:', err);
      }
      noiseProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (err) {
        console.error('Error closing audio context:', err);
      }
      audioContextRef.current = null;
    }
    cleanStreamRef.current = null;
  }, []);

  // Initialize or retrieve media devices
  const getMedia = useCallback(async (callType) => {
    // If stream already exists and has required live tracks, reuse it
    if (localStreamRef.current && localStreamRef.current.active) {
      const liveVideoTracks = localStreamRef.current.getVideoTracks().filter(t => t.readyState === 'live');
      if (callType === 'video' ? liveVideoTracks.length > 0 : true) {
        return localStreamRef.current;
      }
    }

    setMediaError(null);
    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      const rawStream = await navigator.mediaDevices.getUserMedia(constraints);
      rawStreamRef.current = rawStream;

      let streamToUse = rawStream;
      if (isNoiseCancellationEnabled) {
        const cleanStream = await setupNoiseCancellation(rawStream);
        // Combine video track from raw stream with clean audio track
        const tracks = [
          ...cleanStream.getAudioTracks(),
          ...rawStream.getVideoTracks()
        ];
        streamToUse = new MediaStream(tracks);
      }

      localStreamRef.current = streamToUse;
      setLocalStream(streamToUse);
      return streamToUse;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('permission_denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMediaError('device_not_found');
      } else {
        setMediaError('generic_error');
      }

      // Fallback to audio-only if video fails
      if (callType === 'video') {
        try {
          const rawAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          rawStreamRef.current = rawAudioStream;

          let audioStreamToUse = rawAudioStream;
          if (isNoiseCancellationEnabled) {
            audioStreamToUse = await setupNoiseCancellation(rawAudioStream);
          }

          localStreamRef.current = audioStreamToUse;
          setLocalStream(audioStreamToUse);
          setMediaError(null);
          return audioStreamToUse;
        } catch (audioErr) {
          console.error('Error accessing audio device:', audioErr);
        }
      }
      return null;
    }
  }, [isNoiseCancellationEnabled, setupNoiseCancellation]);

  // Dynamic toggle of Noise Cancellation during active call or before call
  const toggleNoiseCancellation = useCallback(async () => {
    const nextState = !isNoiseCancellationEnabled;
    setIsNoiseCancellationEnabled(nextState);

    // If an active PeerConnection exists, dynamically swap the audio track
    if (pcRef.current && rawStreamRef.current) {
      const audioSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (nextState) {
        // Enable noise cancellation
        const cleanStream = await setupNoiseCancellation(rawStreamRef.current);
        const cleanAudioTrack = cleanStream.getAudioTracks()[0];
        if (audioSender && cleanAudioTrack) {
          await audioSender.replaceTrack(cleanAudioTrack);
        }
      } else {
        // Disable noise cancellation and restore raw mic audio track
        destroyNoiseCancellation();
        const rawAudioTrack = rawStreamRef.current.getAudioTracks()[0];
        if (audioSender && rawAudioTrack) {
          await audioSender.replaceTrack(rawAudioTrack);
        }
      }
    } else if (!nextState) {
      destroyNoiseCancellation();
    }
  }, [isNoiseCancellationEnabled, setupNoiseCancellation, destroyNoiseCancellation]);

  // Initialize RTCPeerConnection
  const initPeerConnection = useCallback((targetUser, roomId, stream) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks to PeerConnection
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice_candidate',
          to: targetUser,
          roomId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track handler — clone stream tracks to force React state update on new track addition
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(new MediaStream(event.streams[0].getTracks()));
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      setIceState(pc.iceConnectionState);
    };

    return pc;
  }, [sendSignal]);

  // Initiate call as Caller (Create Offer)
  const createOffer = useCallback(async (targetUser, roomId, stream, callType) => {
    const pc = initPeerConnection(targetUser, roomId, stream);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'sdp_offer',
        to: targetUser,
        roomId,
        callType,
        sdp: offer
      });
    } catch (err) {
      console.error('Error creating SDP offer:', err);
    }
  }, [initPeerConnection, sendSignal]);

  // Handle incoming Offer as Callee (Create Answer)
  const handleOffer = useCallback(async (fromUser, roomId, offerSdp, stream, callType) => {
    const pc = initPeerConnection(fromUser, roomId, stream);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'sdp_answer',
        to: fromUser,
        roomId,
        callType,
        sdp: answer
      });
    } catch (err) {
      console.error('Error handling SDP offer & creating answer:', err);
    }
  }, [initPeerConnection, sendSignal]);

  // Handle incoming Answer as Caller
  const handleAnswer = useCallback(async (answerSdp) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answerSdp));
    } catch (err) {
      console.error('Error setting remote answer SDP:', err);
    }
  }, []);

  // Handle incoming ICE Candidate
  const handleCandidate = useCallback(async (candidate) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  // Toggle Mute Audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Mute Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, []);

  // Cleanup and End Call
  const cleanupCall = useCallback(() => {
    destroyNoiseCancellation();

    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => track.stop());
      rawStreamRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIceState('new');
    setMediaError(null);
  }, [destroyNoiseCancellation]);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isNoiseCancellationEnabled,
    iceState,
    mediaError,
    noiseProcessorRef,
    setupNoiseCancellation,
    toggleNoiseCancellation,
    getMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleCandidate,
    toggleAudio,
    toggleVideo,
    cleanupCall
  };
}
