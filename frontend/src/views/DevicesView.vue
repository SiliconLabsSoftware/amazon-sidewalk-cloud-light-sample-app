<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device";
import { useTemporaryEffect } from "@/composables/temporaryEffect";
import CardPanel from "@/components/CardPanel.vue";
import BusySpinner from "@/components/BusySpinner.vue";

const deviceStore = useDeviceStore();
const { devices } = storeToRefs(deviceStore);

const refreshing = ref(false);
const {
  active: refreshComplete,
  begin: beginRefreshCompleteEffect,
  reset: resetRefreshCompleteEffect,
} = useTemporaryEffect(2000);
async function refresh() {
  try {
    refreshing.value = true;
    resetRefreshCompleteEffect();
    await deviceStore.refreshDevices();
    beginRefreshCompleteEffect();
  } catch (error) {
    console.error("Failed to refresh devices:", error);
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4">
    <!-- Header Card -->
    <CardPanel class="mb-4 flex min-h-18 items-center justify-between p-4">
      <span class="text-lg font-semibold">Devices</span>
      <div>
        <BusySpinner v-if="refreshing" />
        <span v-else-if="refreshComplete" class="text-sm text-sl-gray-500">Refreshed</span>
        <button
          v-else
          :disabled="refreshing"
          @click="refresh"
          class="rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
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
