/***************************************************************************//**
 * @file
 * @brief Composable tying route deviceId param to the device store.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
 *
 ******************************************************************************/
import { computed, ref } from "vue";
import type { Ref } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import { useDeviceStore } from "@/stores/device";

export function useRoutedDevice() {
  const route = useRoute();
  const deviceId: Ref<string> = ref(route.params.deviceId as string);
  const deviceStore = useDeviceStore();
  const device = computed(() => deviceStore.getDevice(deviceId.value));

  onBeforeRouteUpdate(async (to) => {
    deviceId.value = to.params.deviceId as string;
  });

  return { device, deviceId };
}
