<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "@/stores/device";

const props = defineProps<{ deviceId: string }>();

const deviceStore = useDeviceStore();
const { uplinkBlips, downlinkBlips } = storeToRefs(deviceStore);

const uplinkActive = computed(() => uplinkBlips.value[props.deviceId] ?? false);
const downlinkActive = computed(() => downlinkBlips.value[props.deviceId] ?? false);
</script>

<template>
  <div class="relative mb-5">
    <img src="/images/aws-cloud.svg" alt="AWS Cloud" />
    <div
      id="uplinkBeacon"
      class="absolute top-[158px] left-[130px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-sl-gray-300 text-xl font-bold transition-colors duration-150 ease-out"
      :class="{
        'bg-sl-blue-500 text-white': uplinkActive,
        'bg-white text-sl-gray-300': !uplinkActive,
      }"
    >
      &uarr;
    </div>
    <div
      id="downlinkBeacon"
      class="absolute top-[158px] left-[210px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-sl-gray-300 text-xl font-bold transition-colors duration-150 ease-out"
      :class="{
        'bg-sl-blue-500 text-white': downlinkActive,
        'bg-white text-sl-gray-300': !downlinkActive,
      }"
    >
      &darr;
    </div>
  </div>
</template>
