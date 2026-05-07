###############################################################################
# @file
# @brief HTTP API Gateway v2 for REST proxy to Lambda.
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
  api_stage = "prod"
}

resource "aws_apigatewayv2_api" "http" {
  name          = "CloudLightHttp"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
  }
}

resource "aws_apigatewayv2_integration" "http_lambda" {
  api_id           = aws_apigatewayv2_api.http.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  description            = "HTTP Lambda"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.http.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "app_http_api_gateway_resource_route" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.http_lambda.id}"
}

resource "aws_apigatewayv2_stage" "http" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = local.api_stage
  auto_deploy = true
}
