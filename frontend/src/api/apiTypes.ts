export interface Capability {
  key: string;
  mode: "s" | "a";
  type: "b" | "i" | "f" | "t";
  display: "v" | "c";
  name: string;
}

export interface Device {
  type: "sidewalk" | "mqtt";
  protocolVersion: string;
  smsn?: string;
  state: Record<string, string>;
  seq: number;
  deviceId: string;
  capabilities: Capability[];
  expires: number;
}

type WsMessageType = "device_update" | "tonk" | "error" | "set_state" | "tink";

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
}

export type WsMessage =
  | WsDeviceUpdateMessage
  | WsTonkMessage
  | WsErrorMessage
  | WsSetStateMessage
  | WsTinkMessage;
