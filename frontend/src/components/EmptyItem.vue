<!--
  @file
  @brief Skeleton placeholder with pulse bars for empty capability lists.

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
import PulseLoader from "@/components/PulseLoader.vue";
</script>

<template>
  <div class="mb-4 px-4">
    <div class="pb-3">
      <PulseLoader classes="bg-sl-gray-400 w-16"></PulseLoader>
    </div>
    <div>
      <PulseLoader classes="bg-sl-gray-400 w-48"></PulseLoader>
    </div>
  </div>
</template>
