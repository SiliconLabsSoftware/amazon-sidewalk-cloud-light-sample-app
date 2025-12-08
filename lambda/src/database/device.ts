import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import client from "./client.ts";
import type { Device } from "./databaseTypes.ts";
import { newExpiresTimestamp } from "./utils.ts";

export const getDevice = async (deviceId: string): Promise<Device | undefined> => {
  const command = new GetCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: { PK: deviceId, SK: "device" },
  });
  const response = await client.send(command);
  return response.Item as Device | undefined;
};

export const createDevice = async (
  deviceId: string,
  device: Omit<Device, "expires">,
): Promise<void> => {
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: deviceId,
      SK: "device",
      type: device.type,
      capabilities: device.capabilities,
      seq: device.seq,
      fragSeq: device.fragSeq,
      expires: newExpiresTimestamp(),
    },
  });
  await client.send(command);
};
