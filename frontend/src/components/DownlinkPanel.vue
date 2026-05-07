<!--
  @file
  @brief Downlink/actuator capabilities panel with header art and slot above device imagery.

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
import CardPanel from "@/components/CardPanel.vue";
</script>

<template>
  <CardPanel class="pb-[125px]">
    <div class="flex items-center p-4 text-left text-[26px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mr-2 inline-block w-10"
        viewBox="0 0 40.3 28"
        style="enable-background: new 0 0 40.3 28"
        xml:space="preserve"
      >
        <path
          d="M35.2 2h-30c-1.7 0-3 1.4-3 3v18c0 1.7 1.3 3 3 3h30c1.6 0 3-1.3 3-3V5c0-1.6-1.4-3-3-3zm1 21c0 .6-.5 1-1 1h-30c-.6 0-1-.4-1-1V5c0-.5.4-1 1-1h30c.5 0 1 .5 1 1v18zm-23.5-8.2v-1.5c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm6 0v-1.5c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm6 0v-1.5c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm6 0v-1.5c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm-21 5v-1.5c0-.4-.4-.8-.8-.8H7.4c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm24 0v-1.5c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4-.1.8-.4.8-.8zm-24-10V8.2c0-.4-.4-.8-.8-.8H7.4c-.4.1-.7.5-.7.8v1.5c0 .4.3.8.8.8H9c.3 0 .7-.3.7-.7zm6 0V8.2c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4 0 .8-.3.8-.7zm6 0V8.2c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4 0 .8-.3.8-.7zm6 0V8.2c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4 0 .8-.3.8-.7zm6 0V8.2c0-.4-.4-.8-.8-.8h-1.5c-.4 0-.8.4-.8.8v1.5c0 .4.3.8.8.8h1.5c.4 0 .8-.3.8-.7zm-6 9.4v-.5c0-.4-.4-.8-.8-.8H13.4c-.4 0-.8.4-.8.8v.5c0 .4.3.8.8.8h13.5c.4 0 .8-.3.8-.8z"
          style="fill: #555"
        />
      </svg>
      <span class="text-bold">Downlink</span>
    </div>
    <div class="bg-sl-gray-700 p-3 text-[12px] wrap-break-word text-white">
      Actuator type capabilities
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
  </CardPanel>
  <div class="relative top-[-120px] mx-[30px]">
    <picture class="mx-auto">
      <source srcset="/images/EFR32xG24.webp" type="image/webp" />
      <img src="/images/EFR32xG24.png" alt="Silicon Labs EFR32xG24" class="w-[290px]" />
    </picture>
  </div>
</template>
