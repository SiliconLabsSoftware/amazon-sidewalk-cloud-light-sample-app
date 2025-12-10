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
  name        = var.api_stage
  auto_deploy = true
}
