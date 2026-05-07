/***************************************************************************//**
 * @file
 * @brief TypeScript types for devices, capabilities, and connections in DynamoDB.
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
interface DatabaseEntry {
  expires: number;
}

export interface Capability {
  key: string;
  mode: "s" | "a";
  type: "b" | "i" | "f" | "t";
  display: "v" | "c";
  name: string;
}

export interface DeviceRecord extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  protocolVersion: string;
  smsn?: string;
  capabilities: Record<string, Capability>;
  state: Record<string, string>;
  seq: number;
}

export interface Device extends Omit<DeviceRecord, "capabilities"> {
  deviceId: string;
  capabilities: Capability[];
}

export interface Connection extends DatabaseEntry {
  id: string;
}
