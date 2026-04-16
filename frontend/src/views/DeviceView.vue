<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
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
      <CardPanel class="flex items-center p-4">
        <RouterLink :to="{ name: 'devices' }" class="mr-4 text-sl-blue-500 hover:text-sl-blue-700">
          &larr; Back to Devices
        </RouterLink>
        <span class="text-lg font-semibold">{{ deviceId }}</span>
      </CardPanel>
    </div>

    <div
      class="mx-auto grid grid-cols-1 px-4 md:w-[760px] md:grid-cols-2 md:gap-[16px] lg:gap-[40px]"
    >
      <div class="grid-col">
        <AWSCloud></AWSCloud>
        <DownlinkPanel>
          <EmptyItem v-if="actuatorStates.length === 0" />
          <DeviceState
            v-else
            v-for="(state, index) in actuatorStates"
            :key="state.capability.key"
            :showDivider="index < actuatorStates.length - 1"
            :capability="state.capability"
            :state="state.state"
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
          />
        </UplinkPanel>
      </div>
    </div>
  </div>
</template>
