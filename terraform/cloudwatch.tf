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
