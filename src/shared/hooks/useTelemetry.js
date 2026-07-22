import { useState, useEffect, useRef, useCallback } from 'react';
import { authService, WS_BASE_URL } from '../../services/api';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Custom hook to manage a telemetry WebSocket connection.
 *
 * Message format from server:
 * {
 *   "type": "publish",
 *   "uav_id": 2,
 *   "kind": "telemetry",
 *   "metric": "location" | "battery" | "vehicle_state" | "gps" | "attitude" | "link" | "mission_progress" | "mission_event",
 *   "payload": { ... }
 * }
 *
 * Telemetry state shape per UAV:
 * {
 *   [uav_id]: {
 *     vehicle_state: { armed, mode, landed_state },
 *     location: { latitude, longitude, altitude, ground_speed, heading, climb_rate },
 *     gps: { fix_type, fix_type_label, satellites, hdop, eph },
 *     attitude: { roll_deg, pitch_deg, yaw_deg, ... },
 *     battery: { percent, voltage, current, power },
 *     mission_progress: { current_waypoint },
 *     link: { rssi, source },
 *     mission_event: { history_id, event, message }
 *   }
 * }
 *
 * @param {number[]} uavIds - Array of UAV IDs to subscribe to.
 * @returns {{ telemetry: object, isConnected: boolean, error: string|null }}
 */
const MAX_TRAJECTORY_POINTS = 500;

export default function useTelemetry(uavIds = []) {
    const [telemetry, setTelemetry] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    // Track position history (trajectory) and home position per UAV
    const positionHistoryRef = useRef({}); // { [uav_id]: [[lat, lng], ...] }
    const homePositionRef = useRef({});    // { [uav_id]: [lat, lng] }
    const [positionHistory, setPositionHistory] = useState({});
    const [homePositions, setHomePositions] = useState({});

    // Track mission_status runtime_status changes
    const lastRuntimeStatusRef = useRef({}); // { [uav_id]: string }
    const [missionStatusVersion, setMissionStatusVersion] = useState(0);
    const landedTimerRef = useRef(null);

    const wsRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);
    const uavIdsRef = useRef(uavIds);
    const isMounted = useRef(true);

    // Keep uavIdsRef in sync
    useEffect(() => {
        uavIdsRef.current = uavIds;

        // If already connected, re-subscribe with new IDs
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && uavIds.length > 0) {
            const subscribeMsg = JSON.stringify({
                type: 'subscribe',
                uav_ids: uavIds
            });
            wsRef.current.send(subscribeMsg);
            console.log('[Telemetry] Re-subscribed with UAV IDs:', uavIds);
        }
    }, [JSON.stringify(uavIds)]);

    const connect = useCallback(async () => {
        // Don't connect if no UAV IDs
        if (!uavIdsRef.current || uavIdsRef.current.length === 0) {
            console.log('[Telemetry] Skipping connect — no UAV IDs yet');
            return;
        }
        console.log('[Telemetry] Starting connect flow with UAV IDs:', uavIdsRef.current);

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            setError(null);

            // 1. Get WebSocket token via POST
            console.log('[Telemetry] Fetching WS token...');
            const tokenData = await authService.getWsToken();
            console.log('[Telemetry] WS token response:', tokenData);
            const wsToken = tokenData.token || tokenData.ws_token;

            if (!wsToken) {
                console.error('[Telemetry] No token found in response. Keys:', Object.keys(tokenData));
                throw new Error('Invalid WebSocket token received');
            }
            console.log('[Telemetry] Got WS token:', wsToken.substring(0, 20) + '...');

            // 2. Connect to WebSocket
            const wsUrl = `${WS_BASE_URL}/ws/telemetry?token=${wsToken}`;
            console.log('[Telemetry] Connecting to:', wsUrl);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted.current) return;
                console.log('[Telemetry] Connected');
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;

                // 3. Subscribe to UAV IDs
                const subscribeMsg = JSON.stringify({
                    type: 'subscribe',
                    uav_ids: uavIdsRef.current
                });
                ws.send(subscribeMsg);
                console.log('[Telemetry] Subscribed to UAV IDs:', uavIdsRef.current);
            };

            ws.onmessage = (event) => {
                if (!isMounted.current) return;
                try {
                    const msg = JSON.parse(event.data);
                    console.log('[Telemetry] Raw message:', msg);

                    // Handle messages with uav_id + metric (kind: telemetry)
                    if (!msg.uav_id || !msg.metric) {
                        console.log('[Telemetry] Skipping message — uav_id:', msg.uav_id, 'metric:', msg.metric);
                        return;
                    }

                    const { uav_id, metric, payload } = msg;

                    // Track trajectory and home position from location updates
                    if (metric === 'location' && payload.latitude != null && payload.longitude != null) {
                        const pos = [payload.latitude, payload.longitude];

                        // Set home position (first known location)
                        if (!homePositionRef.current[uav_id]) {
                            homePositionRef.current[uav_id] = pos;
                            setHomePositions(prev => ({ ...prev, [uav_id]: pos }));
                        }

                        // Append to trajectory history
                        if (!positionHistoryRef.current[uav_id]) {
                            positionHistoryRef.current[uav_id] = [];
                        }
                        const history = positionHistoryRef.current[uav_id];
                        // Only add if moved (avoid duplicate points)
                        const last = history[history.length - 1];
                        if (!last || last[0] !== pos[0] || last[1] !== pos[1]) {
                            history.push(pos);
                            // Cap the history size
                            if (history.length > MAX_TRAJECTORY_POINTS) {
                                history.shift();
                            }
                            setPositionHistory(prev => ({ ...prev, [uav_id]: [...history] }));
                        }
                    }

                    // Detect mission_status runtime_status changes
                    if (metric === 'mission_status' && payload.runtime_status) {
                        const prevStatus = lastRuntimeStatusRef.current[uav_id];
                        const isChanged = prevStatus !== payload.runtime_status;
                        const isLanded = payload.runtime_status === 'Landed';

                        if (isChanged || isLanded) {
                            console.log(`[Telemetry] mission_status runtime_status for UAV ${uav_id}: ${prevStatus || 'N/A'} → ${payload.runtime_status}`);
                            lastRuntimeStatusRef.current[uav_id] = payload.runtime_status;

                            if (isLanded) {
                                // Wait 10s before refreshing so backend can finalize
                                if (landedTimerRef.current) clearTimeout(landedTimerRef.current);
                                landedTimerRef.current = setTimeout(() => {
                                    if (isMounted.current) {
                                        console.log(`[Telemetry] Landed delay elapsed — refreshing mission-runs`);
                                        setMissionStatusVersion(v => v + 1);
                                    }
                                }, 5000);
                            } else {
                                setMissionStatusVersion(v => v + 1);
                            }
                        }
                    }

                    setTelemetry(prev => ({
                        ...prev,
                        [uav_id]: {
                            ...(prev[uav_id] || {}),
                            [metric]: payload
                        }
                    }));
                } catch (parseErr) {
                    console.warn('[Telemetry] Failed to parse message:', event.data, parseErr);
                }
            };

            ws.onerror = (event) => {
                console.error('[Telemetry] WebSocket error:', event);
                if (!isMounted.current) return;
                setError('WebSocket connection error');
            };

            ws.onclose = (event) => {
                if (!isMounted.current) return;
                console.log('[Telemetry] Disconnected. Code:', event.code, 'Reason:', event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current += 1;
                    const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts.current, 5);
                    console.log(`[Telemetry] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    reconnectTimeout.current = setTimeout(connect, delay);
                } else {
                    setError('Max reconnection attempts reached');
                }
            };

        } catch (err) {
            console.error('[Telemetry] Connection setup failed:', err);
            if (!isMounted.current) return;
            setError(err.message);
            setIsConnected(false);

            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts.current += 1;
                const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts.current, 5);
                reconnectTimeout.current = setTimeout(connect, delay);
            }
        }
    }, []);

    // Connect/disconnect lifecycle
    useEffect(() => {
        isMounted.current = true;
        console.log('[Telemetry] useEffect triggered — uavIds:', uavIds);

        if (uavIds && uavIds.length > 0) {
            connect();
        } else {
            console.log('[Telemetry] useEffect — uavIds empty, not connecting');
        }

        return () => {
            isMounted.current = false;
            clearTimeout(reconnectTimeout.current);
            clearTimeout(landedTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect, JSON.stringify(uavIds)]);

    /**
     * Publish a command through the telemetry WebSocket.
     * Used for gimbal_command, camera_command, etc.
     *
     * @param {number} uavId - Target UAV ID
     * @param {string} metric - e.g. 'gimbal_command', 'camera_command'
     * @param {object} payload - Command payload
     */
    const publish = useCallback((uavId, metric, payload) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[Telemetry] Cannot publish — WebSocket not connected');
            return false;
        }
        const msg = JSON.stringify({
            type: 'publish',
            uav_id: uavId,
            kind: 'telemetry',
            metric,
            payload
        });
        wsRef.current.send(msg);
        console.log(`[Telemetry] Published ${metric}:`, payload);
        return true;
    }, []);

    return { telemetry, isConnected, error, positionHistory, homePositions, missionStatusVersion, publish };
}
