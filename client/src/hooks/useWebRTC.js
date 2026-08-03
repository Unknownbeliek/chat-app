import { useState, useRef, useCallback } from 'react';
import { DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';

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
  const noiseFilterProcessorRef = useRef(null);

  // Setup noise filter processor on a raw audio stream track
  const setupNoiseCancellation = useCallback(async (rawAudioStream, initialEnabled = false) => {
    try {
      const audioTrack = rawAudioStream.getAudioTracks()[0];
      if (!audioTrack) return rawAudioStream;

      const getCdnUrl = () => {
        if (typeof window !== 'undefined') {
          return `${window.location.origin}/models`;
        }
        return '/models';
      };

      const processor = new DeepFilterNoiseFilterProcessor({
        noiseReductionLevel: 90,
        enabled: initialEnabled,
        assetConfig: {
          cdnUrl: getCdnUrl()
        }
      });

      await processor.init({ mediaStreamTrack: audioTrack });
      noiseFilterProcessorRef.current = processor;

      const cleanAudioTrack = processor.processedTrack;
      if (!cleanAudioTrack) return rawAudioStream;

      // Create stream with processed audio track + raw video tracks
      const tracks = [cleanAudioTrack, ...rawAudioStream.getVideoTracks()];
      return new MediaStream(tracks);
    } catch (err) {
      console.error('Failed to setup AI noise cancellation:', err);
      return rawAudioStream;
    }
  }, []);

  // Teardown noise processor
  const destroyNoiseCancellation = useCallback(async () => {
    if (noiseFilterProcessorRef.current) {
      try {
        await noiseFilterProcessorRef.current.destroy();
      } catch (err) {
        console.error('Error destroying noise processor:', err);
      }
      noiseFilterProcessorRef.current = null;
    }
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
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable native browser noise suppression so DeepFilterNet3 handles raw audio
          autoGainControl: true
        },
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      const rawStream = await navigator.mediaDevices.getUserMedia(constraints);
      rawStreamRef.current = rawStream;

      // Always route audio through DeepFilterNet3 processor (defaults to enabled or disabled based on state)
      const processedStream = await setupNoiseCancellation(rawStream, isNoiseCancellationEnabled);

      localStreamRef.current = processedStream;
      setLocalStream(processedStream);
      return processedStream;
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

          const processedAudioStream = await setupNoiseCancellation(rawAudioStream, isNoiseCancellationEnabled);
          localStreamRef.current = processedAudioStream;
          setLocalStream(processedAudioStream);
          setMediaError(null);
          return processedAudioStream;
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

    if (noiseFilterProcessorRef.current) {
      try {
        await noiseFilterProcessorRef.current.setEnabled(nextState);
        console.log(`DeepFilterNet3 Noise Cancellation set to: ${nextState ? 'ENABLED (90dB)' : 'BYPASS'}`);
      } catch (err) {
        console.error('Error toggling noise cancellation bypass state:', err);
      }
    }
  }, [isNoiseCancellationEnabled]);

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
    noiseFilterProcessorRef,
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
