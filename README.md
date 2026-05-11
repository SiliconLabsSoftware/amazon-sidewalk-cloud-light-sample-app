# Amazon Sidewalk Cloud Light Sample Application

A sample cloud backend and web frontend for Amazon Sidewalk devices. This application demonstrates end-to-end connectivity between Sidewalk-enabled embedded devices and a browser-based dashboard, with bidirectional communication, real-time state updates, and latency measurement.

The device firmware for this application is found in the companion **Cloud Light Embedded Sample Application**.

## Deployment Costs

This project uses AWS infrastructure. Most components are billed based on usage and free tier offerings apply. Depending on your usage profile and free tier credits availability, **you may be billed for the use of AWS resources**. See [AWS Services Used](docs/architecture.md#aws-services-used) for a list of cloud resources used.

## Quick Start

**Prerequisites:** AWS account in a [Sidewalk-enabled region](https://docs.sidewalk.amazon/getting-started/), Docker installed, and configured AWS credentials (`~/.aws/credentials`) with [sufficient permissions](docs/deployment.md#aws-permissions) (least-privilege IAM policies are provided in `docs/`).

1. Clone this repository.
2. Copy the configuration file template and edit it:
  ```bash
   cp configure.sh-sample configure.sh
   # Edit configure.sh — set AWS_REGION and AWS_PROFILE at minimum
  ```
3. Build the Docker image (bundles Node.js, Terraform, and AWS CLI):
  ```bash
   docker compose build
  ```
4. Deploy:
  ```bash
   docker compose run --rm deployer
  ```
   This initializes the Terraform backend, deploys all AWS infrastructure, builds and uploads the frontend, and prints the application URL.

5. At this point, you can set up your embedded device and run it. It will register and be available from the deployed frontend.
6. Open the application URL and log in with your `FRONTEND_PASSWORD` (auto-generated if left empty — check `configure.sh` after first deploy). Alternatively you can read the QR code from the device's display, which links to the device's dashboard web page directly.

For a detailed guide, native deployment without Docker, CI/CD setup, and other options, see the [Deployment Guide](docs/deployment.md).

## Repository Structure


| Folder / File               | Description                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `device/`                   | MQTT-based device simulator (Node.js). Includes scripts to create/delete simulated IoT things and a TUI-based simulator |
| `frontend/`                 | Web frontend (Vue 3 + Vite + Tailwind). Builds to static files deployed to S3/CloudFront                                |
| `lambda/`                   | AWS Lambda functions (TypeScript). Three handlers: uplink processing, HTTP API, WebSocket API                           |
| `terraform/`                | Infrastructure as code. All AWS resources defined here (DynamoDB, Lambda, API Gateway, IoT rules, S3, CloudFront, IAM)  |
| `docs/`                     | Documentation and IAM policy files for [AWS permissions](docs/deployment.md#aws-permissions)                            |
| `run.sh`                    | Deployment orchestration script — the main entry point for building and deploying                                       |
| `Dockerfile`                | Docker image with Node.js, Terraform, and AWS CLI pre-installed                                                         |
| `docker-compose.yml`        | Docker Compose config for running deployments in a container                                                            |
| `configure.sh-sample`       | Template for deployment configuration (copy to `configure.sh`)                                                          |
| `certificate-fix.sh-sample` | Template for docker container corporate proxy TLS certificate fix                                                       |


## Documentation


| Document                                         | Description                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [Architecture Overview](docs/architecture.md)    | System description, architecture diagram, AWS services used                          |
| [Deployment Guide](docs/deployment.md)           | Docker and native deployment, configuration, AWS permissions, CI/CD, certificate fix |
| [Data Flow](docs/data-flow.md)                   | Uplink/downlink paths, REST API, pairing flow, simulated device path                 |
| [DynamoDB Data Model](docs/data-model.md)        | Single-table design, key schema, item types and fields                               |
| [WebSocket Protocol](docs/websocket-protocol.md) | Connection lifecycle, authentication, message types                                  |
| [Device Protocol](docs/device-protocol.md)       | ASCII message protocol between device and cloud                                      |
| [Device Simulator](docs/device-simulator.md)     | Setting up and using the MQTT-based device simulator                                 |
| [Limitations](docs/limitations.md)               | Scope, security considerations, production differences                               |
| [Troubleshooting](docs/troubleshooting.md)       | Common issues and solutions                                                          |


## License
See the [LICENSE.md](./LICENSE.md) file for details.

## Contributions

This sample application project is not accepting contributions at this time.

## Disclaimer

This example sample application is considered to be EXPERIMENTAL QUALITY which implies that the code provided in the repository has not been formally tested and is provided as-is. It is not suitable for production environments. See [Limitations](docs/limitations.md) for details. In addition, this code will not be maintained and there may be no bug maintenance planned for these resources. Silicon Labs may update projects from time to time.
