/***************************************************************************//**
 * @file
 * @brief Composable for a short-lived active flag cleared after a timeout.
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
import { ref } from "vue";

export function useTemporaryEffect(timeout: number) {
  let timerHandle: number | undefined = undefined;
  const active = ref(false);

  const reset = () => {
    clearTimeout(timerHandle);
  };
  const begin = () => {
    active.value = true;
    timerHandle = setTimeout(() => (active.value = false), timeout);
  };

  return { active, begin, reset };
}
