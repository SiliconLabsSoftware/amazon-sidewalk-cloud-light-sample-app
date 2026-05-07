###############################################################################
# @file
# @brief Root module input variables and validation.
###############################################################################
# # License
# Copyright 2026 Silicon Laboratories Inc. www.silabs.com
###############################################################################
#
# SPDX-License-Identifier: LicenseRef-MSLA
#
# The licensor of this software is Silicon Laboratories Inc. Your use of this
# software is governed by the terms of the Silicon Labs Master Software License
# Agreement (MSLA) available at
# www.silabs.com/about-us/legal/master-software-license-agreement
# By installing, copying or otherwise using this software, you agree to the
# terms of the MSLA.
#
###############################################################################

# injected via run.sh export

variable "aws_account_id" {
  default = ""
  validation {
    condition     = length(var.aws_account_id) > 0
    error_message = "AWS Account ID is required"
  }
}

variable "aws_region" {
  default = ""
  validation {
    condition     = length(var.aws_region) > 0
    error_message = "AWS Region is required"
  }
}

variable "frontend_password" {
  default = ""
  validation {
    condition     = length(var.frontend_password) > 0
    error_message = "Frontend password is required"
  }
}
