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
