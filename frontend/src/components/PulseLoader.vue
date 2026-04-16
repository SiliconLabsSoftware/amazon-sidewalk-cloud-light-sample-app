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
