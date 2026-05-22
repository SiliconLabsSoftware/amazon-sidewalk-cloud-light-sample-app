<!--
  @file
  @brief AWS cloud graphic with uplink/downlink beacons reflecting live traffic for a device.

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
