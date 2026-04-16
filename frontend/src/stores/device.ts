import { ref } from "vue";
import { defineStore } from "pinia";
import type {
  Device,
  WsDeviceUpdateMessage,
  WsTonkMessage,
  WsReportEventMessage,
} from "@/api/apiTypes.ts";
import { useApplicationStore } from "./application.ts";

export const useDeviceStore = defineStore("device", () => {
  const applicationStore = useApplicationStore();
  const devices = ref<Device[]>([]);

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
    applicationStore.websocketApi.send({
      type: "tink",
      deviceId,
    });
  };

  const handleTonk = (message: WsTonkMessage) => {
    console.log("Tonk received:", message);
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
    if (devices.value.find((d) => d.deviceId === message.device.deviceId)) {
      devices.value = devices.value.map((d) =>
        d.deviceId === message.device.deviceId ? message.device : d,
      );
    } else {
      devices.value.push(message.device);
    }
    if (message.event) {
      triggerBlip(message.device.deviceId, message.event);
    }
  };

  const handleReportEvent = (message: WsReportEventMessage) => {
    triggerBlip(message.deviceId, message.direction);
  };

  return {
    devices,
    uplinkBlips,
    downlinkBlips,
    refreshDevices,
    getDevice,
    initiateTink,
    setState,
    handleDeviceUpdate,
    handleTonk,
    handleReportEvent,
  };
});
