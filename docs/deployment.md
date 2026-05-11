# Deployment Guide

## Prerequisites

- **AWS account** in a [Sidewalk-enabled region](https://docs.sidewalk.amazon/getting-started/) (e.g. `us-east-1`)
- **AWS credentials** configured — either a `~/.aws/credentials` file with a named profile or environment variables (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
- **Docker** installed (needed only for the dockerized deployment method)
- **Sidewalk device provisioning** is done **after** cloud deployment — the IoT Wireless destination created by Terraform must exist before devices can be registered. Device provisioning is documented in the companion Cloud Light Embedded Sample Application

## Configuration

Copy the sample configuration file and edit it:

```bash
cp configure.sh-sample configure.sh
```

The file contains:

```bash
export AWS_REGION="us-east-1"       # must be a Sidewalk-enabled region
export AWS_PROFILE="default"        # comment out if using env var credentials
export TERRAFORM_BACKEND_BUCKET=""  # optional — auto-generated if empty
export FRONTEND_PASSWORD=""         # optional — auto-generated if empty, max 20 chars
```

`AWS_REGION` — Required. The AWS region to deploy into.

`AWS_PROFILE` — The named profile from `~/.aws/credentials`. Comment this out if you provide credentials via environment variables instead.

`TERRAFORM_BACKEND_BUCKET` — S3 bucket for Terraform remote state. Leave empty for auto-generation on first deploy. The generated name is saved back to `configure.sh`.

`FRONTEND_PASSWORD` — The shared password used to authenticate the web frontend. Leave empty for auto-generation (4-digit numeric). Maximum 20 characters — this limit exists because the password is embedded in a device downlink URL message that must fit within Sidewalk transport constraints. The generated password is saved back to `configure.sh`.

### Environment variable alternative

Instead of `configure.sh`, you can provide configuration via environment variables. This is the approach used in CI/CD pipelines. The deploy script auto-detects the mode: if `AWS_REGION` is already set in the environment, it uses **environment mode**; otherwise it loads from `configure.sh` (**config-file mode**).

In environment mode, these variables are required: `AWS_REGION`, `TERRAFORM_BACKEND_BUCKET`, `FRONTEND_PASSWORD`. Auto-generation is not available because generated values cannot be persisted back to the environment (e.g. on a CI runner).

AWS credentials are separate and can be provided via `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (+ optional `AWS_SESSION_TOKEN`) or via `AWS_PROFILE` with a mounted credentials file.

## AWS Permissions

The IAM user or role running deployments needs permissions across multiple AWS services. For a quick start, `AdministratorAccess` works. For least-privilege, three IAM policy documents are provided in the `docs/` folder. Create these as IAM policies and attach them to your deployer user or role. (See [this](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html) AWS documentation for how to create policies.)

**In every policy file, replace `ACCOUNT_ID` with your 12-digit AWS account ID** (e.g. `123456789012`). You can find your account ID in the AWS console or by running `aws sts get-caller-identity`.

| Policy file | Purpose | When needed |
|---|---|---|
| [`policy-terraform-backend.json`](policy-terraform-backend.json) | Terraform state S3 bucket and DynamoDB lock table | Every deployment (init step) |
| [`policy-deploy.json`](policy-deploy.json) | All infrastructure: Lambda, API Gateway, IoT Core, IoT Wireless, S3, CloudFront, DynamoDB, CloudWatch Logs, IAM roles/policies | Every deployment (tf step) |
| [`policy-simulated-device.json`](policy-simulated-device.json) | IoT thing and certificate management for the device simulator | Only when using the [device simulator](device-simulator.md) |

The deployer also needs `sts:GetCallerIdentity` (allowed by default for all IAM identities) — the deploy script uses it to resolve the AWS account ID.

### Simulated device permissions

The `policy-simulated-device.json` policy covers both `device/create.sh` and `device/delete.sh`. This policy is only needed if you plan to use the simulated device — it is not required for deploying or operating the main application. See [Device Simulator](device-simulator.md) for usage.

## Docker Deployment (Recommended)

Docker is the primary deployment path. The Docker image bundles Node.js, Terraform, and the AWS CLI, so you do not need to install any of those on your host machine.

### Build the image

```bash
docker compose build
```

This builds a `cloud-light` image based on `node:24-slim` with Terraform 1.14 and AWS CLI v2 installed.

### Deploy

```bash
docker compose run --rm deployer
```

This runs `./run.sh deploy` inside the container, which executes:

1. **init** — Creates the S3 backend bucket and DynamoDB lock table (if they don't exist), then runs `terraform init`
2. **lambda-deps** — `npm install` in `lambda/`
3. **tf** — Builds Lambda functions, then `terraform apply -auto-approve`
4. **outputs** — Extracts Terraform outputs (URLs, bucket names, CloudFront ID)
5. **ui-deps** — `npm install` in `frontend/`
6. **ui** — Builds the frontend, uploads to S3, invalidates CloudFront cache

The container bind-mounts:

- The project directory → `/cloud-light` (so your code and `configure.sh` are available)
- `~/.aws/credentials` → `/root/.aws/credentials` (read-only)

At the end, the deploy prints the application URL.

### Run individual commands

You can pass any `run.sh` command to the deployer:

```bash
docker compose run --rm deployer plan       # terraform plan (preview changes)
docker compose run --rm deployer destroy    # tear down all infrastructure
docker compose run --rm deployer tf         # just apply terraform (skip init, frontend)
docker compose run --rm deployer outputs    # re-extract terraform outputs
docker compose run --rm deployer ui         # rebuild and redeploy frontend only
docker compose run --rm deployer version    # print toolchain versions
```

### Passing AWS credentials

**Default (credentials file):** The `docker-compose.yml` mounts `~/.aws/credentials` read-only. Set `AWS_PROFILE` in `configure.sh` to select the profile.

**Environment variables:** For environments without a credentials file, pass credentials as environment variables:

```bash
docker compose run --rm \
  -e AWS_ACCESS_KEY_ID=AKIA... \
  -e AWS_SECRET_ACCESS_KEY=... \
  deployer
```

Comment out `AWS_PROFILE` in `configure.sh` when using this approach.

### Certificate Fix (Corporate Proxy / VPN)

When running inside Docker behind a corporate proxy or VPN that performs TLS interception, Terraform may fail with:

```
x509: certificate signed by unknown authority
```

This happens because the container does not trust your corporate root certificate authority. See [Terraform Certificate Error (Corporate Proxy / VPN)](troubleshooting.md#terraform-certificate-error-corporate-proxy--vpn) in the troubleshooting guide.

### Teardown

```bash
docker compose run --rm deployer destroy
```

This runs `terraform destroy` to remove all AWS resources. The Terraform state bucket and lock table are not deleted automatically.

## Native Deployment (Without Docker)

Use this if you prefer to run directly on your host or need faster iteration during development.

### Prerequisites

Install these manually:

- **Node.js** 24+ (with npm)
- **Terraform** 1.14+
- **AWS CLI** v2

### Deploy

```bash
./run.sh deploy
```

This runs the same steps as the Docker deployment, just directly on your machine.

### Command reference


| Command        | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| `deploy`       | Full deployment (expands to: init, lambda-deps, tf, outputs, ui-deps, ui)         |
| `init`         | Initialize Terraform backend (S3 bucket + DynamoDB lock table + `terraform init`) |
| `lambda-deps`  | Install Lambda dependencies (`npm install` in `lambda/`)                          |
| `lambda-build` | Build Lambda functions only (`npm run build` in `lambda/`)                        |
| `plan`         | Run `terraform plan` to preview infrastructure changes                            |
| `tf`           | Build Lambdas + `terraform apply -auto-approve`                                   |
| `outputs`      | Extract Terraform outputs to `terraform/.outputs.sh`                              |
| `ui-deps`      | Install frontend dependencies (`npm install` in `frontend/`)                      |
| `ui`           | Build frontend, upload to S3, invalidate CloudFront                               |
| `destroy`      | `terraform destroy -auto-approve`                                                 |
| `version`      | Print OS, Node.js, Terraform, and AWS CLI versions                                |


Multiple commands can be passed in one invocation: `./run.sh init tf outputs ui`

### Teardown

```bash
./run.sh destroy
```

This runs `terraform destroy` to remove all AWS resources. The Terraform state bucket and lock table are not deleted automatically.

## CI/CD Usage

The project includes a GitHub Actions workflow (`.github/workflows/dev-deploy.yml`) that demonstrates CI/CD deployment.

### How it works

1. The workflow builds the same Docker image used for local deployment
2. Secrets (AWS credentials, Terraform bucket name, frontend password) are loaded from a vault and passed as environment variables
3. The container runs `./run.sh deploy` with all configuration via environment — no `configure.sh` on the runner

### Key CI patterns

**All config via environment:** In CI, setting `AWS_REGION` in the environment activates environment mode, which requires all configuration variables. They are passed as `-e` flags to `docker run`:

```bash
docker run \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e TERRAFORM_BACKEND_BUCKET=my-bucket \
  -e FRONTEND_PASSWORD=my-password \
  -v $(pwd):/cloud-light \
  cloud-light deploy
```

**Concurrency:** The workflow uses a concurrency group to ensure only one deployment runs at a time. `cancel-in-progress: false` means queued runs wait rather than canceling the active one.

**Docker layer caching:** The workflow uses GitHub Actions cache for Docker layers to speed up image builds.
