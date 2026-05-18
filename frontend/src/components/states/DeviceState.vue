<!--
  @file
  @brief Displays or edits one device capability (sensor readout or actuator control) by type.

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
import { ref, computed, watch } from "vue";
import StateInteger from "./StateInteger.vue";
import StateFloat from "./StateFloat.vue";
import StateText from "./StateText.vue";
import StateChart from "./StateChart.vue";
import StateToggle from "./StateToggle.vue";
import type { Capability } from "@/api/apiTypes";

interface Props {
  capability: Capability;
  state: string | undefined;
  chartStates: string[];
  showDivider?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  state: "",
  showDivider: false,
});

const dirtyValue = ref(props.state);
const isDirty = ref(false);
const lastSent = ref<string | null>(null);
const value = computed({
  get() {
    return isDirty.value ? dirtyValue.value : props.state;
  },
  set(v: string) {
    dirtyValue.value = v;
    isDirty.value = true;
  },
});

const emit = defineEmits(["set"]);

const noData = "No data received";

function dataStyle(styleValue: string) {
  return styleValue ? "font-bold" : "text-sl-gray-400";
}

function doSet() {
  lastSent.value = value.value;
  emit("set", value.value);
}

watch(
  () => props.state,
  (newState) => {
    if (lastSent.value !== null && newState === lastSent.value) {
      isDirty.value = false;
      lastSent.value = null;
    }
  },
);
</script>

<template>
  <div class="px-4">
    <h3 class="mb-4 text-left">
      {{ props.capability.name }}
    </h3>
    <div>
      <div v-if="props.capability.mode === 's'" class="w-full text-center">
        <div class="pb-6" v-if="props.capability.display === 'c'">
          <template v-if="props.chartStates.length > 0">
            <StateChart :values="props.chartStates" />
          </template>
          <template v-else>
            <span class="text-sl-gray-400">{{ noData }}</span>
          </template>
        </div>
        <div v-else-if="props.capability.type === 'b'">
          <StateToggle toggleType="binary" :modelValue="props.state" :interactive="false" />
        </div>
        <div v-else-if="props.capability.key === 'ping'" :class="dataStyle(props.state)">
          <span v-if="props.state" class="text-sm font-normal text-sl-gray-700"
            >Current ping time:</span
          >
          {{ props.state ? props.state + " (ms)" : noData }}
        </div>
        <div v-else :class="dataStyle(props.state)">
          {{ props.state || noData }}
        </div>
        <hr v-if="props.showDivider" class="border-dashed" />
      </div>
      <div v-if="props.capability.mode === 'a'" class="mb-4">
        <form @submit.prevent="doSet">
          <div v-if="props.capability.type !== 'b'" class="flex grow flex-row">
            <div class="basis-3/4 items-center justify-center">
              <StateInteger v-if="props.capability.type === 'i'" v-model="value" />
              <StateFloat v-if="props.capability.type === 'f'" v-model="value" />
              <StateText v-if="props.capability.type === 't'" v-model="value" :max="10" />
            </div>
            <div class="basis-1/4">
              <button
                type="submit"
                class="ml-3 inline-flex h-10 items-center justify-center rounded border border-transparent bg-teal-700 px-4 py-[11px] font-medium text-white shadow-sm transition-colors hover:bg-teal-800 hover:shadow-md focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 focus:outline-none"
              >
                Send
              </button>
            </div>
          </div>
          <div v-else class="flex items-center justify-center">
            <div>
              <StateToggle
                v-if="props.capability.type === 'b'"
                v-model="value"
                @update:model-value="doSet"
                toggleType="binary"
              />
            </div>
          </div>
        </form>
        <hr v-if="props.showDivider" class="border-dashed" />
      </div>
    </div>
  </div>
</template>
