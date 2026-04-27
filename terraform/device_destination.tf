resource "awscc_iam_role" "iot_destination_role" {
  role_name = "CloudLightDestinationRole"
  assume_role_policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iotwireless.amazonaws.com"
        }
      }
    ]
  })
}

data "aws_iam_policy_document" "iot_destination_policy" {
  statement {
    effect = "Allow"
    actions = [
      "iot:Publish",
    ]
    resources = [
      "arn:aws:iot:${var.aws_region}:${var.aws_account_id}:topic/${local.mqtt_topic_wireless_received}",
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "iot:DescribeEndpoint",
    ]
    resources = [
      "*",
    ]
  }
}

resource "awscc_iam_role_policy" "iot_destination_policy" {
  policy_name = "CloudLightDestinationPolicy"
  role_name   = awscc_iam_role.iot_destination_role.role_name
  policy_document = jsonencode(
    jsondecode(data.aws_iam_policy_document.iot_destination_policy.json)
  )
}

resource "awscc_iotwireless_destination" "cloud_light_destination" {
  name            = "CloudLightDestination"
  description     = "CloudLight destination for uplink messages"
  expression_type = "MqttTopic"
  expression      = local.mqtt_topic_wireless_received
  role_arn        = awscc_iam_role.iot_destination_role.arn
}
