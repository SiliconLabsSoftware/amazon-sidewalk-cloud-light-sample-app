# Device uplink lambda:
data "archive_file" "uplink_lambda" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/uplink.mjs"
  output_path = "${path.module}/.terraform/uplink.zip"
}

resource "aws_lambda_function" "uplink" {
  function_name    = "CloudLightUplink"
  handler          = "uplink.handler"
  runtime          = "nodejs24.x"
  filename         = data.archive_file.uplink_lambda.output_path
  source_code_hash = filebase64sha256("${data.archive_file.uplink_lambda.output_path}")
  role             = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      REGION         = var.aws_region
      DYNAMODB_TABLE = var.dynamodb_table
      IOT_ENDPOINT   = "https://${data.aws_iot_endpoint.data_ats.endpoint_address}"
    }
  }
  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda_uplink.name
  }
  depends_on = [aws_cloudwatch_log_group.lambda_uplink]
}

resource "aws_lambda_permission" "iot_lambda_uplink_wireless" {
  statement_id  = "AllowExecutionFromAWSIoTWireless"
  action        = "lambda:InvokeFunction"
  principal     = "iot.amazonaws.com"
  function_name = aws_lambda_function.uplink.function_name
  source_arn    = aws_iot_topic_rule.wireless.arn
}

resource "aws_lambda_permission" "iot_lambda_uplink_simulated" {
  statement_id  = "AllowExecutionFromAWSIoTSimulated"
  action        = "lambda:InvokeFunction"
  principal     = "iot.amazonaws.com"
  function_name = aws_lambda_function.uplink.function_name
  source_arn    = aws_iot_topic_rule.simulated.arn
}

# HTTP API Gateway handler lambda:
data "archive_file" "http_lambda" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/http.mjs"
  output_path = "${path.module}/.terraform/http.zip"
}

resource "aws_lambda_function" "http" {
  function_name    = "CloudLightHttp"
  handler          = "http.handler"
  runtime          = "nodejs24.x"
  filename         = data.archive_file.http_lambda.output_path
  source_code_hash = filebase64sha256("${data.archive_file.http_lambda.output_path}")
  role             = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      REGION            = var.aws_region
      DYNAMODB_TABLE    = var.dynamodb_table
      FRONTEND_PASSWORD = var.frontend_password
    }
  }
  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda_http.name
  }
  depends_on = [aws_cloudwatch_log_group.lambda_http]

}

resource "aws_lambda_permission" "apigw_lambda_http" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  function_name = aws_lambda_function.http.function_name
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/${aws_apigatewayv2_stage.http.name}/*/*"
  depends_on    = [aws_apigatewayv2_api.http]
}

# Websocket API Gateway handler lambda:
data "archive_file" "websocket_lambda" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/websocket.mjs"
  output_path = "${path.module}/.terraform/websocket.zip"
}

resource "aws_lambda_function" "websocket" {
  function_name    = "CloudLightWebsocket"
  handler          = "websocket.handler"
  runtime          = "nodejs24.x"
  filename         = data.archive_file.websocket_lambda.output_path
  source_code_hash = filebase64sha256("${data.archive_file.websocket_lambda.output_path}")
  role             = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      REGION             = var.aws_region
      DYNAMODB_TABLE     = var.dynamodb_table
      FRONTEND_PASSWORD  = var.frontend_password
      WEBSOCKET_ENDPOINT = "https://${aws_apigatewayv2_api.websocket.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage}"
    }
  }
  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda_websocket.name
  }
  depends_on = [aws_cloudwatch_log_group.lambda_websocket]

}

resource "aws_lambda_permission" "apigw_lambda_websocket" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  function_name = aws_lambda_function.websocket.function_name
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
  depends_on    = [aws_apigatewayv2_deployment.websocket]
}

# Common permissions:
resource "aws_iam_role" "lambda_exec" {
  name               = "CloudLightLambdaExec"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "policy" {
  name        = "CloudLightLambdaPolicy"
  description = ""

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "logs:CreateLogGroup",
            "Resource": "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/CloudLightUplink:*",
                "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/CloudLightHttp:*",
                "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/CloudLightWebsocket:*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "execute-api:*",
            "Resource": "arn:aws:execute-api:${var.aws_region}:${var.aws_account_id}:*/*/*/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iot:Publish"
            ],
            "Resource": [
                "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/*"
            ]
        },
        {
          "Effect": "Allow",
          "Action": "iotwireless:*",
          "Resource": "arn:aws:iotwireless:${var.aws_region}:${var.aws_account_id}:*"
        },
        {
            "Sid": "DynamoDBTableAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table}"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "cloud_light_lambda" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.policy.arn
  depends_on = [
    aws_iam_policy.policy
  ]
}
