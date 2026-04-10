import { ref } from "vue";
import { defineStore } from "pinia";
import type { Device } from "@/api/apiTypes.ts";
import mockDevices from "./mockDevices.ts";
import { useApplicationStore } from "./application.ts";

export const useDeviceStore = defineStore("device", () => {
  // function initialize() {}
  const applicationStore = useApplicationStore();
  const devices = ref<Device[]>(mockDevices);

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

  return { devices, refreshDevices, getDevice };
});
