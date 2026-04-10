import { Device } from "../database/databaseTypes.ts";

type WsMessageType = "device_update" | "tonk";

interface WsMessageBase {
  type: WsMessageType;
}

export interface WsDeviceUpdateMessage extends WsMessageBase {
  type: "device_update";
  device: Device;
}

export interface WsTonkMessage extends WsMessageBase {
  type: "tonk";
  deviceId: string;
  timestamp: string;
}

export type WsMessage = WsDeviceUpdateMessage | WsTonkMessage;
