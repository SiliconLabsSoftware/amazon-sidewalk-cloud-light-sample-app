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
