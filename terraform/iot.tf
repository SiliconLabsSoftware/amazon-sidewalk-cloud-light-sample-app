###############################################################################
# @file
# @brief AWS IoT Core topic rules, endpoint, and Sidewalk destination wiring.
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
locals {
  mqtt_topic_wireless_received = "CloudLight/received"
}

resource "aws_iot_topic_rule" "wireless" {
  name        = "CloudLightUplink"
  enabled     = true
  sql         = "SELECT * FROM '${local.mqtt_topic_wireless_received}'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.uplink.arn
  }

  error_action {
    lambda {
      function_arn = aws_lambda_function.uplink.arn
    }
  }
}

resource "aws_iot_topic_rule" "simulated" {
  name        = "CloudLightUplinkSimulated"
  enabled     = true
  sql         = "SELECT data, clientId() AS clientId FROM 'CloudLight/simulated/+/received'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.uplink.arn
  }

  error_action {
    lambda {
      function_arn = aws_lambda_function.uplink.arn
    }
  }
}

data "aws_iot_endpoint" "data_ats" {
  endpoint_type = "iot:Data-ATS"
}

resource "aws_iot_policy" "cloud_light_soft_device" {
  name = "CloudLightSoftDevice"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "iot:Connect",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:client/$${iot:Connection.Thing.ThingName}"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Publish",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/*"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Receive",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/*"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Subscribe",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topicfilter/$${iot:Connection.Thing.ThingName}/*"
      }
    ]
  })
}
