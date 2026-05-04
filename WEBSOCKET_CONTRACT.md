# WebSocket Contract

Dokumen ini khusus untuk kontrak realtime WebSocket dan interaksinya dengan HTTP realtime ingestion.

## Endpoint

- `GET /ws/telemetry?token=<WS_TOKEN>`

Tidak ada endpoint WebSocket lain.

## Authentication Flow

1. authenticate dulu dengan JWT atau `X-Device-Token`
2. minta `POST /auth/ws-token`
3. connect ke `GET /ws/telemetry?token=<WS_TOKEN>`

Notes:
- WS token adalah JWT dengan audience `ws`
- default TTL `120` detik
- TTL bisa diatur via `WS_TOKEN_TTL_SECONDS`
- `X-Device-Token` bisa berasal dari row `device_tokens` atau dari env statis `UAV_DEVICE_TOKEN_STATIC` / `DOCKING_DEVICE_TOKEN_STATIC`

## Realtime Model

Semua event realtime memakai satu hub yang sama.

Flow:
1. producer mengirim data lewat `POST /realtime/telemetry` atau WS `type=publish`
2. backend validasi dan normalisasi payload
3. untuk telemetry posisi mission, backend bisa menyimpan track point ke database jika ada `mission_history` aktif pada UAV singleton
4. backend push ke realtime hub
5. hub broadcast ke client yang subscribe pada `uav_id` yang cocok

Routing hanya difilter berdasarkan `uav_id`, bukan `metric`.

## Client Message Types

### Subscribe

Payload:

```json
{
  "type": "subscribe",
  "uav_ids": [1]
}
```

Behavior:
- client mulai menerima semua event untuk `uav_id` yang didaftarkan
- subscribe berikutnya mengganti daftar sebelumnya, bukan append
- `uav_id` tidak valid atau non-positif akan diabaikan
- kalau tidak pernah subscribe, koneksi tetap terbuka tapi tidak menerima event

### Publish

Payload:

```json
{
  "type": "publish",
  "uav_id": 1,
  "kind": "telemetry",
  "metric": "battery",
  "payload": {
    "percent": 78.2,
    "voltage": 15.6
  }
}
```

Behavior:
- publish via WebSocket saat ini hanya untuk `kind=telemetry`
- jika `kind` tidak dikirim, backend memperlakukannya sebagai `telemetry`
- status seperti `uav_status` atau `docking_status` harus lewat `POST /realtime/telemetry`
- publisher-only client tidak perlu subscribe dulu

## Server Event Envelope

Semua event yang dikirim ke subscriber memakai envelope ini:

```json
{
  "uav_id": 1,
  "kind": "telemetry",
  "metric": "battery",
  "ts": "2026-02-05T10:00:00Z",
  "payload": {
    "percent": 78.2,
    "voltage": 15.6
  }
}
```

Field:
- `uav_id`: identitas UAV untuk routing subscriber
- `kind`: `telemetry` atau `status`
- `metric`: nama channel atau tipe status
- `ts`: timestamp UTC dari server
- `payload`: data spesifik event

Contoh status event:

```json
{
  "uav_id": 1,
  "kind": "status",
  "metric": "uav_status",
  "ts": "2026-02-05T10:01:00Z",
  "payload": {
    "battery_percent": 80,
    "is_in_flight": false,
    "is_docked": true,
    "last_heartbeat": "2026-02-05T10:01:00Z"
  }
}
```

## HTTP Realtime Interop

Endpoint:
- `POST /realtime/telemetry`

Envelope HTTP:

```json
{
  "uav_id": 1,
  "kind": "telemetry",
  "metric": "battery",
  "payload": {
    "percent": 78.2
  }
}
```

Rules:
- `kind` valid: `telemetry`, `status`
- status metric valid: `uav_status`, `docking_status`
- `kind=telemetry` tetap dibroadcast ke subscriber
- jika payload telemetry membawa `latitude` + `longitude` dan ada `mission_history` aktif pada UAV singleton, backend juga menyimpan track point mission
- persistence track ini hanya berlaku untuk mission runtime aktif; telemetry di luar mission tetap tidak dipersist
- track mission terakhir tetap tersimpan setelah mission terminal, lalu dibersihkan saat mission berikutnya `start`
- `kind=status` akan di-upsert ke `uav_status` atau `docking_status`, lalu dibroadcast

Untuk `metric=docking_status`:
- docking-scoped token akan update docking singleton itu sendiri
- UAV-scoped token atau authenticated user bisa kirim `docking_id` untuk target docking singleton
- kalau `docking_id` tidak dikirim, backend fallback ke docking singleton aktif

## Connection Behavior

- backend mengirim ping frame berkala untuk menjaga koneksi
- maksimum inbound message size adalah `64 KB`
- setiap koneksi punya bounded outbound buffer
- jika client terlalu lambat, backend bisa menutup koneksi
- reconnect logic tetap tanggung jawab client
- invalid WS message diabaikan dan dicatat di server
- tidak ada success acknowledgement frame untuk `subscribe` atau `publish`

## Typical Usage Patterns

### Subscriber-only

Dipakai frontend dashboard:
1. auth
2. `POST /auth/ws-token`
3. connect WebSocket
4. kirim `subscribe`
5. terima event

### Publisher-only

Dipakai drone/gateway yang hanya kirim telemetry:
1. auth
2. `POST /auth/ws-token`
3. connect WebSocket
4. kirim `publish`

### HTTP producer + WS subscriber

Dipakai jika device lebih nyaman kirim via HTTP:
1. device `POST /realtime/telemetry`
2. jika telemetry membawa koordinat dan mission sedang aktif, backend simpan track point lebih dulu
3. backend broadcast ke subscriber WS terkait
