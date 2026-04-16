<script setup lang="ts">
import { ref } from "vue";
import StateBoolean from "./StateBoolean.vue";
import StateInteger from "./StateInteger.vue";
import StateFloat from "./StateFloat.vue";
import StateText from "./StateText.vue";
// import StateChart from "./StateChart.vue"; // TODO: implement
import StateToggle from "./StateToggle.vue";
import type { Capability } from "@/api/apiTypes";

interface Props {
  capability: Capability;
  state: string | undefined;
  showDivider?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  state: "",
  showDivider: false,
});

const value = ref(props.state);

const emit = defineEmits(["set"]);

const noData = "No data received";

function dataStyle(styleValue: string) {
  return styleValue ? "font-bold" : "text-sl-gray-400";
}

function doSet() {
  if (props.capability.key === "led0" && value.value === "") {
    value.value = "0";
  }
  emit("set", value.value);
}

function determineBoolean(val: unknown): boolean {
  if (val == 0 || val == 1) {
    return val == 1;
  }
  if (val === "true" || val === "false") {
    return val === "true";
  }
  return Boolean(val);
}
</script>

<template>
  <div class="px-4">
    <h3 class="mb-4 text-left">
      {{ props.capability.name }}
    </h3>
    <div>
      <div v-if="props.capability.mode === 's'" class="w-full text-center">
        <div class="pb-6" v-if="props.capability.display === 'c'" :class="dataStyle(props.state)">
          <!-- <template v-if="props.capability.value">
            <StateChart
              v-if="props.capability.value"
              :low="20"
              :high="95"
              :thekey="props.capability.key"
              :value="parseInt(props.capability.value)"
              :values="props.capability.values"
            />
            <span class="pr-2 text-sm font-normal text-sl-gray-700">Current temperature:</span>
            <span>{{ props.capability.value + "°" }}</span>
          </template>
          <template v-else>{{ noData }}</template> -->
          NOT IMPLEMENTED YET
        </div>
        <div v-else-if="props.capability.type === 'b'">
          <StateToggle
            toggleType="binary"
            :modelValue="determineBoolean(props.state)"
            :interactive="false"
          ></StateToggle>
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
          <div v-if="props.capability.type !== 'b'" class="flex flex-grow flex-row">
            <div class="basis-3/4 items-center justify-center">
              <StateInteger v-if="props.capability.type === 'i'" v-model="value" />
              <StateFloat v-if="props.capability.type === 'f'" v-model="value" />
              <StateText v-if="props.capability.type === 't'" v-model="value" :max="32" />
            </div>
            <div class="basis-1/4">
              <button
                type="submit"
                class="ml-3 inline-flex h-10 items-center justify-center rounded border border-transparent bg-sl-blue-500 px-4 py-[11px] font-medium text-white shadow-sm transition-colors hover:bg-sl-blue-700 hover:shadow-md focus:ring-2 focus:ring-sl-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Send
              </button>
            </div>
          </div>
          <div v-else class="flex items-center justify-center">
            <div>
              <StateBoolean
                v-if="props.capability.type === 'b'"
                v-model="value"
                @update:model-value="doSet"
              />
            </div>
          </div>
        </form>
        <hr v-if="props.showDivider" class="border-dashed" />
      </div>
    </div>
  </div>
</template>
