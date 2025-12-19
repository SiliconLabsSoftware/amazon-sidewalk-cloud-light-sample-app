<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useDeviceStore } from "@/stores/device";
import CardPanel from "@/components/CardPanel.vue";
import DeviceState from "@/components/DeviceState.vue";
import UplinkPanel from "@/components/UplinkPanel.vue";
import DownlinkPanel from "@/components/DownlinkPanel.vue";
import AWSCloud from "@/components/AWSCloud.vue";
import EmptyItem from "@/components/EmptyItem.vue";

const route = useRoute();
const router = useRouter();
const deviceStore = useDeviceStore();

const deviceId = route.params.deviceId as string;

// Redirect to 404 if device not found in store
if (!deviceStore.devices.includes(deviceId)) {
  router.replace({ name: "not-found" });
}
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
          <EmptyItem></EmptyItem>
          <DeviceState></DeviceState>
        </DownlinkPanel>
      </div>
      <div class="grid-col">
        <UplinkPanel>
          <EmptyItem></EmptyItem>
          <DeviceState></DeviceState>
        </UplinkPanel>
      </div>
    </div>
  </div>
</template>
