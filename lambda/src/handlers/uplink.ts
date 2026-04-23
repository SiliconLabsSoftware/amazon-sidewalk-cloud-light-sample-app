import type { Device } from "../database/databaseTypes.ts";
import type { SidewalkUplinkMessage, SimulatedDeviceUplinkMessage } from "./types.ts";
import {
  createDevice,
  getDevice,
  refreshDeviceTtl,
  updateDeviceCapabilities,
  updateDeviceState,
} from "../database/device.ts";
import { parseMessage } from "../lib/deviceProtocolParser.ts";
import { MagicUrlMessage, PongMessage, ReadyMessage } from "../lib/deviceProtocolBuilder.ts";
import type { WsDeviceUpdateMessage, WsTonkMessage } from "../lib/websocketTypes.ts";
import { broadcastToClients } from "../lib/websocketPublish.ts";
import { DeviceTransport, transportForDevice } from "../lib/deviceTransport.ts";

export const handler = async (
  event: SidewalkUplinkMessage | SimulatedDeviceUplinkMessage,
): Promise<string> => {
  console.log("[uplink] ← Received uplink event:", JSON.stringify(event, null, 2));

  let deviceId: string;
  let rawMessage: string;
  let uplinkType: "sidewalk" | "mqtt";

  if ("clientId" in event) {
    uplinkType = "mqtt";
    deviceId = event.clientId;
    rawMessage = event.data;
    console.log(`[uplink] Device ${deviceId} connected via MQTT (simulated device)`);
  } else if ("WirelessDeviceId" in event) {
    uplinkType = "sidewalk";
    deviceId = event.WirelessDeviceId;
    rawMessage = event.PayloadData;
    console.log(`[uplink] Device ${deviceId} connected via Sidewalk wireless`);
  } else {
    console.warn("[uplink] ✗ Invalid uplink event — ignoring");
    return "Invalid event";
  }
  const transport: DeviceTransport = transportForDevice(uplinkType);
  const message = transport.decodeMessage(rawMessage);
  console.log(`[uplink] Decoded device message: "${message}"`);

  if (!message || message.trim().length === 0) {
    console.log("[uplink] Empty message — returning gracefully");
    return "Empty message";
  }

  const parsed = parseMessage(message);
  console.log(`[uplink] Parsed device message → verb="${parsed.verb}"`, JSON.stringify(parsed));

  if (parsed.verb === "pairing") {
    console.log(`[uplink] Device ${deviceId} is requesting pairing`);
    await handlePairing(deviceId, uplinkType, parsed, transport);
    return "Success";
  }

  const device = await getDevice(deviceId);
  if (!device) {
    console.warn(
      `[uplink] ✗ Message from unknown device ${deviceId} (verb: ${parsed.verb}) — skipping`,
    );
    return "Unknown device";
  }

  switch (parsed.verb) {
    case "capability":
      console.log(
        `[uplink] Device ${deviceId} reporting capabilities:`,
        JSON.stringify(parsed.capabilities),
      );
      await handleCapability(deviceId, parsed.capabilities);
      break;
    case "state":
      console.log(
        `[uplink] Device ${deviceId} reporting state update:`,
        JSON.stringify(parsed.entries),
      );
      await handleState(deviceId, device, parsed.entries);
      break;
    case "ping":
      console.log(
        `[uplink] Device ${deviceId} sent ping (timestamp=${parsed.timestamp}), will respond with pong`,
      );
      await handlePing(deviceId, parsed.timestamp, transport);
      break;
    case "tonk":
      console.log(
        `[uplink] Device ${deviceId} sent tonk acknowledgment (timestamp=${parsed.timestamp})`,
      );
      await handleTonk(deviceId, parsed.timestamp);
      break;
    case "unknown":
      console.log(`[uplink] ✗ Unknown verb from ${deviceId}: ${parsed.raw}`);
      break;
  }

  return "Success";
};

async function handlePairing(
  deviceId: string,
  uplinkType: "sidewalk" | "mqtt",
  parsed: { version: string; appId: string; smsn?: string },
  transport: DeviceTransport,
): Promise<void> {
  console.log(
    `[uplink/pairing] Creating device record in DynamoDB (id=${deviceId}, type=${uplinkType})`,
  );
  const createdDevice = await createDevice(deviceId, {
    type: uplinkType,
    protocolVersion: parsed.version,
    smsn: parsed.smsn,
  });

  const baseUrl = process.env.BASE_URL!;
  const password = process.env.FRONTEND_PASSWORD!;

  const urlMsg = new MagicUrlMessage({ baseUrl, password, deviceId });
  console.log(`[uplink/pairing] → Sending magic URL to device ${deviceId}`);
  await transport.sendPacket(deviceId, urlMsg);
  console.log(`[uplink/pairing] → Sending ready signal to device ${deviceId}`);
  await transport.sendPacket(deviceId, new ReadyMessage());

  console.log(`[uplink/pairing] → Broadcasting device_update to WebSocket clients`);
  const wsMessage: WsDeviceUpdateMessage = {
    type: "device_update",
    device: createdDevice,
    event: "uplink",
  };
  await broadcastToClients(wsMessage);
}

async function handleCapability(
  deviceId: string,
  capabilities: Device["capabilities"],
): Promise<void> {
  console.log(
    `[uplink/capability] Saving ${capabilities.length} capabilities for device ${deviceId}`,
  );
  const updated = await updateDeviceCapabilities(deviceId, capabilities);
  console.log(`[uplink/capability] → Broadcasting updated device to WebSocket clients`);
  const wsMessage: WsDeviceUpdateMessage = {
    type: "device_update",
    device: updated,
    event: "uplink",
  };
  await broadcastToClients(wsMessage);
}

async function handleState(
  deviceId: string,
  device: Device,
  entries: { key: string; value: string }[],
): Promise<void> {
  const knownKeys = new Set(device.capabilities.map((c) => c.key));
  const filtered = entries.filter((e) => knownKeys.has(e.key));

  if (filtered.length === 0) {
    console.log(`[uplink/state] No matching capability keys for state update on ${deviceId}`);
    return;
  }

  console.log(
    `[uplink/state] Updating state in DynamoDB for device ${deviceId}:`,
    JSON.stringify(filtered),
  );
  const updated = await updateDeviceState(deviceId, filtered);
  console.log(
    `[uplink/state] → Broadcasting state change to WebSocket clients (keys: ${filtered.map((e) => e.key).join(", ")})`,
  );
  const wsMessage: WsDeviceUpdateMessage = {
    type: "device_update",
    device: updated,
    event: "uplink",
    changedKeys: filtered.map((e) => e.key),
  };
  await broadcastToClients(wsMessage);
}

async function handlePing(
  deviceId: string,
  timestamp: string,
  transport: DeviceTransport,
): Promise<void> {
  const pong = new PongMessage({ timestamp });
  console.log(`[uplink/ping] → Sending pong to device ${deviceId} (timestamp=${timestamp})`);
  await transport.sendPacket(deviceId, pong);
  await refreshDeviceTtl(deviceId);
}

async function handleTonk(deviceId: string, timestamp: string): Promise<void> {
  console.log(
    `[uplink/tonk] → Broadcasting tonk event to WebSocket clients for device ${deviceId}`,
  );
  const wsMessage: WsTonkMessage = { type: "tonk", deviceId, timestamp, event: "uplink" };
  await broadcastToClients(wsMessage);
  await refreshDeviceTtl(deviceId);
}
