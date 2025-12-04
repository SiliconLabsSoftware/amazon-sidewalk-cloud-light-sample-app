resource "aws_iot_topic_rule" "rule" {
  name        = "CloudLightUplink"
  enabled     = true
  sql         = "SELECT * FROM 'CloudLight/received'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.uplink.arn
  }

  error_action {
    lambda {
      function_arn = aws_lambda_function.uplink.arn
    }
  }
}

data "aws_iot_endpoint" "data_ats" {
  endpoint_type = "iot:Data-ATS"
}

resource "aws_iot_policy" "cloud_light_soft_device" {
  name = "CloudLightSoftDevice"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "iot:Connect",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:client/$${iot:Connection.Thing.ThingName}"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Publish",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/*"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Receive",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/*"
      },
      {
        "Effect" : "Allow",
        "Action" : "iot:Subscribe",
        "Resource" : "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topicfilter/$${iot:Connection.Thing.ThingName}/*"
      }
    ]
  })
}
