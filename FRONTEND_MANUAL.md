# Frontend Technical Manual

This document provides a technical overview of the React frontend application for the UAV Patrol system. It covers configuration, UI routing, and backend integrations.

## 1. App Configuration & Build Commands

This application is built using **React** with **Vite** for fast, optimized builds. It is integrated with **Tauri** for potential desktop application packaging and uses **TailwindCSS** for styling.

### Available Scripts

The following commands are available via npm (defined in `package.json`):

- `npm run dev`: Starts the local Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles the application for production using Vite.
- `npm run preview`: Serves the production build locally to test before deployment.
- `npm run tauri`: Runs the Tauri CLI wrapper for building/developing the desktop app bundle.

## 2. Environmental Variables

The application relies on several environmental variables for API endpoints. To configure these, create a `.env` file in the project root by copying `.env-example`:

```env
VITE_API_BASE_URL=http://api-xflight.kumalabs.tech
VITE_WS_BASE_URL=ws://api-xflight.kumalabs.tech
VITE_STREAM_API_URL=http://172.15.1.15:8000
VITE_WHEP_URL=http://172.15.1.15:8889/stream/cam2/whep
VITE_DETECTIONS_WS_URL=ws://172.15.1.15:8000/api/ws/detections
VITE_DUMMY_STREAM=true
```

- **`VITE_API_BASE_URL`**: The main REST API endpoint for the Golang backend.
- **`VITE_WS_BASE_URL`**: The WebSocket endpoint for core real-time events.
- **`VITE_STREAM_API_URL`**: The API endpoint responsible for serving recorded missions and video downloads.
- **`VITE_WHEP_URL`**: The MediaMTX WHEP WebRTC endpoint for ultra-low latency live video feeds.
- **`VITE_DETECTIONS_WS_URL`**: The WebSocket URL for real-time AI object detection telemetry.
- **`VITE_DUMMY_STREAM`**: A boolean flag to toggle simulated data/video streams for local UI testing.

## 3. Major UI Routes & Page Components

Routing is managed by `react-router-dom`. The layout includes an `AppHeader` component that renders on all pages except the login screen.

### Defined Routes (`src/app/App.jsx`):

- **`/`** or **`/login`**: `LoginPage`
  - Handles user authentication.
- **`/dashboard`**: `DashboardPage`
  - The main HUD. Displays live video feeds, map tracking, UAV status, and active mission lists. Includes the Quick Launch dialog.
- **`/missions`**: `MissionPage`
  - Allows users to plan, preview, and create missions via the map and waypoint selection panels.
- **`/missions/active`**: `ActiveMissionPage`
  - A dedicated view for actively running missions.
- **`/history`**: `HistoryPage`
  - A tabular layout displaying completed and failed missions, including flight duration, logs, and video capture downloads.
- **`/user-management`**: `UserManagementPage`
  - Admin interface for handling system users.
- **`/docking-panel`**: `DockingPanelPage`
  - Specialized control page for managing the drone docking station.
- **`/about`**: `AboutPage`
  - Software versioning and company details.

*Note: Global state and contexts are primarily handled locally or via custom hooks (e.g., `useTelemetry` for socket streams).*

## 4. Backend Connections & API Client Setup

The frontend connects to a separate Golang backend (and the Python AI/Media service) using the native `fetch` API.

### API Client Setup

The central API configurations are located in `src/services/api.js`. The module dynamically reads the base URLs from `import.meta.env` and falls back to hardcoded defaults if the `.env` file is missing.

### Authentication Strategy

All authenticated requests use standard JWT Bearer Tokens.
- Upon successful login via `authService.login`, a token is received and saved to the browser's `localStorage` as `authToken`.
- Subsequent requests explicitly retrieve this token and inject it into the HTTP headers:
  ```javascript
  const token = localStorage.getItem('authToken');
  const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
  };
  ```

### API Service Modules

The API logic is organized into categorized objects:
- **`authService`**: `login`, `logout`, `getWsToken`.
- **`uavService`**: Fetching active drone units.
- **`missionService`**: Fetching mission schedules, executing Quick Launches (`registerMission`), conflict resolution (`previewConflicts`), and retrieving historical mission runs.
- **`userService`**: Fetching admin user lists.
- **`recordingService`**: Interfaces directly with the Python AI API (`VITE_STREAM_API_URL`) to fetch finalized `mp4` recordings via S3 object storage.

## 5. WebSocket Connections & Real-Time Data

The application heavily relies on WebSockets for real-time telemetry, HUD updates, and AI tracking. These are managed primarily through custom React hooks.

### Core Telemetry WebSocket (`useTelemetry.js`)

This hook manages the connection to the main Golang backend.
- **Connection**: It fetches a one-time WebSocket token via `authService.getWsToken()` before connecting to `${WS_BASE_URL}/ws/telemetry?token=...`.
- **Subscription Model**: The client sends a JSON payload to subscribe to specific drones: `{"type": "subscribe", "uav_ids": [1, 2]}`.
- **Data Flow**: The backend streams various metrics (`location`, `battery`, `vehicle_state`, `gps`, `attitude`, etc.) which the hook aggregates into a structured `telemetry` state object grouped by UAV ID. It also keeps a buffer of `positionHistory` to draw trajectories on the map.
- **Resilience**: Features automatic reconnection with exponential backoff (up to 10 attempts) if the socket drops.

### AI Detections & WebRTC Signaling (`useDetectionStream.js`)

This hook connects to the Python AI service to fetch real-time bounding-box metadata and triggers the WebRTC video stream.
- **Connection**: Connects directly to `VITE_DETECTIONS_WS_URL`.
- **Data Flow**: Listens for messages wrapped in event envelopes (e.g., `{"event": "detections", "data": {...}}`). This includes counts for detected `person_count` and `vehicle_count`.
- **WebRTC Auto-Start**: A key architectural feature is that the WebRTC WHEP negotiation (via `RTCPeerConnection` to MediaMTX) is automatically initiated the moment the first `detections` payload arrives. This ensures the frontend only attempts to play video when the backend confirms the AI pipeline is actively processing frames.
- **Resilience**: Features a standard 3-second polling auto-reconnect if the AI WebSocket is interrupted.
