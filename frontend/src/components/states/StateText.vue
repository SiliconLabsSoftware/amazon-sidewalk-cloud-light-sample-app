<!--
  @file
  @brief Text input with maxlength and live character count for string capabilities.

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
