/***************************************************************************//**
 * @file
 * @brief MQTT and Sidewalk transports: decode uplink payloads and send downlink packets.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: Zlib
 *
 * The licensor of this software is Silicon Laboratories Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *
 ******************************************************************************/
import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { IoTWirelessClient, SendDataToWirelessDeviceCommand } from "@aws-sdk/client-iot-wireless";
import { nextDeviceSeq } from "../database/device.ts";
import type { Device } from "../database/databaseTypes.ts";
import type { ProtocolMessage } from "./deviceProtocolBuilder.ts";

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

  abstract sendPacket(deviceId: string, message: ProtocolMessage): Promise<void>;
}

export class MqttDeviceTransport extends DeviceTransport {
  decodeMessage(message: string): string {
    return normalizeSerialInput(message);
  }

  async sendPacket(deviceId: string, message: ProtocolMessage): Promise<void> {
    const topic = `CloudLight/simulated/${deviceId}/downlink`;
    const payload = message.toString();
    console.log(`[transport/mqtt] → Publishing to MQTT topic "${topic}": "${payload}"`);
    await iotDataClient.send(
      new PublishCommand({
        topic,
        payload,
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

  async sendPacket(deviceId: string, message: ProtocolMessage): Promise<void> {
    const nextSeq = await nextDeviceSeq(deviceId);
    const packet = message.toString();
    console.log(
      `[transport/sidewalk] → Sending downlink to Sidewalk device ${deviceId} (seq=${nextSeq}): "${packet}"`,
    );
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
