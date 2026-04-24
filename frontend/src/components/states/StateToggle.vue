<script setup lang="ts">
import { computed } from "vue";

interface Props {
  interactive?: boolean;
  modelValue?: string | boolean | number;
  toggleType?: "binary" | "boolean" | "onoff" | "yesno";
}
const props = withDefaults(defineProps<Props>(), {
  interactive: true,
  modelValue: false,
  toggleType: "boolean",
});

const emit = defineEmits(["update:modelValue"]);

const booleanValue = computed(() => resolveToBoolean(props.modelValue));

function handleClick() {
  if (props.interactive) {
    emit("update:modelValue", resolveToExternalType(!booleanValue.value));
  }
}

function resolveToExternalType(val: boolean): string | number | boolean {
  switch (props.toggleType) {
    case "binary":
      return val ? 1 : 0;
    case "onoff":
      return val ? "on" : "off";
    case "yesno":
      return val ? "yes" : "no";
    default:
      return val;
  }
}

function resolveToBoolean(val: unknown): boolean {
  if (val == 0 || val == 1) {
    return val == 1;
  } else if (val === "true" || val === "false") {
    return val === "true";
  } else if (val === "no" || val === "yes") {
    return val === "yes";
  } else if (val === "off" || val === "on") {
    return val === "on";
  }
  return Boolean(val);
}

const toggleLabel = computed(() => {
  return resolveToExternalType(booleanValue.value);
});
</script>

<template>
  <div class="relative inline-block pt-2">
    <div
      class="h-[20px] w-[60px] rounded-full border"
      :class="{
        'border-teal-400 bg-teal-100': booleanValue,
        'border-sl-gray-800 bg-sl-gray-700': !booleanValue,
      }"
    />
    <div
      class="absolute top-0 inline-block h-[40px] w-[40px] rounded-full"
      :class="{
        'left-[24px] bg-teal-700': booleanValue,
        'left-[-10px] bg-sl-gray-400': !booleanValue,
        'cursor-pointer transition-all duration-150 ease-out hover:shadow-md': props.interactive,
        'hover:bg-teal-800': props.interactive && booleanValue,
        'hover:bg-teal-100': props.interactive && !booleanValue,
      }"
      @click="handleClick"
    >
      <img
        v-if="!booleanValue"
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
