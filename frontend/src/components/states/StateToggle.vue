<script setup lang="ts">
import { computed, reactive, watch } from "vue";

interface Props {
  interactive?: boolean;
  modelValue?: boolean;
  toggleType?: "binary" | "boolean" | "onoff" | "yesno";
}

const props = withDefaults(defineProps<Props>(), {
  interactive: true,
  modelValue: false,
  toggleType: "boolean",
});

const emit = defineEmits(["toggle"]);

const state = reactive({
  toggleState: false,
});

watch(
  () => props.modelValue,
  (v) => {
    state.toggleState = v;
  },
);

function updateToggle() {
  if (props.interactive) {
    state.toggleState = !state.toggleState;
    emit("toggle", toggleValue());
  }
}

function toggleValue() {
  switch (props.toggleType) {
    case "binary":
      return state.toggleState ? 1 : 0;
    case "onoff":
      return state.toggleState ? "on" : "off";
    case "yesno":
      return state.toggleState ? "yes" : "no";
    default:
      return state.toggleState;
  }
}

const toggleLabel = computed(() => {
  return toggleValue();
});
</script>

<template>
  <div class="relative inline-block pt-2">
    <div
      class="h-[20px] w-[60px] rounded-full border"
      :class="{
        'border-sl-blue-400 bg-sl-blue-100': state.toggleState,
        'border-sl-gray-800 bg-sl-gray-700': !state.toggleState,
      }"
    />
    <div
      class="absolute top-0 inline-block h-[40px] w-[40px] rounded-full"
      :class="{
        'left-[24px] bg-sl-blue-500': state.toggleState,
        'left-[-10px] bg-sl-gray-400': !state.toggleState,
        'cursor-pointer transition-all duration-150 ease-out hover:shadow-md': props.interactive,
        'hover:bg-sl-blue-800': props.interactive && state.toggleState,
        'hover:bg-sl-blue-100': props.interactive && !state.toggleState,
      }"
      @click="updateToggle"
    >
      <img
        v-if="!state.toggleState"
        src="/images/times-icon.svg"
        alt="Toggled Off"
        class="relative top-[5px] left-[5px] w-[30px]"
      />
      <img
        v-else
        src="/images/checkmark-icon.svg"
        alt="Toggled On"
        class="relative top-[5px] left-[5px] w-[30px]"
      />
    </div>
    <code class="relative top-3">{{ toggleLabel }}</code>
  </div>
</template>
