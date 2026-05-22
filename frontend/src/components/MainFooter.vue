<!--
  @file
  @brief Footer with dynamic Silicon Labs copyright and Amazon Sidewalk branding.

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
