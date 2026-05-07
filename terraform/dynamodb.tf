###############################################################################
# @file
# @brief DynamoDB table for application data.
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
locals {
  dynamodb_table = "CloudLight"
}

resource "aws_dynamodb_table" "table" {
  name         = local.dynamodb_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  ttl {
    attribute_name = "expires"
    enabled        = true
  }
}
