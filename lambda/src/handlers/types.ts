/***************************************************************************//**
 * @file
 * @brief Type definitions for Sidewalk and simulated MQTT uplink payloads.
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
export interface SidewalkUplinkMessage {
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

export interface SimulatedDeviceUplinkMessage {
  clientId: string;
  data: string;
}
