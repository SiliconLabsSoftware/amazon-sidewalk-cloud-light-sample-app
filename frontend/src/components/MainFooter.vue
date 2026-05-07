<!--
  @file
  @brief Footer with dynamic Silicon Labs copyright and Amazon Sidewalk branding.

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

const copyright = computed(() => {
  return `Copyright © ${new Date().getFullYear()} Silicon Laboratories. All rights reserved.`;
});
</script>

<template>
  <div class="w-full py-4 text-center text-sm text-white md:bg-sl-gray-800">
    {{ copyright }}
  </div>
  <div class="bg-white py-1 md:hidden">
    <img
      src="/images/amazon-sidewalk.svg"
      alt="Amazon Sidewalk logo"
      class="mx-auto mt-1 w-[255px]"
    />
  </div>
</template>
