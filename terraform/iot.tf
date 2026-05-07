###############################################################################
# @file
# @brief AWS IoT Core topic rules, endpoint, and Sidewalk destination wiring.
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
