<!--
  @file
  @brief Uplink/sensor capabilities panel with titled header and default slot body.

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
import CardPanel from "@/components/CardPanel.vue";
</script>

<template>
  <CardPanel>
    <div class="flex items-center p-4 text-left text-[26px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mr-2 inline-block w-10"
        viewBox="0 0 40.3 28"
        style="enable-background: new 0 0 40.3 28"
        xml:space="preserve"
      >
        <path
          d="m8.2 2.8-.7-.6c0-.1-.2-.2-.3-.2s-.3.1-.4.2C3.8 5.3 2.2 9.5 2.2 14s1.6 8.6 4.6 11.9c.1 0 .2.1.4.1s.3-.1.4-.1l.7-.7c.1-.1.2-.2.2-.4s-.1-.2-.2-.4c-2.6-2.8-4-6.5-4-10.4 0-3.9 1.4-7.6 4-10.4.1-.1.2-.2.2-.4s-.2-.2-.3-.4zm5.3 4.4-.7-.7c-.1-.1-.2-.1-.4-.1s-.2 0-.4.1c-1.6 1.8-2.9 5.1-2.9 7.5 0 2.4 1.3 5.8 2.9 7.6.1.1.2.1.4.1s.3-.1.4-.1l.7-.8c.1-.1.2-.2.2-.3s-.1-.2-.2-.4c-1.2-1.4-2.2-4.2-2.2-6.1 0-1.9 1-4.6 2.2-6.1.1-.1.1-.2.1-.4s-.1-.2-.1-.3zm20.1-5c-.1-.1-.3-.2-.4-.2s-.3.1-.4.2l-.7.7c-.1.1-.1.2-.1.3s.1.2.2.4c2.6 2.8 4.1 6.5 4.1 10.4 0 3.9-1.4 7.6-4.1 10.4-.2.1-.2.3-.2.4s.1.2.2.4l.7.7c.1.1.2.2.4.2s.2-.1.4-.2c2.9-3.2 4.6-7.4 4.6-11.9s-1.8-8.7-4.7-11.8zM20.2 10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.4-9.5-.7.7c-.1.1-.2.2-.2.4s.1.2.2.4c1.2 1.4 2.2 4.2 2.2 6.1 0 1.9-1 4.6-2.2 6.1-.1.1-.2.2-.2.4s.1.2.2.4l.7.7c.1.1.2.2.4.2s.2-.1.4-.2c1.6-1.8 2.9-5.1 2.9-7.5S30 8.4 28.4 6.6c-.1-.1-.2-.1-.4-.1s-.3-.1-.4 0z"
          style="fill: #555"
        />
      </svg>
      <span class="text-bold">Uplink</span>
    </div>
    <div class="bg-sl-gray-700 p-3 text-[12px] text-white">Sensor type capabilities</div>
    <div class="p-4">
      <slot></slot>
    </div>
  </CardPanel>
</template>
