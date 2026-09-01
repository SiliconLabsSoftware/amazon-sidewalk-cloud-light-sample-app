/***************************************************************************//**
 * @file
 * @brief TypeScript types for devices, capabilities, and connections in DynamoDB.
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

export interface StoredCapability extends Capability {
  /** Epoch microseconds (Date.now() * 1000 + index in message); ordering only, not exposed via API. */
  timeAdded: number;
}

export interface DeviceRecord extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  protocolVersion: string;
  smsn?: string;
  capabilities: Record<string, StoredCapability>;
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
