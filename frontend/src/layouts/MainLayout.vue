<!--
  @file
  @brief Primary app chrome with header/footer, auth gating, and authenticated router outlet.

  # License
  Copyright 2026 Silicon Laboratories Inc. www.silabs.com

  SPDX-License-Identifier: Zlib

  The licensor of this software is Silicon Laboratories Inc.

  This software is provided 'as-is', without any express or implied
  warranty. In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

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
