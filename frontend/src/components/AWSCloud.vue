<!--
  @file
  @brief AWS cloud graphic with uplink/downlink beacons reflecting live traffic for a device.

  # License
  Copyright 2026 Silicon Laboratories Inc. www.silabs.com

  SPDX-License-Identifier: LicenseRef-MSLA

  The licensor of this software is Silicon Laboratories Inc. Your use of this
  software is governed by the terms of the Silicon Labs Master Software License
  Agreement (MSLA) available at
  www.silabs.com/about-us/legal/master-software-license-agreement
  By installing, copying or otherwise using this software, you agree to the
  terms of the MSLA.
-->
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
      class="absolute bottom-[2%] left-[30%] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-sl-gray-300 text-xl font-bold transition-colors duration-150 ease-out"
      :class="{
        'bg-teal-700 text-white': uplinkActive,
        'bg-white text-sl-gray-300': !uplinkActive,
      }"
    >
      &uarr;
    </div>
    <div
      id="downlinkBeacon"
      class="absolute bottom-[2%] left-[50%] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-sl-gray-300 text-xl font-bold transition-colors duration-150 ease-out"
      :class="{
        'bg-teal-700 text-white': downlinkActive,
        'bg-white text-sl-gray-300': !downlinkActive,
      }"
    >
      &darr;
    </div>
  </div>
</template>
