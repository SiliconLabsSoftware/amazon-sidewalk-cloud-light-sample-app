<!--
  @file
  @brief Text input with maxlength and live character count for string capabilities.

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

interface Props {
  modelValue?: string;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  max: 32,
});

const emit = defineEmits(["update:modelValue"]);

function updateValue(event: Event) {
  const { target } = event;
  if (target) {
    emit("update:modelValue", (target as HTMLInputElement).value);
  }
}

const charsUsed = computed(() => {
  return props.modelValue.length;
});

const showCharCountWarning = computed(() => {
  const left = props.max - charsUsed.value;
  return left <= 2;
});
</script>

<template>
  <div class="text-right">
    <input
      type="text"
      :value="props.modelValue"
      :maxlength="props.max"
      @input="updateValue($event)"
    />
    <span
      class="text-sm text-sl-gray-500"
      :class="{
        'text-sl-red-500': showCharCountWarning,
      }"
      >{{ charsUsed }} / {{ props.max }}</span
    >
  </div>
</template>
