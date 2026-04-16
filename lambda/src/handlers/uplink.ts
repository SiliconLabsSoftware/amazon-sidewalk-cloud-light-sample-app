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
  console.log("Uplink event:", JSON.stringify(event, null, 2));

  let deviceId: string;
  let rawMessage: string;
  let uplinkType: "sidewalk" | "mqtt";

  if ("clientId" in event) {
    uplinkType = "mqtt";
    deviceId = event.clientId;
    rawMessage = event.data;
  } else if ("WirelessDeviceId" in event) {
    uplinkType = "sidewalk";
    deviceId = event.WirelessDeviceId;
    rawMessage = event.PayloadData;
  } else {
    console.warn("Invalid uplink event — ignoring");
    return "Invalid event";
  }
  const transport: DeviceTransport = transportForDevice(uplinkType);
  const message = transport.decodeMessage(rawMessage);

  if (!message || message.trim().length === 0) {
    console.log("Empty message — returning gracefully");
    return "Empty message";
  }

  const parsed = parseMessage(message);
  console.log("Parsed message:", JSON.stringify(parsed));

  if (parsed.verb === "pairing") {
    await handlePairing(deviceId, uplinkType, parsed, transport);
    return "Success";
  }

  const device = await getDevice(deviceId);
  if (!device) {
    console.warn(`Message from unknown device ${deviceId} (verb: ${parsed.verb}) — skipping`);
    return "Unknown device";
  }

  switch (parsed.verb) {
    case "capability":
      await handleCapability(deviceId, parsed.capabilities);
      break;
    case "state":
      await handleState(deviceId, device, parsed.entries);
      break;
    case "ping":
      await handlePing(deviceId, parsed.timestamp, transport);
      break;
    case "tonk":
      await handleTonk(deviceId, parsed.timestamp);
      break;
    case "unknown":
      console.log(`Unknown verb from ${deviceId}: ${parsed.raw}`);
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
  const createdDevice = await createDevice(deviceId, {
    type: uplinkType,
    protocolVersion: parsed.version,
    smsn: parsed.smsn,
  });

  const smsn = parsed.smsn ?? deviceId;
  const baseUrl = process.env.BASE_URL!;
  const password = process.env.FRONTEND_PASSWORD!;

  const urlMsg = new MagicUrlMessage({ baseUrl, password, smsn });
  await transport.sendPacket(deviceId, urlMsg);
  await transport.sendPacket(deviceId, new ReadyMessage());

  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: createdDevice, event: "uplink" };
  await broadcastToClients(wsMessage);
}

async function handleCapability(
  deviceId: string,
  capabilities: Device["capabilities"],
): Promise<void> {
  const updated = await updateDeviceCapabilities(deviceId, capabilities);
  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: updated, event: "uplink" };
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
    console.log(`No matching capability keys for state update on ${deviceId}`);
    return;
  }

  const updated = await updateDeviceState(deviceId, filtered);
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
  await transport.sendPacket(deviceId, pong);
  await refreshDeviceTtl(deviceId);
}

async function handleTonk(deviceId: string, timestamp: string): Promise<void> {
  const wsMessage: WsTonkMessage = { type: "tonk", deviceId, timestamp, event: "uplink" };
  await broadcastToClients(wsMessage);
  await refreshDeviceTtl(deviceId);
}
