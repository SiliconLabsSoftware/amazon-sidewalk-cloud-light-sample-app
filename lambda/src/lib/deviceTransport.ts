import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { IoTWirelessClient, SendDataToWirelessDeviceCommand } from "@aws-sdk/client-iot-wireless";
import { nextDeviceSeq } from "../database/device.ts";
import type { Device } from "../database/databaseTypes.ts";

const iotDataClient = new IoTDataPlaneClient({
  region: process.env.REGION,
  endpoint: process.env.IOT_ENDPOINT,
});

const iotWirelessClient = new IoTWirelessClient({
  region: process.env.REGION,
});

function normalizeSerialInput(message: string): string {
  // remove C-string terminators (NUL) or other control chars
  return message.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function transportForDevice(deviceType: Device["type"]): DeviceTransport {
  return deviceType === "mqtt" ? new MqttDeviceTransport() : new WirelessDeviceTransport();
}

export abstract class DeviceTransport {
  abstract decodeMessage(message: string): string;

  abstract sendPacket(deviceId: string, packet: string): Promise<void>;
}

export class MqttDeviceTransport extends DeviceTransport {
  decodeMessage(message: string): string {
    return normalizeSerialInput(message);
  }

  async sendPacket(deviceId: string, packet: string): Promise<void> {
    await iotDataClient.send(
      new PublishCommand({
        topic: `CloudLight/simulated/${deviceId}/downlink`,
        payload: packet,
        qos: 1,
      }),
    );
  }
}

export class WirelessDeviceTransport extends DeviceTransport {
  decodeMessage(message: string): string {
    const decoded = Buffer.from(Buffer.from(message, "base64").toString("ascii"), "hex").toString(
      "ascii",
    );
    return normalizeSerialInput(decoded);
  }

  async sendPacket(deviceId: string, packet: string): Promise<void> {
    const nextSeq = await nextDeviceSeq(deviceId);
    await iotWirelessClient.send(
      new SendDataToWirelessDeviceCommand({
        Id: deviceId,
        PayloadData: Buffer.from(packet, "ascii").toString("base64"),
        TransmitMode: 0,
        WirelessMetadata: {
          Sidewalk: {
            Seq: nextSeq,
          },
        },
      }),
    );
  }
}
