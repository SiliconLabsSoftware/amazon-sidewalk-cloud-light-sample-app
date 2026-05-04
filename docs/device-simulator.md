# Device Simulator

The device simulator is a Node.js application that acts as a simulated Sidewalk device using MQTT. It connects directly to AWS IoT Core (bypassing the Sidewalk radio network) and implements the same [device protocol](device-protocol.md) as a real device.

## Prerequisites

- **Cloud infrastructure must be deployed first** — the `CloudLightSoftDevice` IoT policy and IoT topic rules are created by Terraform. Run `./run.sh deploy` (or at least `./run.sh tf`) before creating simulated devices
- **Node.js** installed on the machine where you run the simulator
- **AWS CLI** configured with IoT permissions — attach `[policy-simulated-device.json](policy-simulated-device.json)` to your IAM user/role (see [AWS Permissions](deployment.md#aws-permissions) for more info)
- Install dependencies:
  ```bash
  cd device
  npm install
  ```

## Creating a Simulated Device

Each simulated device needs an IoT thing with certificates. The `create.sh` script provisions everything:

```bash
cd device
./create.sh my-device
```

This script:

1. Creates `certs/my-device/device.js` from `device.sample.js` with the thing name and IoT endpoint filled in
2. Creates an IoT thing named `my-device`
3. Creates and activates a certificate with public/private keys
4. Attaches the certificate to the thing
5. Attaches the `CloudLightSoftDevice` IoT policy to the certificate
6. Downloads the Amazon Root CA certificate

The resulting files are stored in `device/certs/my-device/`.

## Running the Simulator

```bash
cd device
node sim.js my-device
```

The simulator presents a terminal UI (TUI) with:

- **Log panel** (top left) — application events and connection status
- **Status panel** (top right) — capability table showing mode, type, display, name, and current value for each capability
- **Traffic panel** (bottom) — raw MQTT messages (`<` = outgoing, `>` = incoming)
- **Key bar** (bottom line) — available keyboard shortcuts for the current state

### Keyboard Controls


| Key               | Action                                                    | Available when    |
| ----------------- | --------------------------------------------------------- | ----------------- |
| F2                | Connect / Disconnect                                      | Always            |
| F4                | Send ping                                                 | Connected (ready) |
| F10               | Quit                                                      | Always            |
| Number keys (0-9) | Send random value for the corresponding sensor capability | Connected (ready) |


The number keys correspond to the index in the sorted capability list shown in the status panel. Only sensor-mode capabilities (excluding the built-in ping) are triggerable.

### What happens on connect

1. The simulator subscribes to its downlink topic (`CloudLight/simulated/{clientId}/downlink`)
2. It sends a pairing request: `$v1+cloud_light`
3. The cloud responds with a magic URL and `ready`
4. The simulator sends all capability advertisements
5. Periodic pings start (every 30 seconds)
6. The simulator is now ready to send sensor values and receive actuator commands

## Default Capabilities

The simulator comes with these capabilities defined in `device.sample.js`:


| Key    | Mode     | Type    | Display | Name        |
| ------ | -------- | ------- | ------- | ----------- |
| `b0`   | sensor   | boolean | value   | Button      |
| `led0` | actuator | boolean | value   | LED         |
| `temp` | sensor   | integer | chart   | Temperature |
| `disp` | actuator | text    | value   | Display     |
| `msg`  | actuator | text    | value   | Message     |


A `ping` sensor capability is added automatically by the simulator for latency measurement display.

## Deleting a Simulated Device

```bash
cd device
./delete.sh my-device
```

This removes the IoT thing, deactivates and deletes the certificate, detaches the policy, and removes the local certificate files.

## Differences from a Real Sidewalk Device


| Aspect             | Sidewalk Device                                        | Simulated Device                           |
| ------------------ | ------------------------------------------------------ | ------------------------------------------ |
| Transport          | Sidewalk radio (BLE/FSK/CSS)                           | MQTT over WebSocket                        |
| Topic              | `CloudLight/received` (via IoT Wireless destination)   | `CloudLight/simulated/{clientId}/received` |
| Payload            | Binary → base64 → hex → ASCII                          | Plain text JSON `{"data": "..."}`          |
| Downlink           | `SendDataToWirelessDevice` with sequence number        | MQTT publish to downlink topic             |
| Provisioning       | Sidewalk device registration (see embedded sample app) | `create.sh` script (IoT thing + certs)     |
| Message size limit | 255 bytes (BLE/FSK), 19 bytes (CSS)                    | No practical limit                         |


