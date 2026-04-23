# Cloud Light Device Protocol

This document describes the application message protocol used between the embedded device and the cloud backend in the Cloud Light application.

## Overview

Messages are simple ASCII strings. AWS IoT requires messages be sent to MQTT as JSON. For this sample app, the simple string messages are wrapped in a minimal JSON envelope so simple string concatenation can be used as opposed to full JSON generation: `{"data": "<message text>"}`x

Messages consist of a verb (typically a single character) followed by parameters. Single-character verbs do not require a separating space; multi-character verbs require a space before their parameters.

## Transport Constraints

- **BLE / FSK**: messages up to 255 bytes.
- **CSS (sub-GHz)**: messages limited to 19 bytes per physical payload.
- After initial setup, only short messages (≤ 19 bytes) are used so all three link types work transparently.
- Only the NOTIFY Sidewalk message type is used.
- Sidewalk stack-level acknowledgements are used for important messages.

## Overview of messages

| Direction | Verb / Type | Format                         | Description                |
|-----------|-------------|--------------------------------|----------------------------|
| up        | $           | `$<ver>+<app_id>#<smsn>`       | Pairing request            |
| down      | url         | `url <magic_url>`              | Setup URL                  |
| down      | ready       | `ready`                        | Setup complete signal      |
| up        | \|          | `\|<cap>[\|<cap>...]`          | Capability advertisement   |
| up        | :           | `:key=value[:key=value...]`    | Sensor state update        |
| down      | :           | `:key=value[:key=value...]`    | Actuator command           |
| up        | ping        | `!ping=<timestamp>`            | Latency ping               |
| down      | pong        | `!pong=<timestamp>`            | Ping response              |
| down      | tink        | `!tink=<timestamp>`            | Latency request from cloud |
| up        | tonk        | `!tonk=<timestamp>`            | Response to tink           |

## Message Flow

In the examples below, `<` denotes device-to-cloud (uplink) and `>` denotes cloud-to-device (downlink).

### 1. Setup (Pairing)

After registration, time sync, and Sidewalk connection, the device initiates the setup sequence.

#### 1a. Pairing Request

The device sends its application identifier, protocol version, and optionally its SMSN:

```
< $<protocol_version>+<app_id>#<smsn>
```

Example:

```
< $v1+cloud_light#50D141AA10EE03D533AF80F96F5ED5FA
< $v1+cloud_light
```

- `$` - the setup message verb
- `protocol_version` — integer protocol version
- `app_id` — application identifier string (i.e. `cloud_light`)
- `smsn` — Sidewalk Manufacturing Serial Number. Simulated devices are not required to send it

#### 1b. Cloud Response

The cloud responds with a magic URL and a ready signal. These are sent as two separate downlink messages:

```
> url <magic_url>
> ready
```

- `url` — a full URL containing the base URL, password/token, and SMSN so that scanning a QR code (if a display is available) takes the user directly to the device page without manual entry.
- `ready` — signals the device that setup is complete and it may proceed to send capabilities and status.

The device does **not** need to wait for a web UI claim. All devices in the user's deployed stack are implicitly owned by that user.

### 2. Capabilities

After receiving `ready`, the device advertises its capabilities. Capabilities tell the web UI what sensors and actuators the device has, so the UI can render appropriate controls.

Capabilities can be sent one per message or batched, as long as the message fits within the transport limit.

```
< |<cap>
< |<cap>|<cap>|<cap>
```

Each capability has the format:

```
|key+cap+name
```

Where:

| Field | Description |
|-------|-------------|
| `key` | Unique identifier, `a-z0-9_`, up to 8 chars. Shorter is better. |
| `cap` | Concatenation of mode, type, and optional display codes (see below). |
| `name` | Human-readable label, up to 16 chars (`A-Za-z0-9` and space). If omitted, `key` is used. |

`+` separates fields within a capability. `|` separates capabilities within a message.

#### Mode

| Code | Meaning |
|------|---------|
| `s` | **Sensor** — device sends data to cloud |
| `a` | **Actuator** — device receives commands from cloud |

#### Type

| Code | Meaning |
|------|---------|
| `b` | Boolean |
| `i` | Integer |
| `f` | Float |
| `t` | Text (printable ASCII, up to 128 chars) |

#### Display (optional)

| Code | Meaning |
|------|---------|
| `v` | Value (number or true/false indicator) |
| `c` | Chart (real-time, auto-ranging) |

Defaults to `v` value if omitted.

#### Capability Examples

```
< |b0+sb+Button 0
< |b1+sb+Button 1
< |led0+ab+LED 0
< |temp+sic+Temperature
< |msg+at+Display
```

- Capabilities are displayed in the web UI in the order they are received.
- A status update for a key that has no registered capability is ignored.
- A capability registered but never updated with status simply remains in its default state.

#### Enabling link switch (on device)

After setup and capability advertisement, the device enables link switching. It may from this point on switch between BLE, FSK, and CSS.


### 3. State Messages

State messages carry sensor readings (device → cloud) and actuator commands (cloud → device). They use the `:` verb.

```
< :key=value
> :key=value
```

- Device sends: actual sensor state.
- Cloud sends: desired actuator state.

Multiple state updates can be combined in a single message:

```
< :key1=value1:key2=value2
> :key1=value1:key2=value2
```

#### Examples

Using the above example capabilities.

Button press:

```
< :b0=1
< :b0=0
```

LED control from web UI:

```
> :led0=1
```

Temperature reading:

```
< :temp=23
```

Text to display:

```
> :msg=hello
```


### 5. Ping / Pong and Tink / Tonk

Two latency measurement mechanisms exist.

#### Ping / Pong (device-initiated, device ↔ cloud)

The device sends a ping to measure its round-trip latency to the cloud:

```
< !ping=<timestamp>
> !pong=<timestamp>
```

The device generates the timestamp, the cloud echoes it back unchanged, and the
device computes `now - timestamp` on receipt. This measures the **device ↔ cloud**
segment only; the web UI is not involved.

#### Tink / Tonk (UI-initiated, full round-trip)

The web UI initiates a tink to measure the **full UI → cloud → device → cloud → UI**
round-trip:

```
UI  → cloud   (WebSocket)   { type: "tink", deviceId, timestamp }
cloud → device (downlink)    !tink=<timestamp>
device → cloud (uplink)      !tonk=<timestamp>
cloud → UI     (WebSocket)   { type: "tonk", deviceId, timestamp }
```

The frontend generates the timestamp before sending. The cloud passes it through
to the device, which echoes it back verbatim. The cloud then broadcasts the tonk
to all connected WebSocket clients. Only the client that owns the original
timestamp recognises it, computes `now - timestamp`, and displays the result.

This means multiple UI clients can each measure their own independent round-trip
latency without interfering with each other.