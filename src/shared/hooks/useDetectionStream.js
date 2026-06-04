import { useState, useEffect, useRef, useCallback } from 'react';
import { WHEP_URL, DETECTIONS_WS_URL } from '../../services/api';

const DUMMY_STREAM = import.meta.env.VITE_DUMMY_STREAM === 'true';

/**
 * Custom hook that connects to the detections WebSocket and auto-manages WebRTC.
 * 
 * When the WS receives detection data, it starts WebRTC.
 * When the WS disconnects or stops sending, it stops WebRTC.
 * 
 * @returns {{ videoStream, isStreaming, isConnecting, streamError, detections }}
 */
export default function useDetectionStream() {
    const [videoStream, setVideoStream] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [streamError, setStreamError] = useState(null);
    const [detections, setDetections] = useState({
        mission_name: '',
        mission_id: '',
        mission_uuid: '',
        person_count: 0,
        vehicle_count: 0,
        timestamp: null,
    });

    const wsRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const webrtcStartedRef = useRef(false);
    const reconnectTimerRef = useRef(null);

    /**
     * Establish WebRTC WHEP connection to MediaMTX
     */
    const startWebRTC = useCallback(async () => {
        if (webrtcStartedRef.current) return;
        webrtcStartedRef.current = true;

        try {
            console.log('[DetectionStream] Starting WebRTC WHEP connection...');
            setIsConnecting(true);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerConnectionRef.current = pc;

            pc.addTransceiver('video', { direction: 'recvonly' });

            pc.ontrack = (event) => {
                console.log('[DetectionStream] Video track received');
                setVideoStream(event.streams[0]);
                setIsStreaming(true);
                setIsConnecting(false);
            };

            pc.onconnectionstatechange = () => {
                console.log('[DetectionStream] Connection state:', pc.connectionState);
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

            const response = await fetch(WHEP_URL, {
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
                    : `${new URL(WHEP_URL).origin}${whepLocation}`;

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        try {
                            await fetch(patchUrl, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/trickle-ice-sdpfrag' },
                                body: `a=${event.candidate.candidate}\r\n`,
                            });
                        } catch (err) {
                            console.debug('[DetectionStream] Trickle ICE failed:', err);
                        }
                    }
                };
            }

        } catch (error) {
            console.error('[DetectionStream] WebRTC setup failed:', error);
            setStreamError(error.message);
            setIsConnecting(false);
            webrtcStartedRef.current = false;
            stopWebRTC();
        }
    }, []);

    const stopWebRTC = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setVideoStream(null);
        setIsStreaming(false);
        setIsConnecting(false);
        webrtcStartedRef.current = false;
        console.log('[DetectionStream] WebRTC closed');
    }, []);

    /**
     * Connect to detections WebSocket
     */
    const connectWS = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState <= 1) return; // already open or connecting

        console.log('[DetectionStream] Connecting to detections WS:', DETECTIONS_WS_URL);
        const ws = new WebSocket(DETECTIONS_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[DetectionStream] WS connected');
            setStreamError(null);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.event === 'detections' && msg.data) {
                    const d = msg.data;
                    setDetections({
                        mission_name: d.mission_name || '',
                        mission_id: d.mission_id || '',
                        mission_uuid: d.mission_uuid || '',
                        person_count: d.person_count ?? 0,
                        vehicle_count: d.vehicle_count ?? 0,
                        timestamp: d.timestamp || null,
                    });

                    // Start WebRTC on first detection data
                    if (!webrtcStartedRef.current) {
                        console.log('[DetectionStream] Detection data received — starting WebRTC');
                        startWebRTC();
                    }
                }
            } catch (err) {
                console.error('[DetectionStream] WS parse error:', err);
            }
        };

        ws.onclose = (event) => {
            console.log('[DetectionStream] WS closed:', event.code, event.reason);
            // Auto-reconnect after 3 seconds
            reconnectTimerRef.current = setTimeout(() => {
                console.log('[DetectionStream] Reconnecting WS...');
                connectWS();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('[DetectionStream] WS error:', error);
        };
    }, [startWebRTC]);

    // Connect WS on mount (or skip entirely if dummy), cleanup on unmount
    useEffect(() => {
        if (DUMMY_STREAM) {
            console.log('[DetectionStream] DUMMY_STREAM is true. Skipping WS and WebRTC.');
        } else {
            connectWS();
        }

        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // prevent reconnect on intentional close
                wsRef.current.close();
                wsRef.current = null;
            }
            stopWebRTC();
        };
    }, [connectWS, stopWebRTC]);

    return { videoStream, isStreaming, isConnecting, streamError, detections };
}
