<script setup lang="ts">
import StateToggle from "./StateToggle.vue";

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(["update:modelValue"]);

function updateValue(value: string | boolean | number) {
  emit("update:modelValue", value.toString());
}
</script>

<template>
  <div>
    <StateToggle :toggle-type="'binary'" @toggle="updateValue"></StateToggle>
  </div>
</template>
