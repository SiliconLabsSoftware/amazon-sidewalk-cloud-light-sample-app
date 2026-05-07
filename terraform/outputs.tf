###############################################################################
# @file
# @brief Exported Terraform outputs for APIs, IoT, and frontend URLs.
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
output "aws_region" {
  value = var.aws_region
}

output "aws_account_id" {
  value = var.aws_account_id
}

output "iot_endpoint" {
  value = data.aws_iot_endpoint.data_ats.endpoint_address
}

output "rest_url" {
  value = aws_apigatewayv2_stage.http.invoke_url
}

output "wss_url" {
  value = aws_apigatewayv2_stage.websocket.invoke_url
}

output "frontend_s3_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "public_cloudfront_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "public_cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}
