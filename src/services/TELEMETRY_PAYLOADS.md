# Telemetry Payloads

Dokumen ini menjelaskan payload WebSocket yang dipublish oleh service `v4.1.0`.

Format outer message selalu:

```json
{
  "type": "publish",
  "uav_id": 2,
  "kind": "telemetry",
  "metric": "<metric_name>",
  "payload": { ... }
}
```

Catatan:

- field yang bernilai `null` tidak ikut dikirim
- semua payload di bawah adalah bentuk maksimum; payload aktual bisa lebih kecil

## 1. `vehicle_state`

Sumber:

- `HEARTBEAT`
- `EXTENDED_SYS_STATE`

Payload:

```json
{
  "armed": true,
  "mode": "AUTO",
  "landed_state": "IN_AIR"
}
```

## 2. `location`

Sumber:

- `GLOBAL_POSITION_INT`
- `VFR_HUD`

Payload:

```json
{
  "latitude": -6.2000000,
  "longitude": 106.8000000,
  "altitude": 45.2,
  "ground_speed": 8.41,
  "heading": 172.5,
  "climb_rate": -0.35
}
```

Arti field:

- `altitude`: relative altitude meter
- `ground_speed`: meter per second
- `heading`: derajat
- `climb_rate`: meter per second

## 3. `gps`

Sumber:

- `GPS_RAW_INT`

Payload:

```json
{
  "fix_type": 3,
  "fix_type_label": "GPS_3D",
  "satellites": 12,
  "hdop": 1.45,
  "eph": 145
}
```

Arti `fix_type_label`:

- `NO_GPS`
- `NO_FIX`
- `GPS_2D`
- `GPS_3D`
- `DGPS`
- `RTK_FLOAT`
- `RTK_FIX`
- `STATIC`
- `PPP`

## 4. `attitude`

Sumber:

- `ATTITUDE`

Payload:

```json
{
  "roll_deg": 1.2,
  "pitch_deg": -0.8,
  "yaw_deg": 173.4,
  "roll_rate_dps": 0.6,
  "pitch_rate_dps": -0.3,
  "yaw_rate_dps": 1.1
}
```

## 5. `battery`

Sumber:

- `SYS_STATUS`
- fallback `BATTERY_STATUS`

Payload:

```json
{
  "percent": 81,
  "voltage": 15.62,
  "current": 8.41,
  "power": 131.38
}
```

Arti field:

- `voltage`: volt
- `current`: ampere
- `power`: watt

## 6. `mission_progress`

Sumber:

- `MISSION_CURRENT`

Payload:

```json
{
  "current_waypoint": 4
}
```

## 7. `link`

Sumber:

- `RC_CHANNELS`
- fallback `RADIO_STATUS`

Payload:

```json
{
  "rssi": 189,
  "source": "rc_channels"
}
```

## 8. `mission_event`

Ini bukan telemetry kontinu, tapi event sederhana untuk penanda fase mission di frontend.

Payload:

```json
{
  "history_id": 123,
  "event": "takeoff",
  "message": "Drone started takeoff"
}
```

Event yang saat ini bisa dikirim:

- `mission_uploaded`
- `takeoff`
- `mission_started`
- `landed`
- `mission_aborted`
- `mission_failed`

## Yang Tidak Dipublish Oleh Service Ini

Service ini tidak mengirim:

- `kind: status`
- `uav_status`
- `docking_status`

Status seperti itu tetap sebaiknya masuk lewat endpoint realtime HTTP yang memang meng-upsert ke DB.
