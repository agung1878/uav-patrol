import { useState, useEffect, useRef, useCallback } from 'react';
import { streamService, missionService, WHEP_URL } from '../../services/api';

const DUMMY_STREAM = import.meta.env.VITE_DUMMY_STREAM === 'true';

/**
 * Custom hook that watches drone vehicle_state telemetry and auto-manages:
 * 1. Stream API start/stop calls
 * 2. WebRTC WHEP connection for live video
 *
 * @param {number|string} droneId - ID of the selected drone
 * @param {object} telemetry - Telemetry data for the selected drone (telemetry[uav_id])
 * @returns {{ videoStream, isStreaming, isConnecting, streamError }}
 */
export default function useStreamManager(droneId, telemetry) {
    const [videoStream, setVideoStream] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [streamError, setStreamError] = useState(null);

    // Refs to track state transitions and prevent duplicate calls
    const prevStateRef = useRef({ connected: false, inMission: false });
    const peerConnectionRef = useRef(null);
    const isStartingRef = useRef(false);
    const isStoppingRef = useRef(false);
    const streamStartedRef = useRef(false);

    /**
     * Establish WebRTC WHEP connection to MediaMTX
     */
    const startWebRTC = useCallback(async () => {
        try {
            console.log('[StreamManager] Starting WebRTC WHEP connection...');

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerConnectionRef.current = pc;

            // 1. Add video transceiver (receive only)
            pc.addTransceiver('video', { direction: 'recvonly' });

            // 2. Capture incoming video track
            pc.ontrack = (event) => {
                console.log('[StreamManager] Video track received from MediaMTX');
                setVideoStream(event.streams[0]);
                setIsStreaming(true);
                setIsConnecting(false);
            };

            pc.onconnectionstatechange = () => {
                console.log('[StreamManager] Connection state:', pc.connectionState);
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    setStreamError('WebRTC connection lost');
                    setIsStreaming(false);
                }
            };

            // 3. Create SDP offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // 4. Wait for ICE gathering to complete
            if (pc.iceGatheringState !== 'complete') {
                await new Promise((resolve) => {
                    const checkState = () => {
                        if (pc.iceGatheringState === 'complete') {
                            pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    };
                    pc.addEventListener('icegatheringstatechange', checkState);
                    // Timeout fallback — 5 seconds
                    setTimeout(resolve, 5000);
                });
            }

            console.log('[StreamManager] ICE gathering complete. Sending SDP offer to WHEP...');

            // 5. POST SDP offer to MediaMTX WHEP endpoint
            const response = await fetch(WHEP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: pc.localDescription.sdp,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`WHEP connection failed (${response.status}): ${errText}`);
            }

            // 6. Set SDP answer as remote description
            const answerSdp = await response.text();
            console.log('[StreamManager] SDP answer received from MediaMTX');

            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
            );

            // 7. Handle trickle ICE candidates
            const whepResourceLocation = response.headers.get('Location');
            if (whepResourceLocation) {
                const patchUrl = whepResourceLocation.startsWith('http')
                    ? whepResourceLocation
                    : `${new URL(WHEP_URL).origin}${whepResourceLocation}`;

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        try {
                            await fetch(patchUrl, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/trickle-ice-sdpfrag' },
                                body: `a=${event.candidate.candidate}\r\n`,
                            });
                        } catch (err) {
                            console.debug('[StreamManager] Trickle ICE send failed:', err);
                        }
                    }
                };
            }

        } catch (error) {
            console.error('[StreamManager] WebRTC setup failed:', error);
            setStreamError(error.message);
            setIsConnecting(false);
            stopWebRTC();
        }
    }, []);

    /**
     * Close WebRTC connection
     */
    const stopWebRTC = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setVideoStream(null);
        setIsStreaming(false);
        setIsConnecting(false);
        console.log('[StreamManager] WebRTC connection closed');
    }, []);

    /**
     * Start stream: call API then connect WebRTC
     */
    const startStream = useCallback(async () => {
        if (isStartingRef.current || streamStartedRef.current) return;
        isStartingRef.current = true;
        setStreamError(null);
        setIsConnecting(true);

        try {
            if (!DUMMY_STREAM) {
                let missionName = 'Unknown Mission';
                let scheduleId = `ql-${Date.now()}`;
                let scheduleTime = new Date().toISOString();

                if (droneId) {
                    try {
                        const data = await missionService.getMissions(1, 10, droneId);
                        const active = data?.items?.find(m => m.status === 'In Progress');
                        if (active) {
                            missionName = active.mission_name || missionName;
                            scheduleId = String(active.id);
                            scheduleTime = active.schedule || scheduleTime;
                            console.log('[StreamManager] Found active mission for stream:', missionName);
                        } else {
                            console.log('[StreamManager] No active mission found, using fallbacks');
                        }
                    } catch (fetchErr) {
                        console.error('[StreamManager] Failed to fetch active mission:', fetchErr);
                    }
                }

                console.log('[StreamManager] Starting stream:', { missionName, scheduleId, scheduleTime });
                const result = await streamService.start(missionName, scheduleId, scheduleTime);
                console.log('[StreamManager] Stream API start response:', result);
            } else {
                console.log('[StreamManager] DUMMY_STREAM mode — skipping /api/start');
            }

            streamStartedRef.current = true;

            // Now connect WebRTC to receive video
            await startWebRTC();

        } catch (error) {
            console.error('[StreamManager] Failed to start stream:', error);
            setStreamError(error.message);
            setIsConnecting(false);
        } finally {
            isStartingRef.current = false;
        }
    }, [startWebRTC]);

    /**
     * Stop stream: call API and close WebRTC
     */
    const stopStream = useCallback(async () => {
        if (isStoppingRef.current || !streamStartedRef.current) return;
        isStoppingRef.current = true;

        try {
            if (!DUMMY_STREAM) {
                console.log('[StreamManager] Stopping stream...');
                const result = await streamService.stop();
                console.log('[StreamManager] Stream API stop response:', result);
            } else {
                console.log('[StreamManager] DUMMY_STREAM mode — skipping /api/stop');
            }
        } catch (error) {
            console.error('[StreamManager] Failed to stop stream:', error);
            // Still close WebRTC even if API call fails
        } finally {
            stopWebRTC();
            streamStartedRef.current = false;
            isStoppingRef.current = false;
        }
    }, [stopWebRTC]);

    /**
     * Watch vehicle_state transitions
     */
    useEffect(() => {
        const vehicleState = telemetry?.vehicle_state || {};
        const connected = vehicleState.connected === true;
        const inMission = vehicleState.in_mission === true;

        const prevConnected = prevStateRef.current.connected;
        const prevInMission = prevStateRef.current.inMission;

        // Detect transition to connected + in_mission
        if (connected && inMission && !(prevConnected && prevInMission)) {
            console.log('[StreamManager] Vehicle state transition: START (connected + in_mission)');
            startStream();
        }

        // Detect transition to disconnected + not in mission
        if (!connected && !inMission && (prevConnected || prevInMission) && streamStartedRef.current) {
            console.log('[StreamManager] Vehicle state transition: STOP (disconnected + not in mission)');
            stopStream();
        }

        // Update previous state
        prevStateRef.current = { connected, inMission };
    }, [
        telemetry?.vehicle_state?.connected,
        telemetry?.vehicle_state?.in_mission,
        droneId,
        startStream,
        stopStream,
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamStartedRef.current && !DUMMY_STREAM) {
                streamService.stop().catch(() => {});
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };
    }, []);

    return { videoStream, isStreaming, isConnecting, streamError };
}
