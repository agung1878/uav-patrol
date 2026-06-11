const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://api-xflight.kumalabs.tech';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://api-xflight.kumalabs.tech';
export const STREAM_API_URL = import.meta.env.VITE_STREAM_API_URL || 'http://172.15.1.15:8000';
export const WHEP_URL = import.meta.env.VITE_WHEP_URL || 'http://172.15.1.15:8889/stream/cam2/whep';
export const DETECTIONS_WS_URL = import.meta.env.VITE_DETECTIONS_WS_URL || 'ws://172.15.1.15:8000/api/ws/detections';

export const authService = {
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        return data;
    },

    getWsToken: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/auth/ws-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get WebSocket token');
        }

        return response.json();
    }
};

export const uavService = {
    getUav: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/uav`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch UAVs');
        }

        return response.json();
    }
};

export const userService = {
    getUsers: async (page = 1, limit = 50) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch users');
        }

        return response.json();
    }
};

export const missionService = {
    getMissions: async (page = 1, limit = 50, uavId = '') => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const uavParam = uavId ? `&uav_id=${uavId}` : '';
        const response = await fetch(`${API_BASE_URL}/missions?page=${page}&limit=${limit}${uavParam}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch missions');
        }

        return response.json();
    },

    getMissionRuns: async (page = 1, limit = 50, upcoming = 'today', uavId = '') => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const uavParam = uavId ? `&uav_id=${uavId}` : '';
        const upcomingParam = upcoming ? `&upcoming=${upcoming}` : '';
        const response = await fetch(`${API_BASE_URL}/mission-runs?page=${page}&limit=${limit}${upcomingParam}${uavParam}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch mission runs');
        }

        return response.json();
    },

    previewConflicts: async (payload) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/mission-conflicts/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to preview conflicts');
        }

        return response.json();
    },

    registerMission: async (missionData) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/missions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(missionData)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Return structured error for conflict/guard responses so UI can handle them
            if (data.code === 'mission_schedule_conflict' || data.code === 'mission_recent_history_guard') {
                return { error: true, ...data };
            }
            throw new Error(data.error || 'Failed to register mission');
        }

        return data;
    },

    getMissionDetail: async (missionId) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/missions/${missionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch mission detail');
        }

        return response.json();
    },

    getMissionHistory: async (page = 1, limit = 20) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_BASE_URL}/mission-history?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch mission history');
        }

        return response.json();
    }
};

export const recordingService = {
    getMissionRecording: async (idOrUuid) => {
        const response = await fetch(`${STREAM_API_URL}/api/missions/${idOrUuid}`);

        if (!response.ok) {
            if (response.status === 404) return null;
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || 'Failed to fetch recording');
        }

        return response.json();
    }
};
