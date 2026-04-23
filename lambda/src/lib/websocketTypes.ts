import { Device } from "../database/databaseTypes.ts";

type WsMessageType =
  | "device_update"
  | "tonk"
  | "error"
  | "set_state"
  | "tink"
  | "report_event"
  | "keepalive";

interface WsMessageBase {
  type: WsMessageType;
}

export interface WsDeviceUpdateMessage extends WsMessageBase {
  type: "device_update";
  device: Device;
  event?: "uplink" | "downlink";
  changedKeys?: string[];
}

export interface WsTonkMessage extends WsMessageBase {
  type: "tonk";
  deviceId: string;
  timestamp: string;
  event?: "uplink" | "downlink";
}

export interface WsErrorMessage extends WsMessageBase {
  type: "error";
  message: string;
}

export interface WsSetStateMessage extends WsMessageBase {
  type: "set_state";
  deviceId: string;
  entries: { key: string; value: string }[];
}

export interface WsTinkMessage extends WsMessageBase {
  type: "tink";
  deviceId: string;
  timestamp: string;
}

export interface WsReportEventMessage extends WsMessageBase {
  type: "report_event";
  deviceId: string;
  direction: "uplink" | "downlink";
}

export interface WsKeepaliveMessage extends WsMessageBase {
  type: "keepalive";
  at: number;
}

export type WsMessage =
  | WsDeviceUpdateMessage
  | WsTonkMessage
  | WsErrorMessage
  | WsSetStateMessage
  | WsTinkMessage
  | WsReportEventMessage
  | WsKeepaliveMessage;
