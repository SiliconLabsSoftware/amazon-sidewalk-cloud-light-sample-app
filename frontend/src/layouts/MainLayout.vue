<!--
  @file
  @brief Primary app chrome with header/footer, auth gating, and authenticated router outlet.

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
import MainFooter from "@/components/MainFooter.vue";
import MainHeader from "@/components/MainHeader.vue";
import { useApplicationStore } from "@/stores/application";
import CardPanel from "@/components/CardPanel.vue";

const applicationStore = useApplicationStore();
</script>

<template>
  <div class="flex min-h-screen w-full flex-col text-center">
    <MainHeader />
    <main class="flex-1 py-0 pt-6">
      <div v-if="applicationStore.isAuthenticating" class="mx-auto w-full max-w-2xl px-4">
        <CardPanel class="mb-4 h-16 animate-pulse" />
        <CardPanel class="mb-4 h-64 animate-pulse" />
        <CardPanel class="mb-4 h-16 animate-pulse" />
      </div>
      <div v-else-if="!applicationStore.isAuthenticated" class="mx-auto w-full py-24">
        <CardPanel class="mx-auto w-[360px] rounded-2xl bg-white px-12 py-8 text-center shadow-lg">
          <p class="mt-4 text-red-500">Authentication failed.</p>
          <p class="mt-4 text-sl-gray-900">Log in to continue.</p>
          <RouterLink :to="{ name: 'login' }">
            <button
              class="mt-8 flex w-full items-center justify-center rounded border border-transparent bg-teal-700 p-2 text-base font-medium text-white uppercase hover:bg-teal-800 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 focus:outline-none"
            >
              Log in
            </button>
          </RouterLink>
        </CardPanel>
      </div>
      <RouterView v-else />
    </main>
    <MainFooter />
  </div>
</template>
