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
