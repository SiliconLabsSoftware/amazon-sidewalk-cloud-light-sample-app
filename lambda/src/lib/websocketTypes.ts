/***************************************************************************//**
 * @file
 * @brief Discriminated TypeScript types for frontend WebSocket JSON messages.
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
