<script setup lang="ts">
import { computed, ref } from "vue";
// import { storeToRefs } from "pinia";
// import { useDeviceStore } from "@/stores/device";

// const deviceStore = useDeviceStore();
// const { rxBlip, txBlip } = storeToRefs(deviceStore);
const rxBlip = ref(true);
const txBlip = ref(true);

const rxStyle = computed(() => {
  return rxBlip.value ? "bg-sl-blue-500" : "bg-white";
});

const txStyle = computed(() => {
  return txBlip.value ? "bg-sl-blue-500" : "bg-white";
});
</script>

<template>
  <div class="relative mb-5">
    <img src="/images/aws-cloud.svg" alt="AWS Cloud" />
    <div
      id="txBeacon"
      class="absolute top-[55px] left-[210px] h-[30px] w-[30px] rounded-full border-[3px] border-sl-gray-300 transition-colors duration-150 ease-out"
      :class="txStyle"
    ></div>
    <div
      id="rxBeacon"
      class="absolute top-[158px] left-[150px] h-[30px] w-[30px] rounded-full border-[3px] border-sl-gray-300 transition-colors duration-150 ease-out"
      :class="rxStyle"
    ></div>
  </div>
</template>
