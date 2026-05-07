<!--
  @file
  @brief Full-screen 404 card with branding and navigation back to the devices list.

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
  <div class="h-screen w-full overflow-x-clip py-24 text-center">
    <div class="mb-12">
      <img
        src="/images/silicon-labs-white-logo.svg"
        alt="Silicon Labs logo"
        class="mx-auto mb-12 flex w-[320px]"
      />

      <div class="mx-auto w-[360px] rounded-2xl bg-white px-12 py-8 text-center shadow-lg">
        <h1 class="mb-6 text-6xl font-bold text-sl-gray-900">404</h1>
        <p class="mb-8 text-sl-gray-800">The page you're looking for is not there.</p>
        <router-link
          to="/devices"
          class="mt-2 flex w-full items-center justify-center rounded border border-transparent bg-teal-700 p-2 text-base font-medium text-white uppercase hover:bg-teal-800 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 focus:outline-none"
        >
          Go to Devices
        </router-link>
      </div>
    </div>
    <div class="w-full text-[10px] text-white">
      {{ copyright }}
    </div>
  </div>
</template>
