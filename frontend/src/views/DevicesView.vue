<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device";
import CardPanel from "@/components/CardPanel.vue";

const deviceStore = useDeviceStore();
const { devices } = storeToRefs(deviceStore);

function refresh() {
  // TODO: Implement refresh logic from store
  console.log("Refreshing devices...");
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4">
    <!-- Header Card -->
    <CardPanel class="mb-4 flex items-center justify-between p-4">
      <span class="text-lg font-semibold">Devices</span>
      <button
        @click="refresh"
        class="rounded-lg bg-sl-blue-500 px-4 py-2 text-white hover:bg-sl-blue-700"
      >
        Refresh
      </button>
    </CardPanel>

    <RouterLink
      v-for="device in devices"
      :key="device"
      :to="{ name: 'device', params: { deviceId: device } }"
    >
      <CardPanel class="mb-4 p-4 hover:bg-gray-50">
        {{ device }}
      </CardPanel>
    </RouterLink>
  </div>
</template>
