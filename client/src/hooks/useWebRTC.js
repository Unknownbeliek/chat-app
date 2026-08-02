import { useState, useRef, useCallback } from 'react';

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

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize or retrieve media devices
  const getMedia = useCallback(async (callType) => {
    // If stream already exists and has required live tracks, reuse it
    if (localStreamRef.current && localStreamRef.current.active) {
      const liveVideoTracks = localStreamRef.current.getVideoTracks().filter(t => t.readyState === 'live');
      if (callType === 'video' ? liveVideoTracks.length > 0 : true) {
        return localStreamRef.current;
      }
    }

    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      // Fallback to audio-only if video fails
      if (callType === 'video') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          return audioStream;
        } catch (audioErr) {
          console.error('Error accessing audio device:', audioErr);
        }
      }
      return null;
    }
  }, []);

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
  }, []);

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
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
