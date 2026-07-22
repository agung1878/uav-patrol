import { useState, useEffect, useRef, useCallback } from 'react';
import { WHEP_DOCK_URL, ENABLE_DOCK_STREAM } from '../../services/api';

/**
 * Custom hook that connects to the Dock WebRTC WHEP stream.
 */
export default function useDockStream() {
    const [videoStream, setVideoStream] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [streamError, setStreamError] = useState(null);

    const peerConnectionRef = useRef(null);
    const webrtcStartedRef = useRef(false);

    const stopWebRTC = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setVideoStream(null);
        setIsStreaming(false);
        setIsConnecting(false);
        webrtcStartedRef.current = false;
        console.log('[DockStream] WebRTC closed');
    }, []);

    const startWebRTC = useCallback(async () => {
        if (webrtcStartedRef.current) return;
        webrtcStartedRef.current = true;

        if (!WHEP_DOCK_URL) {
            setStreamError('WHEP_DOCK_URL is not configured');
            return;
        }

        try {
            console.log('[DockStream] Starting WebRTC WHEP connection to:', WHEP_DOCK_URL);
            setIsConnecting(true);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerConnectionRef.current = pc;

            pc.addTransceiver('video', { direction: 'recvonly' });

            pc.ontrack = (event) => {
                console.log('[DockStream] Video track received');
                setVideoStream(event.streams[0]);
                setIsStreaming(true);
                setIsConnecting(false);
            };

            pc.onconnectionstatechange = () => {
                console.log('[DockStream] Connection state:', pc.connectionState);
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    setStreamError('WebRTC connection lost');
                    setIsStreaming(false);
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (pc.iceGatheringState !== 'complete') {
                await new Promise((resolve) => {
                    const checkState = () => {
                        if (pc.iceGatheringState === 'complete') {
                            pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    };
                    pc.addEventListener('icegatheringstatechange', checkState);
                    setTimeout(resolve, 5000);
                });
            }

            const response = await fetch(WHEP_DOCK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: pc.localDescription.sdp,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`WHEP failed (${response.status}): ${errText}`);
            }

            const answerSdp = await response.text();
            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
            );

            const whepLocation = response.headers.get('Location');
            if (whepLocation) {
                const patchUrl = whepLocation.startsWith('http')
                    ? whepLocation
                    : `${new URL(WHEP_DOCK_URL).origin}${whepLocation}`;

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        try {
                            await fetch(patchUrl, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/trickle-ice-sdpfrag' },
                                body: `a=${event.candidate.candidate}\r\n`,
                            });
                        } catch (err) {
                            console.debug('[DockStream] Trickle ICE failed:', err);
                        }
                    }
                };
            }

        } catch (error) {
            console.error('[DockStream] WebRTC setup failed:', error);
            setStreamError(error.message);
            setIsConnecting(false);
            webrtcStartedRef.current = false;
            stopWebRTC();
        }
    }, [stopWebRTC]);

    useEffect(() => {
        if (ENABLE_DOCK_STREAM) {
            startWebRTC();
        } else {
            console.log('[DockStream] ENABLE_DOCK_STREAM is false, skipping dock stream setup.');
        }

        return () => {
            stopWebRTC();
        };
    }, [startWebRTC, stopWebRTC]);

    return { videoStream, isStreaming, isConnecting, streamError };
}
