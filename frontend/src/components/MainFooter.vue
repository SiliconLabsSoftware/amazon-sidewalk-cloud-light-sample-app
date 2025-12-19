<script setup lang="ts">
import { computed } from "vue";

const copyright = computed(() => {
  return `Copyright © ${new Date().getFullYear()} Silicon Laboratories. All rights reserved.`;
});
</script>

<template>
  <div class="w-full py-4 text-center text-sm text-white md:bg-sl-gray-800">
    {{ copyright }}
  </div>
  <div class="bg-white py-1 md:hidden">
    <img
      src="/images/amazon-sidewalk.svg"
      alt="Amazon Sidewalk logo"
      class="mx-auto mt-1 w-[255px]"
    />
  </div>
</template>
