<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device";
import CardPanel from "@/components/CardPanel.vue";

const deviceStore = useDeviceStore();
const { devices } = storeToRefs(deviceStore);

async function refresh() {
  try {
    await deviceStore.refreshDevices();
  } catch (error) {
    console.error("Failed to refresh devices:", error);
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4">
    <!-- Header Card -->
    <CardPanel class="mb-4 flex items-center justify-between p-4">
      <span class="text-lg font-semibold">Devices</span>
      <div>
        <button
          @click="refresh"
          class="rounded-lg bg-sl-blue-500 px-4 py-2 text-white hover:bg-sl-blue-700"
        >
          Refresh
        </button>
      </div>
    </CardPanel>

    <RouterLink
      v-for="device in devices"
      :key="device.deviceId"
      :to="{ name: 'device', params: { deviceId: device.deviceId } }"
    >
      <CardPanel class="mb-4 p-4 hover:bg-gray-50">
        {{ device.deviceId }}
      </CardPanel>
    </RouterLink>
  </div>
</template>
