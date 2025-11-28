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
