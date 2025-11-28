resource "aws_cloudwatch_log_group" "lambda_uplink" {
  name              = "/aws/lambda/CloudLightUplink"
  retention_in_days = 7
}