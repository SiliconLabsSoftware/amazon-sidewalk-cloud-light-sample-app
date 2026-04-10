import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import client from "./client.ts";
import type { Capability, Device, DeviceRecord } from "./databaseTypes.ts";
import { newExpiresTimestamp } from "./utils.ts";

const DEVICES_PK = "devices";

function capabilitiesMapToArray(stored: DeviceRecord["capabilities"] | undefined): Capability[] {
  if (!stored) return [];
  return Object.values(stored).sort((a, b) => a.name.localeCompare(b.name));
}

export const getDevice = async (deviceId: string): Promise<Device | undefined> => {
  const command = new GetCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: DEVICES_PK, SK: deviceId },
  });
  const response = await client.send(command);
  if (!response.Item) return undefined;
  const device: Device = {
    deviceId: response.Item.SK as string,
    type: response.Item.type as "sidewalk" | "mqtt",
    protocolVersion: response.Item.protocolVersion as string,
    smsn: response.Item.smsn as string | undefined,
    capabilities: capabilitiesMapToArray(response.Item.capabilities),
    state: response.Item.state as Record<string, string>,
    seq: response.Item.seq as number,
    expires: response.Item.expires as number,
  };
  return device;
};

export const listDevices = async (): Promise<Device[]> => {
  const command = new QueryCommand({
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": DEVICES_PK },
  });
  const response = await client.send(command);
  const devices: Device[] = (response.Items ?? []).map(
    (item): Device => ({
      deviceId: item.SK as string,
      type: item.type,
      protocolVersion: item.protocolVersion,
      smsn: item.smsn,
      capabilities: capabilitiesMapToArray(item.capabilities),
      state: item.state ?? {},
      seq: item.seq ?? 0,
      expires: item.expires,
    }),
  );
  return devices;
};

export const createDevice = async (
  deviceId: string,
  device: Pick<Device, "type" | "protocolVersion" | "smsn">,
): Promise<Device> => {
  const item: DeviceRecord = {
    type: device.type,
    protocolVersion: device.protocolVersion,
    smsn: device.smsn,
    capabilities: {},
    state: {},
    seq: 0,
    expires: newExpiresTimestamp(),
  };
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: DEVICES_PK,
      SK: deviceId,
      ...item,
    },
  });
  await client.send(command);
  const createdDevice: Device = {
    deviceId: deviceId,
    ...item,
    capabilities: [],
  };
  return createdDevice;
};

export const updateDeviceCapabilities = async (
  deviceId: string,
  capabilities: Capability[],
): Promise<void> => {
  if (capabilities.length === 0) return;

  const setExpressions = capabilities.map((_, i) => `capabilities.#k${i} = :v${i}`);
  setExpressions.push("expires = :exp");

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":exp": newExpiresTimestamp() };
  for (const [i, cap] of capabilities.entries()) {
    names[`#k${i}`] = cap.key;
    values[`:v${i}`] = cap;
  }

  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: DEVICES_PK, SK: deviceId },
    UpdateExpression: `SET ${setExpressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  });
  await client.send(command);
};

export const updateDeviceState = async (
  deviceId: string,
  entries: { key: string; value: string }[],
): Promise<void> => {
  if (entries.length === 0) return;

  const setExpressions = entries.map((_, i) => `state.#k${i} = :v${i}`);
  setExpressions.push("expires = :exp");

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":exp": newExpiresTimestamp() };
  for (const [i, entry] of entries.entries()) {
    names[`#k${i}`] = entry.key;
    values[`:v${i}`] = entry.value;
  }

  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: DEVICES_PK, SK: deviceId },
    UpdateExpression: `SET ${setExpressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  });
  await client.send(command);
};

export const nextDeviceSeq = async (deviceId: string): Promise<number> => {
  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: DEVICES_PK, SK: deviceId },
    UpdateExpression: "ADD #seq :one SET #exp = :exp",
    ExpressionAttributeValues: { ":one": 1, ":exp": newExpiresTimestamp() },
    ExpressionAttributeNames: { "#seq": "seq", "#exp": "expires" },
    ReturnValues: "UPDATED_NEW",
  });
  const response = await client.send(command);
  if (!response.Attributes?.seq) {
    throw new Error("Failed to get next device seq");
  }
  const nextSeq =
    typeof response.Attributes.seq === "number"
      ? response.Attributes.seq
      : parseInt(response.Attributes.seq);
  return nextSeq;
};

export const refreshDeviceTtl = async (deviceId: string): Promise<void> => {
  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: DEVICES_PK, SK: deviceId },
    UpdateExpression: "SET expires = :exp",
    ExpressionAttributeValues: { ":exp": newExpiresTimestamp() },
  });
  await client.send(command);
};
