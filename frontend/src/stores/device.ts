import { ref } from "vue";
import { defineStore } from "pinia";
import type { Device, WsDeviceUpdateMessage, WsTonkMessage } from "@/api/apiTypes.ts";
import { useApplicationStore } from "./application.ts";

export const useDeviceStore = defineStore("device", () => {
  const applicationStore = useApplicationStore();
  const devices = ref<Device[]>([]);

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
    // TODO: handle tonk
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
    // TODO downlink blip
  };

  const handleDeviceUpdate = (message: WsDeviceUpdateMessage) => {
    if (devices.value.find((d) => d.deviceId === message.device.deviceId)) {
      devices.value = devices.value.map((d) =>
        d.deviceId === message.device.deviceId ? message.device : d,
      );
    } else {
      devices.value.push(message.device);
    }
  };

  return {
    devices,
    refreshDevices,
    getDevice,
    initiateTink,
    setState,
    handleDeviceUpdate,
    handleTonk,
  };
});
