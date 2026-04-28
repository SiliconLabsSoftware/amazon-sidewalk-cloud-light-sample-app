# Limitations and Production Considerations

This is a sample application. It demonstrates the mechanics of connecting Sidewalk devices to a cloud backend and web frontend, but it intentionally cuts corners that a production system must not.

## What This Sample App Demonstrates

- End-to-end connectivity: Sidewalk device → cloud → browser, and back
- Bidirectional communication with sensors (uplink) and actuators (downlink)
- Real-time updates pushed to the browser via WebSocket
- Device pairing with automatic capability discovery
- Round-trip latency measurement (ping/pong and tink/tonk)
- Infrastructure-as-code deployment with Terraform
- Dockerized deployment toolchain for reproducibility

## What It Is NOT Meant to Demonstrate

- Production-grade security or access control
- Multi-tenant or multi-user architecture
- High availability, fault tolerance, or scalability patterns
- Device fleet management at scale
- OTA firmware updates or device lifecycle management
- Compliance with any regulatory framework

## Security Limitations

These are the most important differences between this sample and what a production deployment requires.

**Single shared password.** The entire application is protected by one global password (`FRONTEND_PASSWORD`). There are no user accounts, no roles, no per-user permissions. Anyone with the password has full access to all devices.

**Password in URL.** During device pairing, the cloud sends a "magic URL" containing the plaintext password to the device (for QR code display). This URL may appear in browser history, server logs, and HTTP referrer headers.

**Password stored in localStorage.** The frontend stores the password in the browser's `localStorage` as plaintext. Any JavaScript running on the same origin can read it.

**No API Gateway authorizer.** Authentication is handled inside the Lambda function code, not at the API Gateway level. This means every request reaches the Lambda before being rejected — there is no gateway-level protection against unauthorized traffic.

**WebSocket messages not re-authenticated.** Once a WebSocket connection is established, all subsequent messages are accepted without further authentication. A connection that was valid at connect time stays authorized until it disconnects.

**No encryption-at-rest configuration.** DynamoDB uses default encryption. No customer-managed KMS keys are configured.

## How a Production Deployment Should Differ

- **Per-user identity** — Use Amazon Cognito, OAuth 2.0, or another identity provider for individual user accounts
- **API Gateway authorizers** — JWT or Lambda authorizers at the gateway level to reject unauthorized requests before they reach application code
- **Per-device ownership and access control** — Associate devices with specific users or organizations, enforce authorization on every API call
- **Secrets management** — Store secrets in AWS Secrets Manager or Parameter Store instead of environment variables and Terraform variables
- **WAF and rate limiting** — AWS WAF in front of API Gateway and CloudFront to prevent abuse
- **Input validation hardening** — Stricter validation of all inputs, especially device messages
- **Monitoring and alerting** — CloudWatch alarms, dashboards, and SNS notifications beyond basic log groups
- **DynamoDB backup** — Enable point-in-time recovery and/or scheduled backups
- **Multi-region / disaster recovery** — Consider cross-region replication for critical workloads
- **Custom domain and TLS** — Use Route 53 and ACM for a custom domain with your own TLS certificate on CloudFront

## Other Limitations

**24-hour TTL on all records.** Device and connection records expire approximately 24 hours after their last update. A device that stops sending uplinks will disappear from the application. This is intentional for a sample app (no stale data accumulates) but inappropriate for production.

**In-memory chart history.** The frontend keeps up to 50 data points per capability for charting, held only in browser memory. Refreshing the page or reconnecting clears all chart history. There is no persistent time-series storage.

**No custom domain.** The frontend is served via the auto-generated CloudFront domain (`d1234.cloudfront.net`). There is no Route 53 or custom domain configuration.

**No blue/green or canary deployments.** `terraform apply` updates resources in place. There is no staged rollout.

**Terraform state in a simple S3 backend.** The state bucket has no versioning, replication, or access logging configured.

**CloudWatch log retention.** Lambda log groups are configured with 7-day retention. Adjust for your needs in production.
