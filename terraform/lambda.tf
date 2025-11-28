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
      REGION                = var.aws_region
    }
  }
  logging_config {
    log_format            = "Text"
    log_group             = aws_cloudwatch_log_group.lambda_uplink.name
  }
  depends_on = [aws_cloudwatch_log_group.lambda_uplink]
}

resource "aws_lambda_permission" "iot_lambda_uplink" {
  statement_id  = "AllowExecutionFromAWSIoT"
  action        = "lambda:InvokeFunction"
  principal     = "iot.amazonaws.com"
  function_name = aws_lambda_function.uplink.function_name
  source_arn    = aws_iot_topic_rule.rule.arn
}

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
          "Action": "cloudwatch:PutMetricData",
          "Resource": "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/CloudLightUplink:*"
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
            "Resource": "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/CloudLight"
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

