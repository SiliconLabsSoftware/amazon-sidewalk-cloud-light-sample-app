###############################################################################
# @file
# @brief IoT wireless destination IAM role and policy.
###############################################################################
# # License
# Copyright 2026 Silicon Laboratories Inc. www.silabs.com
###############################################################################
#
# SPDX-License-Identifier: Zlib
#
# The licensor of this software is Silicon Laboratories Inc.
#
# This software is provided 'as-is', without any express or implied
# warranty. In no event will the authors be held liable for any damages
# arising from the use of this software.
#
# Permission is granted to anyone to use this software for any purpose,
# including commercial applications, and to alter it and redistribute it
# freely, subject to the following restrictions:
#
# 1. The origin of this software must not be misrepresented; you must not
#    claim that you wrote the original software. If you use this software
#    in a product, an acknowledgment in the product documentation would be
#    appreciated but is not required.
# 2. Altered source versions must be plainly marked as such, and must not be
#    misrepresented as being the original software.
# 3. This notice may not be removed or altered from any source distribution.
#
###############################################################################
resource "awscc_iam_role" "iot_destination_role" {
  role_name = "CloudLightDestinationRole"
  assume_role_policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iotwireless.amazonaws.com"
        }
      }
    ]
  })
}

data "aws_iam_policy_document" "iot_destination_policy" {
  statement {
    effect = "Allow"
    actions = [
      "iot:Publish",
    ]
    resources = [
      "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/${local.mqtt_topic_wireless_received}",
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "iot:DescribeEndpoint",
    ]
    resources = [
      "*",
    ]
  }
}

resource "awscc_iam_role_policy" "iot_destination_policy" {
  policy_name = "CloudLightDestinationPolicy"
  role_name   = awscc_iam_role.iot_destination_role.role_name
  policy_document = jsonencode(
    jsondecode(data.aws_iam_policy_document.iot_destination_policy.json)
  )
}

resource "awscc_iotwireless_destination" "cloud_light_destination" {
  name            = "CloudLightDestination"
  description     = "CloudLight destination for uplink messages"
  expression_type = "MqttTopic"
  expression      = local.mqtt_topic_wireless_received
  role_arn        = awscc_iam_role.iot_destination_role.arn
}
