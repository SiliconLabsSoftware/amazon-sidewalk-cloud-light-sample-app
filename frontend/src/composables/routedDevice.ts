import { computed, ref } from "vue";
import type { Ref } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import { useDeviceStore } from "@/stores/device";

export function useRoutedDevice() {
  const route = useRoute();
  const deviceId: Ref<string> = ref(route.params.deviceId as string);
  const deviceStore = useDeviceStore();
  const device = computed(() => deviceStore.getDevice(deviceId.value));

  onBeforeRouteUpdate(async (to) => {
    deviceId.value = to.params.deviceId as string;
  });

  return { device, deviceId };
}
