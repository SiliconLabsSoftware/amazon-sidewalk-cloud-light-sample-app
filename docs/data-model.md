# DynamoDB Data Model

The application uses a single DynamoDB table with a single-table design pattern.

## Table Definition


| Property      | Value                       |
| ------------- | --------------------------- |
| Table name    | `CloudLight`                |
| Billing mode  | Pay-per-request (on-demand) |
| Partition key | `PK` (String)               |
| Sort key      | `SK` (String)               |
| TTL attribute | `expires`                   |


There are no Global Secondary Indexes. All access patterns use the partition key directly, with optional sort key conditions.

## Item Types

The table stores two types of items, distinguished by their `PK` value.

### Device Items

Represent connected devices (both Sidewalk and simulated).


| Attribute         | Type   | Description                                                            |
| ----------------- | ------ | ---------------------------------------------------------------------- |
| `PK`              | String | Always `"devices"`                                                     |
| `SK`              | String | Device ID (Sidewalk wireless device ID or MQTT client ID)              |
| `type`            | String | `"sidewalk"` or `"mqtt"`                                               |
| `protocolVersion` | String | Protocol version reported by device (e.g. `"v1"`)                      |
| `smsn`            | String | Sidewalk Manufacturing Serial Number (optional, Sidewalk devices only) |
| `capabilities`    | Map    | Device capabilities, keyed by capability key                           |
| `state`           | Map    | Current state values, keyed by capability key                          |
| `seq`             | Number | Downlink sequence number for Sidewalk transport                        |
| `expires`         | Number | TTL timestamp (Unix epoch seconds, ~24 hours from last activity)       |


#### Capabilities map structure

Each entry in the `capabilities` map has this shape:


| Field     | Type   | Values                             | Description                      |
| --------- | ------ | ---------------------------------- | -------------------------------- |
| `key`     | String | `a-z0-9_`, up to 8 chars           | Unique identifier                |
| `mode`    | String | `"s"` (sensor) or `"a"` (actuator) | Data direction                   |
| `type`    | String | `"b"`, `"i"`, `"f"`, or `"t"`      | Boolean, integer, float, or text |
| `display` | String | `"v"` (value) or `"c"` (chart)     | Frontend display hint            |
| `name`    | String | Up to 16 chars                     | Human-readable label             |


#### State map structure

The `state` map stores the current value for each capability key as a string. For example:

```json
{
  "b0": "1",
  "temp": "23",
  "led0": "0"
}
```

#### Example device item

```json
{
  "PK": "devices",
  "SK": "AQAAAAEAAAB9mzsP",
  "type": "sidewalk",
  "protocolVersion": "v1",
  "smsn": "50D141AA10EE03D533AF80F96F5ED5FA",
  "capabilities": {
    "b0": { "key": "b0", "mode": "s", "type": "b", "display": "v", "name": "Button 0" },
    "led0": { "key": "led0", "mode": "a", "type": "b", "display": "v", "name": "LED 0" },
    "temp": { "key": "temp", "mode": "s", "type": "i", "display": "c", "name": "Temperature" }
  },
  "state": {
    "b0": "0",
    "led0": "1",
    "temp": "23"
  },
  "seq": 42,
  "expires": 1735689600
}
```

### Connection Items

Track active WebSocket connections for broadcasting updates.


| Attribute | Type   | Description                                                   |
| --------- | ------ | ------------------------------------------------------------- |
| `PK`      | String | Always `"connections"`                                        |
| `SK`      | String | API Gateway WebSocket connection ID                           |
| `expires` | Number | TTL timestamp (Unix epoch seconds, ~24 hours from connection) |


#### Example connection item

```json
{
  "PK": "connections",
  "SK": "AbCdEf12345=",
  "expires": 1735689600
}
```

## Access Patterns


| Operation            | Key condition                                  | Used by                                            |
| -------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Get one device       | `PK = "devices"` AND `SK = <deviceId>`         | HTTP Lambda, WebSocket Lambda                      |
| List all devices     | `PK = "devices"` (query)                       | HTTP Lambda                                        |
| Create/update device | `PK = "devices"` AND `SK = <deviceId>`         | Uplink Lambda, WebSocket Lambda                    |
| Create connection    | `PK = "connections"` AND `SK = <connectionId>` | WebSocket Lambda (`$connect`)                      |
| Delete connection    | `PK = "connections"` AND `SK = <connectionId>` | WebSocket Lambda (`$disconnect`)                   |
| List all connections | `PK = "connections"` (query)                   | Uplink Lambda, WebSocket Lambda (for broadcasting) |


## TTL Behavior

All items have an `expires` attribute set to approximately 24 hours from creation or last significant update. DynamoDB automatically deletes expired items.

This means:

- Devices that stop sending uplinks disappear from the table after a day
- WebSocket connections that are never properly disconnected are cleaned up automatically
- The `broadcastToClients` function also handles stale connections by catching `GoneException` errors and deleting the corresponding connection item immediately

