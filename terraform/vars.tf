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
