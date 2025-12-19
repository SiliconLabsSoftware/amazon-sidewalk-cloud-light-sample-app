<script setup lang="ts">
import MainFooter from "@/components/MainFooter.vue";
import MainHeader from "@/components/MainHeader.vue";
</script>

<template>
  <div class="flex min-h-screen w-full flex-col text-center">
    <MainHeader />
    <main class="flex-1 py-0 pt-6">
      <RouterView />
    </main>
    <MainFooter />
  </div>
</template>
