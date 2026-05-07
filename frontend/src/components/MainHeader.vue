<!--
  @file
  @brief Top header bar showing Silicon Labs and Amazon Sidewalk logos.

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
