<!--
  @file
  @brief Paginated-style device list with refresh control linking into each device route.

  # License
  Copyright 2026 Silicon Laboratories Inc. www.silabs.com

  SPDX-License-Identifier: Zlib

  The licensor of this software is Silicon Laboratories Inc.

  This software is provided 'as-is', without any express or implied
  warranty. In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

-->
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
