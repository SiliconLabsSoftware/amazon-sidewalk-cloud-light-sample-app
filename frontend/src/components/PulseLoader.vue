<!--
  @file
  @brief Animated pulse skeleton bar whose appearance is driven by CSS classes.

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
interface Props {
  classes: string;
}
defineProps<Props>();
</script>

<template>
  <div class="flex animate-pulse">
    <div class="flex-1 space-y-6 py-1">
      <div class="space-y-3">
        <div class="h-2 rounded" :class="classes"></div>
      </div>
    </div>
  </div>
</template>
