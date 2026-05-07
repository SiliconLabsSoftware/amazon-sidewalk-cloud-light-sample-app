<!--
  @file
  @brief Bound number input for floating-point actuator capability values.

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
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(["update:modelValue"]);

function updateValue(event: InputEvent) {
  const { target } = event;
  if (target) {
    emit("update:modelValue", (target as HTMLInputElement).value);
  }
}
</script>

<template>
  <div>
    <input type="number" :value="props.modelValue" @input="updateValue" />
  </div>
</template>
