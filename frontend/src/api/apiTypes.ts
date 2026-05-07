/***************************************************************************//**
 * @file
 * @brief Shared TypeScript types for devices and WebSocket messages.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
 *
 ******************************************************************************/
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
