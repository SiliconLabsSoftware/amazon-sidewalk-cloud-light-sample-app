<!--
  @file
  @brief Single-device dashboard with latency controls and uplink/downlink capability panels.

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
import { computed } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device";
import CardPanel from "@/components/CardPanel.vue";
import DeviceState from "@/components//states/DeviceState.vue";
import UplinkPanel from "@/components/UplinkPanel.vue";
import DownlinkPanel from "@/components/DownlinkPanel.vue";
import AWSCloud from "@/components/AWSCloud.vue";
import EmptyItem from "@/components/EmptyItem.vue";
import { useRoutedDevice } from "@/composables/routedDevice";

const router = useRouter();
const { device, deviceId } = useRoutedDevice();

// Redirect to 404 if device not found in store
if (!device.value) {
  router.replace({ name: "not-found" });
}

const deviceStore = useDeviceStore();
const { tinkLatency } = storeToRefs(deviceStore);
const latencyMs = computed(() => tinkLatency.value[deviceId.value] ?? null);

const sensorStates = computed(
  () =>
    device.value?.capabilities
      .filter((cap) => cap.mode === "s")
      .map((cap) => ({ capability: cap, state: device.value?.state[cap.key] ?? undefined })) || [],
);
const actuatorStates = computed(
  () =>
    device.value?.capabilities
      .filter((cap) => cap.mode === "a")
      .map((cap) => ({ capability: cap, state: device.value?.state[cap.key] ?? undefined })) || [],
);
</script>

<template>
  <div class="w-full text-center">
    <!-- Header Card -->
    <div class="mx-auto mb-4 px-4 md:w-[760px]">
      <CardPanel class="p-4">
        <div class="flex items-center">
          <RouterLink :to="{ name: 'devices' }" class="mr-4 text-teal-700 hover:text-teal-950">
            &larr; Back to Devices
          </RouterLink>
          <span class="text-lg font-semibold">{{ deviceId }}</span>
        </div>
        <div class="mt-3 flex items-center justify-between border-t border-sl-gray-200 pt-3">
          <div class="flex items-center gap-2">
            <h3 class="mb-0">Round-trip Latency</h3>
            <span v-if="latencyMs !== null"> {{ latencyMs }} ms</span>
            <span v-else class="text-sl-gray-400">Not measured</span>
            <div>
              <button
                class="ml-3 inline-flex h-10 items-center justify-center rounded border border-transparent bg-teal-700 px-4 py-[11px] font-medium text-white shadow-sm transition-colors hover:bg-teal-800 hover:shadow-md focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 focus:outline-none"
                @click="deviceStore.initiateTink(deviceId)"
              >
                Measure
              </button>
            </div>
          </div>
        </div>
      </CardPanel>
    </div>

    <div
      class="mx-auto grid grid-cols-1 px-4 md:w-[760px] md:grid-cols-2 md:gap-[16px] lg:gap-[40px]"
    >
      <div class="grid-col">
        <AWSCloud :deviceId="deviceId" />
        <DownlinkPanel>
          <EmptyItem v-if="actuatorStates.length === 0" />
          <DeviceState
            v-else
            v-for="(state, index) in actuatorStates"
            :key="state.capability.key"
            :showDivider="index < actuatorStates.length - 1"
            :capability="state.capability"
            :state="state.state"
            :chartStates="deviceStore.getChartSeries(deviceId, state.capability.key)"
            @set="(value) => deviceStore.setState(deviceId, state.capability.key, value)"
          />
        </DownlinkPanel>
      </div>
      <div class="grid-col">
        <UplinkPanel>
          <EmptyItem v-if="sensorStates.length === 0" />
          <DeviceState
            v-else
            v-for="(state, index) in sensorStates"
            :key="state.capability.key"
            :showDivider="index < sensorStates.length - 1"
            :capability="state.capability"
            :state="state.state"
            :chartStates="deviceStore.getChartSeries(deviceId, state.capability.key)"
          />
        </UplinkPanel>
      </div>
    </div>
  </div>
</template>
