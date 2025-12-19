import { ref } from "vue";
import { defineStore } from "pinia";

export const useDeviceStore = defineStore("device", () => {
  // function initialize() {}

  const devices = ref<string[]>([
    "device2",
    "some other device",
    "a1a5-1234-5678-9012-3456",
    "a1a5-1234-5678-9012-3457",
    "a1a5-1234-5678-9012-3458",
    "a1a5-1234-5678-9012-3459",
    "a1a5-1234-5678-9012-3460",
    "a1a5-1234-5678-9012-3461",
    "a1a5-1234-5678-9012-3462",
    "a1a5-1234-5678-9012-3463",
  ]);
  return { devices };
});
