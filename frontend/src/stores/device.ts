/***************************************************************************//**
 * @file
 * @brief Pinia device store: list, charts, blips, tink latency, and WS handlers.
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
import { ref, reactive } from "vue";
import { defineStore } from "pinia";
import type {
  Device,
  WsDeviceUpdateMessage,
  WsTonkMessage,
  WsReportEventMessage,
} from "@/api/apiTypes.ts";
import { useApplicationStore } from "./application.ts";

const CHART_BUFFER_MAX = 50;

export const useDeviceStore = defineStore("device", () => {
  const applicationStore = useApplicationStore();
  const devices = ref<Device[]>([]);

  /* Chart series — deviceId -> capKey -> ordered values */
  const chartSeries = reactive<Record<string, Record<string, string[]>>>({});
  const getChartSeries = (deviceId: string, key: string): string[] => {
    return chartSeries[deviceId]?.[key] ?? [];
  };
  const clearAllChartSeries = () => {
    for (const key of Object.keys(chartSeries)) {
      delete chartSeries[key];
    }
  };

  /* Blips */
  const uplinkBlips = ref<Record<string, boolean>>({});
  const downlinkBlips = ref<Record<string, boolean>>({});
  const triggerBlip = (deviceId: string, direction: "uplink" | "downlink") => {
    const blips = direction === "uplink" ? uplinkBlips : downlinkBlips;
    blips.value[deviceId] = true;
    setTimeout(
      () => {
        blips.value[deviceId] = false;
      },
      50 + Math.random() * 125,
    );
  };

  /* Tink/tonk round-trip latency — per-device */
  const pendingTinks: Record<string, Set<string>> = {};
  const tinkLatency = ref<Record<string, number | null>>({});

  const refreshDevices = async () => {
    if (!applicationStore.httpApi) {
      throw new Error("HTTP API not initialized.");
    }
    const newDevices = await applicationStore.httpApi.getDevices();
    if (newDevices) {
      devices.value = newDevices;
    }
  };

  const getDevice = (deviceId: string): Device | undefined => {
    return devices.value.find((device) => device.deviceId === deviceId);
  };

  const initiateTink = (deviceId: string) => {
    if (!applicationStore.websocketApi) {
      throw new Error("WebSocket API not initialized.");
    }
    if (!pendingTinks[deviceId]) {
      pendingTinks[deviceId] = new Set();
    }
    const timestamp = String(Date.now());
    applicationStore.websocketApi.send({
      type: "tink",
      deviceId,
      timestamp,
    });
    pendingTinks[deviceId].add(timestamp);
  };

  const handleTonk = (message: WsTonkMessage) => {
    if (pendingTinks[message.deviceId]?.delete(message.timestamp)) {
      tinkLatency.value[message.deviceId] = Date.now() - Number(message.timestamp);
    }
    if (message.event) {
      triggerBlip(message.deviceId, message.event);
    }
  };

  const setState = (deviceId: string, stateId: string, value: string) => {
    if (!applicationStore.websocketApi) {
      throw new Error("WebSocket API not initialized.");
    }
    applicationStore.websocketApi.send({
      type: "set_state",
      deviceId,
      entries: [{ key: stateId, value }],
    });
  };

  const handleDeviceUpdate = (message: WsDeviceUpdateMessage) => {
    const deviceId = message.device.deviceId;

    if (devices.value.find((d) => d.deviceId === deviceId)) {
      devices.value = devices.value.map((d) => (d.deviceId === deviceId ? message.device : d));
    } else {
      devices.value.push(message.device);
    }

    if (message.changedKeys) {
      if (!chartSeries[deviceId]) {
        chartSeries[deviceId] = {};
      }
      for (const key of message.changedKeys) {
        if (message.device.capabilities.find((c) => c.key === key)?.display !== "c") continue;
        const value = message.device.state[key];
        if (value === undefined) continue;
        if (!chartSeries[deviceId][key]) {
          chartSeries[deviceId][key] = [];
        }
        const buf = chartSeries[deviceId][key];
        buf.push(value);
        if (buf.length > CHART_BUFFER_MAX) {
          buf.shift();
        }
      }
    }

    if (message.event) {
      triggerBlip(deviceId, message.event);
    }
  };

  const handleReportEvent = (message: WsReportEventMessage) => {
    triggerBlip(message.deviceId, message.direction);
  };

  return {
    devices,
    uplinkBlips,
    downlinkBlips,
    tinkLatency,
    refreshDevices,
    getDevice,
    getChartSeries,
    clearAllChartSeries,
    initiateTink,
    setState,
    handleDeviceUpdate,
    handleTonk,
    handleReportEvent,
  };
});
