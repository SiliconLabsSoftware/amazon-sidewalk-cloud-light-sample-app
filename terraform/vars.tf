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

variable "product" {
  default = ""
  validation {
    condition     = length(var.product) > 0
    error_message = "Product is required"
  }
}

variable "dynamodb_table" {
  default = "CloudLight"
}
