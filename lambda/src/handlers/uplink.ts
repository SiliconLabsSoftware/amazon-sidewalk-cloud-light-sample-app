import type { Context } from "aws-lambda";

import { createDevice, getDevice } from "../database/device.ts";

export const handler = async (
  event: SidewalkUplinkMessage | SimulatedDeviceUplinkMessage,
  context: Context,
): Promise<string> => {
  console.log("Uplink event: ", JSON.stringify(event, null, 2));

  let deviceId: string;
  let message: string;
  let uplinkType: "sidewalk" | "mqtt";

  if ("clientId" in event) {
    // Simulated (MQTT) device
    uplinkType = "mqtt";
    deviceId = event.clientId;
    message = event.data;
  } else if ("WirelessDeviceId" in event) {
    // Sidewalk device
    uplinkType = "sidewalk";
    deviceId = event.WirelessDeviceId;
    throw new Error("Sidewalk uplink not implemented");
  } else {
    throw new Error("Invalid uplink event");
  }

  const device = await getDevice(deviceId);
  if (device) {
    console.log("Device: ", JSON.stringify(device, null, 2), message);
  } else {
    await createDevice(deviceId, {
      type: uplinkType,
      capabilities: [],
      seq: 0,
      fragSeq: 0,
    });
  }

  return "Success";
};

interface SidewalkUplinkMessage {
  PayloadData: string;
  WirelessDeviceId: string;
  WirelessMetadata: {
    Sidewalk: {
      CmdExStatus: string;
      SidewalkId: string;
      Seq: number;
      MessageType: string;
      Timestamp: string;
    };
  };
}

interface SimulatedDeviceUplinkMessage {
  clientId: string;
  data: string;
}
