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
import type { WsDeviceUpdateMessage, WsTonkMessage } from "../lib/websockerTypes.ts";
import { broadcastToClients } from "../lib/websocketPublish.ts";
import {
  DeviceTransport,
  MqttDeviceTransport,
  WirelessDeviceTransport,
} from "../lib/deviceTransport.ts";

export const handler = async (
  event: SidewalkUplinkMessage | SimulatedDeviceUplinkMessage,
): Promise<string> => {
  console.log("Uplink event:", JSON.stringify(event, null, 2));

  let deviceId: string;
  let rawMessage: string;
  let uplinkType: "sidewalk" | "mqtt";
  let transport: DeviceTransport;

  if ("clientId" in event) {
    uplinkType = "mqtt";
    deviceId = event.clientId;
    transport = new MqttDeviceTransport();
    rawMessage = event.data;
  } else if ("WirelessDeviceId" in event) {
    uplinkType = "sidewalk";
    deviceId = event.WirelessDeviceId;
    transport = new WirelessDeviceTransport();
    rawMessage = event.PayloadData;
  } else {
    console.warn("Invalid uplink event — ignoring");
    return "Invalid event";
  }

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
      await handleCapability(deviceId, device, parsed.capabilities);
      break;
    case "state":
      await handleState(deviceId, device, parsed.entries);
      break;
    case "ping":
      await handlePing(deviceId, device, parsed.timestamp, transport);
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
  await transport.sendPacket(deviceId, urlMsg.toString());
  await transport.sendPacket(deviceId, new ReadyMessage().toString());

  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: createdDevice };
  await broadcastToClients(wsMessage);
}

async function handleCapability(
  deviceId: string,
  device: Device,
  capabilities: Device["capabilities"],
): Promise<void> {
  await updateDeviceCapabilities(deviceId, capabilities);

  const capMap = new Map(device.capabilities.map((c) => [c.key, c]));
  for (const c of capabilities) capMap.set(c.key, c);
  const updatedCaps = [...capMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const updated: Device = { ...device, capabilities: updatedCaps };
  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: updated };
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

  await updateDeviceState(deviceId, filtered);

  const updatedState = { ...device.state };
  for (const entry of filtered) {
    updatedState[entry.key] = entry.value;
  }

  const updated: Device = { ...device, state: updatedState };
  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: updated };
  await broadcastToClients(wsMessage);
}

async function handlePing(
  deviceId: string,
  device: Device,
  timestamp: string,
  transport: DeviceTransport,
): Promise<void> {
  const pong = new PongMessage({ timestamp });
  await transport.sendPacket(deviceId, pong.toString());
  await refreshDeviceTtl(deviceId);
}

async function handleTonk(deviceId: string, timestamp: string): Promise<void> {
  const wsMessage: WsTonkMessage = { type: "tonk", deviceId, timestamp };
  await broadcastToClients(wsMessage);
  await refreshDeviceTtl(deviceId);
}
