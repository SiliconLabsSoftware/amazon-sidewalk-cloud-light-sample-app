<script setup lang="ts">
import PulseLoader from "@/components/PulseLoader.vue";
</script>

<template>
  <div class="mb-4 px-4">
    <div class="pb-3">
      <PulseLoader classes="bg-sl-gray-400 w-16"></PulseLoader>
    </div>
    <div>
      <PulseLoader classes="bg-sl-gray-400 w-48"></PulseLoader>
    </div>
  </div>
</template>
