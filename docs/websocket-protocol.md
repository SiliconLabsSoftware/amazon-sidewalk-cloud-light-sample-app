# WebSocket Protocol

The web frontend communicates with the cloud backend over a WebSocket connection for real-time device updates and sending commands. This document describes the WebSocket API.

For the device-level ASCII protocol between device and cloud, see [Device Protocol](device-protocol.md).

## Connection

### Endpoint

The WebSocket URL is the API Gateway WebSocket endpoint with the `/prod` stage:

```
wss://<api-id>.execute-api.<region>.amazonaws.com/prod
```

This URL is output by Terraform and baked into the frontend at build time as `VITE_WSS_URL`.

### Authentication

Authentication is required on connect. The password is the same `FRONTEND_PASSWORD` used for the HTTP API.

**Query parameter** (used by the frontend):
```
wss://<endpoint>/prod?authorization=Bearer%20<password>
```

**Header** (also supported):
```
Authorization: Bearer <password>
```

If authentication fails, the connection is rejected with an error.

### Keepalive

API Gateway has a **10-minute idle timeout** — connections with no traffic are closed automatically. The frontend sends a `keepalive` message every **9 minutes** to prevent this.

After **24 hours of user inactivity** (no mouse/keyboard/touch), the frontend stops sending keepalives and disconnects to avoid holding stale connections.

### Reconnection

If the WebSocket connection drops, the frontend reconnects automatically with exponential backoff. After **5 consecutive failures**, it stops retrying. The user must re-login or refresh the page to reconnect.

## Server → Client Messages

All messages are JSON objects with a `type` field.

### `device_update`

Sent when a device's state changes (uplink or downlink).

```json
{
  "type": "device_update",
  "device": {
    "deviceId": "AQAAAAEAAAB9mzsP",
    "type": "sidewalk",
    "protocolVersion": "v1",
    "smsn": "50D141AA10EE03D533AF80F96F5ED5FA",
    "capabilities": [
      { "key": "b0", "mode": "s", "type": "b", "display": "v", "name": "Button 0" },
      { "key": "led0", "mode": "a", "type": "b", "display": "v", "name": "LED 0" }
    ],
    "state": { "b0": "1", "led0": "0" },
    "seq": 42,
    "expires": 1735689600
  },
  "event": "uplink",
  "changedKeys": ["b0"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `device` | Object | Full device state (same shape as the HTTP API response) |
| `event` | String? | `"uplink"` or `"downlink"` — which direction triggered this update. Optional |
| `changedKeys` | String[]? | Which capability keys changed in this update. Used by the frontend for chart data |

### `tonk`

Response to a latency measurement (tink/tonk round-trip). Sent when the device echoes back a `!tonk` message.

```json
{
  "type": "tonk",
  "deviceId": "AQAAAAEAAAB9mzsP",
  "timestamp": "1735689500000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | String | The device that responded |
| `timestamp` | String | The original timestamp sent in the `tink` request. The frontend computes `Date.now() - timestamp` for round-trip time |

### `report_event`

Notification that something happened (e.g. a downlink was sent).

```json
{
  "type": "report_event",
  "deviceId": "AQAAAAEAAAB9mzsP",
  "direction": "downlink"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | String | The device involved |
| `direction` | String | `"uplink"` or `"downlink"` |

### `error`

Server-side error notification.

```json
{
  "type": "error",
  "message": "Device not found"
}
```

## Client → Server Messages

### `set_state`

Set one or more actuator values on a device.

```json
{
  "type": "set_state",
  "deviceId": "AQAAAAEAAAB9mzsP",
  "entries": [
    { "key": "led0", "value": "1" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | String | Target device |
| `entries` | Array | Key-value pairs to set. Only actuator keys (mode `"a"`) are forwarded to the device; sensor keys are ignored |

The server updates DynamoDB, sends the command to the device, and broadcasts a `device_update` with `event: "downlink"` to all connected clients.

### `tink`

Initiate a latency measurement (full UI → cloud → device → cloud → UI round-trip).

```json
{
  "type": "tink",
  "deviceId": "AQAAAAEAAAB9mzsP",
  "timestamp": "1735689500000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | String | Target device |
| `timestamp` | String | Client-generated timestamp (typically `Date.now().toString()`). Echoed back verbatim in the `tonk` response |

The server sends `!tink=<timestamp>` to the device and broadcasts a `report_event` with `direction: "downlink"`. When the device responds with `!tonk=<timestamp>`, the server broadcasts a `tonk` message to all clients.

### `keepalive`

No-op message to prevent the API Gateway idle timeout from closing the connection.

```json
{
  "type": "keepalive",
  "at": 1735689500000
}
```

The server does not process this message — it exists solely to keep the connection alive.
