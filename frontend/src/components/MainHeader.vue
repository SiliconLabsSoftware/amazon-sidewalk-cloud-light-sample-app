<!--
  @file
  @brief Top header bar showing Silicon Labs and Amazon Sidewalk logos.

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
<template>
  <header
    class="flex w-full flex-row items-center justify-around border-b border-b-sl-gray-800 bg-white px-4 py-2 text-sm"
  >
    <img
      src="/images/silicon-labs-logo.svg"
      alt="Silicon Labs Logo"
      class="my-1 w-[260px] md:my-0 md:w-[320px]"
    />
    <img
      src="/images/amazon-sidewalk.svg"
      alt="Amazon Sidewalk logo"
      class="mt-1 hidden w-[255px] md:block"
    />
  </header>
</template>
