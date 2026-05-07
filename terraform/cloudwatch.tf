###############################################################################
# @file
# @brief CloudWatch log groups for Lambda functions.
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
resource "aws_cloudwatch_log_group" "lambda_uplink" {
  name              = "/aws/lambda/CloudLightUplink"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_websocket" {
  name              = "/aws/lambda/CloudLightWebsocket"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_http" {
  name              = "/aws/lambda/CloudLightHttp"
  retention_in_days = 7
}
