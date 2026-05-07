###############################################################################
# @file
# @brief Terraform backend, required providers, and AWS provider blocks.
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
terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    awscc = {
      source = "hashicorp/awscc"
    }
    random = {
      source = "hashicorp/random"
    }
  }

  backend "s3" {
  }
}

provider "aws" {
  region = var.aws_region
}

provider "awscc" {
  region = var.aws_region
}
